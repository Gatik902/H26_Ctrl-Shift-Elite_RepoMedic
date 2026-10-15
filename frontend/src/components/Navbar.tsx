import React from 'react';
import { ShieldCheck, Cpu, Stethoscope, Terminal, Radio } from 'lucide-react';
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
    <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 shadow-2xl shadow-cyan-950/20">
      {/* Top micro-ticker banner */}
      <div className="bg-slate-950 border-b border-slate-900 px-4 py-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center space-x-4 overflow-hidden">
          <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
            <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
            LIVE TELEMETRY
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 hidden sm:inline">Flake8 AST Engine: <span className="text-emerald-400">v7.4.1 [ACTIVE]</span></span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden md:inline">Bandit Security Scanner: <span className="text-emerald-400">v1.9.4 [ARMED]</span></span>
          <span className="text-slate-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden lg:inline">Pytest Suite: <span className="text-emerald-400">v9.1.1 [ACTIVE]</span></span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <span>ISOLATION WARD:</span>
          <span className="text-cyan-300 font-bold">READY</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand with animated ECG pulse icon */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative h-11 w-11 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center p-2">
              <Stethoscope className="h-6 w-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
                RepoMedic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 font-bold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-sm shadow-cyan-950">
                ICU Ward Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-medium">
              Autonomous Repository Triage • Verified Fix Loop • Dependency Exit Capsule
            </p>
          </div>
        </div>

        {/* Model Provenance & Status */}
        <div className="flex items-center space-x-3">
          {/* Engine Health Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <span className={`h-2.5 w-2.5 rounded-full ${backendHealthy ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            <span className="font-mono text-[11px]">{backendHealthy ? 'ENGINE ONLINE' : 'ENGINE OFFLINE'}</span>
          </div>

          {/* Model Provenance Pill */}
          {modelInfo && (
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-900/40 text-xs shadow-inner">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-400 font-medium">AI Model:</span>
              <span className="text-cyan-300 font-mono font-bold truncate max-w-[180px]" title={modelInfo.model_id}>
                {modelInfo.model_id}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950 text-cyan-300 rounded font-semibold border border-cyan-800/60">
                {modelInfo.used_ai ? 'Open-Weight LLM' : 'Verified Rule Engine'}
              </span>
            </div>
          )}

          {/* Exit Capsule Button */}
          {canExportCapsule && (
            <button
              onClick={onOpenCapsule}
              className="relative group px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-cyan-500/25 flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
              <span className="tracking-wide">Export Exit Capsule</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
