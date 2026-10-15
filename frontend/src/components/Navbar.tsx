import React from 'react';
import { ShieldCheck, Cpu, Stethoscope, Radio, Activity } from 'lucide-react';
import type { ModelInfo } from '../types';

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
    <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-40 shadow-2xl shadow-cyan-950/30">
      {/* Top Telemetry Micro-Ticker */}
      <div className="bg-slate-950/95 border-b border-slate-900/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center space-x-3 overflow-hidden">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
            <Radio className="h-3 w-3 animate-pulse text-cyan-400" />
            LIVE TELEMETRY
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hidden sm:inline">
            AST Linter: <span className="text-emerald-400 font-semibold">Flake8 v7.4.1 [ACTIVE]</span>
          </span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden md:inline">
            Security Engine: <span className="text-emerald-400 font-semibold">Bandit v1.9.4 [ARMED]</span>
          </span>
          <span className="text-slate-700 hidden md:inline">|</span>
          <span className="text-slate-400 hidden lg:inline">
            Verification Suite: <span className="text-emerald-400 font-semibold">Pytest v9.1.1 [ONLINE]</span>
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Activity className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span className="text-slate-500">ISOLATION WARD:</span>
            <span className="text-cyan-300 font-bold">READY</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand with animated ECG pulse icon */}
        <div className="flex items-center space-x-3.5">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
            <div className="relative h-12 w-12 rounded-xl bg-slate-950 border border-cyan-400/40 flex items-center justify-center p-2.5 shadow-inner">
              <Stethoscope className="h-6 w-6 text-cyan-300 animate-bounce" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                RepoMedic <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 font-black">AI</span>
              </h1>
              <span className="text-[10px] uppercase tracking-wider px-2.5 py-0.5 font-extrabold rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-950">
                ICU Ward Agent
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-medium flex items-center gap-1.5 mt-0.5">
              <span>Autonomous Repository Triage</span>
              <span className="text-cyan-500">•</span>
              <span>Verified Fix Loop</span>
              <span className="text-cyan-500">•</span>
              <span>Dependency Exit Capsule</span>
            </p>
          </div>
        </div>

        {/* Model Provenance & Status */}
        <div className="flex items-center space-x-3">
          {/* Engine Health Status */}
          <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
            <span className={`relative flex h-2.5 w-2.5`}>
              {backendHealthy && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${backendHealthy ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
            </span>
            <span className="font-mono text-[11px] font-semibold">{backendHealthy ? 'ENGINE ONLINE' : 'ENGINE OFFLINE'}</span>
          </div>

          {/* Model Provenance Pill */}
          {modelInfo && (
            <div className="hidden lg:flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-cyan-900/50 text-xs shadow-inner">
              <Cpu className="h-4 w-4 text-cyan-400" />
              <span className="text-slate-400 font-medium">Model:</span>
              <span className="text-cyan-300 font-mono font-bold truncate max-w-[170px]" title={modelInfo.model_id}>
                {modelInfo.model_id}
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-cyan-950/90 text-cyan-300 rounded font-bold border border-cyan-800">
                {modelInfo.used_ai ? 'Open-Weight LLM' : 'Verified Engine'}
              </span>
            </div>
          )}

          {/* Exit Capsule Button */}
          {canExportCapsule && (
            <button
              onClick={onOpenCapsule}
              className="relative group px-4 py-2.5 text-xs font-black rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-cyan-500/30 flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 animate-shimmer"
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
