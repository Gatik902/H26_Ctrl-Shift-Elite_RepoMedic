import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Loader2, 
  Terminal, 
  FileCode, 
  ShieldCheck, 
  Cpu, 
  TestTube2,
  CheckCircle2,
  Code,
  Download,
  GitPullRequest,
  AlertTriangle,
  ArrowRight,
  ListChecks
} from 'lucide-react';
import { DiffViewer } from './DiffViewer';
import { VerificationResultCard } from './VerificationResultCard';
import type { Finding, PatchProposal, VerificationResult } from '../types';
import { getPrDraft, getPatchDownloadUrl } from '../api/client';

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
  const [copiedPr, setCopiedPr] = useState(false);
  const [loadingPr, setLoadingPr] = useState(false);

  const status = proposal?.status;

  const handleCopyPr = async () => {
    if (!proposal) return;
    try {
      setLoadingPr(true);
      const prData = await getPrDraft(proposal.id);
      await navigator.clipboard.writeText(prData.markdown);
      setCopiedPr(true);
      setTimeout(() => setCopiedPr(false), 2500);
    } catch (e) {
      console.error('Failed to copy PR draft:', e);
    } finally {
      setLoadingPr(false);
    }
  };

  const handleDownloadPatch = () => {
    if (!proposal) return;
    const url = getPatchDownloadUrl(proposal.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repomedic-${proposal.id.toLowerCase()}.patch`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/95 border border-white rounded-3xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/70 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-mono text-xs font-bold shadow-sm">
              {finding.id}
            </span>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                finding.severity === 'CRITICAL' 
                  ? 'bg-rose-50 text-rose-700 border-rose-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {finding.severity}
              </span>
              <span className="text-xs text-slate-500 font-mono font-semibold">
                {finding.rule_id}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Finding Core Message */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {finding.message}
            </h3>
            {finding.file_path && (
              <div className="mt-2 flex items-center space-x-2 text-xs font-mono text-slate-500">
                <FileCode className="h-4 w-4 text-indigo-600" />
                <span className="text-slate-800 font-semibold">{finding.file_path}</span>
                {finding.line_number && <span className="text-indigo-600 font-bold">:{finding.line_number}</span>}
              </div>
            )}
          </div>

          {/* Evidence Command */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
              <Terminal className="h-3 w-3" />
              <span>Diagnostic Origin Evidence</span>
            </div>
            <div className="text-slate-800 truncate font-semibold">
              {finding.evidence_source}
            </div>
          </div>

          {/* Context Code Snippet */}
          {finding.context_code && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-600 text-xs font-semibold">
                <Code className="h-3.5 w-3.5" />
                <span>Observed Source Snippet:</span>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-sm">
                {finding.context_code}
              </pre>
            </div>
          )}

          {/* SECTION: AI Proposed Fix */}
          <div className="pt-4 border-t border-slate-200/70 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Corrective Patch Synthesis
                </h4>
              </div>

              {!proposal && (
                <button
                  onClick={onGenerateProposal}
                  disabled={isGeneratingProposal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-500/20"
                >
                  {isGeneratingProposal ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Propose Fix</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Proposal Details */}
            {proposal && (
              <div className="space-y-4 animate-fadeIn">
                {/* AI Explanation & Root Cause */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 text-xs space-y-2">
                  <div className="text-slate-900 font-bold text-sm">
                    {proposal.explanation}
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Root Cause:</strong> {proposal.root_cause}
                  </div>
                  {proposal.suggested_tests?.length > 0 && (
                    <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-indigo-700 font-semibold">
                      <TestTube2 className="h-3.5 w-3.5" />
                      <span>Regression Tests: {proposal.suggested_tests.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Risky Dependency & Migration Card */}
                {(proposal.risky_dependency || proposal.recommended_replacement) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>High-Risk Dependency Modernization</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                        Zero Manual Effort
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-white/90 border border-rose-200 text-rose-800 space-y-1 shadow-sm">
                        <div className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Identified Risky Library / Pin</div>
                        <div className="font-semibold break-words">{proposal.risky_dependency || 'Identified deprecated version'}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-emerald-800 space-y-1 shadow-sm">
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1">
                          <ArrowRight className="h-3 w-3" /> Recommended Modern Replacement
                        </div>
                        <div className="font-semibold break-words">{proposal.recommended_replacement || 'Modern safe release'}</div>
                      </div>
                    </div>

                    {proposal.migration_steps && proposal.migration_steps.length > 0 && (
                      <div className="pt-2 border-t border-amber-200/60 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Step-by-Step Migration Guide:</span>
                        </div>
                        <ol className="space-y-1.5 pl-1 text-[11px] text-slate-700">
                          {proposal.migration_steps.map((step, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-snug">{step.replace(/^\d+\.\s*/, '')}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Diff Viewer & Actions Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-slate-700">
                      Synthesized Unified Diff:
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleDownloadPatch}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 shadow-sm"
                        title="Download unified .patch file"
                      >
                        <Download className="h-3 w-3 text-indigo-600" />
                        <span>Download Patch</span>
                      </button>

                      <button
                        onClick={handleCopyPr}
                        disabled={loadingPr}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border border-slate-200 shadow-sm"
                        title="Copy ready-to-paste GitHub PR draft description"
                      >
                        {loadingPr ? (
                          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
                        ) : copiedPr ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <GitPullRequest className="h-3 w-3 text-indigo-600" />
                        )}
                        <span>{copiedPr ? 'PR Draft Copied!' : 'Copy PR Draft'}</span>
                      </button>
                    </div>
                  </div>

                  <DiffViewer
                    diffText={proposal.diff}
                    filePath={proposal.file_path}
                    beforeContent={proposal.before_content}
                    afterContent={proposal.after_content}
                  />
                </div>


                {/* Verification Action / Result */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Sandbox Verification Ward:</span>
                    </div>

                    {!verification && (
                      <button
                        onClick={onVerifyProposal}
                        disabled={isVerifying}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {isVerifying ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                            <span>Executing Sandbox Tests...</span>
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

                {/* Maintainer Decision Controls */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-500">Proposal State: </span>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 font-bold shadow-sm">
                        {status}
                      </span>
                    </div>

                    {status !== 'APPLIED' && (
                      <div className="flex items-center gap-2">
                        {status !== 'APPROVED' && (
                          <button
                            onClick={() => onDecision('approve', maintainerNotes)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve Patch</span>
                          </button>
                        )}

                        {status === 'APPROVED' && (
                          <button
                            onClick={onApply}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Apply to Working Tree</span>
                          </button>
                        )}

                        <button
                          onClick={() => onDecision('reject', maintainerNotes)}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                        >
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {status === 'APPLIED' && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Patch successfully applied to local repository working tree.</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
