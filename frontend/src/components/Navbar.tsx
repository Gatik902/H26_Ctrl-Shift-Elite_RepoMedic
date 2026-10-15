import React from 'react';
import { Activity, ShieldCheck, Cpu, GitBranch, Stethoscope } from 'lucide-react';
import { ModelInfo } from '../types';

interface NavbarProps {
  modelInfo?: ModelInfo;
  backendHealthy: boolean;
  onOpenCapsule?: () => void;
  canExportCapsule?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  modelInfo,
  backendHealthy,
  onOpenCapsule,
  canExportCapsule
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">RepoMedic <span className="text-cyan-400">AI</span></span>
              <span className="text-xs px-2 py-0.5 font-medium rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Track 2 Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-none">Automated Triage • Verified Fix Loop • Dependency Exit</p>
          </div>
        </div>

        {/* Model Provenance & Status */}
        <div className="flex items-center space-x-3">
          {/* Health Status */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <span className={`h-2 w-2 rounded-full ${backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span>{backendHealthy ? 'Engine Active' : 'Disconnected'}</span>
          </div>

          {/* Model Provenance Pill */}
          {modelInfo && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400">Model:</span>
              <span className="text-cyan-300 font-mono font-medium truncate max-w-[200px]" title={modelInfo.model_id}>
                {modelInfo.model_id}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded">
                {modelInfo.used_ai ? 'Open-Weight LLM' : 'Deterministic Rule Engine'}
              </span>
            </div>
          )}

          {/* Exit Capsule Button */}
          {canExportCapsule && (
            <button
              onClick={onOpenCapsule}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110 transition-all shadow-md shadow-cyan-500/10 flex items-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Export Exit Capsule</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
