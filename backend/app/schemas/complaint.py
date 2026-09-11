from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

# Core Fields Shared Across Models
class ComplaintBase(BaseModel):
    customer_name: Optional[str] = None
    complaint_source: Optional[str] = "Email"
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = "Product Quality Complaint"
    complaint_date: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = "Moderate"
    priority: Optional[str] = "Medium"
    risk_level: Optional[str] = "MEDIUM"
    risk_confidence: Optional[float] = 85.0
    risk_reasoning: Optional[str] = None
    ai_summary: Optional[str] = None
    completeness_score: Optional[float] = 100.0
    missing_information: List[str] = Field(default_factory=list)
    possible_root_causes: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    capa_recommendation: Optional[str] = None
    duplicate_found: bool = False
    duplicate_notes: Optional[str] = None
    field_provenance: Dict[str, str] = Field(default_factory=dict)
    status: str = "Pending Triage"

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    customer_name: Optional[str] = None
    complaint_source: Optional[str] = None
    product_name: Optional[str] = None
    product_strength: Optional[str] = None
    batch_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    capa_recommendation: Optional[str] = None

class ComplaintResponse(ComplaintBase):
    id: int
    complaint_number: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# AI Processing Request & Response
class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Raw complaint text or email content")
    source: Optional[str] = Field(default="Email", description="Complaint source channel")

class ProcessingStage(BaseModel):
    id: str
    title: str
    status: str  # pending | in_progress | completed | failed
    details: Optional[str] = None

class StructuredComplaintAI(BaseModel):
    customer_name: Optional[str] = ""
    complaint_source: Optional[str] = "Email"
    product_name: Optional[str] = ""
    product_strength: Optional[str] = ""
    batch_number: Optional[str] = ""
    manufacturing_date: Optional[str] = ""
    expiry_date: Optional[str] = ""
    complaint_type: Optional[str] = "Product Quality Complaint"
    complaint_date: Optional[str] = ""
    quantity_affected: Optional[str] = ""
    description: Optional[str] = ""
    severity: Optional[str] = "Moderate"
    priority: Optional[str] = "Medium"
    risk_level: Optional[str] = "MEDIUM"
    risk_confidence: float = 85.0
    risk_reasoning: Optional[str] = ""
    summary: Optional[str] = ""
    completeness_score: float = 0.0
    missing_information: List[str] = Field(default_factory=list)
    possible_root_causes: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    capa_recommendation: Optional[str] = ""
    duplicate_found: bool = False
    duplicate_notes: Optional[str] = ""
    field_provenance: Dict[str, str] = Field(default_factory=dict)

class AnalyzeResponse(BaseModel):
    success: bool
    data: StructuredComplaintAI
    stages: List[ProcessingStage] = Field(default_factory=list)
    error: Optional[str] = None

class DuplicateCheckResponse(BaseModel):
    duplicate_found: bool
    confidence: float
    matched_complaint_id: Optional[int] = None
    matched_complaint_number: Optional[str] = None
    match_reason: str
    similar_complaints: List[Dict[str, Any]] = Field(default_factory=list)

class RiskAssessmentResponse(BaseModel):
    risk_level: str
    risk_confidence: float
    risk_reasoning: str
    severity: str
    priority: str
    recommended_actions: List[str]

class RecommendationsResponse(BaseModel):
    possible_root_causes: List[str]
    recommended_actions: List[str]
    capa_recommendation: str

class CopilotChatRequest(BaseModel):
    query: str
    complaint_context: Optional[Dict[str, Any]] = None

class CopilotChatResponse(BaseModel):
    answer: str
    references: List[str] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    field_updates: Optional[Dict[str, Any]] = None
