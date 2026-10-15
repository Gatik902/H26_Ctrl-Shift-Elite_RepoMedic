import urllib.request
import json
import time

base_url = 'http://127.0.0.1:8000/api'

# 1. Start scan for isolated-test-fixture
print('--- 1. POST /api/scan for isolated-test-fixture ---')
req_data = json.dumps({'repo_url': '', 'branch': 'main', 'is_sample': True, 'sample_id': 'isolated-test-fixture'}).encode()
req = urllib.request.Request(f'{base_url}/scan', data=req_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    scan_init = json.loads(resp.read().decode())
scan_id = scan_init['scan_id']
print('Scan ID:', scan_id)

# 2. Poll /api/scan/{scan_id}
print('--- 2. GET /api/scan/{scan_id} ---')
scan_res = None
for i in range(20):
    time.sleep(1)
    with urllib.request.urlopen(f'{base_url}/scan/{scan_id}') as resp:
        scan_res = json.loads(resp.read().decode())
    print(f'Attempt {i+1}: Status = {scan_res["status"]}')
    if scan_res['status'] in ['COMPLETED', 'FAILED']:
        break

print('Ecosystems detected:', scan_res.get('detected_ecosystems'))
print('Manifests detected:', scan_res.get('detected_manifests'))
summary = scan_res['summary']
print(f"Summary: Total={summary['total_findings']}, Errors={summary['errors_count']}, Warnings={summary['warnings_count']}, PassedChecks={summary['passed_checks_count']}, Tests={summary['tests_passed']}/{summary['tests_found']}")

findings = scan_res['findings']
print(f'Findings count: {len(findings)}')
for idx, f in enumerate(findings):
    print(f"[{idx+1}] ID={f['id']} | Cat={f['category']} | Sev={f['severity']} | File={f['file_path']}:{f['line_number']} | Rule={f['rule_id']} | Msg={f['message']}")
