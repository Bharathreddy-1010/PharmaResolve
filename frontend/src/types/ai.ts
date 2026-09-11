import { FieldProvenance } from './complaint';

export interface ProcessingStage {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  details?: string;
}

export interface StructuredComplaintAI {
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
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_confidence: number;
  risk_reasoning: string;
  summary: string;
  completeness_score: number;
  missing_information: string[];
  possible_root_causes: string[];
  recommended_actions: string[];
  capa_recommendation: string;
  duplicate_found: boolean;
  duplicate_notes?: string;
  field_provenance: FieldProvenance;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  content: string;
  timestamp: string;
  references?: string[];
  suggested_followups?: string[];
}
