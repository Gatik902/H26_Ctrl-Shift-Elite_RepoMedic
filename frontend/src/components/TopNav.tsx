import React from 'react';
import { 
  GitBranch, 
  GitCommit, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FolderGit2
} from 'lucide-react';
import type { ScanResult } from '../types';

interface TopNavProps {
  currentScan: ScanResult | null;
  activeTabLabel: string;
  onOpenCapsule: () => void;
  onQuickBenchmark: () => void;
  canExportCapsule: boolean;
  isScanning: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentScan,
  activeTabLabel,
  onOpenCapsule,
  onQuickBenchmark,
  canExportCapsule,
  isScanning
}) => {
  return (
    <header className="h-16 px-6 border-b border-white/60 bg-white/65 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
      {/* Breadcrumbs & Current Repository Indicator */}
      <div className="flex items-center space-x-2 text-xs">
        <span className="text-slate-400 font-mono font-medium">RepoMedic AI</span>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-slate-900 font-bold">{activeTabLabel}</span>

        {currentScan && (
          <div className="hidden md:flex items-center space-x-2 pl-3 ml-2 border-l border-slate-200 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center gap-1.5 truncate max-w-xs shadow-sm">
              <FolderGit2 className="h-3 w-3 text-indigo-500 shrink-0" />
              <span className="truncate font-semibold">{currentScan.repo_url.replace('https://github.com/', '')}</span>
            </span>

            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1 shadow-sm">
              <GitBranch className="h-3 w-3 text-slate-400" />
              <span>{currentScan.branch || 'main'}</span>
            </span>

            {currentScan.commit_hash && (
              <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1 shadow-sm">
                <GitCommit className="h-3 w-3 text-slate-400" />
                <span>{currentScan.commit_hash.substring(0, 7)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Actions & Status Badges */}
      <div className="flex items-center space-x-3">
        {/* Pipeline State Indicator */}
        {isScanning && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono">
            <Clock className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            <span className="font-semibold">Analyzing Codebase...</span>
          </div>
        )}

        {currentScan?.status === 'COMPLETED' && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Diagnosis Complete</span>
          </div>
        )}

        {/* Quick Benchmark Button */}
        <button
          onClick={onQuickBenchmark}
          className="hidden lg:flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <span>Run Benchmark</span>
        </button>

        {/* Capsule Export Button */}
        {canExportCapsule && (
          <button
            onClick={onOpenCapsule}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md shadow-slate-900/10 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Export Exit Capsule</span>
          </button>
        )}
      </div>
    </header>
  );
};
