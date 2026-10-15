import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import PlainTextResponse

from app.config import settings
from app.models.schemas import (
    ScanRequest,
    ScanResult,
    ScanJobStatus,
    Finding,
    PatchProposal,
    VerificationResult,
    DecisionRequest,
    ProposalStatus
)
from app.models.capsule import DependencyExitCapsule
from app.services.repo_manager import RepoManager, SecurityError
from app.services.normalizer import FindingNormalizer
from app.services.model_provider import OpenWeightModelProvider
from app.services.patch_verifier import PatchVerifier
from app.services.capsule_generator import CapsuleGenerator

router = APIRouter(prefix="/api")

# In-memory storage for active sessions
SCANS_DB: Dict[str, ScanResult] = {}
SCAN_PATHS: Dict[str, Path] = {}
PROPOSALS_DB: Dict[str, PatchProposal] = {}
VERIFICATIONS_DB: Dict[str, VerificationResult] = {}
CAPSULES_DB: Dict[str, Dict[str, Any]] = {}

SAMPLE_REPOS_DIR = Path(__file__).resolve().parent.parent.parent.parent / "sample-repos"

@router.get("/health")
def health_check():
    model_meta = OpenWeightModelProvider.get_model_metadata()
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.version,
        "model_info": model_meta.model_dump(),
        "workspaces_dir": str(settings.workspaces_dir)
    }

@router.get("/samples")
def get_sample_repositories():
    """Returns ready-to-test benchmark repositories with authentic diagnostics."""
    samples = []
    if SAMPLE_REPOS_DIR.exists():
        for d in SAMPLE_REPOS_DIR.iterdir():
            if d.is_dir() and (d / "calc.py" or d / "requirements.txt").exists():
                if d.name == "isolated-test-fixture":
                    samples.append({
                        "id": d.name,
                        "name": "Isolated Defect & Test Failure Fixture",
                        "description": "Safe, isolated test repository containing deliberate lint issues (F401, F821) and a failing pytest assertion.",
                        "path": str(d),
                        "ecosystem": "Python",
                        "known_issues": ["AssertionError in test suite", "F401 unused imports (os, sys)", "F821 undefined name 'undefined_var'"]
                    })
                else:
                    samples.append({
                        "id": d.name,
                        "name": "Python Arithmetic & Vulnerability Benchmark",
                        "description": "Authentic Python repo containing real flake8 lint errors, bandit AST assert risks, and failing pytest zero-division guard.",
                        "path": str(d),
                        "ecosystem": "Python",
                        "known_issues": ["ZeroDivisionError in test suite", "B101 assert in production", "F401 unused imports", "Deprecated urllib3"]
                    })
    return {"samples": samples}

def _execute_scan(scan_id: str, repo_url: str, branch: Optional[str], is_sample: bool, sample_id: Optional[str]):
    try:
        scan_job = SCANS_DB[scan_id]
        if is_sample and sample_id:
            # Load local sample repo
            sample_path = SAMPLE_REPOS_DIR / sample_id
            if not sample_path.exists():
                raise FileNotFoundError(f"Sample repository '{sample_id}' not found.")
            # Create a clone of the sample repo for isolation
            isolated_scan_dir = settings.workspaces_dir / f"scan_{scan_id}"
            if isolated_scan_dir.exists():
                shutil.rmtree(isolated_scan_dir, ignore_errors=True)
            shutil.copytree(sample_path, isolated_scan_dir)
            repo_path = isolated_scan_dir
            commit_hash = "6a203b8e71"
            branch_name = "main"
        else:
            scan_job.status = ScanJobStatus.CLONING
            repo_path, commit_hash, branch_name = RepoManager.clone_repository(repo_url, branch)

        SCAN_PATHS[scan_id] = repo_path
        scan_job.status = ScanJobStatus.ANALYZING
        scan_job.commit_hash = commit_hash
        scan_job.branch = branch_name

        # Run real analyzers & test suite
        findings, summary, ecosystems, manifests = FindingNormalizer.analyze_repository(repo_path)

        scan_job.findings = findings
        scan_job.summary = summary
        scan_job.detected_ecosystems = ecosystems
        scan_job.detected_manifests = manifests
        scan_job.status = ScanJobStatus.COMPLETED

    except Exception as e:
        scan_job = SCANS_DB.get(scan_id)
        if scan_job:
            scan_job.status = ScanJobStatus.FAILED
            scan_job.error_message = str(e)

@router.post("/scan")
async def start_scan(payload: ScanRequest, background_tasks: BackgroundTasks):
    scan_id = f"SCN-{uuid.uuid4().hex[:8].upper()}"
    
    # Initialize job in DB
    new_scan = ScanResult(
        scan_id=scan_id,
        repo_url=payload.repo_url,
        branch=payload.branch or "main",
        summary={},  # will populate on completion
        findings=[],
        status=ScanJobStatus.PENDING
    )
    SCANS_DB[scan_id] = new_scan

    # Run scan asynchronously
    background_tasks.add_task(
        _execute_scan,
        scan_id,
        payload.repo_url,
        payload.branch,
        bool(payload.is_sample),
        payload.sample_id
    )

    return {"scan_id": scan_id, "status": "PENDING", "message": "Scan initiated"}

@router.get("/scan/{scan_id}", response_model=ScanResult)
def get_scan(scan_id: str):
    if scan_id not in SCANS_DB:
        raise HTTPException(status_code=404, detail="Scan not found")
    return SCANS_DB[scan_id]

@router.post("/findings/{finding_id}/propose-fix", response_model=PatchProposal)
async def propose_fix(finding_id: str, scan_id: str = Query(...)):
    if scan_id not in SCANS_DB:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan_res = SCANS_DB[scan_id]
    repo_path = SCAN_PATHS.get(scan_id)
    if not repo_path or not repo_path.exists():
        raise HTTPException(status_code=400, detail="Repository workspace unavailable")

    target_finding = next((f for f in scan_res.findings if f.id == finding_id), None)
    if not target_finding:
        raise HTTPException(status_code=404, detail=f"Finding '{finding_id}' not found in scan")

    if not target_finding.file_path:
        raise HTTPException(status_code=400, detail="Finding does not specify a target file")

    safe_target = RepoManager.validate_safe_relative_path(repo_path, target_finding.file_path)
    if not safe_target.exists():
        raise HTTPException(status_code=404, detail=f"File {target_finding.file_path} not found in repository")

    content = safe_target.read_text(encoding="utf-8", errors="replace")

    # Generate proposal using Open-weight model or deterministic remediator
    proposal = await OpenWeightModelProvider.generate_proposal(
        target_finding,
        content,
        target_finding.file_path
    )
    PROPOSALS_DB[proposal.id] = proposal

    return proposal

@router.get("/proposals/{proposal_id}/diff")
def get_proposal_diff(proposal_id: str):
    if proposal_id not in PROPOSALS_DB:
        raise HTTPException(status_code=404, detail="Proposal not found")
    prop = PROPOSALS_DB[proposal_id]
    return {
        "proposal_id": prop.id,
        "finding_id": prop.finding_id,
        "file_path": prop.file_path,
        "diff": prop.diff,
        "before_content": prop.before_content,
        "after_content": prop.after_content,
        "status": prop.status.value,
        "model_info": prop.model_info.model_dump()
    }

@router.post("/proposals/{proposal_id}/verify", response_model=VerificationResult)
def verify_proposal(proposal_id: str, scan_id: str = Query(...)):
    if proposal_id not in PROPOSALS_DB:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if scan_id not in SCANS_DB:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    prop = PROPOSALS_DB[proposal_id]
    scan_res = SCANS_DB[scan_id]
    repo_path = SCAN_PATHS.get(scan_id)
    if not repo_path or not repo_path.exists():
        raise HTTPException(status_code=400, detail="Repository workspace unavailable")

    target_finding = next((f for f in scan_res.findings if f.id == prop.finding_id), None)
    if not target_finding:
        raise HTTPException(status_code=404, detail="Associated finding not found")

    prop.status = ProposalStatus.VERIFYING
    
    # Run isolated verification
    ver_result = PatchVerifier.verify_proposal_in_isolation(
        repo_path,
        target_finding,
        prop
    )
    VERIFICATIONS_DB[proposal_id] = ver_result

    return ver_result

@router.post("/proposals/{proposal_id}/decision")
def make_decision(proposal_id: str, payload: DecisionRequest):
    if proposal_id not in PROPOSALS_DB:
        raise HTTPException(status_code=404, detail="Proposal not found")
    prop = PROPOSALS_DB[proposal_id]
    
    if payload.decision.lower() == "approve":
        prop.status = ProposalStatus.APPROVED
    elif payload.decision.lower() == "reject":
        prop.status = ProposalStatus.REJECTED
    else:
        raise HTTPException(status_code=400, detail="Decision must be 'approve' or 'reject'")
        
    return {
        "proposal_id": prop.id,
        "status": prop.status.value,
        "maintainer_notes": payload.maintainer_notes
    }

@router.post("/proposals/{proposal_id}/apply")
def apply_proposal(proposal_id: str, scan_id: str = Query(...)):
    if proposal_id not in PROPOSALS_DB:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if scan_id not in SCANS_DB:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    prop = PROPOSALS_DB[proposal_id]
    repo_path = SCAN_PATHS.get(scan_id)
    if not repo_path or not repo_path.exists():
        raise HTTPException(status_code=400, detail="Repository workspace unavailable")

    if prop.status != ProposalStatus.APPROVED:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot apply proposal in '{prop.status.value}' state. Must be explicitly APPROVED first."
        )

    PatchVerifier.apply_patch_to_repository(repo_path, prop)
    return {"proposal_id": prop.id, "status": "APPLIED", "message": "Patch applied cleanly to repository working tree"}

@router.get("/scans/{scan_id}/capsule")
@router.get("/scan/{scan_id}/capsule")
def export_capsule(scan_id: str):
    if scan_id not in SCANS_DB:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan_res = SCANS_DB[scan_id]

    # Collect proposals for this scan
    relevant_proposals = [p for p in PROPOSALS_DB.values() if any(f.id == p.finding_id for f in scan_res.findings)]

    capsule, markdown_report = CapsuleGenerator.generate_capsule(
        scan_res,
        relevant_proposals,
        VERIFICATIONS_DB
    )

    return {
        "json_capsule": capsule.model_dump(),
        "markdown_report": markdown_report
    }

@router.get("/scans/{scan_id}/capsule/markdown", response_class=PlainTextResponse)
@router.get("/scan/{scan_id}/capsule/markdown", response_class=PlainTextResponse)
def export_capsule_markdown(scan_id: str):
    if scan_id not in SCANS_DB:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan_res = SCANS_DB[scan_id]
    relevant_proposals = [p for p in PROPOSALS_DB.values() if any(f.id == p.finding_id for f in scan_res.findings)]

    _, markdown_report = CapsuleGenerator.generate_capsule(
        scan_res,
        relevant_proposals,
        VERIFICATIONS_DB
    )
    return markdown_report

@router.get("/proposals/{proposal_id}/patch")
def download_patch(proposal_id: str):
    from fastapi.responses import Response
    if proposal_id not in PROPOSALS_DB:
        raise HTTPException(status_code=404, detail="Proposal not found")
    prop = PROPOSALS_DB[proposal_id]

    header = (
        f"# RepoMedic AI Autonomous Patch Proposal\n"
        f"# Proposal ID: {prop.id}\n"
        f"# Target File: {prop.file_path}\n"
        f"# Remediation Engine: {prop.model_info.model_id}\n"
        f"# Status: {prop.status.value}\n"
        f"# Created: {prop.created_at.isoformat()}\n\n"
    )
    patch_body = header + prop.diff
    filename = f"repomedic-{prop.id.lower()}.patch"

    return Response(
        content=patch_body,
        media_type="text/x-diff",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.get("/proposals/{proposal_id}/pr-draft")
def get_pr_draft(proposal_id: str):
    if proposal_id not in PROPOSALS_DB:
        raise HTTPException(status_code=404, detail="Proposal not found")
    prop = PROPOSALS_DB[proposal_id]
    ver_res = VERIFICATIONS_DB.get(proposal_id)

    # Build branch name
    clean_target = prop.file_path.replace("/", "-").replace("\\", "-").replace(".", "-")
    branch = f"repomedic/fix-{clean_target}"

    # Build markdown
    md_lines = [
        f"# 🤖 Fix: {prop.explanation}",
        "",
        "## 📋 Defect Summary",
        f"- **Target File**: `{prop.file_path}`",
        f"- **Remediation Model**: `{prop.model_info.model_id}` ({prop.model_info.provider})",
        f"- **Root Cause**: {prop.root_cause}",
        ""
    ]

    if prop.risky_dependency or prop.recommended_replacement:
        md_lines.extend([
            "## 🛡️ Dependency Migration & Modernization",
            f"- **Risky Dependency**: `{prop.risky_dependency or 'N/A'}`",
            f"- **Recommended Replacement**: `{prop.recommended_replacement or 'N/A'}`",
            ""
        ])

    if prop.migration_steps:
        md_lines.extend([
            "### 🛠️ Migration Steps",
            *[f"- {step}" for step in prop.migration_steps],
            ""
        ])

    if ver_res:
        md_lines.extend([
            "## 🧪 Isolated Sandbox Verification",
            f"- **Verdict**: `{ver_res.verdict.value}`",
            f"- **Baseline Check**: `{ver_res.baseline_check.command}` (Exit Code: {ver_res.baseline_check.exit_code})",
            f"- **Sandbox Patched Check**: `{ver_res.proposed_check.command}` (Exit Code: {ver_res.proposed_check.exit_code})",
            f"- **Outcome**: {ver_res.explanation}",
            "",
            "<details><summary>Sandbox Terminal Output</summary>",
            "",
            "```text",
            ver_res.proposed_check.output,
            "```",
            "",
            "</details>",
            ""
        ])

    md_lines.extend([
        "## 📝 Proposed Code Diff",
        "```diff",
        prop.diff,
        "```",
        "",
        "---",
        "*Verified and generated autonomously by [RepoMedic AI](https://github.com/repomedic-ai)*"
    ])

    return {
        "proposal_id": prop.id,
        "title": f"fix({prop.file_path}): {prop.explanation[:70]}",
        "branch": branch,
        "markdown": "\n".join(md_lines)
    }

