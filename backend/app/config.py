import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


BASE_DIR = Path(__file__).resolve().parent.parent
WORKSPACE_STORAGE = Path(os.getenv("REPOMEDIC_WORKSPACE", str(BASE_DIR / ".workspaces")))
WORKSPACE_STORAGE.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    app_name: str = "RepoMedic AI"
    version: str = "1.0.0"
    api_prefix: str = "/api"
    # Storage
    workspaces_dir: Path = WORKSPACE_STORAGE
    max_repo_size_mb: int = int(os.getenv("MAX_REPO_SIZE_MB", "50"))
    execution_timeout_sec: int = int(os.getenv("EXECUTION_TIMEOUT_SEC", "30"))
    
    # Model configuration
    # Supported: "groq", "together", "huggingface", "ollama", "openrouter", "openai", "auto"
    model_provider: str = os.getenv("MODEL_PROVIDER", "auto")
    model_endpoint: str = os.getenv("MODEL_ENDPOINT", "https://api.groq.com/openai/v1")
    model_id: str = os.getenv("MODEL_ID", "meta-llama/Llama-3.3-70B-Instruct")
    model_api_key: str = os.getenv("MODEL_API_KEY", os.getenv("GROQ_API_KEY", os.getenv("OPENAI_API_KEY", "")))
    
    # Strict SSRF & Security
    allowed_schemes: list[str] = ["https", "http"]
    allowed_host: str = "github.com"
    
settings = Settings()
