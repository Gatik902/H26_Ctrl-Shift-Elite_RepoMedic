from pathlib import Path
from app.services.detector import ProjectDetector
from app.services.normalizer import FindingNormalizer

# Test on ws_svv if present
ws_dirs = list(Path('d:/KJSSE HACKATHON/svv-hackathon/backend/.workspaces').glob('scan_*/svv-hackathon'))
if ws_dirs:
    target_repo = ws_dirs[0]
    print('Testing on monorepo / polyglot workspace:', target_repo)
    print('Exists:', target_repo.exists())
    if target_repo.exists():
        print('Contents:', list(target_repo.iterdir()))
    detection = ProjectDetector.detect(target_repo)
    print('Ecosystems detected:', detection['ecosystems'])
    print('Manifests detected:', detection['manifests'])
    findings, summary, eco, man = FindingNormalizer.analyze_repository(target_repo)
    print(f'Results: Total findings={len(findings)}, Errors={summary.errors_count}, Warnings={summary.warnings_count}, Tests={summary.tests_passed}/{summary.tests_found}')
    for f in findings[:5]:
        print(f" - {f.id}: [{f.category}] {f.file_path}:{f.line_number} -> {f.message}")
else:
    print('No ws_svv directory found to test.')
