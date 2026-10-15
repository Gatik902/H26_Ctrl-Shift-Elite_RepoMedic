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
    def validate_repo_url(url: str) -> Tuple[str, str]:
        """
        Validates GitHub URL to prevent SSRF, credential stuffing, loopback, or local file access.
        Returns (owner, repo_name).
        """
        if not url:
            raise SecurityError("Repository URL cannot be empty.")
            
        parsed = urlparse(url)
        if parsed.scheme not in settings.allowed_schemes:
            raise SecurityError(f"Invalid scheme '{parsed.scheme}'. Only https/http allowed.")
            
        if parsed.hostname != settings.allowed_host:
            raise SecurityError(f"Host '{parsed.hostname}' is not permitted. Only 'github.com' is allowed.")
            
        if parsed.username or parsed.password:
            raise SecurityError("Embedded credentials in URL are prohibited for security.")
            
        match = GITHUB_URL_REGEX.match(url)
        if not match:
            raise SecurityError("URL must match format https://github.com/owner/repository")
            
        owner, repo = match.group(1), match.group(2)
        if repo.endswith(".git"):
            repo = repo[:-4]
            
        return owner, repo

    @staticmethod
    def clone_repository(repo_url: str, branch: Optional[str] = None) -> Tuple[Path, str, str]:
        """
        Clones a repository into a fresh workspace directory with timeout and limits.
        Returns (repo_dir, commit_hash, branch_name).
        """
        owner, repo_name = RepoManager.validate_repo_url(repo_url)
        workspace_id = f"scan_{uuid.uuid4().hex[:10]}"
        workspace_dir = settings.workspaces_dir / workspace_id
        workspace_dir.mkdir(parents=True, exist_ok=True)
        
        target_dir = workspace_dir / repo_name
        
        cmd = ["git", "clone", "--depth", "1"]
        if branch:
            cmd.extend(["-b", branch])
        cmd.extend([repo_url, str(target_dir)])
        
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=settings.execution_timeout_sec,
                check=True
            )
        except subprocess.TimeoutExpired:
            shutil.rmtree(workspace_dir, ignore_errors=True)
            raise TimeoutError(f"Cloning {repo_url} timed out after {settings.execution_timeout_sec}s")
        except subprocess.CalledProcessError as e:
            shutil.rmtree(workspace_dir, ignore_errors=True)
            raise RuntimeError(f"Git clone failed: {e.stderr.strip() or e.stdout.strip()}")

        # Extract commit hash
        commit_res = subprocess.run(
            ["git", "-C", str(target_dir), "rev-parse", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5
        )
        commit_hash = commit_res.stdout.strip() or "unknown"
        
        # Extract branch
        branch_res = subprocess.run(
            ["git", "-C", str(target_dir), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True,
            text=True,
            timeout=5
        )
        branch_name = branch_res.stdout.strip() or branch or "main"
        
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
