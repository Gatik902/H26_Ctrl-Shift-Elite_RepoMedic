import React, { useState, useEffect, useRef } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  RepoInput 
} from './components/RepoInput';
import { 
  SummaryCards 
} from './components/SummaryCards';
import { 
  FindingsList 
} from './components/FindingsList';
import { 
  FindingDetailModal 
} from './components/FindingDetailModal';
import { 
  CapsuleViewerModal 
} from './components/CapsuleViewerModal';
import { 
  apiClient 
} from './api/client';
import { 
  ScanResult, 
  Finding, 
  PatchProposal, 
  VerificationResult, 
  SampleRepo, 
  ModelInfo, 
  CapsuleExportResponse
} from './types';
import { 
  AlertCircle, 
  Stethoscope, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2, 
  ArrowRight,
  Terminal,
  Activity,
  HeartPulse,
  GitPullRequest,
  Check
} from 'lucide-react';

export function App() {
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | undefined>();
  const [samples, setSamples] = useState<SampleRepo[]>([]);
  
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [proposals, setProposals] = useState<Record<string, PatchProposal>>({});
  const [verifications, setVerifications] = useState<Record<string, VerificationResult>>({});

  const [isGeneratingProposal, setIsGeneratingProposal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [capsuleData, setCapsuleData] = useState<CapsuleExportResponse | null>(null);
  const [showCapsuleModal, setShowCapsuleModal] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  // Initialize and check health on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const health = await apiClient.getHealth();
        setBackendHealthy(true);
        if (health.model_info) {
          setModelInfo(health.model_info);
        }
      } catch (err) {
        setBackendHealthy(false);
      }

      try {
        const sampleData = await apiClient.getSamples();
        setSamples(sampleData.samples || []);
      } catch (err) {
        console.error('Failed to load sample benchmark repos', err);
      }
    };

    initApp();
    const interval = setInterval(initApp, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll scan status until complete
  const pollScan = (scanId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await apiClient.getScan(scanId);
        setCurrentScan(res);

        if (res.status === 'COMPLETED') {
          setIsScanning(false);
          clearInterval(pollIntervalRef.current);
        } else if (res.status === 'FAILED') {
          setIsScanning(false);
          setScanError(res.error_message || 'Diagnostic scan failed.');
          clearInterval(pollIntervalRef.current);
        }
      } catch (err: any) {
        setIsScanning(false);
        setScanError(err.message || 'Error polling scan status.');
        clearInterval(pollIntervalRef.current);
      }
    }, 1500);
  };

  const handleStartScan = async (repoUrl: string, branch: string, isSample: boolean, sampleId?: string) => {
    setScanError(null);
    setIsScanning(true);
    setProposals({});
    setVerifications({});
    setSelectedFinding(null);

    try {
      const init = await apiClient.startScan(repoUrl, branch, isSample, sampleId);
      pollScan(init.scan_id);
    } catch (err: any) {
      setIsScanning(false);
      setScanError(err.message || 'Failed to start diagnostic scan.');
    }
  };

  const handleGenerateProposal = async () => {
    if (!selectedFinding || !currentScan) return;
    setIsGeneratingProposal(true);
    try {
      const prop = await apiClient.proposeFix(selectedFinding.id, currentScan.scan_id);
      setProposals(prev => ({ ...prev, [selectedFinding.id]: prop }));
    } catch (err: any) {
      alert(`Error proposing fix: ${err.message}`);
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  const handleVerifyProposal = async () => {
    if (!selectedFinding || !currentScan) return;
    const prop = proposals[selectedFinding.id];
    if (!prop) return;

    setIsVerifying(true);
    try {
      const ver = await apiClient.verifyProposal(prop.id, currentScan.scan_id);
      setVerifications(prev => ({ ...prev, [prop.id]: ver }));
      setProposals(prev => ({
        ...prev,
        [selectedFinding.id]: {
          ...prop,
          status: ver.verdict === 'PASS' ? 'VERIFIED_PASS' : (ver.verdict === 'FAIL' ? 'VERIFIED_FAIL' : 'VERIFIED_INCONCLUSIVE')
        }
      }));
    } catch (err: any) {
      alert(`Error during sandbox verification: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDecision = async (decision: 'approve' | 'reject', notes?: string) => {
    if (!selectedFinding) return;
    const prop = proposals[selectedFinding.id];
    if (!prop) return;

    try {
      const res = await apiClient.makeDecision(prop.id, decision, notes);
      setProposals(prev => ({
        ...prev,
        [selectedFinding.id]: {
          ...prop,
          status: res.status
        }
      }));
    } catch (err: any) {
      alert(`Error recording decision: ${err.message}`);
    }
  };

  const handleApply = async () => {
    if (!selectedFinding || !currentScan) return;
    const prop = proposals[selectedFinding.id];
    if (!prop) return;

    try {
      await apiClient.applyProposal(prop.id, currentScan.scan_id);
      setProposals(prev => ({
        ...prev,
        [selectedFinding.id]: {
          ...prop,
          status: 'APPLIED'
        }
      }));
      alert('Success: Patch applied cleanly to repository working tree!');
    } catch (err: any) {
      alert(`Failed to apply patch: ${err.message}`);
    }
  };

  const handleOpenCapsule = async () => {
    if (!currentScan) return;
    try {
      const data = await apiClient.getCapsule(currentScan.scan_id);
      setCapsuleData(data);
      setShowCapsuleModal(true);
    } catch (err: any) {
      alert(`Failed to generate capsule: ${err.message}`);
    }
  };

  const activeProposal = selectedFinding ? proposals[selectedFinding.id] : undefined;
  const activeVerification = activeProposal ? verifications[activeProposal.id] : undefined;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        modelInfo={modelInfo}
        backendHealthy={backendHealthy}
        onOpenCapsule={handleOpenCapsule}
        canExportCapsule={!!currentScan && currentScan.status === 'COMPLETED'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Intake Command Card */}
        <RepoInput
          onStartScan={handleStartScan}
          scanStatus={currentScan?.status || 'PENDING'}
          isScanning={isScanning}
          samples={samples}
        />

        {/* Scan Error Banner */}
        {scanError && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-300 text-sm flex items-center gap-3.5 shadow-xl">
            <AlertCircle className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-base">Diagnostic Pipeline Exception</div>
              <div className="text-xs text-rose-200 mt-0.5 font-mono">{scanError}</div>
            </div>
          </div>
        )}

        {/* Empty State: Rich High-Tech Operations Center Overview */}
        {!currentScan && !isScanning && !scanError && (
          <div className="space-y-6 animate-fadeIn">
            {/* Visual Medical ICU Dashboard Hero */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-xs text-cyan-300 font-mono mb-4">
                  <HeartPulse className="h-4 w-4 text-cyan-400 animate-pulse" />
                  <span>TRACK 2 MAINTENANCE AGENT PLATFORM</span>
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                  Autonomous Repository ICU & <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                    The Verified Fix Loop
                  </span>
                </h2>

                <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
                  RepoMedic AI analyzes real repository codebases, detects genuine test failures and security flaws, uses an open-weight model to propose targeted patches, verifies fixes in an isolated sandbox, and outputs a versioned <strong>Dependency Exit Capsule</strong>.
                </p>

                {/* Quick start CTA */}
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => handleStartScan('', 'main', true, 'py-vulnerable-calc')}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Run Verified Benchmark (py-vulnerable-calc)</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* High-Tech Capability Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-8 border-t border-slate-800/80">
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center mb-3">
                    <Activity className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">1. Grounded Diagnosis</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Zero hallucinations or mock data. Every defect is observed via actual Flake8 AST checks, Bandit security scans, and real Pytest execution.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-3">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">2. Isolated Sandbox Ward</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Proposed patches run in disposable sandbox worktrees. Compares pristine baseline exit code (1) vs patched exit code (0) before requesting maintainer approval.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-sm">
                  <div className="h-10 w-10 rounded-xl bg-purple-950/80 border border-purple-800 text-purple-400 flex items-center justify-center mb-3">
                    <GitPullRequest className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">3. Dependency Exit Capsule</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Automated discharge package in validated JSON (schema 1.0.0) and Markdown report with differential proof and non-destructive rollback commands.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Completed Scan Results */}
        {currentScan && currentScan.status === 'COMPLETED' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Triage Summary Cards with Health Gauge */}
            <SummaryCards scanResult={currentScan} />

            {/* Filterable Findings List */}
            <FindingsList
              findings={currentScan.findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
              selectedFindingId={selectedFinding?.id}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-7 text-center text-xs text-slate-500 bg-slate-950/80 font-mono">
        RepoMedic AI • Track 2 Maintenance Agent • Hackathon 2026 • Verified Fix Loop & Dependency Exit Capsule
      </footer>

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