import React from 'react';
import { Sparkles, Edit3, AlertCircle } from 'lucide-react';
import { ProvenanceType } from '../types/complaint';

interface ProvenanceBadgeProps {
  type?: ProvenanceType;
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ type }) => {
  if (!type) return null;

  switch (type) {
    case 'AI Extracted':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          <Sparkles className="w-2.5 h-2.5" />
          AI Extracted
        </span>
      );
    case 'AI Inferred':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
          <Sparkles className="w-2.5 h-2.5" />
          AI Inferred
        </span>
      );
    case 'User Entered':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
          <Edit3 className="w-2.5 h-2.5" />
          User Entered
        </span>
      );
    case 'Missing':
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
          <AlertCircle className="w-2.5 h-2.5" />
          Missing
        </span>
      );
    default:
      return null;
  }
};
