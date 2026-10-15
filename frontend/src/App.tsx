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
  CapsuleExportResponse,
  ScanJobStatus
} from './types';
import { AlertCircle, Stethoscope, Sparkles, FolderGit2, CheckCircle2 } from 'lucide-react';

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
      // Update proposal status in state
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
    <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        modelInfo={modelInfo}
        backendHealthy={backendHealthy}
        onOpenCapsule={handleOpenCapsule}
        canExportCapsule={!!currentScan && currentScan.status === 'COMPLETED'}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Intake Card */}
        <RepoInput
          onStartScan={handleStartScan}
          scanStatus={currentScan?.status || 'PENDING'}
          isScanning={isScanning}
          samples={samples}
        />

        {/* Scan Error Banner */}
        {scanError && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold">Diagnostic Pipeline Error</div>
              <div className="text-xs text-rose-200 mt-0.5">{scanError}</div>
            </div>
          </div>
        )}

        {/* Empty State before any scan */}
        {!currentScan && !isScanning && !scanError && (
          <div className="text-center py-20 px-4 bg-slate-900/30 border border-slate-800/60 rounded-3xl backdrop-blur-sm">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Stethoscope className="h-8 w-8 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white">No Repository Diagnosed Yet</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-lg mx-auto">
              Provide a public GitHub repository URL above, or click on the <strong>py-vulnerable-calc</strong> benchmark fixture to see real static analysis, AST security flaws, and test failures resolved in real time.
            </p>
          </div>
        )}

        {/* Completed Scan Results */}
        {currentScan && currentScan.status === 'COMPLETED' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Triage Summary Cards */}
            <SummaryCards scanResult={currentScan} />

            {/* Findings List */}
            <FindingsList
              findings={currentScan.findings}
              onSelectFinding={(f) => setSelectedFinding(f)}
              selectedFindingId={selectedFinding?.id}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/60">
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
