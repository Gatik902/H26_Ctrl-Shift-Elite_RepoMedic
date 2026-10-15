from enum import Enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class FindingCategory(str, Enum):
    TEST_FAILURE = "TEST_FAILURE"
    SYNTAX_ERROR = "SYNTAX_ERROR"
    LINT_VIOLATION = "LINT_VIOLATION"
    SECURITY_RISK = "SECURITY_RISK"
    TYPE_ERROR = "TYPE_ERROR"
    DEPRECATION = "DEPRECATION"

class FindingOrigin(str, Enum):
    OBSERVED = "OBSERVED"   # Directly parsed from analyzer output or test execution
    INFERRED = "INFERRED"   # Inferred dependency relation or side-effect

class ProposalStatus(str, Enum):
    PROPOSED = "PROPOSED"
    VERIFYING = "VERIFYING"
    VERIFIED_PASS = "VERIFIED_PASS"
    VERIFIED_FAIL = "VERIFIED_FAIL"
    VERIFIED_INCONCLUSIVE = "VERIFIED_INCONCLUSIVE"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    APPLIED = "APPLIED"

class VerificationStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NOT_RUN = "NOT_RUN"
    INCONCLUSIVE = "INCONCLUSIVE"

class Finding(BaseModel):
    id: str
    category: FindingCategory
    severity: Severity
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    column: Optional[int] = None
    rule_id: str
    message: str
    evidence_source: str
    command: str
    origin: FindingOrigin = FindingOrigin.OBSERVED
    context_code: Optional[str] = None

class ModelInfo(BaseModel):
    model_id: str
    provider: str
    is_open_weight: bool = True
    license: str = "Open Access / Permissive (Llama 3.3 / Qwen 2.5 / Apache 2.0)"
    usage_terms: str = "Authorized for research, commercial, and maintenance code analysis"
    used_ai: bool = True
    status_note: Optional[str] = None

class PatchProposal(BaseModel):
    id: str
    finding_id: str
    file_path: str
    explanation: str
    root_cause: str
    suggested_tests: List[str] = []
    before_content: str
    after_content: str
    diff: str
    status: ProposalStatus = ProposalStatus.PROPOSED
    model_info: ModelInfo
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CheckExecutionRecord(BaseModel):
    check_name: str
    command: str
    exit_code: int
    output: str
    status: VerificationStatus
    duration_ms: Optional[int] = None

class VerificationResult(BaseModel):
    proposal_id: str
    finding_id: str
    baseline_check: CheckExecutionRecord
    proposed_check: CheckExecutionRecord
    verdict: VerificationStatus
    explanation: str
    isolated_workspace: str
    verified_at: datetime = Field(default_factory=datetime.utcnow)

class ScanSummary(BaseModel):
    total_findings: int = 0
    errors_count: int = 0
    warnings_count: int = 0
    passed_checks_count: int = 0
    tests_found: int = 0
    tests_passed: int = 0
    tests_failed: int = 0
    security_issues: int = 0

class ScanJobStatus(str, Enum):
    PENDING = "PENDING"
    CLONING = "CLONING"
    ANALYZING = "ANALYZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ScanResult(BaseModel):
    scan_id: str
    repo_url: str
    commit_hash: Optional[str] = None
    branch: Optional[str] = None
    detected_ecosystems: List[str] = []
    detected_manifests: List[str] = []
    summary: ScanSummary
    findings: List[Finding] = []
    status: ScanJobStatus = ScanJobStatus.PENDING
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DecisionRequest(BaseModel):
    decision: str  # "approve" | "reject"
    maintainer_notes: Optional[str] = None

class ScanRequest(BaseModel):
    repo_url: str
    branch: Optional[str] = None
    is_sample: Optional[bool] = False
    sample_id: Optional[str] = None
