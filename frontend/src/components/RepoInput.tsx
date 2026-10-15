import React, { useState } from 'react';
import { GitBranch, Play, Loader2, Sparkles, FolderGit2, Lock, Terminal, Activity, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { SampleRepo } from '../types';

interface RepoInputProps {
  onStartScan: (url: string, branch: string, isSample: boolean, sampleId?: string) => void;
  scanStatus: string;
  isScanning: boolean;
  samples: SampleRepo[];
}

export const RepoInput: React.FC<RepoInputProps> = ({
  onStartScan,
  scanStatus,
  isScanning,
  samples
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSample) {
      onStartScan('', branch, true, selectedSample);
    } else if (repoUrl.trim()) {
      onStartScan(repoUrl.trim(), branch.trim() || 'main', false);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    setRepoUrl('');
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRepoUrl(e.target.value);
    setSelectedSample(null);
  };

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono text-indigo-700 mb-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="font-bold">REPOSITORY INTAKE STATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Connect Codebase for Autonomous Triage
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Feed any public GitHub URL or run the verified benchmark repo to detect genuine AST lint errors, test regressions, and security flaws in an isolated sandbox ward.
          </p>
        </div>

        {/* Quick Launch Benchmark Cards */}
        {samples.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Verified Suite:
            </span>
            {samples.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSample(s.id)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  selectedSample === s.id
                    ? 'bg-indigo-600 text-white font-bold border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                <span className="font-bold">{s.id}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold ${
                  selectedSample === s.id ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  BENCHMARK
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form Inputs */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Repo URL Input */}
          <div className="lg:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={handleCustomInput}
              disabled={isScanning}
              placeholder="https://github.com/owner/repository"
              className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono shadow-inner"
            />
            <div className="absolute right-3.5 top-3.5 text-[10px] font-mono text-emerald-600 font-semibold pointer-events-none hidden sm:block">
              SSRF Protected
            </div>
          </div>

          {/* Branch Input */}
          <div className="lg:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <GitBranch className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isScanning}
              placeholder="main"
              className="w-full pl-9 pr-3.5 py-3 bg-white/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono shadow-inner"
            />
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isScanning || (!repoUrl && !selectedSample)}
              className="w-full h-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-500/25 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Analyze Codebase</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Diagnostic Timeline Stepper */}
        {isScanning && (
          <div className="mt-5 pt-4 border-t border-slate-200/60 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-slate-700 font-mono mb-2.5">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                <span className="font-bold text-slate-900">Live Execution Pipeline</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[11px]">
                {scanStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                scanStatus === 'CLONING' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm' 
                  : 'bg-white/60 border-slate-200 text-slate-400'
              }`}>
                <Terminal className="h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-bold text-[11px]">1. Ingestion</div>
                  <div className="text-[10px] text-slate-500">SSRF Isolation</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                scanStatus === 'ANALYZING' 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm' 
                  : 'bg-white/60 border-slate-200 text-slate-400'
              }`}>
                <Activity className="h-4 w-4 text-indigo-600" />
                <div>
                  <div className="font-bold text-[11px]">2. Flake8 Lint</div>
                  <div className="text-[10px] text-slate-500">Compiler AST</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                scanStatus === 'ANALYZING' 
                  ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-sm' 
                  : 'bg-white/60 border-slate-200 text-slate-400'
              }`}>
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="font-bold text-[11px]">3. Bandit AST</div>
                  <div className="text-[10px] text-slate-500">Security Check</div>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                scanStatus === 'COMPLETED' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-sm' 
                  : 'bg-white/60 border-slate-200 text-slate-400'
              }`}>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <div>
                  <div className="font-bold text-[11px]">4. Pytest Suite</div>
                  <div className="text-[10px] text-slate-500">Assertions</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
