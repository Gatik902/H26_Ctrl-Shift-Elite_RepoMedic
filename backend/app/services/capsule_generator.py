import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from app.models.schemas import ScanResult, PatchProposal, VerificationResult
from app.models.capsule import (
    DependencyExitCapsule,
    FindingItemCapsule,
    ProposalCapsule,
    VerificationComparisonCapsule,
    CheckExecutionCapsule,
    ModelProvenance,
    RollbackGuidance
)
from app.config import settings

class CapsuleGenerator:
    @classmethod
    def generate_capsule(
        cls,
        scan_result: ScanResult,
        proposals: List[PatchProposal],
        verifications: Dict[str, VerificationResult]
    ) -> Tuple[DependencyExitCapsule, str]:
        """
        Compiles both the validated schema-compliant JSON capsule and human-readable Markdown.
        """
        capsule_id = f"CAPSULE-{uuid.uuid4().hex[:8].upper()}"

        # 1. Findings item capsules
        finding_items = []
        risk_indicators = []
        for f in scan_result.findings:
            finding_items.append(FindingItemCapsule(
                finding_id=f.id,
                rule_id=f.rule_id,
                category=f.category.value,
                severity=f.severity.value,
                file_path=f.file_path,
                line_number=f.line_number,
                message=f.message,
                evidence_source=f.evidence_source,
                origin=f.origin.value
            ))
            if f.severity.value in ["CRITICAL", "HIGH"]:
                risk_indicators.append(f"[{f.severity.value}] {f.rule_id} in {f.file_path or 'unknown'}: {f.message}")

        # 2. Proposals capsules
        proposal_capsules = []
        for p in proposals:
            ver = verifications.get(p.id)
            ver_capsule = None
            if ver:
                ver_capsule = VerificationComparisonCapsule(
                    baseline_check=CheckExecutionCapsule(
                        check_name=ver.baseline_check.check_name,
                        command=ver.baseline_check.command,
                        exit_code=ver.baseline_check.exit_code,
                        output_snippet=ver.baseline_check.output[:500],
                        status=ver.baseline_check.status.value
                    ),
                    proposed_check=CheckExecutionCapsule(
                        check_name=ver.proposed_check.check_name,
                        command=ver.proposed_check.command,
                        exit_code=ver.proposed_check.exit_code,
                        output_snippet=ver.proposed_check.output[:500],
                        status=ver.proposed_check.status.value
                    ),
                    verdict=ver.verdict.value,
                    explanation=ver.explanation
                )

            proposal_capsules.append(ProposalCapsule(
                proposal_id=p.id,
                finding_id=p.finding_id,
                target_file=p.file_path,
                explanation=p.explanation,
                root_cause=p.root_cause,
                suggested_tests=p.suggested_tests,
                unified_diff=p.diff,
                verification=ver_capsule,
                approval_status=p.status.value
            ))

        # Model provenance
        first_model_info = proposals[0].model_info if proposals else None
        model_provenance = ModelProvenance(
            model_identifier=first_model_info.model_id if first_model_info else settings.model_id,
            provider_endpoint=settings.model_endpoint if (first_model_info and first_model_info.used_ai) else "Local Rule Engine",
            access_method="HTTPS REST OpenAI-Compatible / Deterministic Sandbox" if (first_model_info and first_model_info.used_ai) else "Local Native Verification Engine",
            is_open_weight=True,
            license_terms="Llama 3.3 Community License / Apache 2.0" if (first_model_info and first_model_info.used_ai) else "Apache 2.0",
            ai_assistance_used=first_model_info.used_ai if first_model_info else False,
            disclaimer="Observed diagnostics and verification exit codes are factual ground truth. Model root causes and recommendations are machine-generated proposals requiring maintainer review."
        )

        # Rollback guidance
        rollback = RollbackGuidance(
            instructions=(
                "To roll back any applied changes, run the git checkout command shown below. "
                "All patches are non-destructive and maintain an exact baseline snapshot."
            ),
            git_command=f"git checkout {scan_result.commit_hash or 'HEAD'} -- .",
            limitations=[
                "Isolated sandbox verification tests executed in temporary workspace; external network dependencies were bounded.",
                "Maintainer approval is mandatory prior to committing to production branch."
            ]
        )

        capsule = DependencyExitCapsule(
            schema_version="1.0.0",
            capsule_id=capsule_id,
            repository_url=scan_result.repo_url,
            commit_hash=scan_result.commit_hash or "HEAD",
            branch=scan_result.branch or "main",
            scan_timestamp=scan_result.created_at,
            ecosystems_detected=scan_result.detected_ecosystems,
            manifest_files=scan_result.detected_manifests,
            risk_indicators=risk_indicators,
            findings=finding_items,
            proposals=proposal_capsules,
            model_provenance=model_provenance,
            compatibility_gaps_and_concerns=[
                "Ensure target CI/CD test runners match the localized python 3.10+ / node runtime environment.",
                "Review deprecated third-party packages in requirements.txt or package.json for long-term compatibility."
            ],
            rollback_guidance=rollback
        )

        # Generate Markdown Document
        markdown_report = cls._render_markdown(capsule)

        return capsule, markdown_report

    @staticmethod
    def _render_markdown(capsule: DependencyExitCapsule) -> str:
        lines = [
            f"# 💊 Dependency Exit Capsule: {capsule.capsule_id}",
            f"**Repository**: `{capsule.repository_url}`  ",
            f"**Source Commit**: `{capsule.commit_hash}` | **Branch**: `{capsule.branch}`  ",
            f"**Timestamp**: {capsule.scan_timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}  ",
            f"**Schema Version**: `{capsule.schema_version}`  ",
            "",
            "---",
            "## 1. Executive Vitals & Triage Summary",
            f"- **Ecosystems Detected**: {', '.join(capsule.ecosystems_detected) or 'General'}",
            f"- **Manifests Found**: {', '.join(capsule.manifest_files) or 'None'}",
            f"- **Total Observed Findings**: {len(capsule.findings)}",
            f"- **Critical/High Risks**: {len(capsule.risk_indicators)}",
            "",
            "### Risk Indicators:",
        ]
        if capsule.risk_indicators:
            for r in capsule.risk_indicators:
                lines.append(f"- ⚠️ {r}")
        else:
            lines.append("- ✅ No critical risk indicators observed.")

        lines.extend([
            "",
            "---",
            "## 2. AI Model Provenance & Terms",
            f"- **Model Identifier**: `{capsule.model_provenance.model_identifier}`",
            f"- **Provider Endpoint**: `{capsule.model_provenance.provider_endpoint}`",
            f"- **Access Method**: {capsule.model_provenance.access_method}",
            f"- **Open-Weight / Permissive**: `{'Yes' if capsule.model_provenance.is_open_weight else 'No'}`",
            f"- **License**: {capsule.model_provenance.license_terms}",
            f"- **AI Used**: `{'Yes (Remote LLM)' if capsule.model_provenance.ai_assistance_used else 'No (Deterministic Remediator)'}`",
            f"> *{capsule.model_provenance.disclaimer}*",
            "",
            "---",
            "## 3. Verified Fix Proposals & Sandbox Execution",
        ])

        if not capsule.proposals:
            lines.append("_No fix proposals have been generated yet for this scan._\n")
        else:
            for p in capsule.proposals:
                lines.extend([
                    f"### Proposal `{p.proposal_id}` for Finding `{p.finding_id}`",
                    f"- **Target File**: `{p.target_file}`",
                    f"- **Approval Status**: **`{p.approval_status}`**",
                    f"- **Explanation**: {p.explanation}",
                    f"- **Root Cause**: {p.root_cause}",
                ])
                if p.suggested_tests:
                    lines.append(f"- **Suggested Regression Tests**: {', '.join(p.suggested_tests)}")

                if p.verification:
                    v = p.verification
                    lines.extend([
                        "",
                        "#### Sandbox Verification Proof:",
                        f"| Environment | Command | Exit Code | Status |",
                        f"| :--- | :--- | :--- | :--- |",
                        f"| **Baseline** | `{v.baseline_check.command}` | `{v.baseline_check.exit_code}` | `{v.baseline_check.status}` |",
                        f"| **Patched Sandbox** | `{v.proposed_check.command}` | `{v.proposed_check.exit_code}` | `{v.proposed_check.status}` |",
                        "",
                        f"**Differential Verdict**: `{v.verdict}` — {v.explanation}",
                    ])

                lines.extend([
                    "",
                    "```diff",
                    p.unified_diff or "No diff",
                    "```",
                    ""
                ])

        lines.extend([
            "---",
            "## 4. Rollback Guidance & Limitations",
            f"{capsule.rollback_guidance.instructions}",
            "",
            "```bash",
            capsule.rollback_guidance.git_command,
            "```",
            "",
            "**Operational Limitations:**",
        ])
        for lim in capsule.rollback_guidance.limitations:
            lines.append(f"- {lim}")

        lines.extend([
            "",
            "---",
            "*Generated automatically by RepoMedic AI Track 2 Maintenance Agent.*"
        ])

        return "\n".join(lines)
