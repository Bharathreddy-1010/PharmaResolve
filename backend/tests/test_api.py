import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.workflows.complaint_graph import complaint_workflow
from app.services.complaint_service import ComplaintService
from app.database.session import SessionLocal

def test_workflow_execution():
    print("Testing LangGraph Complaint Workflow...")
    sample_text = (
        "Customer ABC Pharma reported that Batch B240812 of Paracetamol "
        "500 mg tablets had several tablets with broken edges and unusual "
        "discoloration. The shipment was received on 12 August 2026. "
        "Customer requests investigation and replacement."
    )
    
    result = complaint_workflow.invoke({
        "raw_input": sample_text,
        "complaint_source": "Email",
        "stages": []
    })
    
    assert "final_structured_complaint" in result, "Workflow missing final_structured_complaint"
    final = result["final_structured_complaint"]
    print("✓ Extracted Customer:", final.get("customer_name"))
    print("✓ Extracted Product:", final.get("product_name"))
    print("✓ Extracted Batch:", final.get("batch_number"))
    print("✓ Risk Level:", final.get("risk_level"))
    print("✓ Risk Confidence:", final.get("risk_confidence"))
    print("✓ Duplicate Found:", final.get("duplicate_found"))
    print("✓ Provenance:", final.get("field_provenance"))
    print("✓ Stages count:", len(result.get("stages", [])))
    print("All workflow assertions passed!\n")

def test_duplicate_detection():
    print("Testing Duplicate Detection...")
    db = SessionLocal()
    try:
        dup = ComplaintService.check_duplicates(
            db=db,
            batch_number="B240812",
            product_name="Paracetamol",
            description="Tablets with broken edges and yellow discoloration"
        )
        print("✓ Duplicate Result:", dup["duplicate_found"])
        print("✓ Match Reason:", dup["match_reason"])
        assert dup["duplicate_found"] is True, "Expected duplicate to be detected for batch B240812"
        print("Duplicate detection passed!\n")
    finally:
        db.close()

if __name__ == "__main__":
    test_workflow_execution()
    test_duplicate_detection()
    print("All backend tests completed successfully!")
