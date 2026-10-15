import React, { useState } from 'react';
import { 
  Search, 
  GitBranch, 
  Play, 
  Loader2, 
  FolderGit2, 
  Sparkles, 
  ShieldCheck, 
  Terminal,
  Activity,
  Layers,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { SampleRepo, ScanJobStatus } from '../types';

interface RepoInputProps {
  onStartScan: (repoUrl: string, branch: string, isSample: boolean, sampleId?: string) => void;
  scanStatus: ScanJobStatus;
  isScanning: boolean;
  samples: SampleRepo[];
}

export const RepoInput: React.FC<RepoInputProps> = ({
  onStartScan,
  scanStatus,
  isScanning,
  samples
}) => {
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/Gatik902/svv-hackathon');
  const [branch, setBranch] = useState<string>('main');
  const [selectedSample, setSelectedSample] = useState<string>('py-vulnerable-calc');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSample) {
      onStartScan('', branch, true, selectedSample);
    } else {
      if (!repoUrl) return;
      onStartScan(repoUrl, branch, false);
    }
  };

  const handleSelectSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    const sample = samples.find(s => s.id === sampleId);
    if (sample) {
      setRepoUrl(`[Benchmark Target Repo]: ${sample.name}`);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSample('');
    setRepoUrl(e.target.value);
  };

  return (
    <div className="relative group rounded-3xl p-0.5 bg-gradient-to-b from-cyan-500/30 via-slate-800/40 to-slate-900/60 shadow-2xl">
      <div className="bg-[#0b101e]/90 rounded-[23px] p-6 sm:p-7 backdrop-blur-xl border border-cyan-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-[11px] text-cyan-300 font-mono mb-2">
              <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
              <span>INTAKE DESK & SURGICAL TRIAGE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Target Repository Intake</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Feed any public GitHub URL or select a verified benchmark repo to detect genuine test failures, security flaws, and lint regressions in an isolated sandbox ward.
            </p>
          </div>

          {/* Quick Launch Benchmark Cards */}
          {samples.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Target Benchmark:
              </span>
              {samples.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s.id)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                    selectedSample === s.id
                      ? 'bg-gradient-to-r from-cyan-950/90 to-slate-900 border-cyan-400 text-cyan-200 shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                  }`}
                >
                  <FolderGit2 className="h-4 w-4 text-cyan-400" />
                  <span>{s.id}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
                    VERIFIED
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Repo URL Input */}
            <div className="lg:col-span-8 relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-cyan-400" />
              </div>
              <input
                type="text"
                value={repoUrl}
                onChange={handleCustomInput}
                disabled={isScanning}
                placeholder="https://github.com/owner/repository"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all font-mono shadow-inner"
              />
              <div className="absolute right-3.5 top-3.5 text-[11px] font-mono text-slate-500 pointer-events-none hidden sm:block">
                SSRF-Protected
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
                className="w-full pl-10 pr-3.5 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 transition-all font-mono shadow-inner"
              />
            </div>

            {/* Submit Button */}
            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={isScanning || (!repoUrl && !selectedSample)}
                className="w-full h-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:brightness-110 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Diagnosing...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-slate-950" />
                    <span>Run Diagnosis</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diagnostic Timeline Stepper */}
          {isScanning && (
            <div className="mt-6 pt-5 border-t border-slate-800/80 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-slate-300 font-mono mb-3">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-semibold text-cyan-300">Live Diagnostic Pipeline Execution</span>
                </span>
                <span className="px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  {scanStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  scanStatus === 'CLONING' 
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <div>
                    <div className="font-bold">1. Ingestion</div>
                    <div className="text-[10px] text-slate-500">SSRF Security Fence</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  scanStatus === 'ANALYZING' 
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <Activity className="h-4 w-4 text-cyan-400" />
                  <div>
                    <div className="font-bold">2. Flake8 Lint</div>
                    <div className="text-[10px] text-slate-500">AST Syntax & Rules</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  scanStatus === 'ANALYZING' 
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="font-bold">3. Bandit AST</div>
                    <div className="text-[10px] text-slate-500">Security Vulnerabilities</div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                  scanStatus === 'COMPLETED' 
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20' 
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <div>
                    <div className="font-bold">4. Pytest Suite</div>
                    <div className="text-[10px] text-slate-500">Assertion Execution</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};