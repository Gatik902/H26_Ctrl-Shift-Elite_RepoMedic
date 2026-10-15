import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  GitCommit, 
  Loader2, 
  Terminal, 
  FileCode, 
  ShieldCheck, 
  Cpu, 
  TestTube2,
  CheckCircle2,
  Code
} from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { VerificationResultCard } from './VerificationResultCard';
import type { Finding, PatchProposal, VerificationResult } from '../types';

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
  const [maintainerNotes, setMaintainerNotes] = useState<string>('');

  const status = proposal?.status;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <span className="font-mono text-xs font-bold text-white px-2 py-0.5 bg-slate-800 rounded border border-slate-700">
              {finding.id}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-300">{finding.rule_id}</span>
              <span className="text-[10px] text-slate-500 uppercase font-mono">{finding.category}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section 1: Finding Details */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Observed Diagnostic:</div>
            <div className="text-sm font-semibold text-white">{finding.message}</div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono pt-2">
              {finding.file_path && (
                <div className="flex items-center space-x-1 text-slate-300">
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  <span>{finding.file_path}</span>
                  {finding.line_number && <span className="text-cyan-400">:{finding.line_number}</span>}
                </div>
              )}
              <div className="flex items-center space-x-1 text-slate-500">
                <Terminal className="h-3 w-3 text-slate-600" />
                <span>{finding.command}</span>
              </div>
            </div>

            {finding.context_code && (
              <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono text-slate-500 mb-1 flex items-center gap-1">
                  <Code className="h-3 w-3 text-slate-500" />
                  Source Context:
                </div>
                <pre className="p-2 bg-slate-900 rounded text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {finding.context_code}
                </pre>
              </div>
            )}
          </div>

          {/* Section 2: AI Proposal Trigger */}
          {!proposal && (
            <div className="p-6 bg-slate-950/40 border border-slate-800 rounded-lg text-center space-y-3">
              <h4 className="text-sm font-bold text-white">Generate Verified Fix Proposal</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                RepoMedic uses open-weight coding models (DeepSeek-R1 / Qwen2.5-Coder / Llama-3.3) to analyze root causes, generate bounded patches, and verify regressions in isolated worktrees.
              </p>
              <button
                onClick={onGenerateProposal}
                disabled={isGeneratingProposal}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm shadow-cyan-600/30 disabled:opacity-50 flex items-center gap-2 mx-auto cursor-pointer transition-all"
              >
                {isGeneratingProposal ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Synthesizing Remediation...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate AI Fix Proposal</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Section 3: Proposal Details & Review */}
          {proposal && (
            <div className="space-y-4">
              {/* Model Provenance Banner */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span className="text-slate-400">Engine:</span>
                  <span className="text-white font-medium">{proposal.model_info.model_id}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {proposal.model_info.license}
                </span>
              </div>

              {/* Diagnosis Details */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Explanation:</span>
                  <p className="text-xs text-slate-200 mt-1">{proposal.explanation}</p>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Root Cause:</span>
                  <p className="text-xs text-slate-200 mt-1">{proposal.root_cause}</p>
                </div>

                {proposal.suggested_tests && proposal.suggested_tests.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
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

              {/* Reviewable Unified Diff */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1.5">
                  <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                  Reviewable Unified Diff
                </div>
                <DiffViewer
                  diffText={proposal.diff}
                  filePath={proposal.file_path}
                  beforeContent={proposal.before_content}
                  afterContent={proposal.after_content}
                />
              </div>

              {/* Sandbox Verification Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Isolated Sandbox Verification
                  </div>

                  {!verification && (
                    <button
                      onClick={onVerifyProposal}
                      disabled={isVerifying}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-sm shadow-cyan-600/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-all"
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

              {/* Maintainer Approval & Application Controls */}
              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2 font-mono">Maintainer Review & Decision Governance</div>

                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={maintainerNotes}
                    onChange={(e) => setMaintainerNotes(e.target.value)}
                    placeholder="Optional maintainer audit notes..."
                    disabled={status === 'APPLIED'}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onDecision('approve', maintainerNotes)}
                        disabled={status === 'APPROVED' || status === 'APPLIED'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          status === 'APPROVED' || status === 'APPLIED'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>{status === 'APPROVED' || status === 'APPLIED' ? 'Proposal Approved' : 'Approve Fix Proposal'}</span>
                      </button>

                      <button
                        onClick={() => onDecision('reject', maintainerNotes)}
                        disabled={status === 'REJECTED' || status === 'APPLIED'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          status === 'REJECTED'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                        }`}
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Reject Proposal</span>
                      </button>
                    </div>

                    {status === 'APPROVED' && (
                      <button
                        onClick={onApply}
                        className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer animate-pulse"
                      >
                        <GitCommit className="h-3.5 w-3.5" />
                        <span>Apply Verified Fix to Working Tree</span>
                      </button>
                    )}

                    {status === 'APPLIED' && (
                      <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-800 font-mono">
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