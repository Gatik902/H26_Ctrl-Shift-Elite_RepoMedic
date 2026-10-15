import React from 'react';
import { 
  LayoutDashboard, 
  GitBranch, 
  AlertCircle, 
  ShieldCheck, 
  FileJson, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Stethoscope,
  Radio
} from 'lucide-react';
import type { ModelInfo } from '../types';

export type NavTab = 'overview' | 'intake' | 'findings' | 'verification' | 'capsule' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  backendHealthy: boolean;
  findingsCount: number;
  proposalsCount: number;
  canExportCapsule: boolean;
  modelInfo?: ModelInfo;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  backendHealthy,
  findingsCount,
  proposalsCount,
  canExportCapsule,
  modelInfo
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number | string; disabled?: boolean }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-4 w-4 shrink-0" />
    },
    {
      id: 'intake',
      label: 'Repository Intake',
      icon: <GitBranch className="h-4 w-4 shrink-0" />
    },
    {
      id: 'findings',
      label: 'Diagnostics & Findings',
      icon: <AlertCircle className="h-4 w-4 shrink-0" />,
      badge: findingsCount > 0 ? findingsCount : undefined
    },
    {
      id: 'verification',
      label: 'Verified Fix Loop',
      icon: <ShieldCheck className="h-4 w-4 shrink-0" />,
      badge: proposalsCount > 0 ? `${proposalsCount} Fixes` : undefined
    },
    {
      id: 'capsule',
      label: 'Exit Capsule',
      icon: <FileJson className="h-4 w-4 shrink-0" />,
      badge: canExportCapsule ? 'Ready' : undefined
    },
    {
      id: 'settings',
      label: 'Engine Settings',
      icon: <Settings className="h-4 w-4 shrink-0" />
    }
  ];

  return (
    <aside 
      className={`relative flex flex-col justify-between border-r border-slate-800/80 bg-[#090d16]/95 backdrop-blur-xl transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/10">
              <Stethoscope className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-sm tracking-tight text-white font-brand">RepoMedic</span>
                  <span className="text-xs font-bold text-cyan-400">AI</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Maintenance Agent</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                disabled={item.disabled}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-lg px-3 py-2.5 text-xs font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/5'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                }`}
              >
                <span className={`${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="ml-3 truncate font-sans text-left flex-1">{item.label}</span>
                )}

                {!isCollapsed && item.badge !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                    isActive 
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status / Model Provenance */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {!isCollapsed && modelInfo && (
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 text-[11px] font-mono leading-tight">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Model Runtime</div>
            <div className="text-slate-300 truncate font-semibold mt-0.5" title={modelInfo.model_id}>
              {modelInfo.model_id}
            </div>
            <div className="text-[10px] text-cyan-400/90 mt-0.5">
              {modelInfo.used_ai ? 'Open-Weight Inference' : 'Deterministic Engine'}
            </div>
          </div>
        )}

        {/* Engine Connectivity Indicator */}
        <div className={`flex items-center rounded-lg px-2.5 py-2 text-xs border ${
          backendHealthy 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300' 
            : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
        }`}>
          <Radio className={`h-3 w-3 shrink-0 ${backendHealthy ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
          {!isCollapsed && (
            <span className="ml-2 font-mono text-[11px] truncate">
              {backendHealthy ? 'Engine: 127.0.0.1:8000' : 'Engine Offline'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};