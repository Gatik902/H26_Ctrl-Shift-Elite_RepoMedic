export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type FindingCategory = 
  | 'TEST_FAILURE' 
  | 'SYNTAX_ERROR' 
  | 'LINT_VIOLATION' 
  | 'SECURITY_RISK' 
  | 'TYPE_ERROR' 
  | 'DEPRECATION';

export type FindingOrigin = 'OBSERVED' | 'INFERRED';

export type ProposalStatus = 
  | 'PROPOSED'
  | 'VERIFYING'
  | 'VERIFIED_PASS'
  | 'VERIFIED_FAIL'
  | 'VERIFIED_INCONCLUSIVE'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED';

export type VerificationStatus = 'PASS' | 'FAIL' | 'NOT_RUN' | 'INCONCLUSIVE';

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  file_path?: string;
  line_number?: number;
  column?: number;
  rule_id: string;
  message: string;
  evidence_source: string;
  command: string;
  origin: FindingOrigin;
  context_code?: string;
}

export interface ModelInfo {
  model_id: string;
  provider: string;
  is_open_weight: boolean;
  license: string;
  usage_terms: string;
  used_ai: boolean;
  status_note?: string;
}

export interface PatchProposal {
  id: string;
  finding_id: string;
  file_path: string;
  explanation: string;
  root_cause: string;
  suggested_tests: string[];
  risky_dependency?: string;
  recommended_replacement?: string;
  migration_steps?: string[];
  before_content: string;
  after_content: string;
  diff: string;
  status: ProposalStatus;
  model_info: ModelInfo;
  created_at: string;
}

export interface CheckExecutionRecord {
  check_name: string;
  command: string;
  exit_code: number;
  output: string;
  status: VerificationStatus;
  duration_ms?: number;
}

export interface VerificationResult {
  proposal_id: string;
  finding_id: string;
  baseline_check: CheckExecutionRecord;
  proposed_check: CheckExecutionRecord;
  verdict: VerificationStatus;
  explanation: string;
  isolated_workspace: string;
  verified_at: string;
}

export interface ScanSummary {
  total_findings: number;
  errors_count: number;
  warnings_count: number;
  passed_checks_count: number;
  tests_found: number;
  tests_passed: number;
  tests_failed: number;
  security_issues: number;
}

export type ScanJobStatus = 'PENDING' | 'CLONING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export interface ScanResult {
  scan_id: string;
  id?: string;
  repo_url: string;
  commit_hash?: string;
  branch?: string;
  detected_ecosystems: string[];
  detected_manifests: string[];
  summary: ScanSummary;
  findings: Finding[];
  status: ScanJobStatus;
  error_message?: string;
  created_at: string;
}

export interface SampleRepo {
  id: string;
  name: string;
  description: string;
  path: string;
  ecosystem: string;
  known_issues: string[];
}

export interface CapsuleExportResponse {
  json_capsule: any;
  markdown_report: string;
}

export type CapsuleData = CapsuleExportResponse;
