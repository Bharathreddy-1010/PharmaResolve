export interface DemoPreset {
  id: string;
  title: string;
  badge: string;
  source: string;
  description: string;
  rawText: string;
}

export const DEMO_PRESETS: DemoPreset[] = [
  {
    id: 'demo-1',
    title: 'Discoloration & Tablet Chipping',
    badge: 'High Risk / GxP Defect',
    source: 'Email',
    description: 'Paracetamol 500 mg - Batch B240812',
    rawText: `Subject: URGENT: Complaint Regarding Paracetamol 500mg Tablets - Batch B240812
From: QA Compliance <quality@abcpharma.com>
Date: 12 August 2026

Dear Quality Assurance Team,

Customer ABC Pharma Distributors reported that shipment received on 12 August 2026 for Paracetamol 500 mg Tablets (Batch B240812) had several tablets with broken edges and unusual yellow-brown discoloration upon blister strip opening.

Approximately 1,200 tablets across 60 blister packs are visibly affected. Receiving storage conditions were verified at 22°C and 45% relative humidity.

We request an immediate formal quality investigation, retain sample verification, and credit replacement for the compromised inventory.

Best regards,
Dr. Robert Vance
Head of Quality, ABC Pharma`
  },
  {
    id: 'demo-2',
    title: 'Crushed Packaging & Blister Foil Puncture',
    badge: 'Medium Risk / Transit Damage',
    source: 'Customer Portal',
    description: 'Ibuprofen 200 mg - Batch B1234',
    rawText: `Portal Intake Log: CMP-PORTAL-8891
Customer: MedHealth Care Logistics
Reported Date: 20 August 2026
Product: Ibuprofen Film-Coated Tablets 200 mg
Batch/Lot Number: B1234

During inbound receiving at MedHealth Central Hub, warehouse staff observed that 350 boxes arrived with crushed secondary packaging and severed outer shipper tamper seals. Upon opening individual cartons, multiple aluminum blister foils were found pierced and crumpled.

Immediate replacement of 350 boxes is requested along with carrier transit audit.`
  },
  {
    id: 'demo-3',
    title: 'Quantity Shipment Discrepancy',
    badge: 'Low Risk / Count Discrepancy',
    source: 'Phone',
    description: 'Amoxicillin 250 mg - Batch AMX-8820',
    rawText: `Telephone QA Intake Call Memo
Recorded by: Sarah Jenkins (Customer Service)
Caller: Apex Healthcare Hospital Network - Central Pharmacy
Date: 01 September 2026
Product: Amoxicillin Trihydrate Capsules 250 mg
Batch: AMX-8820

Pharmacist reported receiving dock inspection noted shipping pallet #4 arrived with 40 cartons fewer than indicated on invoice INV-90412 (total shortage of 400 blister packs). Outer tamper-evident tape on shipper carton remained completely intact.

Zero product damage observed. Customer requests expedited dispatch of missing 40 cartons or debit note.`
  }
];
