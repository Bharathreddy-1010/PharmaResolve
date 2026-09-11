import React from 'react';
import { Header } from '../components/Header';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { useAppSelector } from '../hooks/useAppSelector';
import { setNotification } from '../store/uiSlice';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const notification = useAppSelector((state) => state.ui.notification);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased flex flex-col">
      <Header />

      {/* Global Notification Toast */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-4">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between shadow-xs text-xs animate-in slide-in-from-top-2 duration-150 ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2 font-medium">
              {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
              {notification.type === 'info' && <Info className="w-4 h-4 text-blue-600" />}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => dispatch(setNotification(null))}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full min-h-0">
        {children}
      </main>

      {/* Enterprise Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">PharmaQMS™ Suite</span> • GxP Validated Quality Management System
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>ICH Q9 / Q10 Compliant</span>
            <span>•</span>
            <span>21 CFR Part 11 Audit Trail Ready</span>
            <span>•</span>
            <span>Powered by LangGraph & Groq</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
