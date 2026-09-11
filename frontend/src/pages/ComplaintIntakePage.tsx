import React from 'react';
import { ComplaintForm } from '../components/ComplaintForm';
import { IntakeAssistant } from '../components/IntakeAssistant';

export const ComplaintIntakePage: React.FC = () => {
  return (
    <div
      style={{ height: 'calc(100vh - 7.5rem)', minHeight: '580px' }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
    >
      {/* Left Column: Log Customer Complaint Form (matches reference UI, independent scroll) */}
      <div className="lg:col-span-7 h-full min-h-0 overflow-hidden flex flex-col">
        <ComplaintForm />
      </div>

      {/* Right Column: AI Complaint Intake Assistant & Copilot (matches reference UI, independent scroll) */}
      <div className="lg:col-span-5 h-full min-h-0 overflow-hidden flex flex-col">
        <IntakeAssistant />
      </div>
    </div>
  );
};
