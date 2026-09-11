import React, { useEffect, useState } from 'react';
import { ShieldCheck, FileSpreadsheet, PlusCircle, CheckCircle2, Activity } from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setCurrentTab } from '../store/uiSlice';
import { resetForm } from '../store/complaintSlice';
import { resetAiState } from '../store/aiSlice';
import { api } from '../services/api';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTab = useAppSelector((state) => state.ui.currentTab);
  const complaintsList = useAppSelector((state) => state.complaint.complaintsList);
  const [health, setHealth] = useState<{ dialect?: string; model?: string; fallback?: boolean }>({});

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        setHealth({
          dialect: res.database?.dialect,
          model: res.ai?.model,
          fallback: res.ai?.fallback_active,
        });
      })
      .catch(() => {});
  }, []);

  const handleNewComplaint = () => {
    dispatch(resetForm());
    dispatch(resetAiState());
    dispatch(setCurrentTab('intake'));
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Module Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 tracking-tight text-base">
                  PharmaQMS Enterprise
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  GxP QA Module
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Active Pharmaceutical Ingredients & Finished Dosage Forms Complaint Triage
              </p>
            </div>
          </div>

          {/* System Health & Connectivity Pill */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">PostgreSQL</span>
            <span className="text-slate-300">•</span>
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-700 font-medium">
              LangGraph + {health.model || 'gemma2-9b-it'}
            </span>
          </div>

          {/* Navigation & Action Buttons */}
          <div className="flex items-center gap-3">
            <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                id="tab-intake-btn"
                onClick={() => dispatch(setCurrentTab('intake'))}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  currentTab === 'intake'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Log Complaint
              </button>
              <button
                id="tab-registry-btn"
                onClick={() => dispatch(setCurrentTab('registry'))}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'registry'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Registry
                {complaintsList.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                    {complaintsList.length}
                  </span>
                )}
              </button>
            </nav>

            <button
              id="new-complaint-btn"
              onClick={handleNewComplaint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Complaint
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
