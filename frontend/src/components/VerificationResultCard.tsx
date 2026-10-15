import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Terminal, FolderSymlink } from 'lucide-react';
import type { VerificationResult, VerificationStatus } from '../types';

interface VerificationResultCardProps {
  verification: VerificationResult;
}

export const VerificationResultCard: React.FC<VerificationResultCardProps> = ({ verification }) => {
  const { verdict, baseline_check, proposed_check, explanation, isolated_workspace } = verification;

  const getVerdictStyle = (v: VerificationStatus) => {
    switch (v) {
      case 'PASS':
        return {
          bg: 'bg-emerald-950/30 border-emerald-500/60',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
          label: 'FIX VERIFIED (PASS)'
        };
      case 'FAIL':
        return {
          bg: 'bg-rose-950/30 border-rose-500/60',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500',
          icon: <XCircle className="h-4 w-4 text-rose-400" />,
          label: 'VERIFICATION FAILED'
        };
      case 'INCONCLUSIVE':
        return {
          bg: 'bg-amber-950/30 border-amber-500/60',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500',
          icon: <AlertCircle className="h-4 w-4 text-amber-400" />,
          label: 'INCONCLUSIVE'
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700',
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <HelpCircle className="h-4 w-4 text-slate-400" />,
          label: 'NOT RUN'
        };
    }
  };

  const style = getVerdictStyle(verdict);

  return (
    <div className={`border rounded-lg p-3.5 ${style.bg} transition-all`}>
      {/* Verdict Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          {style.icon}
          <div className="flex items-center space-x-2">
            <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded border ${style.badge}`}>
              {style.label}
            </span>
            <span className="text-xs text-slate-300">{explanation}</span>
          </div>
        </div>

        {/* Sandbox Directory */}
        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          <FolderSymlink className="h-3 w-3 text-cyan-400" />
          <span className="truncate max-w-[180px]" title={isolated_workspace}>
            Sandbox: {isolated_workspace ? isolated_workspace.split(/[\\/]/).pop() : 'isolated'}
          </span>
        </div>
      </div>

      {/* Differential Baseline vs Patched Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs font-mono">
        {/* Baseline Execution */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-slate-500" />
              1. Pristine Baseline
            </span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${
              baseline_check.exit_code === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              Exit: {baseline_check.exit_code}
            </span>
          </div>
          <div className="mt-1.5 text-slate-400 truncate text-[11px]">
            <span className="text-slate-600">$ </span>
            {baseline_check.command}
          </div>
          <pre className="mt-1.5 p-2 bg-slate-900/50 rounded text-[10px] text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {baseline_check.output || 'No output recorded'}
          </pre>
        </div>

        {/* Proposed Patched Execution */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
            <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
              <Terminal className="h-3 w-3 text-cyan-400" />
              2. Isolated Patched Execution
            </span>
            <span className={`px-1.5 py-0.2 rounded font-bold ${
              proposed_check.exit_code === 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              Exit: {proposed_check.exit_code}
            </span>
          </div>
          <div className="mt-1.5 text-slate-400 truncate text-[11px]">
            <span className="text-slate-600">$ </span>
            {proposed_check.command}
          </div>
          <pre className="mt-1.5 p-2 bg-slate-900/50 rounded text-[10px] text-emerald-300/90 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {proposed_check.output || 'No output recorded'}
          </pre>
        </div>
      </div>
    </div>
  );
};