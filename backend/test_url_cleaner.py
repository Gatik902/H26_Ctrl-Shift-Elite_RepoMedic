import re
from urllib.parse import urlparse

def clean_github_url(url: str):
    url = url.strip().strip("'\"")
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if hostname.startswith("www."):
        hostname = hostname[4:]
    if hostname != "github.com":
        raise ValueError(f"Invalid host '{hostname}'. Only 'github.com' is allowed.")
    
    path = parsed.path.strip("/")
    parts = path.split("/")
    if len(parts) < 2:
        raise ValueError("URL must specify owner and repository name.")
    
    owner = parts[0]
    repo = parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    
    branch = None
    if len(parts) >= 4 and parts[2] in ["tree", "blob"]:
        branch = parts[3]
        
    canonical_url = f"https://github.com/{owner}/{repo}"
    return canonical_url, owner, repo, branch

test_urls = [
    "https://github.com/pallets/flask",
    "https://github.com/pallets/flask/",
    "github.com/pallets/flask",
    "http://github.com/pallets/flask.git",
    "https://www.github.com/pallets/flask",
    "https://github.com/pallets/flask/tree/main",
    "https://github.com/pallets/flask/blob/2.3.x/setup.py"
]

def test_clean_github_urls():
    for u in test_urls:
        canonical, owner, repo, branch = clean_github_url(u)
        assert canonical == "https://github.com/pallets/flask"
        assert owner == "pallets"
        assert repo == "flask"

def test_invalid_hosts():
    import pytest
    with pytest.raises(ValueError):
        clean_github_url("https://gitlab.com/pallets/flask")
    with pytest.raises(ValueError):
        clean_github_url("https://malicious.site/pallets/flask")

if __name__ == "__main__":
    for u in test_urls:
        print(u, "->", clean_github_url(u))
