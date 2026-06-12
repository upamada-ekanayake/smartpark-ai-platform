import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md p-8 rounded-3xl glassmorphism text-center border border-red-500/10">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Access Denied</h2>
        <p className="text-slate-400 text-xs leading-relaxed mb-6">
          You do not have the required permissions to view this administrative resource. Please contact system support if you believe this is an error.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition duration-200"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
};
