from pathlib import Path
from typing import List, Dict, Any

class ProjectDetector:
    MANIFEST_MAP = {
        "requirements.txt": "Python (Pip)",
        "pyproject.toml": "Python (PEP 518/621 / Poetry / Flit)",
        "setup.py": "Python (Setuptools)",
        "Pipfile": "Python (Pipenv)",
        "package.json": "JavaScript / TypeScript (Node.js)",
        "tsconfig.json": "TypeScript",
        "Cargo.toml": "Rust (Cargo)",
        "go.mod": "Go",
        "pom.xml": "Java (Maven)",
        "build.gradle": "Java / Kotlin (Gradle)",
    }

    TEST_PATTERNS = [
        "tests", "test", "spec", "tests.py", "test_*.py", "*_test.py"
    ]

    EXCLUDE_DIRS = {".git", ".venv", "venv", "node_modules", ".workspaces", "dist", "build", "__pycache__"}

    @classmethod
    def _is_excluded(cls, path: Path, base_dir: Path) -> bool:
        try:
            rel = path.relative_to(base_dir)
            return any(part in cls.EXCLUDE_DIRS for part in rel.parts)
        except Exception:
            return False

    @classmethod
    def detect(cls, repo_dir: Path) -> Dict[str, Any]:
        manifests = []
        ecosystems = set()
        test_frameworks = []
        
        linters = []

        # Check manifests at root and subdirectories (up to 2 levels)
        for fname, eco in cls.MANIFEST_MAP.items():
            # Check root
            if (repo_dir / fname).exists():
                manifests.append(fname)
                if "Python" in eco:
                    ecosystems.add("Python")
                elif "JavaScript" in eco or "TypeScript" in eco:
                    ecosystems.add("JavaScript/TypeScript")
                elif "Rust" in eco:
                    ecosystems.add("Rust")
                elif "Go" in eco:
                    ecosystems.add("Go")

            # Check immediate subdirectories (e.g. backend/requirements.txt, server/package.json)
            for sub_manifest in repo_dir.glob(f"*/{fname}"):
                if not cls._is_excluded(sub_manifest, repo_dir):
                    rel_name = sub_manifest.relative_to(repo_dir).as_posix()
                    if rel_name not in manifests:
                        manifests.append(rel_name)
                    if "Python" in eco:
                        ecosystems.add("Python")
                    elif "JavaScript" in eco or "TypeScript" in eco:
                        ecosystems.add("JavaScript/TypeScript")

        # Always inspect source files (never gate behind 'if not ecosystems:')
        # Check Python files
        has_py_files = False
        for p in repo_dir.glob("**/*.py"):
            if not cls._is_excluded(p, repo_dir):
                has_py_files = True
                ecosystems.add("Python")
                break

        # Check JS/TS files
        for p in list(repo_dir.glob("**/*.js"))[:10] + list(repo_dir.glob("**/*.ts"))[:10]:
            if not cls._is_excluded(p, repo_dir):
                ecosystems.add("JavaScript/TypeScript")
                break

        # Test framework detection
        has_python_tests = False
        test_patterns = ["**/test_*.py", "**/*_test.py", "**/tests.py", "**/test.py"]
        for pattern in test_patterns:
            for candidate in repo_dir.glob(pattern):
                if not cls._is_excluded(candidate, repo_dir):
                    has_python_tests = True
                    break
            if has_python_tests:
                break

        # Check test directories
        if not has_python_tests:
            for t_dir in ["tests", "test"]:
                t_path = repo_dir / t_dir
                if t_path.is_dir() and not cls._is_excluded(t_path, repo_dir):
                    # verify it has python files
                    if any(not cls._is_excluded(f, repo_dir) for f in t_path.glob("**/*.py")):
                        has_python_tests = True
                        break

        if has_python_tests:
            test_frameworks.append("pytest / unittest")

        # Linting / static tools available
        if "Python" in ecosystems:
            linters.extend(["flake8", "bandit (AST security)", "ruff"])
        if "JavaScript/TypeScript" in ecosystems:
            linters.extend(["eslint", "npm-audit"])

        return {
            "ecosystems": sorted(list(ecosystems)),
            "manifests": sorted(manifests),
            "test_frameworks": test_frameworks,
            "linters": linters,
        }
