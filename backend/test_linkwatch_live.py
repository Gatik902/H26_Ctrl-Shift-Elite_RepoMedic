import urllib.request
import json
import time

base_url = 'http://127.0.0.1:8000/api'
repo_url = 'https://github.com/rishrek/LinkWatch'

print(f'--- 1. POST /api/scan for {repo_url} ---')
req_data = json.dumps({'repo_url': repo_url, 'branch': 'main'}).encode()
req = urllib.request.Request(f'{base_url}/scan', data=req_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    scan_init = json.loads(resp.read().decode())
scan_id = scan_init['scan_id']
print('Scan ID:', scan_id)

print('--- 2. Polling /api/scan/{scan_id} ---')
scan_res = None
for i in range(35):
    time.sleep(2)
    with urllib.request.urlopen(f'{base_url}/scan/{scan_id}') as resp:
        scan_res = json.loads(resp.read().decode())
    print(f'Attempt {i+1}: Status = {scan_res["status"]}')
    if scan_res['status'] in ['COMPLETED', 'FAILED']:
        break

if scan_res['status'] == 'FAILED':
    print('Scan failed with error:', scan_res.get('error_message'))
else:
    summary = scan_res['summary']
    print(f"Summary: Total={summary['total_findings']}, Errors={summary['errors_count']}, Warnings={summary['warnings_count']}, PassedChecks={summary['passed_checks_count']}, Tests={summary['tests_passed']}/{summary['tests_found']}")
    print(f"Detected Ecosystems: {scan_res.get('detected_ecosystems')}")
    print(f"Detected Manifests: {scan_res.get('detected_manifests')}")
    findings = scan_res['findings']
    print(f"Total findings count: {len(findings)}")
    for idx, f in enumerate(findings[:20]):
        print(f"[{idx+1}] ID={f['id']} | Cat={f['category']} | Sev={f['severity']} | File={f['file_path']}:{f['line_number']} | Rule={f['rule_id']} | Msg={f['message'][:80]}")
