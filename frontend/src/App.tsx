import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  GitPullRequest,
  Cpu,
  CheckCircle2,
  GitBranch,
  Layers,
  Shield
} from 'lucide-react';

import { BackgroundEffects } from './components/BackgroundEffects';
import { Sidebar, NavTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { RepoInput } from './components/RepoInput';
import { SummaryCards } from './components/SummaryCards';
import { FindingsList } from './components/FindingsList';
import { FindingDetailModal } from './components/FindingDetailModal';
import { CapsuleViewerModal } from './components/CapsuleViewerModal';
import { DiffViewer } from './components/DiffViewer';
import { VerificationResultCard } from './components/VerificationResultCard';

import { 
  checkHealth, 
  getSampleRepos, 
  startScan, 
  getScanResult, 
  proposeFix, 
  verifyProposal, 
  recordDecision, 
  applyProposal,
  getScanCapsule 
} from './api/client';

import type { 
  ScanResult, 
  Finding, 
  PatchProposal, 
  VerificationResult, 
  SampleRepo, 
  ModelInfo, 
  CapsuleData 
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | undefined>();
  const [samples, setSamples] = useState<SampleRepo[]>([]);
  
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [proposals, setProposals] = useState<Record<string, PatchProposal>>({});
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});

  const [isGeneratingProposal, setIsGeneratingProposal] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const [showCapsuleModal, setShowCapsuleModal] = useState<boolean>(false);
  const [capsuleData, setCapsuleData] = useState<CapsuleData | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkEngineStatus() {
      try {
        const health = await checkHealth();
        if (!isMounted) return;
        setBackendHealthy(true);
        const info = health.model_info || health;
        setModelInfo({
          model_id: info.model_id || 'Deterministic Engine v1.0',
          provider: info.provider || 'RepoMedic Native Engine',
          is_open_weight: info.is_open_weight ?? true,
          license: info.license || 'Apache 2.0',
          usage_terms: info.usage_terms || 'Permitted for automated triage and repair',
          used_ai: info.used_ai ?? false,
          status_note: info.status_note || health.status
        });
      } catch (err) {
        if (!isMounted) return;
        setBackendHealthy(false);
      }
    }

    async function loadSamples() {
      try {
        const sampleList = await getSampleRepos();
        if (isMounted && sampleList.length > 0) {
          setSamples(sampleList);
        }
      } catch (err) {
        console.error('Failed to load sample repos:', err);
      }
    }

    checkEngineStatus();
    loadSamples();

    // Heartbeat: sync backend connection every 4 seconds
    const interval = setInterval(checkEngineStatus, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleStartScan = async (url: string, branch: string, isSample: boolean, sampleId?: string) => {
    setIsScanning(true);
    setScanError(null);
    setCurrentScan(null);
    setSelectedFinding(null);
    setProposals({});
    setVerifications({});

    try {
      const initResp = await startScan({
        repo_url: url,
        branch: branch,
        is_sample: isSample,
        sample_id: sampleId
      });

      const pollInterval = setInterval(async () => {
        try {
          const result = await getScanResult(initResp.scan_id);
          setCurrentScan(result);
          if (result.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setIsScanning(false);
          } else if (result.status === 'FAILED') {
            clearInterval(pollInterval);
            setScanError(result.error_message || 'Diagnostic scan failed.');
            setIsScanning(false);
          }
        } catch (err) {
          clearInterval(pollInterval);
          setScanError('Failed to retrieve diagnostic telemetry.');
          setIsScanning(false);
        }
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize repository scan.';
      setScanError(msg);
      setIsScanning(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!selectedFinding) return;
    setIsGeneratingProposal(true);
    try {
      const scanId = currentScan?.scan_id || currentScan?.id || '';
      const prop = await proposeFix(selectedFinding.id, scanId);
      setProposals(prev => ({ ...prev, [selectedFinding.id]: prop }));
    } catch (err) {
      console.error('Failed to generate fix proposal:', err);
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleVerifyProposal = async () => {
    if (!selectedFinding) return;
    const prop = proposals[selectedFinding.id];
    if (!prop) return;
    setIsVerifying(true);
    try {
      const scanId = currentScan?.scan_id || currentScan?.id || '';
      const ver = await verifyProposal(prop.id, scanId);
      setVerifications(prev => ({ ...prev, [prop.id]: ver }));
    } catch (err) {
      console.error('Verification run failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDecision = async (decision: 'approve' | 'reject', notes?: string) => {
    if (!selectedFinding) return;
    const prop = proposals[selectedFinding.id];
    if (!prop) return;
    try {
      const updated = await recordDecision(prop.id, decision, notes);
      setProposals(prev => ({ ...prev, [selectedFinding.id]: updated }));
    } catch (err) {
      console.error('Failed to record decision:', err);
    }
  };

  const handleApply = async () => {
    if (!selectedFinding) return;
    const prop = proposals[selectedFinding.id];
    if (!prop) return;
    try {
      const scanId = currentScan?.scan_id || currentScan?.id || '';
      const applied = await applyProposal(prop.id, scanId);
      setProposals(prev => ({ ...prev, [selectedFinding.id]: applied }));
    } catch (err) {
      console.error('Failed to apply fix to repository tree:', err);
    }
  };

  const handleOpenCapsule = async () => {
    if (!currentScan) return;
    try {
      const scanId = currentScan.scan_id || currentScan.id || '';
      const cap = await getScanCapsule(scanId);
      setCapsuleData(cap);
      setShowCapsuleModal(true);
    } catch (err) {
      console.error('Failed to fetch dependency exit capsule:', err);
    }
  };

  const activeProposal = selectedFinding ? proposals[selectedFinding.id] : undefined;
  const activeVerification = activeProposal ? verifications[activeProposal.id] : undefined;

  const getTabLabel = (tab: NavTab) => {
    switch (tab) {
      case 'overview': return 'Overview & Vitals';
      case 'intake': return 'Repository Intake';
      case 'findings': return 'Diagnostics & Findings';
      case 'verification': return 'Verified Fix Loop';
      case 'capsule': return 'Exit Capsule';
      case 'settings': return 'Engine Settings';
    }
  };

  return (
    <div className="relative flex h-screen w-screen overflow-hidden text-slate-800 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Interactive Liquid Mesh Background */}
      <BackgroundEffects />
      {/* 1. Left Responsive Frosted Glass Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        backendHealthy={backendHealthy}
        findingsCount={currentScan?.findings?.length || 0}
        proposalsCount={Object.keys(proposals).length}
        canExportCapsule={!!currentScan && currentScan.status === 'COMPLETED'}
        modelInfo={modelInfo}
      />

      {/* 2. Main Application Cockpit */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Top Header Navigation */}
        <TopNav
          currentScan={currentScan}
          activeTabLabel={getTabLabel(activeTab)}
          onOpenCapsule={handleOpenCapsule}
          onQuickBenchmark={() => {
            setActiveTab('intake');
            handleStartScan('', 'main', true, 'py-vulnerable-calc');
          }}
          canExportCapsule={!!currentScan && currentScan.status === 'COMPLETED'}
          isScanning={isScanning}
        />

        {/* Dynamic Tab Body Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Diagnostic Error Banner */}
          {scanError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">Diagnostic Exception</div>
                <div className="text-rose-600 mt-0.5 font-mono">{scanError}</div>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Repository Intake Station */}
              <RepoInput
                onStartScan={handleStartScan}
                scanStatus={currentScan?.status || 'PENDING'}
                isScanning={isScanning}
                samples={samples}
              />

              {/* Once diagnosed: Show complete results right here under the intake */}
              {currentScan && currentScan.status === 'COMPLETED' && (
                <div className="space-y-6 animate-fadeIn pt-2">
                  <SummaryCards scanResult={currentScan} />

                  <FindingsList
                    findings={currentScan.findings}
                    onSelectFinding={(f) => setSelectedFinding(f)}
                    selectedFindingId={selectedFinding?.id}
                  />
                </div>
              )}

              {!currentScan && !isScanning && (
                <div className="liquid-glass rounded-3xl p-8 sm:p-12 relative overflow-hidden">
                  <div className="max-w-3xl relative z-10">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-mono text-indigo-700 mb-4 shadow-sm">
                      <Shield className="h-3.5 w-3.5" />
                      <span className="font-bold">TRACK 2 MAINTENANCE AGENT PLATFORM</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                      Autonomous Repository Maintenance & <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-teal-600">
                        The Verified Fix Loop
                      </span>
                    </h1>

                    <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed font-normal">
                      RepoMedic AI analyzes genuine compiler ASTs and security scanners, synthesizes minimal corrective patches with an open-weight model, and verifies fixes in isolated worktrees before producing a versioned <strong>Dependency Exit Capsule</strong>.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3.5">
                      <button
                        onClick={() => {
                          handleStartScan('', 'main', true, 'py-vulnerable-calc');
                        }}
                        className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Run Verified Benchmark (py-vulnerable-calc)</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 3 Pillar Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10 pt-8 border-t border-slate-200/60">
                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3">
                        <Activity className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">1. Grounded Diagnosis</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Observed via Flake8 AST checks, Bandit security scans, and real Pytest execution.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mb-3">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">2. Isolated Sandbox Ward</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Proposed patches run in disposable sandbox worktrees comparing baseline vs patched exit codes.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mb-3">
                        <GitPullRequest className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">3. Exit Capsule</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Automated discharge package in validated JSON (schema 1.0.0) and Markdown report.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTAKE */}
          {activeTab === 'intake' && (
            <div className="space-y-6 animate-fadeIn">
              <RepoInput
                onStartScan={handleStartScan}
                scanStatus={currentScan?.status || 'PENDING'}
                isScanning={isScanning}
                samples={samples}
              />

              {/* Show results directly here near repository intake without navigating away */}
              {currentScan && currentScan.status === 'COMPLETED' && (
                <div className="space-y-6 animate-fadeIn pt-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                    <div className="flex items-center space-x-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">
                        Live Diagnostic Telemetry & Observed Findings Ward
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {currentScan.repo_url.replace('https://github.com/', '') || 'Benchmark'} ({currentScan.branch || 'main'})
                    </span>
                  </div>

                  {/* Summary & Health Score Cards */}
                  <SummaryCards scanResult={currentScan} />

                  {/* Complete Findings Ward with Fix Verification Trigger */}
                  <FindingsList
                    findings={currentScan.findings}
                    onSelectFinding={(f) => setSelectedFinding(f)}
                    selectedFindingId={selectedFinding?.id}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINDINGS */}
          {activeTab === 'findings' && (
            <div className="space-y-6 animate-fadeIn">
              {currentScan ? (
                <FindingsList
                  findings={currentScan.findings}
                  onSelectFinding={(f) => setSelectedFinding(f)}
                  selectedFindingId={selectedFinding?.id}
                />
              ) : (
                <div className="liquid-glass rounded-3xl p-12 text-center">
                  <Activity className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-900">No Repository Scan Loaded</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Please run a scan or select the verified benchmark repository to generate diagnostics.
                  </p>
                  <button
                    onClick={() => setActiveTab('intake')}
                    className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer shadow-md shadow-indigo-500/20"
                  >
                    Go to Repository Intake
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="liquid-glass rounded-3xl p-6 sm:p-8">
                <div className="pb-4 border-b border-slate-200/60">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">The Verified Fix Loop</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Every patch generated by RepoMedic AI is tested in an isolated sandbox worktree comparing pristine baseline outcome vs patched outcome.
                  </p>
                </div>

                {Object.keys(proposals).length === 0 ? (
                  <div className="py-14 text-center text-slate-400 text-xs">
                    No fix proposals generated yet. Select an observed finding from the Diagnostics Ward to generate and verify a fix.
                  </div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {Object.values(proposals).map(prop => {
                      const ver = verifications[prop.id];
                      return (
                        <div key={prop.id} className="p-5 rounded-2xl bg-white/80 border border-slate-200 space-y-3.5 shadow-sm">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 text-xs font-mono">
                            <span className="font-bold text-indigo-700">Proposal #{prop.id}</span>
                            <span className="text-slate-600 font-semibold">{prop.file_path}</span>
                          </div>

                          <DiffViewer
                            diffText={prop.diff}
                            filePath={prop.file_path}
                            beforeContent={prop.before_content}
                            afterContent={prop.after_content}
                          />

                          {ver && (
                            <VerificationResultCard verification={ver} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: EXIT CAPSULE */}
          {activeTab === 'capsule' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="liquid-glass rounded-3xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/60">
                  <div>
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-lg font-bold text-slate-900">Dependency Exit Capsule Export</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Validated machine-readable discharge package (JSON schema 1.0.0) and human-readable Markdown report.
                    </p>
                  </div>

                  {currentScan && (
                    <button
                      onClick={handleOpenCapsule}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
                    >
                      Export Capsule
                    </button>
                  )}
                </div>

                {!currentScan ? (
                  <div className="py-14 text-center text-slate-400 text-xs">
                    Run a repository diagnosis first to generate an Exit Capsule.
                  </div>
                ) : (
                  <div className="mt-5 p-5 rounded-2xl bg-white border border-slate-200 font-mono text-xs space-y-2.5 shadow-sm">
                    <div className="text-slate-900 font-bold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Capsule Schema v1.0.0 Ready</span>
                    </div>
                    <div className="text-slate-600 text-[11px] leading-relaxed">
                      Target Repository: <span className="text-slate-900 font-bold">{currentScan.repo_url}</span><br />
                      Commit Hash: <span className="text-indigo-600 font-bold">{currentScan.commit_hash || 'HEAD'}</span><br />
                      Observed Findings: <span className="text-slate-900 font-bold">{currentScan.findings.length}</span><br />
                      Verification Proofs: <span className="text-emerald-700 font-bold">{Object.keys(verifications).length}</span><br />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="liquid-glass rounded-3xl p-6 sm:p-8 max-w-3xl">
                <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/60">
                  <Cpu className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Engine Settings & Model Provenance</h3>
                </div>

                <div className="mt-5 space-y-4 text-xs font-mono">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-sm">
                    <div className="text-slate-400 uppercase font-bold text-[9px]">Open-Weight Model Provenance</div>
                    <div className="text-slate-900 font-bold text-sm">{modelInfo?.model_id || 'DeepSeek-Coder-V2-Lite-Instruct'}</div>
                    <div className="text-slate-600">License: <span className="text-indigo-700 font-bold">{modelInfo?.license || 'Apache 2.0'}</span></div>
                    <div className="text-slate-600">Provider: <span className="text-slate-800 font-semibold">{modelInfo?.provider || 'vLLM / Open-Weight Engine'}</span></div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-sm">
                    <div className="text-slate-400 uppercase font-bold text-[9px]">Sandbox Ward Security Guarantees</div>
                    <div className="text-slate-700 leading-relaxed font-sans text-xs">
                      • Isolated Git Worktree per verification run<br />
                      • SSRF domain restriction for repository cloning<br />
                      • Non-destructive rollback guarantees before patch application<br />
                      • Grounded compiler AST verification
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Finding Detail & Verified Fix Loop Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          proposal={activeProposal}
          verification={activeVerification}
          isGeneratingProposal={isGeneratingProposal}
          isVerifying={isVerifying}
          onGenerateProposal={handleGenerateProposal}
          onVerifyProposal={handleVerifyProposal}
          onDecision={handleDecision}
          onApply={handleApply}
          onClose={() => setSelectedFinding(null)}
        />
      )}

      {/* Dependency Exit Capsule Export Modal */}
      {showCapsuleModal && capsuleData && (
        <CapsuleViewerModal
          capsuleData={capsuleData}
          onClose={() => setShowCapsuleModal(false)}
        />
      )}
    </div>
  );
}

export default App;
