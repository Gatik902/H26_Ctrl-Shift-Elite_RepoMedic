import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.endpoints import router

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="RepoMedic AI — Track 2 Maintenance Agent. Real automated repository triage, diagnosis, verified fix loop, and Dependency Exit Capsule generation."
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.version,
        "docs_url": "/docs",
        "api_health": "/api/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
