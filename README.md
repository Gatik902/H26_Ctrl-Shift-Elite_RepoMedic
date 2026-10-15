# 🩺 RepoMedic AI — Track 2 Maintenance Agent

**RepoMedic AI** is an automated repository triage, diagnosis, verified fix, and dependency exit agent built for the Hackathon 2026 (Track 2: Maintenance Agent).

It accepts any public GitHub repository URL, detects real code-quality issues and failing tests, uses open-weight AI models to propose targeted fixes, verifies proposed changes in an isolated sandbox environment, and generates a reusable, versioned **Dependency Exit Capsule**.

---

## 🌟 The Primary Innovation: The Verified Fix Loop

Every displayed finding and test result comes from actual repository execution records and AST analyzers—never fabricated.

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
│  - Static analysis (flake8 / ruff)   │
│  - Security scan (Bandit AST)        │
│  - Test execution (pytest / unittest)│
│  - Normalized stable finding IDs     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│        Verified Fix Loop             │
│  1. Baseline run recording           │
│  2. Open-Weight Model Fix Proposal   │
│     (Llama 3.3 / Qwen 2.5 / Engine)  │
│  3. Patch validation & path bounds   │
│  4. Isolated Sandbox Verification    │
│  5. Maintainer Review & Approval     │
│  6. Working Tree Application         │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│      Dependency Exit Capsule         │
│  - Validated JSON (Schema 1.0.0)     │
│  - Maintainer Markdown Report        │
│  - Differential Verification Proof   │
│  - Non-destructive Rollback Guidance │
└──────────────────────────────────────┘
```

---

## 🚀 Key Features

1. **Real Issue Detection**:
   - Executes real static analysis (`flake8`), AST security audits (`bandit`), and test suites (`pytest`).
   - Normalizes findings with stable IDs (`TEST-001`, `SEC-002`, `LINT-003`), exact file/line pointers, and captured traceback evidence.
   - Distinguishes observed diagnostics from inferred side effects.

2. **Open-Weight AI Model Integration**:
   - Configurable via standard environment variables: `MODEL_PROVIDER`, `MODEL_ENDPOINT`, `MODEL_ID`, and `MODEL_API_KEY`.
   - Default configured model: `meta-llama/Llama-3.3-70B-Instruct` / `Qwen/Qwen2.5-Coder-32B-Instruct` (Llama 3.3 Community License / Apache 2.0).
   - **Truthful Fallback Engine**: If no API key is provided, the deterministic repair engine executes with guaranteed reproducibility, explicitly documenting that deterministic rules were used.

3. **Isolated Sandbox Verification**:
   - Disposable workspace created at known commit hash.
   - Patch applied strictly in the sandbox ward.
   - Baseline check vs Sandbox check differential outcome recorded (`PASS`, `FAIL`, `INCONCLUSIVE`).
   - Original repository working tree remains completely untouched during verification.

4. **Maintainer Governance**:
   - Proposals, verifications, approvals, and applications are tracked as distinct states.
   - No patch is applied until explicitly APPROVED by the maintainer with optional audit notes.

5. **Dependency Exit Capsule**:
   - Exportable in validated **JSON (Schema 1.0.0)** and **Markdown**.
   - Contains complete provenance, baseline vs patched command outputs, exit codes, risk indicators, and rollback commands (`git checkout <commit> -- .`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Python 3.10+, FastAPI, Uvicorn, Pydantic v2, HTTPX
- **Analyzers**: Pytest, Flake8, Bandit AST scanner, GitPython / Subprocess

---

## 🏃 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the FastAPI Backend
```bash
cd svv-hackathon/backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at `http://127.0.0.1:8000/docs`.

### 2. Start the React Vite Frontend
```bash
cd svv-hackathon/frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Testing the 1-Click Benchmark: `py-vulnerable-calc`

RepoMedic AI includes an authentic benchmark target repository (`sample-repos/py-vulnerable-calc`) containing:
- Failing zero-division guard in `tests/test_calc.py` (`ZeroDivisionError`)
- AST security risk `B101` (assert in production code) in `calc.py`
- Unused imports `F401` in `calc.py`
- Deprecated dependency `urllib3<1.26.0` in `requirements.txt`

### Verification Workflow in the UI:
1. Click **`py-vulnerable-calc`** in the Quick Benchmark bar.
2. Click **Start Diagnosis**.
3. View the triage summary cards and diagnostics list.
4. Click finding **`TEST-001`** (`test_divide_zero_guard`).
5. Click **Propose Minimal Surgical Fix** to see the root cause and unified diff.
6. Click **Run Sandbox Verification** — observe the differential exit code comparison:
   - **Baseline Exit**: `1` (FAIL)
   - **Patched Sandbox Exit**: `0` (PASS)
   - **Verdict**: `FIX VERIFIED (PASS)`
7. Click **Approve Fix Proposal**.
8. Click **Apply Verified Fix to Working Tree**.
9. In the top navbar, click **Export Exit Capsule** to download JSON or Markdown.

---

## 🛡️ Security Guarantees
- **SSRF Prevention**: Scheme enforcement (http/https only) and hostname restriction (`github.com`). Local file schemes and private IP ranges are rejected.
- **Path Traversal Defense**: All target file operations are resolved and validated against the workspace root.
- **Sandbox Isolation**: Verifications run in temporary directories that are cleaned up automatically.
- **No Rogue Pushes**: RepoMedic AI does not automatically push commits or open unauthorized pull requests.
