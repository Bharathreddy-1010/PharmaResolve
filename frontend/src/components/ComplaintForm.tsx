import React from 'react';
import {
  RotateCcw,
  Save,
  Calendar,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import {
  setFormField,
  resetForm,
  setSaving,
  setSaveSuccess,
  setError,
  setComplaintsList,
} from '../store/complaintSlice';
import { setNotification } from '../store/uiSlice';
import { ProvenanceBadge } from './ProvenanceBadge';
import { api } from '../services/api';
import { ComplaintFormData } from '../types/complaint';

export const ComplaintForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { formData, fieldProvenance, isSaving, saveSuccess, error, activeComplaint } =
    useAppSelector((state) => state.complaint);
  const { structuredAi, activeExtractingField, recentlyFilledFields } =
    useAppSelector((state) => state.ai);

  const getFieldClass = (field: keyof ComplaintFormData, isTextarea = false) => {
    const base = isTextarea
      ? 'w-full text-xs rounded-lg p-3 text-slate-800 focus:outline-hidden transition leading-relaxed'
      : 'w-full text-xs rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden transition';

    if (activeExtractingField === field) {
      return `${base} border border-blue-400 ring-2 ring-blue-500 bg-blue-50/70 text-slate-900 shadow-sm animate-pulse`;
    }
    if (recentlyFilledFields.includes(field)) {
      return `${base} border border-emerald-400 ring-1 ring-emerald-300 bg-emerald-50/25 text-slate-900 transition-all duration-700`;
    }
    return `${base} border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500`;
  };

  const renderStatusBadge = (field: keyof ComplaintFormData) => {
    if (activeExtractingField === field) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded-sm animate-pulse">
          <Sparkles className="w-2.5 h-2.5" />
          Extracting...
        </span>
      );
    }
    if (recentlyFilledFields.includes(field)) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm transition-all duration-500">
          <Check className="w-2.5 h-2.5" />
          Filled
        </span>
      );
    }
    return null;
  };

  const handleInputChange = (field: keyof ComplaintFormData, value: string) => {
    dispatch(setFormField({ field, value, provenance: 'User Entered' }));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all form fields?')) {
      dispatch(resetForm());
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name && !formData.description) {
      alert('Please provide at least a Product Name or Complaint Description before saving.');
      return;
    }

    dispatch(setSaving(true));
    try {
      const payload = {
        ...formData,
        risk_level: structuredAi?.risk_level || 'MEDIUM',
        risk_confidence: structuredAi?.risk_confidence || 85.0,
        risk_reasoning: structuredAi?.risk_reasoning || 'Evaluated during intake review.',
        ai_summary: structuredAi?.summary || formData.description.slice(0, 150),
        completeness_score: structuredAi?.completeness_score || 85.0,
        missing_information: structuredAi?.missing_information || [],
        possible_root_causes: structuredAi?.possible_root_causes || [],
        recommendations: structuredAi?.recommended_actions || [],
        capa_recommendation: structuredAi?.capa_recommendation || '',
        duplicate_found: structuredAi?.duplicate_found || false,
        duplicate_notes: structuredAi?.duplicate_notes || '',
        field_provenance: fieldProvenance,
        status: 'Pending Triage',
      };

      const saved = await api.saveComplaint(payload);
      dispatch(setSaveSuccess(true));
      dispatch(
        setNotification({
          type: 'success',
          message: `Complaint ${saved.complaint_number} successfully saved to PostgreSQL database!`,
        })
      );

      // Refresh list
      const refreshed = await api.getComplaints();
      dispatch(setComplaintsList(refreshed));
    } catch (err: any) {
      dispatch(setError(err.message || 'Error saving complaint'));
      dispatch(
        setNotification({
          type: 'error',
          message: err.message || 'Could not save complaint',
        })
      );
    }
  };

  const statusBadgeText = activeComplaint?.complaint_number
    ? `Logged: ${activeComplaint.complaint_number}`
    : saveSuccess
    ? 'Saved & Triaged'
    : 'Pending Triage';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Form Header matching Reference UI */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Log Customer Complaint
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            API & FDF Quality Assurance Module
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
            saveSuccess
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {statusBadgeText}
        </span>
      </div>

      {/* Save Success Notice */}
      {saveSuccess && (
        <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 shrink-0">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Complaint successfully persisted in PostgreSQL database with GxP audit trail.
          </span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800 shrink-0">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Content (Internally scrollable, smooth) */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* SECTION 1 — ORIGIN & CUSTOMER DETAILS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
            <span>1. Origin & Customer Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Complaint Source */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Complaint Source</label>
                  {renderStatusBadge('complaint_source')}
                </div>
                <ProvenanceBadge type={fieldProvenance.complaint_source} />
              </div>
              <input
                type="text"
                id="field-complaint-source"
                value={formData.complaint_source}
                onChange={(e) => handleInputChange('complaint_source', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={getFieldClass('complaint_source')}
              />
            </div>

            {/* Customer Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Customer Name</label>
                  {renderStatusBadge('customer_name')}
                </div>
                <ProvenanceBadge type={fieldProvenance.customer_name} />
              </div>
              <input
                type="text"
                id="field-customer-name"
                value={formData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={getFieldClass('customer_name')}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2 — PRODUCT & BATCH IDENTIFICATION */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
            <span>2. Product & Batch Identification</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Product Name</label>
                  {renderStatusBadge('product_name')}
                </div>
                <ProvenanceBadge type={fieldProvenance.product_name} />
              </div>
              <input
                type="text"
                id="field-product-name"
                value={formData.product_name}
                onChange={(e) => handleInputChange('product_name', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={getFieldClass('product_name')}
              />
            </div>

            {/* Product Strength / Grade */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Product Strength / Grade</label>
                  {renderStatusBadge('product_strength')}
                </div>
                <ProvenanceBadge type={fieldProvenance.product_strength} />
              </div>
              <input
                type="text"
                id="field-product-strength"
                value={formData.product_strength}
                onChange={(e) => handleInputChange('product_strength', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={getFieldClass('product_strength')}
              />
            </div>

            {/* Batch / Lot Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Batch / Lot Number</label>
                  {renderStatusBadge('batch_number')}
                </div>
                <ProvenanceBadge type={fieldProvenance.batch_number} />
              </div>
              <input
                type="text"
                id="field-batch-number"
                value={formData.batch_number}
                onChange={(e) => handleInputChange('batch_number', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={`${getFieldClass('batch_number')} font-mono`}
              />
            </div>

            {/* Manufacturing Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Manufacturing Date</label>
                  {renderStatusBadge('manufacturing_date')}
                </div>
                <ProvenanceBadge type={fieldProvenance.manufacturing_date} />
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="field-manufacturing-date"
                  value={formData.manufacturing_date}
                  onChange={(e) => handleInputChange('manufacturing_date', e.target.value)}
                  placeholder="YYYY-MM-DD or Awaiting AI..."
                  className={`${getFieldClass('manufacturing_date')} pr-8`}
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Expiry Date</label>
                  {renderStatusBadge('expiry_date')}
                </div>
                <ProvenanceBadge type={fieldProvenance.expiry_date} />
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="field-expiry-date"
                  value={formData.expiry_date}
                  onChange={(e) => handleInputChange('expiry_date', e.target.value)}
                  placeholder="YYYY-MM-DD or Awaiting AI..."
                  className={`${getFieldClass('expiry_date')} pr-8`}
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Quantity Affected */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Quantity Affected</label>
                  {renderStatusBadge('quantity_affected')}
                </div>
                <ProvenanceBadge type={fieldProvenance.quantity_affected} />
              </div>
              <input
                type="text"
                id="field-quantity-affected"
                value={formData.quantity_affected}
                onChange={(e) => handleInputChange('quantity_affected', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={getFieldClass('quantity_affected')}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3 — COMPLAINT DETAILS */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
            <span>3. Complaint Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Complaint Type */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Complaint Type</label>
                  {renderStatusBadge('complaint_type')}
                </div>
                <ProvenanceBadge type={fieldProvenance.complaint_type} />
              </div>
              <input
                type="text"
                id="field-complaint-type"
                value={formData.complaint_type}
                onChange={(e) => handleInputChange('complaint_type', e.target.value)}
                placeholder="Awaiting AI extraction..."
                className={getFieldClass('complaint_type')}
              />
            </div>

            {/* Complaint Date */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Complaint Date</label>
                  {renderStatusBadge('complaint_date')}
                </div>
                <ProvenanceBadge type={fieldProvenance.complaint_date} />
              </div>
              <div className="relative">
                <input
                  type="text"
                  id="field-complaint-date"
                  value={formData.complaint_date}
                  onChange={(e) => handleInputChange('complaint_date', e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className={`${getFieldClass('complaint_date')} pr-8`}
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Detailed Complaint Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-medium text-slate-700">Detailed Complaint Description</label>
                {renderStatusBadge('description')}
              </div>
              <ProvenanceBadge type={fieldProvenance.description} />
            </div>
            <textarea
              id="field-description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Awaiting AI extraction..."
              className={getFieldClass('description', true)}
            />
          </div>
        </div>

        {/* SECTION 4 — INITIAL ASSESSMENT & PRIORITY */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
            <span>4. Initial Assessment & Priority</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Initial Severity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Initial Severity</label>
                  {renderStatusBadge('severity')}
                </div>
                <ProvenanceBadge type={fieldProvenance.severity} />
              </div>
              <select
                id="field-severity"
                value={formData.severity}
                onChange={(e) => handleInputChange('severity', e.target.value)}
                className={getFieldClass('severity')}
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-medium text-slate-700">Priority</label>
                  {renderStatusBadge('priority')}
                </div>
                <ProvenanceBadge type={fieldProvenance.priority} />
              </div>
              <select
                id="field-priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
                className={getFieldClass('priority')}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar matching Reference UI */}
        <div className="flex items-center justify-between pt-3 pb-3 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur-xs -mx-6 px-6 -mb-6 mt-6 shadow-xs shrink-0">
          <button
            type="button"
            id="btn-reset-form"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset Form
          </button>

          <button
            type="submit"
            id="btn-save-complaint"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving to Database...' : 'Save Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};
