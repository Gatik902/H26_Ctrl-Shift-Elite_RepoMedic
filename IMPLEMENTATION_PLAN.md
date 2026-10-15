# RepoMedic AI — Implementation Plan & Architecture Specification
**Track 2 Maintenance Agent | Hackathon 2026**

## 1. Executive Summary & Architecture Overview
**RepoMedic AI** is an automated repository triage, diagnosis, verified fix, and dependency exit agent designed to solve code quality, test failures, and dependency deprecation risks in public GitHub repositories.

```
       [ Public GitHub Repo URL ]
                   │
                   ▼
┌──────────────────────────────────────┐
│        RepoMedic Ingestion           │
│  - SSRF-safe git clone / checkout    │
│  - Toolchain & manifest detection    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        Diagnostic Engine             │
│  - Static analysis (ruff, flake8)    │
│  - Security scan (bandit, audit)     │
│  - Test execution (pytest, unittest) │
│  - Finding normalization             │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        Verified Fix Loop             │
│  1. Baseline run recording           │
│  2. Open-Weight Model Fix Proposal   │
│     (DeepSeek-R1 / Qwen2.5-Coder /   │
│      Llama-3.3 / Deterministic engine)
│  3. Patch validation & path bounds   │
│  4. Isolated Sandbox Verification    │
│  5. Maintainer Review & Approval     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Dependency Exit Capsule         │
│  - Versioned JSON Schema             │
│  - Maintainer Markdown Report        │
│  - Verification Proof & Rollback     │
└──────────────────────────────────────┘
```

## 2. Directory Structure in `svv-hackathon`

```
svv-hackathon/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                     # FastAPI entry point & routers
│   │   ├── config.py                   # Environment & model settings
│   │   ├── models/
│   │   │   ├── schemas.py              # Pydantic models for findings, fixes, capsules
│   │   │   └── capsule.py              # Dependency Exit Capsule schemas
│   │   ├── services/
│   │   │   ├── repo_manager.py         # Secure clone, worktree & security isolation
│   │   │   ├── detector.py             # Language, manifest & toolchain detection
│   │   │   ├── analyzers/
│   │   │   │   ├── base.py
│   │   │   │   ├── python_analyzer.py  # Ruff, Flake8, Bandit, Pip-audit, Pytest
│   │   │   │   └── js_analyzer.py      # ESLint, npm audit, Vitest/Jest
│   │   │   ├── normalizer.py           # Stable ID & schema normalization
│   │   │   ├── model_provider.py       # Open-weight AI integration & fallback
│   │   │   ├── patch_verifier.py       # Isolated worktree verification & diff engine
│   │   │   └── capsule_generator.py    # Exit capsule JSON/Markdown compiler
│   │   └── api/
│   │       ├── health.py
│   │       ├── scan.py
│   │       ├── findings.py
│   │       ├── proposals.py
│   │       └── capsules.py
│   ├── requirements.txt
│   └── tests/
├── frontend/                           # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── RepoInput.tsx           # GitHub URL input + sample benchmarks
│   │   │   ├── ScanProgress.tsx        # Real-time inspection timeline
│   │   │   ├── SummaryCards.tsx        # Vitals & triage counts
│   │   │   ├── FindingsList.tsx        # Filterable issue list with badges
│   │   │   ├── FindingDetailModal.tsx  # Deep dive + diagnostics
│   │   │   ├── DiffViewer.tsx          # Split / unified before-and-after diff
│   │   │   ├── VerificationResult.tsx  # Baseline vs fix execution comparison
│   │   │   ├── ApprovalControls.tsx    # Maintainer Approve / Reject / Apply actions
│   │   │   └── CapsuleViewer.tsx       # JSON & Markdown export with copy/download
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── sample-repos/                       # Real test target repositories with real bugs
│   ├── py-vulnerable-calc/             # Python repo with failing tests & lint issues
│   └── ts-legacy-parser/               # Node/TS repo with deprecated patterns
└── README.md                           # Hackathon documentation & demo instructions
```

## 3. Step-by-Step Implementation Strategy

1. **Backend Foundation & Security Validation**:
   - Setup Python environment with FastAPI, uvicorn, pydantic, gitpython, unidiff.
   - Implement strict URL validation (prevent SSRF, scheme enforcement, local file denial).
   - Implement temporary workspace lifecycle with automatic cleanup.

2. **Analyzer & Test Discovery Pipeline**:
   - Support Python toolchain (ruff/flake8, bandit/security, pytest/test runner).
   - Detect manifests (`requirements.txt`, `pyproject.toml`, `setup.py`, `package.json`).
   - Run real tools and parse structured findings with stable IDs and evidence traces.

3. **Open-Weight AI Integration**:
   - Support open-weight models (`Qwen/Qwen2.5-Coder-32B-Instruct`, `meta-llama/Llama-3.3-70B-Instruct`, `mistralai/Mistral-7B-Instruct-v0.3`) via standard OpenAI-compatible endpoints (Groq, Together, HuggingFace Inference API, Ollama).
   - Implement deterministic fallback engine when API keys are absent, clearly stating whether AI was used or deterministic rules were used.

4. **The Verified Fix Loop**:
   - Baseline execution: Run test/lint in the original clean repository commit and record exit codes/output.
   - Patch Generation: Generate minimal, syntax-checked diff.
   - Isolated Verification: Clone or create isolated disposable directory, apply patch with bounds checks, run the exact same tests/lint, capture new exit codes.
   - Result Comparison: Baseline FAIL -> Proposed PASS = Verified Fix. Pre-existing vs regression detection.

5. **Dependency Exit Capsule**:
   - JSON export complying with versioned schema (`schema_version: "1.0.0"`).
   - Human-readable Markdown export with maintainer checklist and rollback instructions.

6. **Frontend Dashboard**:
   - High-fidelity React + Vite + Tailwind CSS interface.
   - Real-time polling/SSE for scan progress.
   - Syntax-highlighted diff viewer, verification comparison table, approval state transitions.

7. **End-to-End Verification**:
   - Verify on sample repositories with actual tests and real diagnostic failures.
   - Test approval flow and exit capsule export.
