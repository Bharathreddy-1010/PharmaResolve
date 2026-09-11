from typing import TypedDict, List, Dict, Any, Optional

class ComplaintState(TypedDict, total=False):
    # Inputs
    raw_input: str
    complaint_source: str
    
    # Extraction & Normalization
    extracted_data: Dict[str, Any]
    normalized_data: Dict[str, Any]
    
    # Quality & Risk Evaluations
    completeness_score: float
    missing_information: List[str]
    complaint_type: str
    severity: str
    priority: str
    risk_level: str
    risk_confidence: float
    risk_reasoning: str
    
    # Duplicate Check
    duplicate_found: bool
    duplicate_notes: str
    
    # Insights & Guidance
    summary: str
    possible_root_causes: List[str]
    recommended_actions: List[str]
    capa_recommendation: str
    
    # Provenance tracking: field -> "AI Extracted" | "AI Inferred" | "User Entered" | "Missing"
    field_provenance: Dict[str, str]
    
    # Final Result & UI Stage Timeline
    final_structured_complaint: Dict[str, Any]
    stages: List[Dict[str, Any]]
    error: Optional[str]
