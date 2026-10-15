import React, { useState } from 'react';
import { 
  Search, 
  Terminal, 
  FileText, 
  ChevronRight,
  Filter,
  Activity
} from 'lucide-react';
import type { Finding } from '../types';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filtered = findings.filter((f) => {
    const matchesSearch = 
      f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.file_path ? f.file_path.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      f.rule_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesCategory = categoryFilter === 'ALL' || f.category === categoryFilter;

    return matchesSearch && matchesSeverity && matchesCategory;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'HIGH':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'TEST_FAILURE':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'SECURITY_RISK':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'SYNTAX_ERROR':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LINT_VIOLATION':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const countForCategory = (cat: string) => {
    if (cat === 'ALL') return findings.length;
    return findings.filter(f => f.category === cat).length;
  };

  return (
    <div className="liquid-glass rounded-3xl p-6 sm:p-8">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Observed Diagnostics Ward
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
              {filtered.length} of {findings.length} RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded diagnostic records extracted from compiler ASTs, security scanners, and pytest execution tracebacks.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="h-3.5 w-3.5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, files, errors..."
            className="w-full pl-9 pr-3.5 py-2.5 bg-white/90 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 font-mono shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-4 pb-3 text-xs font-mono">
        <span className="text-slate-400 text-[10px] font-bold mr-1 uppercase tracking-wider flex items-center gap-1">
          <Filter className="h-3 w-3 text-indigo-600" />
          Category:
        </span>
        {['ALL', 'TEST_FAILURE', 'SECURITY_RISK', 'SYNTAX_ERROR', 'LINT_VIOLATION'].map((cat) => {
          const count = countForCategory(cat);
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'
              }`}
            >
              <span>{cat.replace('_', ' ')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${categoryFilter === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}

        <div className="h-4 w-[1px] bg-slate-200 mx-2 hidden lg:block" />

        <span className="text-slate-400 text-[10px] font-bold mr-1 uppercase tracking-wider hidden lg:inline">Severity:</span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer hidden lg:inline-flex ${
              severityFilter === sev
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-600'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Findings Cards List */}
      <div className="mt-3.5 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-white/40">
            No diagnostic records match the selected filters.
          </div>
        ) : (
          filtered.map((f) => {
            const isSelected = selectedFindingId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => onSelectFinding(f)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Left: ID & Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                      {f.id}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadge(f.category)}`}>
                      {f.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {f.rule_id}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      • {f.origin}
                    </span>
                  </div>

                  {/* Right: Action Button */}
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                    <span>Inspect Fix</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                {/* Message */}
                <div className="mt-2.5 text-sm font-bold text-slate-900">
                  {f.message}
                </div>

                {/* Location & Command Evidence */}
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                  {f.file_path && (
                    <div className="flex items-center space-x-1.5 text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                      <FileText className="h-3 w-3 text-indigo-600" />
                      <span>{f.file_path}</span>
                      {f.line_number && <span className="text-indigo-600 font-bold">:{f.line_number}</span>}
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 text-slate-400 truncate max-w-lg text-[11px]" title={f.evidence_source}>
                    <Terminal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
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
