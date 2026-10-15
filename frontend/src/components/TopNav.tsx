import React from 'react';
import { 
  GitBranch, 
  GitCommit, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileCode,
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
    <header className="h-16 px-6 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs & Current Repository Indicator */}
      <div className="flex items-center space-x-3 overflow-hidden text-xs">
        <span className="text-slate-500 font-mono font-medium">RepoMedic AI</span>
        <span className="text-slate-700 font-mono">/</span>
        <span className="text-slate-300 font-semibold">{activeTabLabel}</span>

        {currentScan && (
          <div className="hidden md:flex items-center space-x-2 pl-3 ml-2 border-l border-slate-800 font-mono text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5 truncate max-w-xs">
              <FolderGit2 className="h-3 w-3 text-cyan-400 shrink-0" />
              <span className="truncate">{currentScan.repo_url.replace('https://github.com/', '')}</span>
            </span>

            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
              <GitBranch className="h-3 w-3 text-slate-500" />
              <span>{currentScan.branch || 'main'}</span>
            </span>

            {currentScan.commit_hash && (
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
                <GitCommit className="h-3 w-3 text-slate-500" />
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
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs font-mono animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>Scanning Active...</span>
          </div>
        )}

        {currentScan?.status === 'COMPLETED' && (
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scan: Completed</span>
          </div>
        )}

        {/* Quick Benchmark Button */}
        <button
          onClick={onQuickBenchmark}
          className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <FileCode className="h-3.5 w-3.5 text-cyan-400" />
          <span>Quick Benchmark</span>
        </button>

        {/* Capsule Export Button */}
        {canExportCapsule && (
          <button
            onClick={onOpenCapsule}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-sm shadow-cyan-600/30 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Export Exit Capsule</span>
          </button>
        )}
      </div>
    </header>
  );
};