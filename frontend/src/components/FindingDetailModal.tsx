import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Cpu, 
  TestTube2, 
  AlertCircle, 
  FileCode, 
  Loader2,
  Check,
  RotateCcw,
  GitCommit
} from 'lucide-react';
import { Finding, PatchProposal, VerificationResult, ProposalStatus } from '../types';
import { DiffViewer } from './DiffViewer';
import { VerificationResultCard } from './VerificationResultCard';

interface FindingDetailModalProps {
  finding: Finding;
  proposal?: PatchProposal;
  verification?: VerificationResult;
  isGeneratingProposal: boolean;
  isVerifying: boolean;
  onGenerateProposal: () => void;
  onVerifyProposal: () => void;
  onDecision: (decision: 'approve' | 'reject', notes?: string) => void;
  onApply: () => void;
  onClose: () => void;
}

export const FindingDetailModal: React.FC<FindingDetailModalProps> = ({
  finding,
  proposal,
  verification,
  isGeneratingProposal,
  isVerifying,
  onGenerateProposal,
  onVerifyProposal,
  onDecision,
  onApply,
  onClose
}) => {
  const [maintainerNotes, setMaintainerNotes] = useState('');

  const status = proposal ? proposal.status : 'UNPROPOSED';

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PROPOSED':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'VERIFYING':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800 animate-pulse';
      case 'VERIFIED_PASS':
        return 'bg-emerald-950 text-emerald-300 border-emerald-600';
      case 'VERIFIED_FAIL':
        return 'bg-rose-950 text-rose-300 border-rose-600';
      case 'APPROVED':
        return 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold';
      case 'REJECTED':
        return 'bg-slate-800 text-slate-400 border-slate-700 line-through';
      case 'APPLIED':
        return 'bg-purple-950 text-purple-300 border-purple-500 font-bold';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-sm px-2.5 py-1 bg-slate-800 rounded-lg text-white font-bold border border-slate-700">
              {finding.id}
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{finding.rule_id}</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                  {finding.category}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {finding.file_path || 'Target Repository'}
                {finding.line_number ? `:${finding.line_number}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status Pill */}
            {proposal && (
              <span className={`text-xs px-2.5 py-1 rounded-full border font-mono ${getStatusBadge(status)}`}>
                State: {status}
              </span>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Observed Diagnostic Evidence */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-cyan-400" />
              Observed Diagnostic Evidence
            </div>
            <div className="text-sm font-semibold text-slate-200">
              {finding.message}
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono bg-slate-900 p-2.5 rounded border border-slate-800/80">
              <span className="text-slate-500">$ </span>
              {finding.command}
              <div className="mt-1 text-slate-400 italic">
                Source: {finding.evidence_source}
              </div>
            </div>

            {/* Context Code */}
            {finding.context_code && (
              <div className="mt-3">
                <div className="text-[11px] font-mono text-slate-400 mb-1">Code Context:</div>
                <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto border border-slate-800">
                  {finding.context_code}
                </pre>
              </div>
            )}
          </div>

          {/* Section 2: Propose Targeted Fix */}
          {!proposal && (
            <div className="text-center py-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-6">
              <Sparkles className="h-8 w-8 text-cyan-400 mx-auto mb-3 animate-bounce" />
              <h4 className="text-sm font-bold text-white">Generate Targeted Remediation</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Engage the open-weight model / verified engine to explain root cause, generate a minimal patch, and suggest regression tests.
              </p>
              <button
                onClick={onGenerateProposal}
                disabled={isGeneratingProposal}
                className="mt-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2 mx-auto cursor-pointer"
              >
                {isGeneratingProposal ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing & Synthesizing Patch...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Propose Minimal Surgical Fix</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Section 3: Proposal Explanations, Root Cause & Suggested Tests */}
          {proposal && (
            <div className="space-y-4">
              {/* Model Provenance Banner */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-400">Remediation Engine:</span>
                  <span className="text-white font-mono font-medium">{proposal.model_info.model_id}</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {proposal.model_info.license}
                </span>
              </div>

              {/* Diagnosis Details */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Explanation:</span>
                  <p className="text-xs text-slate-200 mt-1">{proposal.explanation}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Root Cause:</span>
                  <p className="text-xs text-slate-200 mt-1">{proposal.root_cause}</p>
                </div>

                {proposal.suggested_tests && proposal.suggested_tests.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TestTube2 className="h-3.5 w-3.5 text-indigo-400" />
                      Suggested Regression Tests:
                    </span>
                    <ul className="mt-1 list-disc list-inside text-xs text-indigo-300 font-mono space-y-0.5">
                      {proposal.suggested_tests.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section 4: Reviewable Diff */}
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-cyan-400" />
                  Reviewable Unified Diff
                </div>
                <DiffViewer
                  diffText={proposal.diff}
                  filePath={proposal.file_path}
                  beforeContent={proposal.before_content}
                  afterContent={proposal.after_content}
                />
              </div>

              {/* Section 5: Isolated Sandbox Verification */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Isolated Sandbox Ward Verification
                  </div>

                  {!verification && (
                    <button
                      onClick={onVerifyProposal}
                      disabled={isVerifying}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Verifying in Sandbox...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Run Sandbox Verification</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {verification && (
                  <VerificationResultCard verification={verification} />
                )}
              </div>

              {/* Section 6: Explicit Maintainer Approval & Application Controls */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">Maintainer Review & Decision Governance</div>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={maintainerNotes}
                    onChange={(e) => setMaintainerNotes(e.target.value)}
                    placeholder="Optional maintainer audit notes..."
                    disabled={status === 'APPLIED'}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Approve / Reject Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onDecision('approve', maintainerNotes)}
                        disabled={status === 'APPROVED' || status === 'APPLIED'}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          status === 'APPROVED' || status === 'APPLIED'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                        <span>{status === 'APPROVED' || status === 'APPLIED' ? 'Proposal Approved' : 'Approve Fix Proposal'}</span>
                      </button>

                      <button
                        onClick={() => onDecision('reject', maintainerNotes)}
                        disabled={status === 'REJECTED' || status === 'APPLIED'}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          status === 'REJECTED'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        }`}
                      >
                        <X className="h-4 w-4" />
                        <span>Reject Proposal</span>
                      </button>
                    </div>

                    {/* Apply Button (Only enabled when explicitly APPROVED) */}
                    {status === 'APPROVED' && (
                      <button
                        onClick={onApply}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <GitCommit className="h-4 w-4" />
                        <span>Apply Verified Fix to Working Tree</span>
                      </button>
                    )}

                    {status === 'APPLIED' && (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Patch Applied Cleanly to Repository</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
