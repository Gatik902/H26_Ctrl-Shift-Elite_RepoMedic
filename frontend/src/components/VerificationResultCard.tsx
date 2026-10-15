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
          bg: 'bg-emerald-50/80 border-emerald-200 shadow-sm',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
          label: 'VERIFIED PASS'
        };
      case 'FAIL':
        return {
          bg: 'bg-rose-50/80 border-rose-200 shadow-sm',
          badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
          icon: <XCircle className="h-4 w-4 text-rose-600" />,
          label: 'VERIFICATION FAILED'
        };
      case 'INCONCLUSIVE':
        return {
          bg: 'bg-amber-50/80 border-amber-200 shadow-sm',
          badge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
          label: 'INCONCLUSIVE'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200',
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <HelpCircle className="h-4 w-4 text-slate-500" />,
          label: 'NOT RUN'
        };
    }
  };

  const style = getVerdictStyle(verdict);

  return (
    <div className={`border rounded-2xl p-4.5 ${style.bg}`}>
      {/* Verdict Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div className="flex items-center space-x-2">
          {style.icon}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-md border ${style.badge}`}>
              {style.label}
            </span>
            <span className="text-xs text-slate-800 font-bold">{explanation}</span>
          </div>
        </div>

        {/* Sandbox Directory */}
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-600 font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
          <FolderSymlink className="h-3.5 w-3.5 text-indigo-600" />
          <span className="truncate max-w-[200px]" title={isolated_workspace}>
            Sandbox: {isolated_workspace ? isolated_workspace.split(/[\\/]/).pop() : 'isolated'}
          </span>
        </div>
      </div>

      {/* Differential Baseline vs Patched Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5 text-xs font-mono">
        {/* Baseline Execution */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
            <span className="text-slate-600 font-bold flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-slate-400" />
              1. Baseline Check
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold ${
              baseline_check.exit_code === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              Exit: {baseline_check.exit_code}
            </span>
          </div>
          <div className="mt-2 text-slate-600 truncate text-[11px]">
            <span className="text-indigo-600 font-bold">$ </span>
            {baseline_check.command}
          </div>
          <pre className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] text-slate-700 max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {baseline_check.output || 'No output recorded'}
          </pre>
        </div>

        {/* Proposed Patched Execution */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
            <span className="text-indigo-700 font-bold flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-indigo-600" />
              2. Isolated Patched Execution
            </span>
            <span className={`px-2 py-0.5 rounded-md font-bold ${
              proposed_check.exit_code === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              Exit: {proposed_check.exit_code}
            </span>
          </div>
          <div className="mt-2 text-slate-600 truncate text-[11px]">
            <span className="text-indigo-600 font-bold">$ </span>
            {proposed_check.command}
          </div>
          <pre className="mt-2 p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-[10px] text-emerald-900 font-semibold max-h-28 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {proposed_check.output || 'No output recorded'}
          </pre>
        </div>
      </div>
    </div>
  );
};
