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

    @classmethod
    def detect(cls, repo_dir: Path) -> Dict[str, Any]:
        manifests = []
        ecosystems = set()
        test_frameworks = []
        linters = []

        # Check manifests
        for fname, eco in cls.MANIFEST_MAP.items():
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

        # Fallback check by file extensions if no manifest
        if not ecosystems:
            if list(repo_dir.glob("**/*.py")):
                ecosystems.add("Python")
            if list(repo_dir.glob("**/*.ts")) or list(repo_dir.glob("**/*.js")):
                ecosystems.add("JavaScript/TypeScript")

        # Test framework detection
        has_python_tests = False
        for pattern in ["**/test_*.py", "**/*_test.py"]:
            if list(repo_dir.glob(pattern)):
                has_python_tests = True
                break
        if has_python_tests or (repo_dir / "tests").exists():
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
