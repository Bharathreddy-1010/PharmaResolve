import re
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models.complaint import Complaint
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate

def calculate_text_similarity(s1: str, s2: str) -> float:
    """Calculate word-token Jaccard similarity between two texts."""
    if not s1 or not s2:
        return 0.0
    words1 = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', s1.lower()))
    words2 = set(re.findall(r'\b[a-zA-Z0-9]{3,}\b', s2.lower()))
    if not words1 or not words2:
        return 0.0
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    return round((intersection / union) * 100.0, 1)

class ComplaintService:
    @staticmethod
    def generate_complaint_number(db: Session) -> str:
        """Generates next sequential complaint number, e.g. CMP-2026-004."""
        year = datetime.utcnow().year
        last_record = (
            db.query(Complaint)
            .filter(Complaint.complaint_number.like(f"CMP-{year}-%"))
            .order_by(desc(Complaint.id))
            .first()
        )
        if last_record and last_record.complaint_number:
            match = re.search(r"CMP-\d{4}-(\d+)", last_record.complaint_number)
            if match:
                next_seq = int(match.group(1)) + 1
                return f"CMP-{year}-{next_seq:03d}"
        
        # Count fallback
        total = db.query(Complaint).count() + 1
        return f"CMP-{year}-{total:03d}"

    @classmethod
    def create_complaint(cls, db: Session, complaint_data: ComplaintCreate) -> Complaint:
        """Persists a new complaint into the database."""
        complaint_num = cls.generate_complaint_number(db)
        data_dict = complaint_data.model_dump()
        
        db_complaint = Complaint(
            complaint_number=complaint_num,
            **data_dict
        )
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        return db_complaint

    @staticmethod
    def get_complaints(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        risk_level: Optional[str] = None,
        status: Optional[str] = None
    ) -> Tuple[List[Complaint], int]:
        """Fetch list of complaints with search and filtering."""
        query = db.query(Complaint)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Complaint.complaint_number.ilike(search_pattern),
                    Complaint.customer_name.ilike(search_pattern),
                    Complaint.product_name.ilike(search_pattern),
                    Complaint.batch_number.ilike(search_pattern),
                    Complaint.description.ilike(search_pattern)
                )
            )
        
        if risk_level:
            query = query.filter(Complaint.risk_level == risk_level.upper())
            
        if status:
            query = query.filter(Complaint.status == status)
            
        total = query.count()
        complaints = query.order_by(desc(Complaint.id)).offset(skip).limit(limit).all()
        return complaints, total

    @staticmethod
    def get_complaint_by_id(db: Session, complaint_id: int) -> Optional[Complaint]:
        """Fetch a single complaint by primary key ID."""
        return db.query(Complaint).filter(Complaint.id == complaint_id).first()

    @staticmethod
    def update_complaint(db: Session, complaint_id: int, update_data: ComplaintUpdate) -> Optional[Complaint]:
        """Update fields of an existing complaint."""
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None
        
        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(complaint, key, value)
            
        complaint.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(complaint)
        return complaint

    @staticmethod
    def check_duplicates(
        db: Session,
        batch_number: Optional[str],
        product_name: Optional[str],
        description: Optional[str],
        exclude_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Compares against existing records for matching batch, product, or description.
        Returns detailed duplicate risk analysis.
        """
        if not batch_number and not description:
            return {
                "duplicate_found": False,
                "confidence": 0.0,
                "match_reason": "Insufficient batch or description data to check duplicates.",
                "similar_complaints": []
            }

        query = db.query(Complaint)
        if exclude_id:
            query = query.filter(Complaint.id != exclude_id)

        all_records = query.all()
        matched = []

        clean_batch = batch_number.strip().upper() if batch_number else ""
        clean_prod = product_name.strip().lower() if product_name else ""

        for rec in all_records:
            score = 0.0
            reasons = []

            # 1. Exact batch number match (strongest signal)
            if clean_batch and rec.batch_number and clean_batch == rec.batch_number.strip().upper():
                score += 70.0
                reasons.append(f"Identical Batch/Lot #{rec.batch_number}")

            # 2. Product name match
            if clean_prod and rec.product_name and clean_prod in rec.product_name.lower():
                score += 15.0
                reasons.append(f"Matching Product '{rec.product_name}'")

            # 3. Textual similarity
            sim = calculate_text_similarity(description or "", rec.description or "")
            if sim > 20.0:
                score += min(sim * 0.4, 25.0)
                reasons.append(f"{sim:.0f}% text similarity with past report")

            if score >= 40.0:
                matched.append({
                    "id": rec.id,
                    "complaint_number": rec.complaint_number,
                    "customer_name": rec.customer_name,
                    "batch_number": rec.batch_number,
                    "product_name": rec.product_name,
                    "risk_level": rec.risk_level,
                    "status": rec.status,
                    "created_at": rec.created_at.strftime("%Y-%m-%d") if rec.created_at else "",
                    "score": min(score, 99.0),
                    "reasons": reasons
                })

        # Sort by score descending
        matched.sort(key=lambda x: x["score"], reverse=True)

        if matched:
            top = matched[0]
            return {
                "duplicate_found": True,
                "confidence": top["score"],
                "matched_complaint_id": top["id"],
                "matched_complaint_number": top["complaint_number"],
                "match_reason": f"High similarity detected with existing record {top['complaint_number']} ({'; '.join(top['reasons'])}).",
                "similar_complaints": matched
            }
        else:
            return {
                "duplicate_found": False,
                "confidence": 0.0,
                "matched_complaint_id": None,
                "matched_complaint_number": None,
                "match_reason": "No previous complaints found matching this batch or description.",
                "similar_complaints": []
            }
