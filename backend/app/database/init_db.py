import logging
from datetime import datetime, timedelta
from app.database.session import engine, SessionLocal, Base
from app.models.complaint import Complaint

logger = logging.getLogger(__name__)

def init_database():
    """Create tables and seed initial demo complaints if empty."""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized.")

    db = SessionLocal()
    try:
        count = db.query(Complaint).count()
        if count == 0:
            logger.info("Seeding initial demo pharmaceutical complaints...")
            now = datetime.utcnow()
            
            seed_complaints = [
                Complaint(
                    complaint_number="CMP-2026-001",
                    customer_name="ABC Pharma Distributors",
                    complaint_source="Email",
                    product_name="Paracetamol Tablets",
                    product_strength="500 mg",
                    batch_number="B240812",
                    manufacturing_date="2026-02-15",
                    expiry_date="2028-02-14",
                    quantity_affected="1,200 tablets (60 blister strips)",
                    complaint_type="Product Quality Complaint",
                    complaint_date="2026-08-12",
                    description="Customer reported several tablets in Batch B240812 exhibited chipped/broken edges and distinct yellow-brown discoloration upon opening outer blister foil. Storage conditions at receiving warehouse verified at 22°C / 45% RH.",
                    severity="High",
                    priority="High",
                    risk_level="HIGH",
                    risk_confidence=91.0,
                    risk_reasoning="Potential contamination or degradation during compression/coating. Physical integrity compromised, posing potential dosing variance and visual defect non-conformance.",
                    ai_summary="Physical defect & discoloration in Paracetamol 500mg (Batch B240812). Urgent QA inspection warranted.",
                    completeness_score=95.0,
                    missing_information=["Photographic evidence of retain samples"],
                    possible_root_causes=[
                        "Manufacturing - Granulation moisture imbalance",
                        "Compression tooling wear or punch chipping",
                        "Storage/Packaging seal integrity failure"
                    ],
                    recommendations=[
                        "Quarantine remaining inventory of Batch B240812 immediately",
                        "Inspect QA retain samples from beginning, middle, and end of batch compression",
                        "Conduct visual inspection and dissolution testing on retain samples"
                    ],
                    capa_recommendation="Initiate Deviation DEV-2026-089. Inspect upper punch tips on tablet press #3; verify humidity control sensors in coating suite B.",
                    duplicate_found=False,
                    field_provenance={
                        "customer_name": "AI Extracted",
                        "product_name": "AI Extracted",
                        "product_strength": "AI Extracted",
                        "batch_number": "AI Extracted",
                        "manufacturing_date": "AI Extracted",
                        "expiry_date": "AI Extracted",
                        "quantity_affected": "AI Extracted",
                        "complaint_type": "AI Inferred",
                        "complaint_date": "AI Extracted",
                        "description": "AI Extracted",
                        "severity": "AI Inferred",
                        "priority": "AI Inferred"
                    },
                    status="Investigating",
                    created_at=now - timedelta(days=14),
                    updated_at=now - timedelta(days=12)
                ),
                Complaint(
                    complaint_number="CMP-2026-002",
                    customer_name="MedHealth Care Logistics",
                    complaint_source="Customer Portal",
                    product_name="Ibuprofen Film-Coated Tablets",
                    product_strength="200 mg",
                    batch_number="B1234",
                    manufacturing_date="2026-03-01",
                    expiry_date="2028-02-28",
                    quantity_affected="350 boxes",
                    complaint_type="Packaging Defect",
                    complaint_date="2026-08-20",
                    description="Secondary packaging crushed and outer shipper seal broken upon receipt at central distribution hub. Individual blister strips inside showed partial foil puncture.",
                    severity="Moderate",
                    priority="Medium",
                    risk_level="MEDIUM",
                    risk_confidence=84.0,
                    risk_reasoning="Packaging integrity breached during handling or transport. Product stability could be impacted if exposed to ambient moisture, but no intrinsic chemical defect identified.",
                    ai_summary="Crushed secondary packaging and pierced blister foils in Ibuprofen 200mg (Batch B1234). Transit damage suspected.",
                    completeness_score=88.0,
                    missing_information=["Carrier bill of lading", "Temperature logger data during transit"],
                    possible_root_causes=[
                        "Transportation - Inadequate pallet strapping or pallet overhang",
                        "Packaging - Shipper corrugated box burst strength deficiency",
                        "Handling - Rough handling by third-party logistics (3PL) freight provider"
                    ],
                    recommendations=[
                        "Issue replacement units for damaged boxes to distributor",
                        "Audit 3PL transport carrier handling protocol",
                        "Review shipper carton edge-crush test (ECT) specifications"
                    ],
                    capa_recommendation="Update packaging SOP PK-302 to require reinforced edge protectors on export pallets; file claim with logistics partner.",
                    duplicate_found=False,
                    field_provenance={
                        "customer_name": "AI Extracted",
                        "product_name": "AI Extracted",
                        "product_strength": "AI Extracted",
                        "batch_number": "AI Extracted",
                        "manufacturing_date": "AI Extracted",
                        "expiry_date": "AI Extracted",
                        "quantity_affected": "AI Extracted",
                        "complaint_type": "AI Inferred",
                        "complaint_date": "AI Extracted",
                        "description": "AI Extracted",
                        "severity": "AI Inferred",
                        "priority": "AI Inferred"
                    },
                    status="CAPA Required",
                    created_at=now - timedelta(days=7),
                    updated_at=now - timedelta(days=5)
                ),
                Complaint(
                    complaint_number="CMP-2026-003",
                    customer_name="Apex Healthcare Hospital Network",
                    complaint_source="Phone",
                    product_name="Amoxicillin Trihydrate Capsules",
                    product_strength="250 mg",
                    batch_number="AMX-8820",
                    manufacturing_date="2026-05-10",
                    expiry_date="2028-05-09",
                    quantity_affected="40 cartons (400 blister packs)",
                    complaint_type="Quantity / Shipment Issue",
                    complaint_date="2026-09-01",
                    description="Receiving dock inspection noted shipping pallet #4 arrived with 40 cartons fewer than indicated on invoice INV-90412. Tamper-evident tape on shipper was intact.",
                    severity="Low",
                    priority="Low",
                    risk_level="LOW",
                    risk_confidence=92.0,
                    risk_reasoning="Reconciliation discrepancy occurred during staging or dispatch. Zero impact on product quality, safety, or efficacy.",
                    ai_summary="Dispatch count discrepancy of 40 cartons for Amoxicillin 250mg (Batch AMX-8820). Packaging seals intact.",
                    completeness_score=90.0,
                    missing_information=["Warehouse staging camera footage verification"],
                    possible_root_causes=[
                        "Documentation - Dispatch reconciliation recording error",
                        "Warehouse - Pick-and-pack counting discrepancy at final palletizing",
                        "ERP system stock allocation mismatch"
                    ],
                    recommendations=[
                        "Reconcile finished goods inventory for Batch AMX-8820 in central warehouse",
                        "Credit note or dispatch remaining 40 cartons upon inventory count verification",
                        "Review barcode scanning logs at dispatch bay #2"
                    ],
                    capa_recommendation="Implement automated weight-check verification on pallet wrapping line to prevent dispatch count discrepancies.",
                    duplicate_found=False,
                    field_provenance={
                        "customer_name": "AI Extracted",
                        "product_name": "AI Extracted",
                        "product_strength": "AI Extracted",
                        "batch_number": "AI Extracted",
                        "manufacturing_date": "AI Extracted",
                        "expiry_date": "AI Extracted",
                        "quantity_affected": "AI Extracted",
                        "complaint_type": "AI Inferred",
                        "complaint_date": "AI Extracted",
                        "description": "AI Extracted",
                        "severity": "AI Inferred",
                        "priority": "AI Inferred"
                    },
                    status="Closed",
                    created_at=now - timedelta(days=3),
                    updated_at=now - timedelta(days=1)
                )
            ]
            
            db.add_all(seed_complaints)
            db.commit()
            logger.info("Successfully seeded 3 demo complaints.")
        else:
            logger.info(f"Database already contains {count} complaints. Skipping seed.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
