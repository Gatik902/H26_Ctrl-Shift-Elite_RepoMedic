from pathlib import Path
from typing import List, Tuple
from app.models.schemas import Finding, ScanSummary, Severity, FindingCategory
from app.services.detector import ProjectDetector
from app.services.analyzers.python_analyzer import PythonAnalyzer

class FindingNormalizer:
    @staticmethod
    def analyze_repository(repo_dir: Path) -> Tuple[List[Finding], ScanSummary, List[str], List[str]]:
        detection = ProjectDetector.detect(repo_dir)
        ecosystems = detection["ecosystems"]
        manifests = detection["manifests"]
        
        all_findings: List[Finding] = []
        tests_passed = 0
        tests_failed = 0
        
        # If Python ecosystem detected
        if "Python" in ecosystems:
            py_analyzer = PythonAnalyzer(repo_dir)
            
            # 1. Run flake8 (syntax and lint)
            flake_findings = py_analyzer.run_flake8()
            all_findings.extend(flake_findings)
            
            # 2. Run bandit (AST security check)
            sec_findings = py_analyzer.run_bandit()
            all_findings.extend(sec_findings)
            
            # 3. Discover and execute tests
            test_findings, p_cnt, f_cnt = py_analyzer.run_tests()
            all_findings.extend(test_findings)
            tests_passed += p_cnt
            tests_failed += f_cnt

            # 4. Audit dependencies
            dep_findings = py_analyzer.run_dependency_audit()
            all_findings.extend(dep_findings)
            
        # 5. Check JSON syntax for configuration/manifest files across repository
        import json
        exclude_dirs = {".git", ".venv", "venv", "node_modules", ".workspaces", "dist", "build", "__pycache__"}
        for json_file in repo_dir.glob("**/*.json"):
            try:
                rel = json_file.relative_to(repo_dir)
                if any(part in exclude_dirs for part in rel.parts):
                    continue
                try:
                    with open(json_file, "r", encoding="utf-8") as f:
                        json.load(f)
                except json.JSONDecodeError as jde:
                    rel_path = rel.as_posix()
                    all_findings.append(Finding(
                        id=f"FIND-JSON-{len(all_findings) + 1:03d}",
                        category=FindingCategory.SYNTAX_ERROR,
                        severity=Severity.HIGH,
                        file_path=rel_path,
                        line_number=jde.lineno,
                        column=jde.colno,
                        rule_id="JSON_SYNTAX_ERROR",
                        message=f"JSON syntax error: {jde.msg}",
                        evidence_source=f"JSON parser error: {jde}",
                        command=f"python -m json.tool {rel_path}",
                        origin=FindingOrigin.OBSERVED,
                        context_code=""
                    ))
            except Exception:
                continue

        # Normalize IDs sequentially
        severity_order = {
            Severity.CRITICAL: 0,
            Severity.HIGH: 1,
            Severity.MEDIUM: 2,
            Severity.LOW: 3,
            Severity.INFO: 4,
        }
        all_findings.sort(key=lambda f: (severity_order.get(f.severity, 5), f.file_path or "", f.line_number or 0))

        for idx, finding in enumerate(all_findings):
            prefix = "FIND"
            if finding.category == FindingCategory.TEST_FAILURE:
                prefix = "TEST"
            elif finding.category == FindingCategory.SECURITY_RISK:
                prefix = "SEC"
            elif finding.category == FindingCategory.SYNTAX_ERROR:
                prefix = "SYN"
            elif finding.category == FindingCategory.LINT_VIOLATION:
                prefix = "LINT"
            elif finding.category == FindingCategory.DEPRECATION:
                prefix = "DEP"
            finding.id = f"{prefix}-{idx + 1:03d}"

        # Calculate summary counts
        errors = sum(1 for f in all_findings if f.severity in [Severity.CRITICAL, Severity.HIGH])
        warnings = sum(1 for f in all_findings if f.severity in [Severity.MEDIUM, Severity.LOW, Severity.INFO])
        security_count = sum(1 for f in all_findings if f.category == FindingCategory.SECURITY_RISK)
        
        summary = ScanSummary(
            total_findings=len(all_findings),
            errors_count=errors,
            warnings_count=warnings,
            passed_checks_count=tests_passed + (0 if errors > 0 else 1),
            tests_found=tests_passed + tests_failed,
            tests_passed=tests_passed,
            tests_failed=tests_failed,
            security_issues=security_count,
        )

        return all_findings, summary, ecosystems, manifests
