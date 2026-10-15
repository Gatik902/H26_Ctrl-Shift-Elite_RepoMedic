import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowRight, 
  Code2, 
  FileText,
  Terminal
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
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-orange-950/80 text-orange-300 border-orange-800';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'LOW':
        return 'bg-blue-950/80 text-blue-300 border-blue-800';
      case 'INFO':
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryBadge = (cat: FindingCategory) => {
    switch (cat) {
      case 'TEST_FAILURE':
        return 'text-rose-400 bg-rose-950/40 border-rose-900/60';
      case 'SECURITY_RISK':
        return 'text-purple-400 bg-purple-950/40 border-purple-900/60';
      case 'SYNTAX_ERROR':
        return 'text-amber-400 bg-amber-950/40 border-amber-900/60';
      case 'LINT_VIOLATION':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-900/60';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-400" />
            Observed Diagnostics ({filtered.length} of {findings.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real static analysis, security findings, and test execution outcomes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules, files, errors..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-4 pb-2 text-xs">
        <span className="text-slate-500 text-[11px] font-medium mr-1">Category:</span>
        {['ALL', 'TEST_FAILURE', 'SECURITY_RISK', 'SYNTAX_ERROR', 'LINT_VIOLATION'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
              categoryFilter === cat
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-semibold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}

        <div className="h-4 w-[1px] bg-slate-800 mx-2 hidden sm:block" />

        <span className="text-slate-500 text-[11px] font-medium mr-1">Severity:</span>
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
              severityFilter === sev
                ? 'bg-slate-800 border-slate-600 text-white font-semibold'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* Findings List Items */}
      <div className="mt-4 space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
            No diagnostics match your filter criteria.
          </div>
        ) : (
          filtered.map((f) => {
            const isSelected = selectedFindingId === f.id;
            return (
              <div
                key={f.id}
                onClick={() => onSelectFinding(f)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left: ID & Badges */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-white px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
                      {f.id}
                    </span>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getSeverityBadge(f.severity)}`}>
                      {f.severity}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getCategoryBadge(f.category)}`}>
                      {f.category.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                      {f.origin}
                    </span>
                  </div>

                  {/* Right: Action Prompt */}
                  <div className="flex items-center space-x-1.5 text-xs text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Remediate in Verified Sandbox</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Message */}
                <div className="mt-2 text-sm font-semibold text-slate-200">
                  {f.message}
                </div>

                {/* Location & Command Evidence */}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                  {f.file_path && (
                    <div className="flex items-center space-x-1 text-slate-300">
                      <FileText className="h-3.5 w-3.5 text-cyan-400" />
                      <span>{f.file_path}</span>
                      {f.line_number && <span className="text-cyan-400">:{f.line_number}</span>}
                    </div>
                  )}

                  <div className="flex items-center space-x-1 text-slate-500 truncate max-w-md" title={f.evidence_source}>
                    <Terminal className="h-3.5 w-3.5 text-slate-600" />
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
