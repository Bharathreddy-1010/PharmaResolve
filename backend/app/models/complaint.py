from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, JSON
from app.database.session import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_number = Column(String(64), unique=True, index=True, nullable=False)
    
    # Origin & Customer Details
    customer_name = Column(String(255), nullable=True)
    complaint_source = Column(String(100), nullable=True)
    
    # Product & Batch Identification
    product_name = Column(String(255), nullable=True)
    product_strength = Column(String(100), nullable=True)
    batch_number = Column(String(100), index=True, nullable=True)
    manufacturing_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    quantity_affected = Column(String(100), nullable=True)
    
    # Complaint Details
    complaint_type = Column(String(150), nullable=True)
    complaint_date = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    
    # Initial Assessment
    severity = Column(String(50), nullable=True)
    priority = Column(String(50), nullable=True)
    
    # AI Risk & Copilot fields
    risk_level = Column(String(50), nullable=True)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_confidence = Column(Float, nullable=True)
    risk_reasoning = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    completeness_score = Column(Float, nullable=True)
    
    # Lists stored as JSON
    missing_information = Column(JSON, default=list)
    possible_root_causes = Column(JSON, default=list)
    recommendations = Column(JSON, default=list)
    capa_recommendation = Column(Text, nullable=True)
    
    # Duplicate Analysis
    duplicate_found = Column(Boolean, default=False)
    duplicate_notes = Column(Text, nullable=True)
    
    # Field Provenance dictionary {field_name: "AI Extracted" | "AI Inferred" | "User Entered" | "Missing"}
    field_provenance = Column(JSON, default=dict)
    
    # Workflow Status
    status = Column(String(50), default="Pending Triage")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
