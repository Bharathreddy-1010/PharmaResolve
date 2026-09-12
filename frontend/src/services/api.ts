import { ComplaintFormData, ComplaintRecord } from '../types/complaint';
import { StructuredComplaintAI, ProcessingStage, ChatMessage } from '../types/ai';

const rawBase = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = rawBase ? `${rawBase.replace(/\/+$/, '')}/api` : '/api';

export interface AnalyzeResult {
  success: boolean;
  data: StructuredComplaintAI;
  stages: ProcessingStage[];
  error?: string;
}

export const api = {
  // Analyze pasted text or email
  async analyzeText(text: string, source: string = 'Email'): Promise<AnalyzeResult> {
    const response = await fetch(`${API_BASE}/complaints/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Analysis failed' }));
      throw new Error(err.detail || 'Failed to analyze complaint');
    }
    return response.json();
  },

  // Analyze uploaded document (PDF, DOCX, TXT, EML, Image)
  async analyzeFile(file: File, source: string = 'Uploaded File'): Promise<AnalyzeResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source', source);

    const response = await fetch(`${API_BASE}/complaints/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'File analysis failed' }));
      throw new Error(err.detail || 'Failed to analyze uploaded file');
    }
    return response.json();
  },

  // Save reviewed complaint
  async saveComplaint(complaintData: Partial<ComplaintRecord>): Promise<ComplaintRecord> {
    const response = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Failed to save complaint' }));
      throw new Error(err.detail || 'Failed to save complaint');
    }
    return response.json();
  },

  // Fetch list of complaints
  async getComplaints(search?: string, riskLevel?: string, status?: string): Promise<ComplaintRecord[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (riskLevel && riskLevel !== 'ALL') params.append('risk_level', riskLevel);
    if (status && status !== 'ALL') params.append('status', status);

    const response = await fetch(`${API_BASE}/complaints?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve complaints registry');
    }
    return response.json();
  },

  // Fetch single complaint
  async getComplaint(id: number): Promise<ComplaintRecord> {
    const response = await fetch(`${API_BASE}/complaints/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to retrieve complaint #${id}`);
    }
    return response.json();
  },

  // Copilot Interactive Chat
  async askCopilot(query: string, complaintContext?: any): Promise<{
    answer: string;
    references: string[];
    suggested_followups: string[];
    field_updates?: Record<string, any> | null;
  }> {
    const response = await fetch(`${API_BASE}/complaints/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, complaint_context: complaintContext }),
    });
    if (!response.ok) {
      throw new Error('Copilot inquiry failed');
    }
    return response.json();
  },

  // System Diagnostics Health
  async getHealth(): Promise<any> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  }
};
