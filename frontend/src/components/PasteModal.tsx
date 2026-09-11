import React, { useState } from 'react';
import { X, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setPasteModalOpen } from '../store/uiSlice';
import { DEMO_PRESETS } from '../utils/demoData';

interface PasteModalProps {
  onAnalyze: (text: string, source: string) => void;
}

export const PasteModal: React.FC<PasteModalProps> = ({ onAnalyze }) => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.ui.isPasteModalOpen);
  const [text, setText] = useState('');
  const [source, setSource] = useState('Email');

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(setPasteModalOpen(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAnalyze(text.trim(), source);
    handleClose();
  };

  const handleLoadPreset = (presetText: string, presetSource: string) => {
    setText(presetText);
    setSource(presetSource);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Paste Customer Complaint or Email
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Demo Previews */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Quick Load Demo Pharma Complaints:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_PRESETS.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleLoadPreset(demo.rawText, demo.source)}
                  className="text-left p-2 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition text-xs group"
                >
                  <div className="font-medium text-slate-800 line-clamp-1 group-hover:text-blue-700">
                    {demo.title}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {demo.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Source Selection */}
          <div className="flex items-center gap-4">
            <div className="w-1/2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Complaint Intake Channel
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full text-xs rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Email">Email Communication</option>
                <option value="Customer Portal">Customer Portal Ticket</option>
                <option value="Phone">Telephone / Call Memo</option>
                <option value="Distributor">Distributor QA Report</option>
                <option value="Quality Audit">Internal / External Audit</option>
              </select>
            </div>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Raw Complaint Content or Email Body
              </label>
              {text.trim() && (
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Clear text
                </button>
              )}
            </div>
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste raw email, distributor correspondence, or phone call memo here...&#10;&#10;e.g. 'Customer ABC Pharma reported that Batch B240812 of Paracetamol 500 mg tablets had several tablets with broken edges and unusual discoloration. The shipment was received on 12 August 2026...'"
              className="w-full text-xs font-mono rounded-lg border border-slate-300 p-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Analyze with AI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
