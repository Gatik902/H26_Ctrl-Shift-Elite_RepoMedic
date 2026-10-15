import os
import subprocess
import shutil
import time
from pathlib import Path
from typing import Tuple, Optional

from app.config import settings
from app.models.schemas import (
    Finding,
    PatchProposal,
    VerificationResult,
    VerificationStatus,
    CheckExecutionRecord,
    ProposalStatus
)
from app.services.repo_manager import RepoManager, SecurityError

class PatchVerifier:
    @staticmethod
    def _run_bounded_command(cmd_str: str, cwd: Path) -> Tuple[int, str]:
        """
        Executes a diagnostic or test command in cwd with bounded execution and timeout.
        Handles quoted paths and spaces cleanly.
        """
        import shlex
        try:
            tokens = shlex.split(cmd_str, posix=False)
            proc = subprocess.run(
                tokens,
                cwd=str(cwd),
                capture_output=True,
                text=True,
                timeout=settings.execution_timeout_sec
            )
            output = (proc.stdout + "\n" + proc.stderr).strip()
            return proc.returncode, output
        except subprocess.TimeoutExpired:
            return -1, f"Command execution timed out after {settings.execution_timeout_sec} seconds."
        except Exception as e:
            # Fallback to shell execution if direct token execution fails
            try:
                proc = subprocess.run(
                    cmd_str,
                    cwd=str(cwd),
                    capture_output=True,
                    text=True,
                    shell=True,
                    timeout=settings.execution_timeout_sec
                )
                output = (proc.stdout + "\n" + proc.stderr).strip()
                return proc.returncode, output
            except Exception as e2:
                return -1, f"Command execution failed: {str(e2)}"

    @classmethod
    def verify_proposal_in_isolation(
        cls,
        repo_dir: Path,
        finding: Finding,
        proposal: PatchProposal
    ) -> VerificationResult:
        """
        Executes the full Verified Fix Loop:
        1. Executes baseline check on pristine original repo.
        2. Clones an isolated disposable workspace.
        3. Applies only the proposed patch to the isolated workspace.
        4. Executes the exact same check on the isolated workspace.
        5. Compares outcomes and determines verdict (PASS, FAIL, NOT_RUN, INCONCLUSIVE).
        6. Preserves original repository unmodified.
        """
        command_to_run = finding.command
        if not command_to_run:
            command_to_run = "pytest" if finding.category.value == "TEST_FAILURE" else "flake8 ."

        # Step 1: Run Baseline Check on original repository
        t0 = time.time()
        base_code, base_out = cls._run_bounded_command(command_to_run, repo_dir)
        base_duration = int((time.time() - t0) * 1000)
        base_status = VerificationStatus.PASS if base_code == 0 else VerificationStatus.FAIL

        baseline_record = CheckExecutionRecord(
            check_name=f"Baseline Check: {finding.rule_id}",
            command=command_to_run,
            exit_code=base_code,
            output=base_out[:3000],  # bounded output
            status=base_status,
            duration_ms=base_duration
        )

        # Step 2: Validate patch target file
        try:
            safe_target = RepoManager.validate_safe_relative_path(repo_dir, proposal.file_path)
            if not safe_target.exists():
                raise SecurityError(f"Target file {proposal.file_path} does not exist in repository inventory.")
        except Exception as e:
            proposed_record = CheckExecutionRecord(
                check_name=f"Isolated Sandbox: {finding.rule_id}",
                command=command_to_run,
                exit_code=-1,
                output=f"Security/Path Validation Failed: {str(e)}",
                status=VerificationStatus.FAIL,
                duration_ms=0
            )
            return VerificationResult(
                proposal_id=proposal.id,
                finding_id=finding.id,
                baseline_check=baseline_record,
                proposed_check=proposed_record,
                verdict=VerificationStatus.FAIL,
                explanation=f"Patch rejected during path validation: {str(e)}",
                isolated_workspace="rejected"
            )

        # Step 3: Create disposable isolated workspace
        isolated_dir = RepoManager.create_isolated_copy(repo_dir, proposal.id)

        try:
            # Step 4: Apply patch strictly to isolated directory
            isolated_target_file = isolated_dir / proposal.file_path
            isolated_target_file.parent.mkdir(parents=True, exist_ok=True)
            isolated_target_file.write_text(proposal.after_content, encoding="utf-8")

            # Step 5: Run Proposed Check in isolated sandbox
            t1 = time.time()
            prop_code, prop_out = cls._run_bounded_command(command_to_run, isolated_dir)
            prop_duration = int((time.time() - t1) * 1000)
            prop_status = VerificationStatus.PASS if prop_code == 0 else VerificationStatus.FAIL

            proposed_record = CheckExecutionRecord(
                check_name=f"Isolated Sandbox: {finding.rule_id}",
                command=command_to_run,
                exit_code=prop_code,
                output=prop_out[:3000],
                status=prop_status,
                duration_ms=prop_duration
            )

            # Step 6: Compare outcomes accurately
            if base_code != 0 and prop_code == 0:
                verdict = VerificationStatus.PASS
                explanation = (
                    f"Fix Verified: Baseline check failed with exit code {base_code}, "
                    f"while isolated patched workspace passed all checks with exit code 0."
                )
                proposal.status = ProposalStatus.VERIFIED_PASS
            elif base_code != 0 and prop_code != 0:
                verdict = VerificationStatus.FAIL
                explanation = (
                    f"Verification Failed: Proposed patch did not resolve the issue. "
                    f"Exit code remains non-zero ({prop_code}). Diagnostic still observed."
                )
                proposal.status = ProposalStatus.VERIFIED_FAIL
            elif base_code == 0 and prop_code == 0:
                # If baseline was already passing for this specific command
                verdict = VerificationStatus.INCONCLUSIVE
                explanation = (
                    "Inconclusive: Baseline was already exiting with code 0 for this specific command, "
                    "so no differential resolution could be confirmed."
                )
                proposal.status = ProposalStatus.VERIFIED_INCONCLUSIVE
            else:
                verdict = VerificationStatus.FAIL
                explanation = (
                    f"Regression Detected: Baseline check passed ({base_code}), "
                    f"but patched isolated workspace failed ({prop_code})."
                )
                proposal.status = ProposalStatus.VERIFIED_FAIL

        finally:
            # Clean up the isolated workspace after verification
            RepoManager.cleanup_workspace(isolated_dir)

        return VerificationResult(
            proposal_id=proposal.id,
            finding_id=finding.id,
            baseline_check=baseline_record,
            proposed_check=proposed_record,
            verdict=verdict,
            explanation=explanation,
            isolated_workspace=str(isolated_dir)
        )

    @classmethod
    def apply_patch_to_repository(cls, repo_dir: Path, proposal: PatchProposal) -> bool:
        """
        Applies an APPROVED proposal to the actual repository working tree.
        Only called when explicitly approved by the human maintainer.
        """
        safe_target = RepoManager.validate_safe_relative_path(repo_dir, proposal.file_path)
        safe_target.write_text(proposal.after_content, encoding="utf-8")
        proposal.status = ProposalStatus.APPLIED
        return True
