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
  Shield,
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
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number | string }[] = [
    {
      id: 'overview',
      label: 'Overview & Vitals',
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
      className={`relative flex flex-col justify-between border-r border-white/60 bg-white/65 backdrop-blur-2xl transition-all duration-300 z-30 select-none shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Header / Branding */}
      <div>
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shrink-0 font-black text-xs shadow-md shadow-indigo-500/25">
              <Shield className="h-4 w-4 fill-white" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-sm tracking-tight text-slate-900">RepoMedic</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">AI</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Maintenance Agent</span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
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
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm shadow-slate-200/80 border border-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <span className={`${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="ml-3 truncate font-sans text-left flex-1">{item.label}</span>
                )}

                {!isCollapsed && item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-500'
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
      <div className="p-3 border-t border-slate-200/50 space-y-2">
        {!isCollapsed && modelInfo && (
          <div className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60 text-[11px] font-mono leading-tight shadow-sm">
            <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Model Provenance</div>
            <div className="text-slate-800 truncate font-bold mt-0.5" title={modelInfo.model_id}>
              {modelInfo.model_id}
            </div>
            <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">
              {modelInfo.used_ai ? 'Open-Weight LLM' : 'Deterministic Engine'}
            </div>
          </div>
        )}

        {/* Engine Connectivity Indicator */}
        <div className={`flex items-center rounded-xl px-3 py-2 text-xs border ${
          backendHealthy 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50/80 border-rose-200 text-rose-800'
        }`}>
          <Radio className={`h-3 w-3 shrink-0 ${backendHealthy ? 'text-emerald-600 animate-pulse' : 'text-rose-600'}`} />
          {!isCollapsed && (
            <span className="ml-2 font-mono text-[11px] font-medium truncate">
              {backendHealthy ? 'Engine Online: 8000' : 'Engine Offline'}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
