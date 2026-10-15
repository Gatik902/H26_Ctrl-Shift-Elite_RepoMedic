import React, { useState } from 'react';
import { Search, GitBranch, Play, CheckCircle2, AlertCircle, Loader2, Sparkles, FolderGit2 } from 'lucide-react';
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
  const [selectedSample, setSelectedSample] = useState<string>('');

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
      setRepoUrl(`[Benchmark Fixture]: ${sample.name}`);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSample('');
    setRepoUrl(e.target.value);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Search className="h-5 w-5 text-cyan-400" />
            Repository Intake & Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze any public GitHub repo URL or benchmark target repository for real code quality, security, and test failures.
          </p>
        </div>

        {/* 1-Click Benchmark Selector */}
        {samples.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Benchmark:</span>
            {samples.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSample(s.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedSample === s.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <FolderGit2 className="h-3.5 w-3.5 text-cyan-400" />
                <span>{s.id}</span>
                <span className="text-[10px] px-1 py-0.2 bg-slate-950/80 text-emerald-400 rounded">verified</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* URL Input */}
          <div className="md:col-span-8 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="text-slate-500 font-mono text-sm">git://</span>
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={handleCustomInput}
              disabled={isScanning}
              placeholder="https://github.com/owner/repository"
              className="w-full pl-14 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          {/* Branch Input */}
          <div className="md:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <GitBranch className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isScanning}
              placeholder="main"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          {/* Scan Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isScanning || (!repoUrl && !selectedSample)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-slate-950" />
                  <span>Start Diagnosis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scan Progress Tracker */}
        {isScanning && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium text-cyan-300">Diagnostic Pipeline in Progress:</span>
              <span className="font-mono text-cyan-400">{scanStatus}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
              <div className={`p-2 rounded-lg border ${scanStatus === 'CLONING' ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                1. Safe Ingestion
              </div>
              <div className={`p-2 rounded-lg border ${scanStatus === 'ANALYZING' ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                2. Static & AST Audit
              </div>
              <div className={`p-2 rounded-lg border ${scanStatus === 'ANALYZING' ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 animate-pulse' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                3. Test Discovery
              </div>
              <div className={`p-2 rounded-lg border ${scanStatus === 'COMPLETED' ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300' : 'bg-slate-950/40 border-slate-800 text-slate-500'}`}>
                4. Triage Ready
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
