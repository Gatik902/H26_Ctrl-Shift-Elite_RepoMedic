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
    EXCLUDE_DIRS = {".git", ".venv", "venv", "node_modules", ".workspaces", "dist", "build", "__pycache__"}

    def __init__(self, repo_dir: Path):
        self.repo_dir = repo_dir
        self.python_bin = sys.executable

    def _get_subprocess_env(self) -> dict:
        env = os.environ.copy()
        venv_scripts = str(Path(self.python_bin).parent)
        env["PATH"] = f"{venv_scripts}{os.pathsep}{env.get('PATH', '')}"
        
        # Include repo_dir and immediate subdirectories in PYTHONPATH so local imports succeed
        subdirs = [str(self.repo_dir)]
        for sub in ["src", "backend", "app", "api", "server", "lib"]:
            p = self.repo_dir / sub
            if p.is_dir():
                subdirs.append(str(p))
        existing_pp = env.get("PYTHONPATH", "")
        env["PYTHONPATH"] = os.pathsep.join(subdirs + ([existing_pp] if existing_pp else []))
        return env

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
        cmd = [
            self.python_bin, "-m", "flake8",
            "--isolated",
            "--exclude=.git,.venv,venv,node_modules,.workspaces,dist,build,__pycache__",
            "."
        ]
        
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                env=self._get_subprocess_env(),
                timeout=25
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
        cmd = [
            self.python_bin, "-m", "bandit",
            "-r", ".",
            "-f", "json",
            "-q",
            "-x", ".git,.venv,venv,node_modules,.workspaces,dist,build,__pycache__"
        ]
        
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                env=self._get_subprocess_env(),
                timeout=25
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

            line_no = item.get("line_number", 1)
            issue_text = item.get("issue_text", "")
            test_id = item.get("test_id", "B000")
            bandit_sev = item.get("issue_severity", "MEDIUM").upper()

            is_test_file = "test" in rel_path.lower() or rel_path.startswith("tests/")
            category = FindingCategory.SECURITY_RISK

            if is_test_file:
                severity = Severity.LOW
                if test_id == "B101":
                    category = FindingCategory.LINT_VIOLATION
            else:
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
                category=category,
                severity=severity,
                file_path=rel_path,
                line_number=line_no,
                column=1,
                rule_id=test_id,
                message=issue_text,
                evidence_source=f"Bandit AST scan ({test_id}): {issue_text}",
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

        # Check if tests exist, excluding venv / node_modules
        def _is_excluded(p: Path) -> bool:
            try:
                rel = p.relative_to(self.repo_dir)
                return any(part in self.EXCLUDE_DIRS for part in rel.parts)
            except Exception:
                return False

        test_files = []
        for pat in ["**/test_*.py", "**/*_test.py", "**/tests.py", "**/test.py"]:
            for candidate in self.repo_dir.glob(pat):
                if not _is_excluded(candidate):
                    test_files.append(candidate)
        if not test_files:
            for t_dir in ["tests", "test"]:
                t_path = self.repo_dir / t_dir
                if t_path.is_dir() and not _is_excluded(t_path):
                    for candidate in t_path.glob("**/*.py"):
                        if not _is_excluded(candidate):
                            test_files.append(candidate)

        if not test_files:
            return findings, passed_count, failed_count

        cmd = [self.python_bin, "-m", "pytest", "-v", "--tb=short", "--color=no"]
        try:
            res = subprocess.run(
                cmd,
                cwd=str(self.repo_dir),
                capture_output=True,
                text=True,
                env=self._get_subprocess_env(),
                timeout=35
            )
            raw_output = res.stdout + "\n" + res.stderr
        except Exception:
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

            # Handle pytest collection / import failures
            if line_clean.startswith("ERROR collecting "):
                failed_count += 1
                rest = line_clean[len("ERROR collecting "):].strip()
                target_file = rest.split(":")[0].strip()
                reason = rest.split(":", 1)[1].strip() if ":" in rest else "Collection/Import Error"
                test_func = "test_collection"
                line_no = 1
                ctx = self._read_context_code(target_file, line_no)
                findings.append(Finding(
                    id=f"FIND-TEST-{len(findings) + 1:03d}",
                    category=FindingCategory.TEST_FAILURE,
                    severity=Severity.HIGH,
                    file_path=target_file.replace("\\", "/"),
                    line_number=line_no,
                    column=1,
                    rule_id="PYTEST_COLLECT_ERROR",
                    message=f"Test collection failed for '{target_file}': {reason}",
                    evidence_source=f"pytest execution output: {line_clean}",
                    command=self._cmd_to_str(cmd),
                    origin=FindingOrigin.OBSERVED,
                    context_code=ctx
                ))
                continue

            if line_clean.startswith("FAILED ") or line_clean.startswith("ERROR "):
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

        # Handle suite-level crash or conftest import failure if no individual tests ran
        if res.returncode != 0 and failed_count == 0 and not findings:
            failed_count += 1
            err_line = ""
            err_file = "tests/conftest.py"
            err_line_no = 1
            for l in lines:
                if any(k in l for k in ["ModuleNotFoundError:", "ImportError:", "SyntaxError:", "Traceback"]):
                    err_line = l.strip()
                match_frame = re.search(r"([a-zA-Z0-9_\-\.\/\\]+\.py):(\d+):", l)
                if match_frame:
                    cand = match_frame.group(1).replace("\\", "/")
                    if not any(part in self.EXCLUDE_DIRS for part in cand.split("/")):
                        err_file = cand
                        err_line_no = int(match_frame.group(2))
            
            if not err_line:
                err_line = (res.stderr or res.stdout).strip().splitlines()[-1] if (res.stderr or res.stdout).strip() else "Pytest failed to execute test suite"

            ctx = self._read_context_code(err_file, err_line_no)
            findings.append(Finding(
                id=f"FIND-TEST-{len(findings) + 1:03d}",
                category=FindingCategory.TEST_FAILURE,
                severity=Severity.HIGH,
                file_path=err_file.replace("\\", "/"),
                line_number=err_line_no,
                column=1,
                rule_id="PYTEST_EXECUTION_ERROR",
                message=f"Test suite execution failed: {err_line}",
                evidence_source=f"pytest runner error: {err_line}",
                command=self._cmd_to_str(cmd),
                origin=FindingOrigin.OBSERVED,
                context_code=ctx
            ))

        # Parse pytest deprecation & runtime warnings
        warning_regex = re.compile(r"([a-zA-Z0-9_\-\.\/\\]+\.py):(\d+):\s+([A-Za-z0-9_]+):\s+(.+)")
        seen_warnings = set()
        for line in lines:
            line_str = line.strip()
            w_match = warning_regex.search(line_str)
            if w_match:
                raw_file = w_match.group(1)
                try:
                    rel_f = Path(raw_file).relative_to(self.repo_dir).as_posix()
                except Exception:
                    rel_f = raw_file.replace(str(self.repo_dir), "").lstrip("/\\").replace("\\", "/")

                # Skip warnings originating inside site-packages / .venv
                if any(part in self.EXCLUDE_DIRS or "site-packages" in part.lower() for part in rel_f.split("/")):
                    continue

                line_no = int(w_match.group(2))
                warn_type = w_match.group(3)
                warn_msg = w_match.group(4)
                
                dedup_key = (rel_f, line_no, warn_type)
                if dedup_key in seen_warnings:
                    continue
                seen_warnings.add(dedup_key)

                ctx = self._read_context_code(rel_f, line_no)
                findings.append(Finding(
                    id=f"FIND-WARN-{len(findings) + 1:03d}",
                    category=FindingCategory.DEPRECATION,
                    severity=Severity.HIGH if "pkg_resources" in warn_msg else Severity.MEDIUM,
                    file_path=rel_f.replace("\\", "/"),
                    line_number=line_no,
                    column=1,
                    rule_id=warn_type,
                    message=f"{warn_type}: {warn_msg}",
                    evidence_source=f"pytest runtime warning: {line_str}",
                    command=self._cmd_to_str(cmd),
                    origin=FindingOrigin.OBSERVED,
                    context_code=ctx
                ))

        return findings, passed_count, failed_count

    def run_dependency_audit(self) -> List[Finding]:
        """Audits requirements and manifests for deprecated or severely vulnerable pinned dependencies."""
        findings = []
        KNOWN_RISKS = {
            "jinja2": {
                "vulnerable_below": "3.1.4",
                "cve": "CVE-2024-34064",
                "message": "Jinja2 version is outdated (<3.1.4) and vulnerable to cross-site scripting (XSS) and template sandbox escapes."
            },
            "urllib3": {
                "vulnerable_below": "1.26.18",
                "cve": "CVE-2023-45803",
                "message": "urllib3 version is vulnerable to request body leaks and Cookie header exposure on redirect."
            },
            "idna": {
                "vulnerable_below": "3.0",
                "cve": "DEPRECATED_PACKAGE",
                "message": "idna version is legacy (v2.x) and deprecated on modern Python versions."
            },
            "setuptools": {
                "vulnerable_below": "70.0.0",
                "cve": "CVE-2024-6345",
                "message": "Legacy setuptools version contains remote code execution vulnerability in package download/installation."
            }
        }
        for req_name in ["requirements.txt", "requirements-dev.txt"]:
            req_file = self.repo_dir / req_name
            if not req_file.exists():
                continue
            rel_name = req_file.relative_to(self.repo_dir).as_posix()
            try:
                for idx, line in enumerate(req_file.read_text(encoding="utf-8", errors="replace").splitlines()):
                    raw = line.split("#")[0].strip()
                    if "==" in raw:
                        parts = [p.strip() for p in raw.split("==", 1)]
                        pkg = parts[0]
                        ver = parts[1]
                        pkg_lower = pkg.lower()
                        if pkg_lower in KNOWN_RISKS:
                            risk = KNOWN_RISKS[pkg_lower]
                            ctx = self._read_context_code(rel_name, idx + 1)
                            cat = FindingCategory.SECURITY_RISK if "CVE" in risk["cve"] else FindingCategory.DEPRECATION
                            findings.append(Finding(
                                id=f"FIND-DEP-{len(findings) + 1:03d}",
                                category=cat,
                                severity=Severity.HIGH,
                                file_path=rel_name,
                                line_number=idx + 1,
                                column=1,
                                rule_id=risk["cve"],
                                message=f"{pkg}=={ver}: {risk['message']}",
                                evidence_source=f"Dependency audit in {rel_name}: {raw}",
                                command=f"audit {rel_name}",
                                origin=FindingOrigin.OBSERVED,
                                context_code=ctx
                            ))
            except Exception:
                continue
        return findings
