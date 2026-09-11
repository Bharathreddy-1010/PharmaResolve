import logging
import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.config import settings
from app.models.complaint import Complaint
from app.schemas.complaint import (
    ComplaintCreate,
    ComplaintUpdate,
    ComplaintResponse,
    AnalyzeRequest,
    AnalyzeResponse,
    StructuredComplaintAI,
    DuplicateCheckResponse,
    RiskAssessmentResponse,
    RecommendationsResponse,
    CopilotChatRequest,
    CopilotChatResponse,
)
from app.services.complaint_service import ComplaintService
from app.services.document_parser import DocumentParser
from app.workflows.complaint_graph import complaint_workflow
from app.ai.llm_client import llm_client, clean_json_response
from app.ai.prompts import COPILOT_QA_PROMPT, RISK_ASSESSMENT_PROMPT, RECOMMENDATIONS_PROMPT

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_complaint(
    fastapi_req: Request,
):
    """
    Intake and analyze complaint via text, pasted email, or uploaded document (PDF/DOCX/TXT/EML/Image).
    Orchestrates the 10-node LangGraph pipeline.
    """
    intake_text = ""
    complaint_source = "Email"

    content_type = fastapi_req.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body = await fastapi_req.json()
            intake_text = body.get("text", "")
            complaint_source = body.get("source", "Email")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")
    elif "multipart/form-data" in content_type:
        form = await fastapi_req.form()
        file_obj = form.get("file")
        source_val = form.get("source")
        text_val = form.get("text")

        if file_obj and hasattr(file_obj, "read"):
            content = await file_obj.read()
            extracted_text, detected_type = DocumentParser.extract_text_from_file(
                getattr(file_obj, "filename", "upload.txt"), content
            )
            intake_text = extracted_text
            complaint_source = source_val or f"Uploaded {detected_type}"
        elif text_val:
            intake_text = str(text_val)
            complaint_source = str(source_val or "Email")
    else:
        # Fallback query / raw body
        raw_body = await fastapi_req.body()
        if raw_body:
            try:
                import json
                data = json.loads(raw_body.decode())
                intake_text = data.get("text", "")
                complaint_source = data.get("source", "Email")
            except Exception:
                intake_text = raw_body.decode(errors="replace")

    if not intake_text or not intake_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complaint content is empty. Please enter or paste valid complaint information."
        )

    # Execute LangGraph Workflow
    try:
        initial_state = {
            "raw_input": intake_text,
            "complaint_source": complaint_source,
            "stages": []
        }
        result = complaint_workflow.invoke(initial_state)

        if result.get("error"):
            return AnalyzeResponse(
                success=False,
                data=StructuredComplaintAI(),
                stages=result.get("stages", []),
                error=result.get("error")
            )

        structured_data = result.get("final_structured_complaint", {})
        structured_model = StructuredComplaintAI(**structured_data)

        return AnalyzeResponse(
            success=True,
            data=structured_model,
            stages=result.get("stages", []),
            error=None
        )
    except Exception as e:
        logger.error(f"Error executing LangGraph complaint workflow: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Workflow error: {str(e)}"
        )

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def save_complaint(complaint_in: ComplaintCreate, db: Session = Depends(get_db)):
    """Save reviewed and edited complaint into PostgreSQL."""
    try:
        complaint = ComplaintService.create_complaint(db, complaint_in)
        return complaint
    except Exception as e:
        logger.error(f"Database error saving complaint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist complaint in database. Please check connection."
        )

@router.get("", response_model=List[ComplaintResponse])
def list_complaints(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    risk_level: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve saved complaints with search and filtering."""
    complaints, total = ComplaintService.get_complaints(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        risk_level=risk_level,
        status=status
    )
    return complaints

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Retrieve a single complaint by ID."""
    complaint = ComplaintService.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} not found."
        )
    return complaint

@router.put("/{complaint_id}", response_model=ComplaintResponse)
def update_complaint(complaint_id: int, update_data: ComplaintUpdate, db: Session = Depends(get_db)):
    """Update complaint status or details."""
    complaint = ComplaintService.update_complaint(db, complaint_id, update_data)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint with ID {complaint_id} not found."
        )
    return complaint

@router.post("/{complaint_id}/duplicate-check", response_model=DuplicateCheckResponse)
def check_complaint_duplicates(complaint_id: int, db: Session = Depends(get_db)):
    """Run duplicate check on an existing complaint against all other records."""
    complaint = ComplaintService.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    res = ComplaintService.check_duplicates(
        db=db,
        batch_number=complaint.batch_number,
        product_name=complaint.product_name,
        description=complaint.description,
        exclude_id=complaint.id
    )
    return DuplicateCheckResponse(**res)

@router.post("/{complaint_id}/risk-assessment", response_model=RiskAssessmentResponse)
def assess_complaint_risk(complaint_id: int, db: Session = Depends(get_db)):
    """Re-run AI risk assessment on an existing complaint."""
    complaint = ComplaintService.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    risk_prompt = RISK_ASSESSMENT_PROMPT.format(
        product_name=complaint.product_name or "",
        product_strength=complaint.product_strength or "",
        batch_number=complaint.batch_number or "",
        complaint_type=complaint.complaint_type or "",
        description=complaint.description or ""
    )
    resp = llm_client.invoke("You are a Senior Pharmaceutical Quality Officer assessing risk under ICH Q9.", risk_prompt)
    risk_data = clean_json_response(resp)

    risk_level = risk_data.get("risk_level", complaint.risk_level or "MEDIUM")
    confidence = risk_data.get("risk_confidence", complaint.risk_confidence or 85.0)
    reasoning = risk_data.get("risk_reasoning", "Re-assessed under current GxP quality guidelines.")
    severity = risk_data.get("severity", complaint.severity or "Moderate")
    priority = risk_data.get("priority", complaint.priority or "Medium")

    # Update database record
    complaint.risk_level = risk_level
    complaint.risk_confidence = confidence
    complaint.risk_reasoning = reasoning
    complaint.severity = severity
    complaint.priority = priority
    db.commit()

    return RiskAssessmentResponse(
        risk_level=risk_level,
        risk_confidence=confidence,
        risk_reasoning=reasoning,
        severity=severity,
        priority=priority,
        recommended_actions=complaint.recommendations or []
    )

@router.post("/{complaint_id}/recommendations", response_model=RecommendationsResponse)
def generate_complaint_recommendations(complaint_id: int, db: Session = Depends(get_db)):
    """Generate fresh Root Cause categories and CAPA recommendations."""
    complaint = ComplaintService.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found.")

    recom_prompt = RECOMMENDATIONS_PROMPT.format(
        product_name=complaint.product_name or "",
        product_strength=complaint.product_strength or "",
        batch_number=complaint.batch_number or "",
        description=complaint.description or "",
        risk_level=complaint.risk_level or "MEDIUM"
    )
    resp = llm_client.invoke("You are a Lead QA Quality Investigator recommending Root Cause analysis areas and CAPA.", recom_prompt)
    recom_data = clean_json_response(resp)

    root_causes = recom_data.get("possible_root_causes", complaint.possible_root_causes or [])
    actions = recom_data.get("recommended_actions", complaint.recommendations or [])
    capa = recom_data.get("capa_recommendation", complaint.capa_recommendation or "")

    complaint.possible_root_causes = root_causes
    complaint.recommendations = actions
    complaint.capa_recommendation = capa
    db.commit()

    return RecommendationsResponse(
        possible_root_causes=root_causes,
        recommended_actions=actions,
        capa_recommendation=capa
    )

@router.post("/chat", response_model=CopilotChatResponse)
def copilot_chat(request: CopilotChatRequest):
    """Interactive AI Copilot Q&A for Quality Engineers regarding the active complaint."""
    context_str = ""
    if request.complaint_context:
        ctx = request.complaint_context
        context_str = f"""
Product: {ctx.get('product_name')} ({ctx.get('product_strength')})
Batch: {ctx.get('batch_number')}
Customer: {ctx.get('customer_name')}
Complaint Type: {ctx.get('complaint_type')}
Description: {ctx.get('description')}
Risk Level: {ctx.get('risk_level')} ({ctx.get('risk_confidence')}%)
Risk Reasoning: {ctx.get('risk_reasoning')}
Completeness: {ctx.get('completeness_score')}%
Missing: {', '.join(ctx.get('missing_information', []))}
"""
    prompt = COPILOT_QA_PROMPT.format(
        context=context_str or "No complaint currently loaded.",
        query=request.query
    )
    resp = llm_client.invoke("You are the AI Quality Assurance Copilot in an enterprise pharmaceutical QMS. Keep responses short and sweet.", prompt)
    chat_data = clean_json_response(resp)

    raw_answer = chat_data.get("answer", "Quarantine affected units and review retain samples per SOP-QA-104.")
    # Remove any markdown asterisks (**, ****, etc.)
    clean_answer = re.sub(r'\*+', '', raw_answer).strip()

    field_updates = chat_data.get("field_updates")
    if not isinstance(field_updates, dict):
        field_updates = {}

    query_str = request.query

    # Check for strength correction (e.g. "not 250 mg its 300 mg")
    strength_m = (
        re.search(r'(?:not|instead of)\s+\d+\s*(?:mg|g|ml|mcg|iu|%)\s*(?:[,\.;]|\s+|but)*\s*(?:its|it\'s|it is|use|is|to|=|should be)?\s*(\d+\s*(?:mg|g|ml|mcg|iu|%))', query_str, re.I) or
        re.search(r'(\d+\s*(?:mg|g|ml|mcg|iu|%))\s+(?:not|instead of)\s+\d+\s*(?:mg|g|ml|mcg|iu|%)', query_str, re.I) or
        re.search(r'(?:change|update|set|correct|make)\s+(?:the\s+)?(?:product\s+)?(?:strength|dose|dosage)\s+(?:to|=|\s+)*(\d+\s*(?:mg|g|ml|mcg|iu|%))', query_str, re.I) or
        re.search(r'(?:its|it\'s|it is|actually|should be)\s+(\d+\s*(?:mg|g|ml|mcg|iu|%))', query_str, re.I)
    )
    if strength_m and "product_strength" not in field_updates:
        field_updates["product_strength"] = strength_m.group(1).strip()

    # Check for batch correction (requires explicit batch/lot keyword)
    batch_m = (
        re.search(r'(?:not|instead of)\s+(?:batch\s+|lot\s+)([A-Za-z0-9\-]+)\s*(?:[,\.;]|\s+|but)*\s*(?:its|it\'s|it is|use|is|to|=|should be)?\s*(?:batch\s+|lot\s+)?([A-Za-z0-9\-]+)', query_str, re.I) or
        re.search(r'(?:change|update|set|correct)\s+(?:the\s+)?(?:batch|lot)(?:\s*(?:number|no|#))?\s+(?:to|=|\s+)*([A-Za-z0-9\-]+)', query_str, re.I) or
        re.search(r'\b(?:batch|lot)(?:\s*(?:number|no|#))?\s*(?:is|:|to|=)\s*([A-Za-z0-9\-]+)', query_str, re.I)
    )
    if batch_m and "batch_number" not in field_updates:
        val = batch_m.group(2) if len(batch_m.groups()) >= 2 and batch_m.group(2) else batch_m.group(1)
        if val.upper() not in ['NOT', 'MG', 'ML', 'G', 'THE', 'A', 'AN', 'COMPLAINT', 'PRODUCT']:
            field_updates["batch_number"] = val.strip().upper()

    # Check for customer correction
    cust_m = (
        re.search(r'(?:change|update|set|correct)\s+(?:the\s+)?customer\s+(?:name\s+)?(?:to|=|\s+)*([A-Za-z0-9\s]+?)(?:[,\.;]|$)', query_str, re.I) or
        re.search(r'(?:customer|client)(?:\s+name)?(?:\s+is|\s*:|\s+to)\s*([A-Za-z0-9\s]+?)(?:[,\.;]|$)', query_str, re.I)
    )
    if cust_m and "customer_name" not in field_updates:
        field_updates["customer_name"] = cust_m.group(1).strip()

    # Check for quantity correction (requires physical units like boxes/tablets/packs, not mg/ml)
    qty_units = r'(?:tablets|capsules|units|bottles|boxes|packs|cartons|strips|vials|ampoules|cases|containers|syringes|blisters)'
    qty_m = (
        re.search(rf'(?:not|instead of)\s+\d+[\d,]*\s*{qty_units}\s*(?:[,\.;]|\s+|but)*\s*(?:its|it\'s|it is|use|is|to|=|should be)?\s*(\d+[\d,]*\s*{qty_units})', query_str, re.I) or
        re.search(rf'(?:change|update|set|correct)\s+(?:the\s+)?quantity\s+(?:to|=|\s+)*(\d+[\d,]*\s*{qty_units})', query_str, re.I) or
        re.search(rf'(?:quantity|qty)(?:\s*affected)?(?:\s+is|\s*:|\s+to)\s*(\d+[\d,]*\s*{qty_units})', query_str, re.I)
    )
    if qty_m and "quantity_affected" not in field_updates:
        field_updates["quantity_affected"] = qty_m.group(1).strip()

    if field_updates and not any(w in clean_answer.lower() for w in ["updated", "amended", "changed", "noted"]):
        update_items = [f"{k.replace('_', ' ')} to {v}" for k, v in field_updates.items()]
        clean_answer = f"Updated {', '.join(update_items)}. Form on the left has been updated."

    return CopilotChatResponse(
        answer=clean_answer,
        references=chat_data.get("references", ["FDA 21 CFR 211.198", "ICH Q9 Quality Risk Management"]),
        suggested_followups=chat_data.get("suggested_followups", [
            "What retain sample tests are mandatory?",
            "What are the reporting timelines?"
        ]),
        field_updates=field_updates if field_updates else None
    )
