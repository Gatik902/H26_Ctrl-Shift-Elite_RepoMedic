import type {
  ScanResult,
  PatchProposal,
  VerificationResult,
  SampleRepo,
  CapsuleExportResponse
} from '../types';

const PRIMARY_BASE = '/api';
const DIRECT_BACKEND = 'http://127.0.0.1:8000/api';

async function resilientFetch(path: string, options?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(`${PRIMARY_BASE}${path}`, options);
    // If proxy returned 502/504 Bad Gateway, try direct backend
    if (res.status === 502 || res.status === 504) {
      return await fetch(`${DIRECT_BACKEND}${path}`, options);
    }
    return res;
  } catch (err) {
    // Fallback directly to backend server if proxy failed
    try {
      return await fetch(`${DIRECT_BACKEND}${path}`, options);
    } catch {
      throw err;
    }
  }
}

export const apiClient = {
  async getHealth() {
    const res = await resilientFetch('/health');
    if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
    return res.json();
  },

  async getSamples(): Promise<{ samples: SampleRepo[] }> {
    const res = await resilientFetch('/samples');
    if (!res.ok) throw new Error(`Failed to fetch samples: ${res.statusText}`);
    return res.json();
  },

  async startScan(repoUrl: string, branch?: string, isSample: boolean = false, sampleId?: string) {
    const res = await resilientFetch('/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repo_url: repoUrl,
        branch: branch && branch.trim() ? branch.trim() : undefined,
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
    const res = await resilientFetch(`/scan/${scanId}`);
    if (!res.ok) throw new Error(`Failed to fetch scan results: ${res.statusText}`);
    return res.json();
  },

  async proposeFix(findingId: string, scanId: string): Promise<PatchProposal> {
    const res = await resilientFetch(`/findings/${findingId}/propose-fix?scan_id=${encodeURIComponent(scanId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to generate proposal');
    }
    return res.json();
  },

  async verifyProposal(proposalId: string, scanId: string): Promise<VerificationResult> {
    const res = await resilientFetch(`/proposals/${proposalId}/verify?scan_id=${encodeURIComponent(scanId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to verify proposal');
    }
    return res.json();
  },

  async makeDecision(proposalId: string, decision: 'approve' | 'reject', maintainerNotes?: string): Promise<PatchProposal> {
    const res = await resilientFetch(`/proposals/${proposalId}/decision`, {
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

  async applyProposal(proposalId: string, scanId: string): Promise<PatchProposal> {
    const res = await resilientFetch(`/proposals/${proposalId}/apply?scan_id=${encodeURIComponent(scanId)}`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Failed to apply patch');
    }
    return res.json();
  },

  async getCapsule(scanId: string): Promise<CapsuleExportResponse> {
    const res = await resilientFetch(`/scans/${scanId}/capsule`);
    if (!res.ok) throw new Error(`Failed to export capsule: ${res.statusText}`);
    return res.json();
  },

  getPatchDownloadUrl(proposalId: string): string {
    return `/api/proposals/${encodeURIComponent(proposalId)}/patch`;
  },

  async getPrDraft(proposalId: string): Promise<{ proposal_id: string; title: string; branch: string; markdown: string }> {
    const res = await resilientFetch(`/proposals/${encodeURIComponent(proposalId)}/pr-draft`);
    if (!res.ok) throw new Error(`Failed to fetch PR draft: ${res.statusText}`);
    return res.json();
  }
};

export const checkHealth = async () => {
  return apiClient.getHealth();
};

export const getSampleRepos = async (): Promise<SampleRepo[]> => {
  const data = await apiClient.getSamples();
  return data.samples || [];
};

export const startScan = async (params: { repo_url: string; branch?: string; is_sample?: boolean; sample_id?: string }) => {
  return apiClient.startScan(params.repo_url, params.branch, params.is_sample, params.sample_id);
};

export const getScanResult = async (scanId: string): Promise<ScanResult> => {
  return apiClient.getScan(scanId);
};

export const proposeFix = async (findingId: string, scanId?: string): Promise<PatchProposal> => {
  return apiClient.proposeFix(findingId, scanId || '');
};

export const verifyProposal = async (proposalId: string, scanId?: string): Promise<VerificationResult> => {
  return apiClient.verifyProposal(proposalId, scanId || '');
};

export const recordDecision = async (proposalId: string, decision: 'approve' | 'reject', maintainerNotes?: string): Promise<PatchProposal> => {
  return apiClient.makeDecision(proposalId, decision, maintainerNotes);
};

export const applyProposal = async (proposalId: string, scanId?: string): Promise<PatchProposal> => {
  return apiClient.applyProposal(proposalId, scanId || '');
};

export const getScanCapsule = async (scanId: string): Promise<CapsuleExportResponse> => {
  return apiClient.getCapsule(scanId);
};

export const getPatchDownloadUrl = (proposalId: string): string => {
  return apiClient.getPatchDownloadUrl(proposalId);
};

export const getPrDraft = async (proposalId: string) => {
  return apiClient.getPrDraft(proposalId);
};

