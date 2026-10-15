import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight, 
  FileText,
  Terminal,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Finding, FindingCategory, Severity } from '../types';

interface FindingsListProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding) => void;
  selectedFindingId?: string;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  onSelectFinding,
  selectedFindingId
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = findings.filter((f) => {
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = f.message.toLowerCase().includes(q);
      const matchFile = (f.file_path || '').toLowerCase().includes(q);
      const matchRule = f.rule_id.toLowerCase().includes(q);
      const matchId = f.id.toLowerCase().includes(q);
      if (!matchMsg && !matchFile && !matchRule && !matchId) return false;
    }
    return true;
  });

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow-sm shadow-rose-950';
      case 'HIGH':
        return 'bg-orange-950/90 text-orange-300 border-orange-500/60 shadow-sm shadow-orange-950';
      case 'MEDIUM':
        return 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-950';
      case 'LOW':
        return 'bg-blue-950/90 text-blue-300 border-blue-500/60 shadow-sm shadow-blue-950';
      case 'INFO':
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  const getCategoryBadge = (cat: FindingCategory) => {
    switch (cat) {
      case 'TEST_FAILURE':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'SECURITY_RISK':
        return 'text-purple-300 bg-purple-950/60 border-purple-800/80';
      case 'SYNTAX_ERROR':
        return 'text-amber-300 bg-amber-950/60 border-amber-800/80';
      case 'LINT_VIOLATION':
        return 'text-cyan-300 bg-cyan-950/60 border-cyan-800/80';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  const countForCategory = (cat: string) => {
    if (cat === 'ALL') return findings.length;
    return findings.filter(f => f.category === cat).length;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-cyan-500/20 shadow-2xl">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Observed Diagnostics Ward
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-mono font-bold">
              {filtered.length} / {findings.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Grounded diagnostic records extracted from real compiler ASTs, security scanners, and pytest assertion tracebacks.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-cyan-400/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, files, errors..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 font-mono shadow-inner"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pt-5 pb-3 text-xs font-mono">
        <span className="text-slate-500 text-[11px] font-semibold mr-1 uppercase tracking-wider">Category:</span>
        {['ALL', 'TEST_FAILURE', 'SECURITY_RISK', 'SYNTAX_ERROR', 'LINT_VIOLATION'].map((cat) => {
          const count = countForCategory(cat);
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-gradient-to-r from-cyan-950 to-slate-900 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{cat.replace('_', ' ')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilter === cat ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}

        <div className="h-4 w-[1px] bg-slate-800 mx-2 hidden lg:block" />

        <span className="text-slate-500 text-[11px] font-semibold mr-1 uppercase tracking-wider hidden lg:inline">Severity:</span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer hidden lg:inline-flex ${
              severityFilter === sev
                ? 'bg-slate-800 border-slate-500 text-white shadow-sm'
                : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Findings Cards List */}
      <div className="mt-4 space-y-3 max-h-[620px] overflow-y-auto pr-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm border border-dashed border-slate-800 rounded-2xl">
            No diagnostic records match the selected filters.
          </div>
        ) : (
          filtered.map((f) => {
            const isSelected = selectedFindingId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => onSelectFinding(f)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400/90 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/60'
                }`}
              >
                {/* Active glow accent bar */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  f.severity === 'CRITICAL' || f.category === 'TEST_FAILURE' 
                    ? 'bg-rose-500' 
                    : (f.category === 'SECURITY_RISK' ? 'bg-purple-500' : 'bg-cyan-500')
                }`} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pl-2">
                  {/* Left: ID & Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-extrabold text-white px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-700">
                      {f.id}
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md border ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getCategoryBadge(f.category)}`}>
                      {f.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      {f.rule_id}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      • {f.origin}
                    </span>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                    <span>Inspect & Verified Fix</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Message */}
                <div className="mt-2.5 text-sm sm:text-base font-bold text-slate-100 pl-2">
                  {f.message}
                </div>

                {/* Location & Command Evidence */}
                <div className="mt-2.5 pl-2 flex flex-wrap items-center gap-3.5 text-xs text-slate-400 font-mono">
                  {f.file_path && (
                    <div className="flex items-center space-x-1.5 text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                      <FileText className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{f.file_path}</span>
                      {f.line_number && <span className="text-cyan-400 font-bold">:{f.line_number}</span>}
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 text-slate-500 truncate max-w-lg" title={f.evidence_source}>
                    <Terminal className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    <span className="truncate">{f.evidence_source}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};