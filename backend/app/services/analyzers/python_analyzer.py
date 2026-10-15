import os
import re
import json
import subprocess
import sys
from pathlib import Path
from typing import List, Tuple
import uuid

from app.models.schemas import Finding, FindingCategory, Severity, FindingOrigin

FLAKE8_LINE_REGEX = re.compile(r"^([^:]+):(\d+):(\d+):\s+([A-Z]\d+)\s+(.+)$")
PYTEST_FAIL_REGEX = re.compile(r"^FAILED\s+([^:]+)::(\w+)(?:\s+-\s+(.+))?$")

class PythonAnalyzer:
    def __init__(self, repo_dir: Path):
        self.repo_dir = repo_dir
        # Determine python/flake8/bandit/pytest path (prefer current virtualenv)
        venv_scripts = Path(sys.executable).parent
        self.flake8_bin = str(venv_scripts / "flake8.exe") if (venv_scripts / "flake8.exe").exists() else "flake8"
        self.bandit_bin = str(venv_scripts / "bandit.exe") if (venv_scripts / "bandit.exe").exists() else "bandit"
        self.pytest_bin = str(venv_scripts / "pytest.exe") if (venv_scripts / "pytest.exe").exists() else "pytest"
        self.python_bin = sys.executable

    @staticmethod
    def _cmd_to_str(cmd_list: List[str]) -> str:
        return " ".join([f'"{c}"' if (" " in c and not c.startswith('"')) else c for c in cmd_list])

    def _read_context_code(self, file_path_str: str, line_no: int) -> str:
        try:
            full_path = self.repo_dir / file_path_str
            if not full_path.exists():
                return ""
            lines = full_path.read_text(encoding="utf-8", errors="replace").splitlines()
            start = max(0, line_no - 3)
            end = min(len(lines), line_no + 3)
            snippet = []
            for idx in range(start, end):
                prefix = ">" if idx + 1 == line_no else " "
                snippet.append(f"{prefix} {idx + 1:4d} | {lines[idx]}")
            return "\n".join(snippet)
        except Exception:
            return ""

    def run_flake8(self) -> List[Finding]:
        """Runs flake8 to detect syntax errors, unresolved imports, and style bugs."""
        findings = []
        cmd = [self.flake8_bin, "--max-line-length=120", "--isolated", "."]
        
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                timeout=20
            )
            raw_output = res.stdout + "\n" + res.stderr
        except Exception as e:
            return findings

        for line in raw_output.splitlines():
            line = line.strip()
            if not line:
                continue
            match = FLAKE8_LINE_REGEX.match(line)
            if match:
                rel_file = match.group(1).replace("\\", "/")
                line_no = int(match.group(2))
                col_no = int(match.group(3))
                code = match.group(4)
                msg = match.group(5)

                # Determine category & severity
                if code.startswith("E9") or code.startswith("F7") or "SyntaxError" in msg:
                    category = FindingCategory.SYNTAX_ERROR
                    severity = Severity.CRITICAL
                elif code.startswith("F8"):  # e.g. undefined name, undefined variable
                    category = FindingCategory.SYNTAX_ERROR
                    severity = Severity.HIGH
                elif code.startswith("F4"):  # unused import or star import
                    category = FindingCategory.LINT_VIOLATION
                    severity = Severity.LOW
                else:
                    category = FindingCategory.LINT_VIOLATION
                    severity = Severity.MEDIUM

                ctx = self._read_context_code(rel_file, line_no)
                
                findings.append(Finding(
                    id=f"FIND-FLAKE-{len(findings) + 1:03d}",
                    category=category,
                    severity=severity,
                    file_path=rel_file,
                    line_number=line_no,
                    column=col_no,
                    rule_id=code,
                    message=msg,
                    evidence_source=f"flake8: {line}",
                    command=self._cmd_to_str(cmd),
                    origin=FindingOrigin.OBSERVED,
                    context_code=ctx
                ))

        return findings

    def run_bandit(self) -> List[Finding]:
        """Runs Bandit AST security scanner to detect real vulnerabilities."""
        findings = []
        cmd = [self.bandit_bin, "-r", ".", "-f", "json", "-q"]
        
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                timeout=20
            )
            raw_json = res.stdout
            if not raw_json.strip():
                return findings
            data = json.loads(raw_json)
        except Exception:
            return findings

        results = data.get("results", [])
        for item in results:
            raw_path = item.get("filename", "")
            try:
                rel_path = Path(raw_path).relative_to(self.repo_dir).as_posix()
            except Exception:
                rel_path = raw_path.replace(str(self.repo_dir), "").lstrip("/\\").replace("\\", "/")

            # Filter out test files and directories from Bandit security issues
            if "test" in rel_path.lower() or rel_path.startswith("tests/"):
                continue

            line_no = item.get("line_number", 1)
            issue_text = item.get("issue_text", "")
            test_id = item.get("test_id", "B000")
            bandit_sev = item.get("issue_severity", "MEDIUM").upper()

            severity = Severity.MEDIUM
            if bandit_sev == "HIGH":
                severity = Severity.HIGH
            elif bandit_sev == "LOW":
                severity = Severity.LOW

            # Elevate critical issues like command execution / eval / injection
            if test_id in ["B608", "B102", "B103", "B307", "B602"]:
                severity = Severity.CRITICAL

            ctx = self._read_context_code(rel_path, line_no)

            findings.append(Finding(
                id=f"FIND-SEC-{len(findings) + 1:03d}",
                category=FindingCategory.SECURITY_RISK,
                severity=severity,
                file_path=rel_path,
                line_number=line_no,
                column=1,
                rule_id=test_id,
                message=issue_text,
                evidence_source=f"Bandit security scan ({test_id}): {issue_text}",
                command=self._cmd_to_str(cmd),
                origin=FindingOrigin.OBSERVED,
                context_code=ctx
            ))

        return findings

    def run_tests(self) -> Tuple[List[Finding], int, int]:
        """
        Discovers and executes existing tests with pytest.
        Returns (findings, passed_count, failed_count).
        """
        findings = []
        passed_count = 0
        failed_count = 0

        # Check if tests exist
        test_files = list(self.repo_dir.glob("**/test_*.py")) + list(self.repo_dir.glob("**/*_test.py"))
        if not test_files:
            return findings, passed_count, failed_count

        cmd = [self.pytest_bin, "-v", "--tb=short", "--color=no"]
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                timeout=30
            )
            raw_output = res.stdout + "\n" + res.stderr
        except Exception as e:
            return findings, passed_count, failed_count

        lines = raw_output.splitlines()

        # Parse pytest output to identify exact failing tests and underlying source file
        failure_blocks = re.split(r"_{5,}\s+(\S+)\s+_{5,}", raw_output)
        test_details: dict[str, dict] = {}
        if len(failure_blocks) > 1:
            for idx in range(1, len(failure_blocks), 2):
                test_func_name = failure_blocks[idx]
                block_body = failure_blocks[idx + 1] if idx + 1 < len(failure_blocks) else ""
                
                # Check for source frames e.g. "calc.py:23: in divide"
                source_frame_match = re.search(r"([a-zA-Z0-9_\-\.\/\\]+\.py):(\d+):\s+in\s+([a-zA-Z0-9_]+)", block_body)
                src_file = None
                src_line = None
                if source_frame_match:
                    candidate_file = source_frame_match.group(1).replace("\\", "/")
                    # Prefer non-test files as primary defect source
                    frames = re.findall(r"([a-zA-Z0-9_\-\.\/\\]+\.py):(\d+):\s+in\s+([a-zA-Z0-9_]+)", block_body)
                    for f_name, f_line, f_sub in reversed(frames):
                        cleaned_f = f_name.replace("\\", "/")
                        if not ("test" in cleaned_f.lower() or "tests/" in cleaned_f):
                            src_file = cleaned_f
                            src_line = int(f_line)
                            break
                    if not src_file:
                        src_file = candidate_file
                        src_line = int(source_frame_match.group(2))

                test_details[test_func_name] = {
                    "source_file": src_file,
                    "source_line": src_line,
                    "block": block_body[:1000]
                }

        for line in lines:
            line_clean = line.strip()
            # Track passed tests
            if " PASSED" in line:
                passed_count += 1
            elif " FAILED" in line:
                failed_count += 1

            if line_clean.startswith("FAILED ") or line_clean.startswith("ERROR "):
                # e.g. FAILED tests/test_calc.py::test_divide_zero_guard - ZeroDivisionError: division by zero
                parts = line_clean.split(None, 2)
                target = parts[1] if len(parts) > 1 else ""
                reason = parts[2] if len(parts) > 2 else "Test assertion failed"

                file_part = target.split("::")[0] if "::" in target else target
                test_func = target.split("::")[1] if "::" in target else "unknown"
                
                # Determine target file: check if exception traceback pointed to source file
                detail = test_details.get(test_func, {})
                target_file = detail.get("source_file") or file_part
                line_no = detail.get("source_line") or 1

                # If still default, try finding line number of failing test in test file
                if line_no == 1:
                    try:
                        test_file_path = self.repo_dir / file_part
                        if test_file_path.exists():
                            fcontent = test_file_path.read_text(encoding="utf-8", errors="replace").splitlines()
                            for l_idx, l_str in enumerate(fcontent):
                                if f"def {test_func}" in l_str:
                                    line_no = l_idx + 1
                                    break
                    except Exception:
                        pass

                ctx = self._read_context_code(target_file, line_no)

                findings.append(Finding(
                    id=f"FIND-TEST-{len(findings) + 1:03d}",
                    category=FindingCategory.TEST_FAILURE,
                    severity=Severity.HIGH,
                    file_path=target_file.replace("\\", "/"),
                    line_number=line_no,
                    column=1,
                    rule_id="PYTEST_FAIL",
                    message=f"Test '{test_func}' failed: {reason}",
                    evidence_source=f"pytest execution output: {line_clean}",
                    command=self._cmd_to_str(cmd),
                    origin=FindingOrigin.OBSERVED,
                    context_code=ctx
                ))

        return findings, passed_count, failed_count
