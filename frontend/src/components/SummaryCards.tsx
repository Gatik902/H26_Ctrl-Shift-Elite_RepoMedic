import React from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  TestTube2, 
  Layers, 
  Activity,
  HeartPulse,
  GitCommit
} from 'lucide-react';
import { ScanResult } from '../types';

interface SummaryCardsProps {
  scanResult: ScanResult;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ scanResult }) => {
  const { summary, detected_ecosystems, detected_manifests, commit_hash, branch } = scanResult;

  // Calculate dynamic repository health score out of 100
  const penalty = (summary.errors_count * 15) + (summary.security_issues * 10) + (summary.warnings_count * 2) + (summary.tests_failed * 20);
  const healthScore = Math.max(12, Math.min(100, 100 - penalty));

  const getScoreColor = (score: number) => {
    if (score >= 85) return { stroke: '#10b981', text: 'text-emerald-400', label: 'HEALTHY' };
    if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-400', label: 'ELEVATED RISK' };
    return { stroke: '#f43f5e', text: 'text-rose-400', label: 'CRITICAL ICU INTERVENTION' };
  };

  const scoreInfo = getScoreColor(healthScore);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-4">
      {/* Top Health & Target Metadata Banner */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 border border-cyan-500/20">
        {/* Left: Target Repo Commit & Environment */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <GitCommit className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-400">Commit:</span>
            <span className="text-cyan-300 font-bold">{commit_hash ? commit_hash.substring(0, 7) : 'HEAD'}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300">{branch || 'main'}</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Ecosystem:</span>
            {detected_ecosystems.map((eco) => (
              <span key={eco} className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold text-[11px]">
                {eco}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Manifests:</span>
            {detected_manifests.map((m) => (
              <span key={m} className="px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded text-[11px]">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Right: Repository Health Index Meter */}
        <div className="flex items-center space-x-4 bg-slate-950/90 px-4 py-2.5 rounded-2xl border border-slate-800/90 shadow-inner">
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="h-14 w-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="23"
                className="stroke-slate-800"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="23"
                stroke={scoreInfo.stroke}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 23}
                strokeDashoffset={2 * Math.PI * 23 - (healthScore / 100) * (2 * Math.PI * 23)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <span className={`absolute text-sm font-extrabold font-mono ${scoreInfo.text}`}>
              {healthScore}%
            </span>
          </div>

          <div>
            <div className="text-[10px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
              Repository Vitals Score
            </div>
            <div className={`text-xs font-extrabold ${scoreInfo.text} flex items-center gap-1.5`}>
              <HeartPulse className="h-3.5 w-3.5 animate-pulse" />
              <span>{scoreInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Vitals Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Findings */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Diagnostics</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tracking-tight font-mono">
            {summary.total_findings}
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">Observed across AST</div>
        </div>

        {/* Critical & High Errors */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between border-rose-500/30 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Critical Errors</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-400 tracking-tight font-mono">
            {summary.errors_count}
          </div>
          <div className="mt-1 text-[11px] text-rose-300/80 font-medium">Priority remediation</div>
        </div>

        {/* Warnings & Lints */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between border-amber-500/30 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-amber-400 text-xs font-medium">
            <span>Lint Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-400 tracking-tight font-mono">
            {summary.warnings_count}
          </div>
          <div className="mt-1 text-[11px] text-amber-300/80 font-medium">Code quality rules</div>
        </div>

        {/* Test Suite Failures */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between border-indigo-500/30 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-indigo-400 text-xs font-medium">
            <span>Test Failures</span>
            <TestTube2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white tracking-tight font-mono flex items-baseline gap-1">
            <span className={summary.tests_failed > 0 ? 'text-rose-400' : 'text-emerald-400'}>
              {summary.tests_failed}
            </span>
            <span className="text-xs text-slate-500 font-normal">/ {summary.tests_found} tests</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-medium">{summary.tests_passed} passed</div>
        </div>

        {/* Security Risks */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between border-purple-500/30 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium">
            <span>Security Risks</span>
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-purple-300 tracking-tight font-mono">
            {summary.security_issues}
          </div>
          <div className="mt-1 text-[11px] text-purple-300/80 font-medium">Bandit AST alerts</div>
        </div>

        {/* Passed Checks */}
        <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between border-emerald-500/30 hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Passed Checks</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
            {summary.passed_checks_count}
          </div>
          <div className="mt-1 text-[11px] text-emerald-300/80 font-medium">Verified healthy</div>
        </div>
      </div>
    </div>
  );
};