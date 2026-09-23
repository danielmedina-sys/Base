import React from 'react';
import { Check, Copy } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
      <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2.5 text-xs font-medium">
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Check className="w-3.5 h-3.5" />
        </div>
        <span>{message}</span>
      </div>
    </div>
  );
};
