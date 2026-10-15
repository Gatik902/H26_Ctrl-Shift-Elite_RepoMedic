import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Tuple, Optional
from urllib.parse import urlparse
import uuid

from app.config import settings

GITHUB_URL_REGEX = re.compile(
    r"^https://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+?)(?:\.git)?/?$"
)

class SecurityError(Exception):
    pass

class RepoManager:
    @staticmethod
    def validate_repo_url(url: str) -> Tuple[str, str, str, Optional[str]]:
        """
        Validates and normalizes any GitHub URL variant to prevent SSRF while
        supporting tree/blob links, www prefixes, owner/repo shorthand, and SSH formats.
        Returns (canonical_url, owner, repo_name, extracted_branch).
        """
        if not url or not url.strip():
            raise SecurityError("Repository URL cannot be empty.")
            
        clean_url = url.strip().strip("'\"<>")

        # Support SSH style clone strings: git@github.com:owner/repo.git or ssh://git@github.com/owner/repo.git
        if clean_url.startswith("git@github.com:") or clean_url.startswith("ssh://git@github.com/"):
            clean_url = re.sub(r"^(ssh://)?git@github\.com[:/]", "https://github.com/", clean_url)

        # Support convenient owner/repo shorthand (e.g. "psf/requests", "pallets/click", "octocat/Hello-World")
        if re.match(r"^[a-zA-Z0-9_\-\.]+/[a-zA-Z0-9_\-\.]+$", clean_url):
            clean_url = f"https://github.com/{clean_url}"

        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            clean_url = "https://" + clean_url
            
        parsed = urlparse(clean_url)
        if parsed.scheme not in settings.allowed_schemes:
            raise SecurityError(f"Invalid scheme '{parsed.scheme}'. Only https/http allowed.")
            
        hostname = (parsed.hostname or "").lower()
        if hostname.startswith("www."):
            hostname = hostname[4:]
            
        if hostname != settings.allowed_host:
            raise SecurityError(
                f"Host '{hostname}' is not permitted. Only public GitHub repositories "
                "(e.g. 'https://github.com/owner/repo' or 'owner/repo') are allowed."
            )
            
        if parsed.username or parsed.password:
            raise SecurityError("Embedded credentials in URL are prohibited for security.")
            
        path = parsed.path.strip("/")
        parts = [p for p in path.split("/") if p]
        if len(parts) < 2:
            raise SecurityError("URL must specify both owner and repository name (e.g. https://github.com/owner/repo or owner/repo).")
            
        owner = parts[0]
        repo_name = parts[1]
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
            
        extracted_branch = None
        if len(parts) >= 4:
            if parts[2] == "tree":
                # Branch may contain slashes (e.g. feature/my-branch)
                extracted_branch = "/".join(parts[3:])
            elif parts[2] == "blob":
                # First part after blob is branch, remaining are file paths
                extracted_branch = parts[3]
            
        canonical_url = f"https://github.com/{owner}/{repo_name}"
        return canonical_url, owner, repo_name, extracted_branch

    @staticmethod
    def clone_repository(repo_url: str, branch: Optional[str] = None) -> Tuple[Path, str, str]:
        """
        Clones a repository into a fresh workspace directory with timeout,
        longpaths support, and automatic branch fallback.
        Returns (repo_dir, commit_hash, branch_name).
        """
        canonical_url, owner, repo_name, extracted_branch = RepoManager.validate_repo_url(repo_url)
        target_branch = branch if (branch and branch.strip()) else extracted_branch
        
        workspace_id = f"scan_{uuid.uuid4().hex[:10]}"
        workspace_dir = settings.workspaces_dir / workspace_id
        workspace_dir.mkdir(parents=True, exist_ok=True)
        
        target_dir = workspace_dir / repo_name
        
        # Git clone environment: prevent interactive credential prompts
        clone_env = os.environ.copy()
        clone_env["GIT_TERMINAL_PROMPT"] = "0"
        
        # Attempt 1: Clone with specified branch if present
        def run_clone(use_branch: Optional[str]):
            cmd = ["git", "-c", "core.longpaths=true", "clone", "--depth", "1"]
            if use_branch and use_branch.lower() not in ["main", "master", "default"]:
                cmd.extend(["-b", use_branch])
            cmd.extend([canonical_url, str(target_dir)])
            return subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                env=clone_env,
                timeout=90
            )

        try:
            res = run_clone(target_branch)
            # If clone with branch failed and a branch was requested, retry with default branch
            if res.returncode != 0 and target_branch:
                err_check = (res.stderr or res.stdout).lower()
                # If not definitively an auth failure or nonexistent repo, retry default branch
                if "could not read username" not in err_check and "repository not found" not in err_check:
                    if target_dir.exists():
                        shutil.rmtree(target_dir, ignore_errors=True)
                    res = run_clone(None)
                
            if res.returncode != 0:
                err_text = (res.stderr or res.stdout).strip()
                if "Authentication failed" in err_text or "could not read Username" in err_text:
                    raise RuntimeError(f"Repository not found or private. Please ensure '{canonical_url}' is public on GitHub.")
                elif "Repository not found" in err_text:
                    raise RuntimeError(f"Repository '{canonical_url}' does not exist on GitHub.")
                else:
                    raise RuntimeError(f"Git clone failed: {err_text}")
        except subprocess.TimeoutExpired:
            shutil.rmtree(workspace_dir, ignore_errors=True)
            raise TimeoutError(f"Cloning {canonical_url} timed out after 90 seconds. The repository may be too large or network slow.")
        except Exception as e:
            shutil.rmtree(workspace_dir, ignore_errors=True)
            raise

        # Extract commit hash
        commit_res = subprocess.run(
            ["git", "-C", str(target_dir), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=10
        )
        commit_hash = commit_res.stdout.strip()

        # Check if cloned repository is empty (no commits or no tracked source files)
        has_files = any(p.name != ".git" for p in target_dir.iterdir())
        if commit_res.returncode != 0 or not has_files or not commit_hash:
            shutil.rmtree(workspace_dir, ignore_errors=True)
            raise RuntimeError(
                f"Repository '{canonical_url}' is completely empty on GitHub (no commits or files were found). "
                "Please push your project code to GitHub before analyzing, or test using the pre-loaded Benchmark Sample."
            )
        
        # Extract branch name
        branch_res = subprocess.run(
            ["git", "-C", str(target_dir), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=10
        )
        branch_name = branch_res.stdout.strip() or target_branch or "main"
        
        return target_dir, commit_hash, branch_name

    @staticmethod
    def create_isolated_copy(source_repo_dir: Path, proposal_id: str) -> Path:
        """
        Creates an isolated disposable directory for sandbox verification.
        Does NOT modify the original repository.
        """
        isolated_dir = settings.workspaces_dir / f"verify_{proposal_id}_{uuid.uuid4().hex[:6]}"
        shutil.copytree(source_repo_dir, isolated_dir, symlinks=False, dirs_exist_ok=True)
        return isolated_dir

    @staticmethod
    def cleanup_workspace(path: Path) -> None:
        """Cleans up a workspace directory."""
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)

    @staticmethod
    def validate_safe_relative_path(base_dir: Path, rel_path: str) -> Path:
        """
        Ensures rel_path does not escape base_dir (prevents directory traversal attacks).
        """
        # Normalize and resolve
        resolved_base = base_dir.resolve()
        target_path = (base_dir / rel_path).resolve()
        
        if not str(target_path).startswith(str(resolved_base)):
            raise SecurityError(f"Path traversal detected: {rel_path} attempts to escape workspace.")
            
        return target_path
