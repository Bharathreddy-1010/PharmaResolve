export type ProvenanceType = 'AI Extracted' | 'AI Inferred' | 'User Entered' | 'Missing';

export interface FieldProvenance {
  [key: string]: ProvenanceType;
}

export interface ComplaintFormData {
  customer_name: string;
  complaint_source: string;
  product_name: string;
  product_strength: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity_affected: string;
  complaint_type: string;
  complaint_date: string;
  description: string;
  severity: string;
  priority: string;
}

export interface ComplaintRecord extends ComplaintFormData {
  id: number;
  complaint_number: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_confidence: number;
  risk_reasoning: string;
  ai_summary: string;
  completeness_score: number;
  missing_information: string[];
  possible_root_causes: string[];
  recommendations: string[];
  capa_recommendation: string;
  duplicate_found: boolean;
  duplicate_notes?: string;
  field_provenance: FieldProvenance;
  status: string;
  created_at: string;
  updated_at: string;
}
