import React from 'react';
import { X, Cpu, Server, Shield, ExternalLink } from 'lucide-react';
import type { ModelInfo } from '../types';

interface SettingsModalProps {
  modelInfo?: ModelInfo;
  backendHealthy: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  modelInfo,
  backendHealthy,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Engine Settings & Model Provenance</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Backend Connection */}
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Server className="h-4 w-4 text-slate-400" />
              <div>
                <div className="font-semibold text-slate-200">Local FastAPI Backend</div>
                <div className="text-[11px] text-slate-500 font-mono">http://127.0.0.1:8000</div>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              backendHealthy ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
            }`}>
              {backendHealthy ? 'HEALTHY' : 'OFFLINE'}
            </span>
          </div>

          {/* Model Information */}
          {modelInfo && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 font-mono">
              <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/80">
                <span className="font-sans font-semibold text-slate-300">Active Model Identifier:</span>
                <span className="text-cyan-300 font-bold">{modelInfo.model_id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Provider:</span>
                <span className="text-slate-300">{modelInfo.provider}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Open-Weight Status:</span>
                <span className="text-emerald-400 font-bold">{modelInfo.is_open_weight ? 'Yes (Open Access)' : 'Proprietary'}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>License Terms:</span>
                <span className="text-slate-300">{modelInfo.license}</span>
              </div>
            </div>
          )}

          {/* Compliance & Safety Guarantee */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Shield className="h-3.5 w-3.5 text-cyan-400" />
              <span>Sandbox Isolation Guarantee</span>
            </div>
            <p className="leading-relaxed">
              Every proposed patch is bound-checked to prevent path traversal outside repository root, executed within a disposable temporary worktree, and subjected to differential execution comparisons before maintainer review.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-800 flex justify-end bg-slate-950/40">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};