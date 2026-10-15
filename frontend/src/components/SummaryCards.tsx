import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert, FileCode2, TestTube2, Layers } from 'lucide-react';
import { ScanSummary, ScanResult } from '../types';

interface SummaryCardsProps {
  scanResult: ScanResult;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ scanResult }) => {
  const { summary, detected_ecosystems, detected_manifests, commit_hash, branch } = scanResult;

  return (
    <div className="space-y-4">
      {/* Target Repo Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/40 border border-slate-800/80 rounded-xl text-xs">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">Target Commit:</span>
          <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-cyan-300">
            {commit_hash ? commit_hash.substring(0, 7) : 'HEAD'}
          </span>
          <span className="text-slate-400">Branch:</span>
          <span className="font-mono text-slate-300">
            {branch || 'main'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Ecosystems:</span>
          {detected_ecosystems.length > 0 ? (
            detected_ecosystems.map((eco) => (
              <span key={eco} className="px-2 py-0.5 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded font-medium text-[11px]">
                {eco}
              </span>
            ))
          ) : (
            <span className="text-slate-500 italic">Generic</span>
          )}

          <span className="text-slate-400 ml-2">Manifests:</span>
          {detected_manifests.map((m) => (
            <span key={m} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[11px]">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Findings */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Findings</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {summary.total_findings}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Observed diagnostics</div>
        </div>

        {/* Critical / High Errors */}
        <div className="bg-slate-900/60 border border-rose-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium">Errors</span>
            <AlertCircle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">
            {summary.errors_count}
          </div>
          <div className="mt-1 text-[11px] text-rose-500/80">Critical & High priority</div>
        </div>

        {/* Warnings */}
        <div className="bg-slate-900/60 border border-amber-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium">Warnings</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
            {summary.warnings_count}
          </div>
          <div className="mt-1 text-[11px] text-amber-500/80">Medium & Low lint</div>
        </div>

        {/* Test Suite Failures */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Test Vitals</span>
            <TestTube2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className={`text-2xl font-bold ${summary.tests_failed > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {summary.tests_failed}
            </span>
            <span className="text-xs text-slate-400">/ {summary.tests_found} failed</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">{summary.tests_passed} tests passed</div>
        </div>

        {/* Security Risks */}
        <div className="bg-slate-900/60 border border-purple-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-medium">Security Risks</span>
            <ShieldAlert className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300 tracking-tight">
            {summary.security_issues}
          </div>
          <div className="mt-1 text-[11px] text-purple-400/80">Bandit AST alerts</div>
        </div>

        {/* Passed Checks */}
        <div className="bg-slate-900/60 border border-emerald-900/40 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium">Passed Checks</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 tracking-tight">
            {summary.passed_checks_count}
          </div>
          <div className="mt-1 text-[11px] text-emerald-500/80">Valid test & AST checks</div>
        </div>
      </div>
    </div>
  );
};
