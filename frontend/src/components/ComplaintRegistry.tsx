import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setComplaintsList, setActiveComplaint } from '../store/complaintSlice';
import { setCurrentTab } from '../store/uiSlice';
import { api } from '../services/api';
import { ComplaintRecord } from '../types/complaint';

export const ComplaintRegistry: React.FC = () => {
  const dispatch = useAppDispatch();
  const complaints = useAppSelector((state) => state.complaint.complaintsList);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null);

  const loadComplaints = async () => {
    setIsLoading(true);
    try {
      const data = await api.getComplaints(searchTerm, riskFilter, statusFilter);
      dispatch(setComplaintsList(data));
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [riskFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleViewInForm = (comp: ComplaintRecord) => {
    dispatch(setActiveComplaint(comp));
    dispatch(setCurrentTab('intake'));
  };

  return (
    <div className="space-y-4">
      {/* Registry Title & Stats Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Customer Complaint Registry
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            GxP Complaint Records & Quality Investigation Log (PostgreSQL Store)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadComplaints}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row items-center gap-3 justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search complaint #, customer, batch..."
            className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Risk Level Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-700 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-700 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending Triage">Pending Triage</option>
            <option value="Investigating">Investigating</option>
            <option value="CAPA Required">CAPA Required</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Complaint #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product & Strength</th>
                <th className="py-3 px-4">Batch / Lot</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reported Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    {isLoading ? 'Loading complaints from PostgreSQL...' : 'No complaints found.'}
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedComplaint(c)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-4 font-semibold text-blue-600 font-mono">
                      {c.complaint_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {c.customer_name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.product_name || '—'} {c.product_strength && `(${c.product_strength})`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.batch_number || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.risk_level === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : c.risk_level === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : c.risk_level === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {c.complaint_date || c.created_at?.slice(0, 10) || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewInForm(c);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Complaint Detail Modal / Drawer */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {selectedComplaint.complaint_number}
                </span>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {selectedComplaint.product_name} ({selectedComplaint.batch_number})
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Customer</span>
                  <span className="font-semibold text-slate-800">{selectedComplaint.customer_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Batch / Lot</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedComplaint.batch_number || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Risk Level</span>
                  <span className="font-bold text-rose-700">{selectedComplaint.risk_level} ({selectedComplaint.risk_confidence}%)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Status</span>
                  <span className="font-medium text-slate-800">{selectedComplaint.status}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-800 block mb-1">Complaint Description:</span>
                <p className="p-3 bg-slate-50 rounded-lg border border-slate-200 leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.risk_reasoning && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">ICH Q9 Risk Rationale:</span>
                  <p className="p-3 bg-rose-50/50 text-rose-900 rounded-lg border border-rose-200 leading-relaxed">
                    {selectedComplaint.risk_reasoning}
                  </p>
                </div>
              )}

              {selectedComplaint.possible_root_causes && selectedComplaint.possible_root_causes.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Suggested Root Cause Categories:</span>
                  <ul className="list-disc list-inside p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                    {selectedComplaint.possible_root_causes.map((rc, i) => (
                      <li key={i}>{rc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedComplaint.capa_recommendation && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">CAPA Recommendation:</span>
                  <p className="p-3 bg-blue-50 text-blue-900 rounded-lg border border-blue-200 leading-relaxed">
                    {selectedComplaint.capa_recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Created: {selectedComplaint.created_at?.slice(0, 10)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleViewInForm(selectedComplaint);
                    setSelectedComplaint(null);
                  }}
                  className="px-4 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                  Open in Complaint Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
