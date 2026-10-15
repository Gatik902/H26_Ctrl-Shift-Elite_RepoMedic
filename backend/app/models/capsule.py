from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class FindingItemCapsule(BaseModel):
    finding_id: str
    rule_id: str
    category: str
    severity: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    message: str
    evidence_source: str
    origin: str  # OBSERVED or INFERRED

class CheckExecutionCapsule(BaseModel):
    check_name: str
    command: str
    exit_code: int
    output_snippet: str
    status: str

class VerificationComparisonCapsule(BaseModel):
    baseline_check: CheckExecutionCapsule
    proposed_check: CheckExecutionCapsule
    verdict: str  # PASS, FAIL, NOT_RUN, INCONCLUSIVE
    explanation: str

class ProposalCapsule(BaseModel):
    proposal_id: str
    finding_id: str
    target_file: str
    explanation: str
    root_cause: str
    suggested_tests: List[str] = []
    unified_diff: str
    verification: Optional[VerificationComparisonCapsule] = None
    approval_status: str  # PROPOSED, APPROVED, REJECTED, APPLIED
    maintainer_notes: Optional[str] = None

class ModelProvenance(BaseModel):
    model_identifier: str
    provider_endpoint: str
    access_method: str
    is_open_weight: bool
    license_terms: str
    ai_assistance_used: bool
    disclaimer: str

class RollbackGuidance(BaseModel):
    instructions: str
    git_command: str
    limitations: List[str]

class DependencyExitCapsule(BaseModel):
    schema_version: str = "1.0.0"
    capsule_id: str
    repository_url: str
    commit_hash: str
    branch: Optional[str] = "main"
    scan_timestamp: datetime = Field(default_factory=datetime.utcnow)
    ecosystems_detected: List[str]
    manifest_files: List[str]
    risk_indicators: List[str]
    findings: List[FindingItemCapsule]
    proposals: List[ProposalCapsule]
    model_provenance: ModelProvenance
    compatibility_gaps_and_concerns: List[str]
    rollback_guidance: RollbackGuidance
    generated_at: datetime = Field(default_factory=datetime.utcnow)
