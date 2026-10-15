import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  TestTube2, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  GitCommit, 
  HeartPulse 
} from 'lucide-react';
import type { ScanResult } from '../types';

interface SummaryCardsProps {
  scanResult: ScanResult;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ scanResult }) => {
  const { summary, commit_hash, branch, detected_ecosystems, detected_manifests } = scanResult;

  const totalIssues = summary.errors_count + summary.warnings_count + summary.tests_failed + summary.security_issues;
  const baseHealth = 100 - (summary.errors_count * 12 + summary.tests_failed * 18 + summary.security_issues * 15 + summary.warnings_count * 3);
  const healthScore = Math.max(10, Math.min(100, totalIssues === 0 ? 100 : baseHealth));

  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#10b981', text: 'text-emerald-700', label: 'HEALTHY CONDITION' };
    if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-700', label: 'ELEVATED RISK' };
    return { stroke: '#ef4444', text: 'text-rose-700', label: 'CRITICAL ATTENTION' };
  };

  const scoreInfo = getScoreColor(healthScore);

  return (
    <div className="space-y-4">
      {/* Top Health & Target Metadata Banner */}
      <div className="liquid-glass rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Target Repo Commit & Environment */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
            <GitCommit className="h-3.5 w-3.5 text-indigo-600" />
            <span className="text-slate-500">Commit:</span>
            <span className="text-slate-900 font-bold">{commit_hash ? commit_hash.substring(0, 7) : 'HEAD'}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-semibold">{branch || 'main'}</span>
          </div>

          <div className="flex items-center space-x-2 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-slate-500">Ecosystem:</span>
            {detected_ecosystems.map((eco) => (
              <span key={eco} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold text-[11px]">
                {eco}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
            <span className="text-slate-500">Manifests:</span>
            {detected_manifests.map((m) => (
              <span key={m} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Repository Health Index Meter */}
        <div className="flex items-center space-x-4 bg-white/90 px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="h-14 w-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                className="stroke-slate-100"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke={scoreInfo.stroke}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 - (healthScore / 100) * (2 * Math.PI * 22)}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className={`absolute text-sm font-black font-mono ${scoreInfo.text}`}>
              {healthScore}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-bold">
              Health Score
            </div>
            <div className={`text-xs font-bold ${scoreInfo.text} flex items-center gap-1 mt-0.5`}>
              <HeartPulse className="h-3.5 w-3.5 animate-pulse" />
              <span>{scoreInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Vitals Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Findings */}
        <div className="liquid-glass rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Diagnostics</span>
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2.5 text-3xl font-black text-slate-900 tracking-tight font-mono">
            {summary.total_findings}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">Observed AST</div>
        </div>

        {/* Critical Errors */}
        <div className="liquid-glass rounded-2xl p-4 flex flex-col justify-between border-rose-200/80 bg-rose-50/40 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold">
            <span>Critical Errors</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-2.5 text-3xl font-black text-rose-700 tracking-tight font-mono">
            {summary.errors_count}
          </div>
          <div className="mt-1 text-[11px] text-rose-600/80 font-mono">Priority Triage</div>
        </div>

        {/* Warnings & Lints */}
        <div className="liquid-glass rounded-2xl p-4 flex flex-col justify-between border-amber-200/80 bg-amber-50/40 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Lint Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2.5 text-3xl font-black text-amber-700 tracking-tight font-mono">
            {summary.warnings_count}
          </div>
          <div className="mt-1 text-[11px] text-amber-600/80 font-mono">AST Rules</div>
        </div>

        {/* Test Suite Failures */}
        <div className="liquid-glass rounded-2xl p-4 flex flex-col justify-between border-indigo-200/80 bg-indigo-50/40 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold">
            <span>Test Failures</span>
            <TestTube2 className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2.5 text-3xl font-black text-slate-900 tracking-tight font-mono flex items-baseline gap-1">
            <span className={summary.tests_failed > 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {summary.tests_failed}
            </span>
            <span className="text-xs text-slate-400 font-normal">/ {summary.tests_found}</span>
          </div>
          <div className="mt-1 text-[11px] text-indigo-600/80 font-mono">{summary.tests_passed} passed</div>
        </div>

        {/* Security Risks */}
        <div className="liquid-glass rounded-2xl p-4 flex flex-col justify-between border-purple-200/80 bg-purple-50/40 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
            <span>Security Risks</span>
            <ShieldAlert className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2.5 text-3xl font-black text-purple-700 tracking-tight font-mono">
            {summary.security_issues}
          </div>
          <div className="mt-1 text-[11px] text-purple-600/80 font-mono">Bandit alerts</div>
        </div>

        {/* Passed Checks */}
        <div className="liquid-glass rounded-2xl p-4 flex flex-col justify-between border-emerald-200/80 bg-emerald-50/40 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Passed Checks</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2.5 text-3xl font-black text-emerald-700 tracking-tight font-mono">
            {summary.passed_checks_count}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600/80 font-mono">Verified clean</div>
        </div>
      </div>
    </div>
  );
};
