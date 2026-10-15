import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Terminal, Clock, FolderSymlink } from 'lucide-react';
import { VerificationResult, VerificationStatus } from '../types';

interface VerificationResultCardProps {
  verification: VerificationResult;
}

export const VerificationResultCard: React.FC<VerificationResultCardProps> = ({ verification }) => {
  const { verdict, baseline_check, proposed_check, explanation, isolated_workspace } = verification;

  const getVerdictStyle = (v: VerificationStatus) => {
    switch (v) {
      case 'PASS':
        return {
          bg: 'bg-emerald-950/40 border-emerald-500/80',
          text: 'text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
          label: 'FIX VERIFIED (PASS)'
        };
      case 'FAIL':
        return {
          bg: 'bg-rose-950/40 border-rose-500/80',
          text: 'text-rose-300',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500',
          icon: <XCircle className="h-5 w-5 text-rose-400" />,
          label: 'VERIFICATION FAILED'
        };
      case 'INCONCLUSIVE':
        return {
          bg: 'bg-amber-950/40 border-amber-500/80',
          text: 'text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500',
          icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
          label: 'INCONCLUSIVE'
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700',
          text: 'text-slate-300',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <HelpCircle className="h-5 w-5 text-slate-400" />,
          label: 'NOT RUN'
        };
    }
  };

  const style = getVerdictStyle(verdict);

  return (
    <div className={`border rounded-xl p-4 ${style.bg} transition-all`}>
      {/* Verdict Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          {style.icon}
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${style.badge}`}>
                {style.label}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Differential Exit Code Comparison
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{explanation}</p>
          </div>
        </div>

        {/* Isolated Workspace Note */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono bg-slate-950/70 px-2.5 py-1 rounded border border-slate-800">
          <FolderSymlink className="h-3.5 w-3.5 text-cyan-400" />
          <span className="truncate max-w-[200px]" title={isolated_workspace}>
            Sandbox: {isolated_workspace ? isolated_workspace.split(/[\\/]/).pop() : 'isolated'}
          </span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3.5 text-xs font-mono">
        {/* Baseline Check */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-slate-500" />
              1. Pristine Baseline Execution
            </span>
            <span className={`px-2 py-0.2 rounded font-bold ${
              baseline_check.exit_code === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              Exit: {baseline_check.exit_code}
            </span>
          </div>
          <div className="mt-2 text-slate-400 truncate" title={baseline_check.command}>
            <span className="text-slate-500">$ </span>
            {baseline_check.command}
          </div>
          <pre className="mt-2 p-2 bg-slate-900/60 rounded text-[11px] text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {baseline_check.output || 'No output recorded'}
          </pre>
        </div>

        {/* Proposed Check (Isolated) */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
            <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-cyan-400" />
              2. Isolated Patched Sandbox
            </span>
            <span className={`px-2 py-0.2 rounded font-bold ${
              proposed_check.exit_code === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              Exit: {proposed_check.exit_code}
            </span>
          </div>
          <div className="mt-2 text-slate-400 truncate" title={proposed_check.command}>
            <span className="text-slate-500">$ </span>
            {proposed_check.command}
          </div>
          <pre className="mt-2 p-2 bg-slate-900/60 rounded text-[11px] text-emerald-300/90 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {proposed_check.output || 'No output recorded'}
          </pre>
        </div>
      </div>
    </div>
  );
};
