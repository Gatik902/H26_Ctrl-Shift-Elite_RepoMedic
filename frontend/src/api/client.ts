import {
  ScanResult,
  PatchProposal,
  VerificationResult,
  SampleRepo,
  CapsuleExportResponse
} from '../types';

const API_BASE = '/api';

export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getSamples(): Promise<{ samples: SampleRepo[] }> {
    const res = await fetch(`${API_BASE}/samples`);
    if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`);
    return res.json();
  },

  async startScan(repoUrl: string, branch?: string, isSample: boolean = false, sampleId?: string) {
    const res = await fetch(`${API_BASE}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url: repoUrl,
        branch: branch || 'main',
        is_sample: isSample,
        sample_id: sampleId
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to start scan');
    }
    return res.json();
  },

  async getScan(scanId: string): Promise<ScanResult> {
    const res = await fetch(`${API_BASE}/scan/${scanId}`);
    if (!res.ok) throw new Error(`Failed to fetch scan results: ${res.statusText}`);
    return res.json();
  },

  async proposeFix(findingId: string, scanId: string): Promise<PatchProposal> {
    const res = await fetch(`${API_BASE}/findings/${findingId}/propose-fix?scan_id=${encodeURIComponent(scanId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to generate proposal');
    }
    return res.json();
  },

  async verifyProposal(proposalId: string, scanId: string): Promise<VerificationResult> {
    const res = await fetch(`${API_BASE}/proposals/${proposalId}/verify?scan_id=${encodeURIComponent(scanId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to verify proposal');
    }
    return res.json();
  },

  async makeDecision(proposalId: string, decision: 'approve' | 'reject', maintainerNotes?: string) {
    const res = await fetch(`${API_BASE}/proposals/${proposalId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        maintainer_notes: maintainerNotes
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to record decision');
    }
    return res.json();
  },

  async applyProposal(proposalId: string, scanId: string) {
    const res = await fetch(`${API_BASE}/proposals/${proposalId}/apply?scan_id=${encodeURIComponent(scanId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to apply patch');
    }
    return res.json();
  },

  async getCapsule(scanId: string): Promise<CapsuleExportResponse> {
    const res = await fetch(`${API_BASE}/scans/${scanId}/capsule`);
    if (!res.ok) throw new Error(`Failed to export capsule: ${res.statusText}`);
    return res.json();
  }
};
