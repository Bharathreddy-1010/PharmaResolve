import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ComplaintFormData, ComplaintRecord, FieldProvenance, ProvenanceType } from '../types/complaint';

const initialFormData: ComplaintFormData = {
  complaint_source: 'Email',
  customer_name: '',
  product_name: '',
  product_strength: '',
  batch_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  complaint_type: 'Product Quality Complaint',
  complaint_date: new Date().toISOString().split('T')[0],
  description: '',
  severity: 'Moderate',
  priority: 'Medium',
};

interface ComplaintState {
  formData: ComplaintFormData;
  fieldProvenance: FieldProvenance;
  activeComplaint: ComplaintRecord | null;
  complaintsList: ComplaintRecord[];
  isSaving: boolean;
  saveSuccess: boolean;
  error: string | null;
}

const initialState: ComplaintState = {
  formData: initialFormData,
  fieldProvenance: {},
  activeComplaint: null,
  complaintsList: [],
  isSaving: false,
  saveSuccess: false,
  error: null,
};

export const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    setFormField: (
      state,
      action: PayloadAction<{ field: keyof ComplaintFormData; value: string; provenance?: ProvenanceType }>
    ) => {
      const { field, value, provenance } = action.payload;
      state.formData[field] = value;
      state.fieldProvenance[field] = provenance || 'User Entered';
    },
    populateFromAi: (
      state,
      action: PayloadAction<{ data: Partial<ComplaintFormData>; provenance: FieldProvenance }>
    ) => {
      state.formData = {
        ...state.formData,
        ...action.payload.data,
      };
      state.fieldProvenance = action.payload.provenance;
      state.saveSuccess = false;
      state.error = null;
    },
    resetForm: (state) => {
      state.formData = initialFormData;
      state.fieldProvenance = {};
      state.activeComplaint = null;
      state.saveSuccess = false;
      state.error = null;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    setSaveSuccess: (state, action: PayloadAction<boolean>) => {
      state.saveSuccess = action.payload;
      state.isSaving = false;
    },
    setActiveComplaint: (state, action: PayloadAction<ComplaintRecord | null>) => {
      state.activeComplaint = action.payload;
      if (action.payload) {
        state.formData = {
          complaint_source: action.payload.complaint_source || 'Email',
          customer_name: action.payload.customer_name || '',
          product_name: action.payload.product_name || '',
          product_strength: action.payload.product_strength || '',
          batch_number: action.payload.batch_number || '',
          manufacturing_date: action.payload.manufacturing_date || '',
          expiry_date: action.payload.expiry_date || '',
          quantity_affected: action.payload.quantity_affected || '',
          complaint_type: action.payload.complaint_type || 'Product Quality Complaint',
          complaint_date: action.payload.complaint_date || '',
          description: action.payload.description || '',
          severity: action.payload.severity || 'Moderate',
          priority: action.payload.priority || 'Medium',
        };
        state.fieldProvenance = action.payload.field_provenance || {};
      }
    },
    setComplaintsList: (state, action: PayloadAction<ComplaintRecord[]>) => {
      state.complaintsList = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isSaving = false;
    },
  },
});

export const {
  setFormField,
  populateFromAi,
  resetForm,
  setSaving,
  setSaveSuccess,
  setActiveComplaint,
  setComplaintsList,
  setError,
} = complaintSlice.actions;

export default complaintSlice.reducer;
