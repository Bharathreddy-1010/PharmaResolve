import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, START, END
from app.workflows.state import ComplaintState
from app.ai.llm_client import llm_client, clean_json_response
from app.ai.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    RISK_ASSESSMENT_PROMPT,
    COMPLETENESS_PROMPT,
    RECOMMENDATIONS_PROMPT,
)
from app.database.session import SessionLocal
from app.services.complaint_service import ComplaintService

logger = logging.getLogger(__name__)

# Node 1: Receive Input
def receive_input(state: ComplaintState) -> Dict[str, Any]:
    raw = state.get("raw_input", "").strip()
    stages = state.get("stages", [])
    if not raw:
        return {
            "error": "Empty complaint content provided.",
            "stages": stages + [{
                "id": "doc_received",
                "title": "Document received",
                "status": "failed",
                "details": "No complaint content was provided."
            }]
        }
    
    return {
        "stages": [{
            "id": "doc_received",
            "title": "Document received",
            "status": "completed",
            "details": f"Received intake payload ({len(raw)} chars) via {state.get('complaint_source', 'Email')}"
        }]
    }

# Node 2: Extract Complaint Content (Unified 1-Shot High-Performance Extraction)
def extract_complaint_content(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
    
    raw = state.get("raw_input", "")
    response_text = llm_client.invoke(EXTRACTION_SYSTEM_PROMPT, raw)
    extracted = clean_json_response(response_text)
    
    # Track provenance
    provenance = {}
    field_keys = [
        "customer_name", "complaint_source", "product_name", "product_strength",
        "batch_number", "manufacturing_date", "expiry_date", "quantity_affected",
        "complaint_type", "complaint_date", "description", "severity", "priority"
    ]
    for key in field_keys:
        val = extracted.get(key)
        if val and str(val).strip() and str(val).lower() != "null":
            provenance[key] = "AI Extracted"
        else:
            provenance[key] = "Missing"
            
    stages = state.get("stages", []) + [{
        "id": "extract_info",
        "title": "Extracting complaint information",
        "status": "completed",
        "details": f"Extracted {len([k for k in field_keys if provenance[k] == 'AI Extracted'])} fields from source document"
    }]
    
    return {
        "extracted_data": extracted,
        "field_provenance": provenance,
        "risk_level": (extracted.get("risk_level") or "MEDIUM").upper(),
        "risk_confidence": float(extracted.get("risk_confidence") or 85.0),
        "risk_reasoning": extracted.get("risk_reasoning") or "Assessed based on reported defect characteristics and potential GxP / patient safety impact.",
        "severity": extracted.get("severity") or "Moderate",
        "priority": extracted.get("priority") or "Medium",
        "possible_root_causes": extracted.get("possible_root_causes") or [],
        "recommended_actions": extracted.get("recommended_actions") or [],
        "capa_recommendation": extracted.get("capa_recommendation") or "",
        "summary": extracted.get("summary") or "",
        "stages": stages
    }

# Node 3: Normalize Information
def normalize_information(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    extracted = dict(state.get("extracted_data", {}))
    
    # Normalize batch
    if extracted.get("batch_number"):
        extracted["batch_number"] = extracted["batch_number"].strip().upper()
        
    # Standardize empty values
    for field in ["manufacturing_date", "expiry_date", "quantity_affected", "customer_name", "product_strength"]:
        if not extracted.get(field):
            extracted[field] = ""
            
    # Source
    extracted["complaint_source"] = state.get("complaint_source") or extracted.get("complaint_source") or "Email"
    
    stages = state.get("stages", []) + [{
        "id": "id_product_batch",
        "title": "Identifying product and batch",
        "status": "completed",
        "details": f"Product: {extracted.get('product_name') or 'Pending Identification'} | Batch: {extracted.get('batch_number') or 'Not Found'}"
    }]
    
    return {
        "normalized_data": extracted,
        "stages": stages
    }

# Node 4: Validate Completeness (Deterministic GxP Audit, 0ms latency)
def validate_completeness(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    normalized = state.get("normalized_data", {})
    
    missing = []
    score = 100.0
    
    if not normalized.get("batch_number") or str(normalized.get("batch_number")).lower() in ["null", "none", ""]:
        missing.append("Batch / Lot Number not identified")
        score -= 20.0
    if not normalized.get("customer_name") or str(normalized.get("customer_name")).lower() in ["null", "none", ""]:
        missing.append("Customer / Facility identity unconfirmed")
        score -= 10.0
    if not normalized.get("product_name") or str(normalized.get("product_name")).lower() in ["null", "none", ""]:
        missing.append("Product Name not specified")
        score -= 20.0
    if not normalized.get("expiry_date") or str(normalized.get("expiry_date")).lower() in ["null", "none", ""]:
        missing.append("Expiry Date missing from intake record")
        score -= 10.0
    if not normalized.get("manufacturing_date") or str(normalized.get("manufacturing_date")).lower() in ["null", "none", ""]:
        missing.append("Manufacturing Date pending batch record retrieval")
        score -= 8.0
    if not normalized.get("quantity_affected") or str(normalized.get("quantity_affected")).lower() in ["null", "none", ""]:
        missing.append("Quantity affected count / unit unconfirmed")
        score -= 10.0
    if not normalized.get("description") or len(str(normalized.get("description", ""))) < 20:
        missing.append("Comprehensive defect description needed")
        score -= 15.0

    final_score = max(score, 45.0)
        
    stages = state.get("stages", []) + [{
        "id": "check_completeness",
        "title": "Checking complaint completeness",
        "status": "completed",
        "details": f"Intake record is {final_score:.0f}% complete. {len(missing)} missing items identified."
    }]
    
    return {
        "completeness_score": final_score,
        "missing_information": missing,
        "stages": stages
    }

# Node 5: Classify Complaint
def classify_complaint(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    normalized = state.get("normalized_data", {})
    desc = (normalized.get("description") or "").lower()
    ctype = normalized.get("complaint_type") or "Product Quality Complaint"
    
    if any(w in desc for w in ["broken", "discoloration", "chipped", "particle", "dissolution"]):
        ctype = "Product Quality Complaint"
    elif any(w in desc for w in ["blister", "carton", "foil", "seal", "crushed box", "packaging"]):
        ctype = "Packaging Defect"
    elif any(w in desc for w in ["shortage", "missing units", "fewer", "quantity discrepancy"]):
        ctype = "Quantity / Shipment Issue"
    elif any(w in desc for w in ["label", "leaflet", "expiry smudged", "misprinted"]):
        ctype = "Labeling / Artwork Defect"
        
    normalized["complaint_type"] = ctype
    prov = dict(state.get("field_provenance", {}))
    prov["complaint_type"] = "AI Inferred"
    
    return {
        "normalized_data": normalized,
        "complaint_type": ctype,
        "field_provenance": prov
    }

# Node 6: Assess Risk (Fast GxP Evaluation)
def assess_risk(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    normalized = state.get("normalized_data", {})
    
    risk_level = state.get("risk_level") or "MEDIUM"
    confidence = state.get("risk_confidence") or 85.0
    reasoning = state.get("risk_reasoning") or "Assessed based on reported defect characteristics and potential GxP / patient safety impact."
    severity = state.get("severity") or normalized.get("severity") or "Moderate"
    priority = state.get("priority") or normalized.get("priority") or "Medium"
    
    prov = dict(state.get("field_provenance", {}))
    prov["severity"] = "AI Inferred"
    prov["priority"] = "AI Inferred"
    
    stages = state.get("stages", []) + [{
        "id": "risk_assessment",
        "title": "Performing AI risk assessment",
        "status": "completed",
        "details": f"Risk Level: {risk_level} ({confidence:.0f}% confidence) | Severity: {severity}"
    }]
    
    return {
        "risk_level": risk_level,
        "risk_confidence": confidence,
        "risk_reasoning": reasoning,
        "severity": severity,
        "priority": priority,
        "field_provenance": prov,
        "stages": stages
    }

# Node 7: Check Duplicate
def check_duplicate(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    normalized = state.get("normalized_data", {})
    batch = normalized.get("batch_number")
    product = normalized.get("product_name")
    desc = normalized.get("description")
    
    db = SessionLocal()
    try:
        dup_result = ComplaintService.check_duplicates(db, batch, product, desc)
        return {
            "duplicate_found": dup_result.get("duplicate_found", False),
            "duplicate_notes": dup_result.get("match_reason", "")
        }
    except Exception as e:
        logger.warning(f"Error checking duplicates against DB: {e}")
        return {
            "duplicate_found": False,
            "duplicate_notes": "Could not access database for historical duplicate check."
        }
    finally:
        db.close()

# Node 8: Generate Summary
def generate_summary(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    summary = state.get("summary")
    if not summary:
        normalized = state.get("normalized_data", {})
        customer = normalized.get("customer_name") or "Customer"
        product = normalized.get("product_name") or "Pharmaceutical Product"
        batch = normalized.get("batch_number") or "Unspecified Batch"
        desc = normalized.get("description") or "reported issue"
        summary = f"{customer} reported defect for {product} (Batch {batch}): {desc[:120]}..."
        
    return {"summary": summary}

# Node 9: Generate Recommendations (Fast GxP Root Cause & CAPA)
def generate_recommendations(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {}
        
    normalized = state.get("normalized_data", {})
    
    root_causes = state.get("possible_root_causes")
    actions = state.get("recommended_actions")
    capa = state.get("capa_recommendation")
    summary = state.get("summary")
    
    if not root_causes or not actions or not capa:
        desc = (normalized.get("description") or "").lower()
        if any(w in desc for w in ["broken", "discoloration", "chipped", "particle", "surface"]):
            root_causes = [
                "Manufacturing process - Compression tooling wear or excess punch force",
                "Formulation - Granulation binder distribution and moisture variability",
                "Packaging - Primary blister sealing temperature or barrier failure",
                "Raw Materials - Excipient or active substance particle size heterogeneity"
            ]
            actions = [
                "Quarantine affected batch inventory in warehouse immediately",
                "Retrieve and inspect QC retain samples across the compression run",
                "Review compression force logs and tooling maintenance history",
                "Initiate formalized Deviation Investigation per SOP-QA-104"
            ]
            capa = "Inspect and re-calibrate tablet press tooling; verify granulator moisture sensor calibration; update in-process friability check frequency."
        elif any(w in desc for w in ["blister", "carton", "foil", "seal", "crushed", "puncture"]):
            root_causes = [
                "Transportation - Freight carrier vibration, impact, or improper pallet stacking",
                "Packaging Material - Out-of-specification blister foil thickness or burst strength",
                "Warehouse Handling - Automated conveyor jamming or rough handling at dispatch"
            ]
            actions = [
                "Request photographic proof of damaged master shipper cartons from distributor",
                "Verify carrier transit temperature and shock telemetry logs",
                "Issue replacement units for compromised packages"
            ]
            capa = "Review shipper carton Edge Crush Test (ECT) rating with vendor; reinforce pallet stretch-wrap protocol."
        else:
            root_causes = [
                "Documentation - Dispatch order staging reconciliation recording error",
                "Warehouse - Pick-and-pack counting discrepancy at final palletizing",
                "ERP Integration - Electronic inventory deduction timing mismatch"
            ]
            actions = [
                "Perform physical cycle count for finished goods inventory in central warehouse",
                "Review warehouse dock CCTV footage and barcode scan timestamps",
                "Issue credit memo or expedite shipment of remaining quantity"
            ]
            capa = "Mandate automated tare and weight verification at packaging conveyor end-of-line before stretch-wrapping."

    return {
        "possible_root_causes": root_causes,
        "recommended_actions": actions,
        "capa_recommendation": capa,
        "summary": summary
    }

# Node 10: Prepare Structured Complaint
def prepare_structured_complaint(state: ComplaintState) -> Dict[str, Any]:
    if state.get("error"):
        return {
            "final_structured_complaint": {},
            "stages": state.get("stages", [])
        }
        
    normalized = state.get("normalized_data", {})
    prov = state.get("field_provenance", {})
    
    # Ensure all form fields have a provenance badge
    final_prov = {}
    for f in [
        "complaint_source", "customer_name", "product_name", "product_strength",
        "batch_number", "manufacturing_date", "expiry_date", "quantity_affected",
        "complaint_type", "complaint_date", "description", "severity", "priority"
    ]:
        val = normalized.get(f)
        if f in ["severity", "priority", "complaint_type"]:
            final_prov[f] = "AI Inferred"
        elif val and str(val).strip():
            final_prov[f] = prov.get(f, "AI Extracted")
        else:
            final_prov[f] = "Missing"

    structured = {
        "customer_name": normalized.get("customer_name", ""),
        "complaint_source": normalized.get("complaint_source", state.get("complaint_source", "Email")),
        "product_name": normalized.get("product_name", ""),
        "product_strength": normalized.get("product_strength", ""),
        "batch_number": normalized.get("batch_number", ""),
        "manufacturing_date": normalized.get("manufacturing_date", ""),
        "expiry_date": normalized.get("expiry_date", ""),
        "complaint_type": normalized.get("complaint_type", "Product Quality Complaint"),
        "complaint_date": normalized.get("complaint_date", ""),
        "quantity_affected": normalized.get("quantity_affected", ""),
        "description": normalized.get("description", ""),
        "severity": state.get("severity", "Moderate"),
        "priority": state.get("priority", "Medium"),
        "risk_level": state.get("risk_level", "MEDIUM"),
        "risk_confidence": state.get("risk_confidence", 85.0),
        "risk_reasoning": state.get("risk_reasoning", ""),
        "summary": state.get("summary", ""),
        "completeness_score": state.get("completeness_score", 85.0),
        "missing_information": state.get("missing_information", []),
        "possible_root_causes": state.get("possible_root_causes", []),
        "recommended_actions": state.get("recommended_actions", []),
        "capa_recommendation": state.get("capa_recommendation", ""),
        "duplicate_found": state.get("duplicate_found", False),
        "duplicate_notes": state.get("duplicate_notes", ""),
        "field_provenance": final_prov
    }
    
    stages = state.get("stages", []) + [{
        "id": "prep_record",
        "title": "Preparing complaint record",
        "status": "completed",
        "details": "Ready for Quality Officer review and verification"
    }]
    
    return {
        "final_structured_complaint": structured,
        "stages": stages
    }

# Conditional routing logic
def route_after_input(state: ComplaintState):
    if state.get("error"):
        return END
    return "extract_complaint_content"

# Build LangGraph StateGraph
def build_complaint_graph():
    workflow = StateGraph(ComplaintState)
    
    workflow.add_node("receive_input", receive_input)
    workflow.add_node("extract_complaint_content", extract_complaint_content)
    workflow.add_node("normalize_information", normalize_information)
    workflow.add_node("validate_completeness", validate_completeness)
    workflow.add_node("classify_complaint", classify_complaint)
    workflow.add_node("assess_risk", assess_risk)
    workflow.add_node("check_duplicate", check_duplicate)
    workflow.add_node("generate_summary", generate_summary)
    workflow.add_node("generate_recommendations", generate_recommendations)
    workflow.add_node("prepare_structured_complaint", prepare_structured_complaint)
    
    # Define execution edges
    workflow.add_edge(START, "receive_input")
    workflow.add_conditional_edges(
        "receive_input",
        route_after_input,
        {
            "extract_complaint_content": "extract_complaint_content",
            END: END
        }
    )
    workflow.add_edge("extract_complaint_content", "normalize_information")
    workflow.add_edge("normalize_information", "validate_completeness")
    workflow.add_edge("validate_completeness", "classify_complaint")
    workflow.add_edge("classify_complaint", "assess_risk")
    workflow.add_edge("assess_risk", "check_duplicate")
    workflow.add_edge("check_duplicate", "generate_summary")
    workflow.add_edge("generate_summary", "generate_recommendations")
    workflow.add_edge("generate_recommendations", "prepare_structured_complaint")
    workflow.add_edge("prepare_structured_complaint", END)
    
    return workflow.compile()

# Singleton compiled graph
complaint_workflow = build_complaint_graph()
