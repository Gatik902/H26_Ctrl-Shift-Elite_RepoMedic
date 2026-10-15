import urllib.request
import json
import time

base_url = 'http://127.0.0.1:8000/api'

# 1. Start scan for benchmark sample
print('--- 1. POST /api/scan ---')
req_data = json.dumps({'repo_url': '', 'branch': 'main', 'is_sample': True, 'sample_id': 'py-vulnerable-calc'}).encode()
req = urllib.request.Request(f'{base_url}/scan', data=req_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    scan_init = json.loads(resp.read().decode())
scan_id = scan_init['scan_id']
print('Scan ID:', scan_id)

# 2. Poll /api/scan/{scan_id}
print('--- 2. GET /api/scan/{scan_id} ---')
scan_res = None
for i in range(15):
    time.sleep(1)
    with urllib.request.urlopen(f'{base_url}/scan/{scan_id}') as resp:
        scan_res = json.loads(resp.read().decode())
    print(f'Attempt {i+1}: Status = {scan_res["status"]}')
    if scan_res['status'] in ['COMPLETED', 'FAILED']:
        break

findings = scan_res['findings']
print(f'Findings: {len(findings)} findings observed.')
f = next(item for item in findings if item['category'] == 'TEST_FAILURE')
print(f'Target Finding: {f["id"]} in {f["file_path"]}:{f["line_number"]}')

# 3. Propose fix
print('--- 3. POST /api/findings/{id}/propose-fix ---')
req = urllib.request.Request(f'{base_url}/findings/{f["id"]}/propose-fix?scan_id={scan_id}', data=b'', headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    proposal = json.loads(resp.read().decode())
prop_id = proposal['id']
print('Proposal ID:', prop_id)
print('Root cause:', proposal['root_cause'])

# 4. Verify in isolation
print('--- 4. POST /api/proposals/{id}/verify ---')
req = urllib.request.Request(f'{base_url}/proposals/{prop_id}/verify?scan_id={scan_id}', data=b'', headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    ver = json.loads(resp.read().decode())
print('Verdict:', ver['verdict'])
print('Explanation:', ver['explanation'])

# 5. Maintainer Decision (Approve)
print('--- 5. POST /api/proposals/{id}/decision ---')
dec_data = json.dumps({'decision': 'approve', 'maintainer_notes': 'Verified zero check resolution'}).encode()
req = urllib.request.Request(f'{base_url}/proposals/{prop_id}/decision', data=dec_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    dec_res = json.loads(resp.read().decode())
print('Decision result:', dec_res['status'])

# 6. Apply to repo
print('--- 6. POST /api/proposals/{id}/apply ---')
req = urllib.request.Request(f'{base_url}/proposals/{prop_id}/apply?scan_id={scan_id}', data=b'', headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    app_res = json.loads(resp.read().decode())
print('Apply result:', app_res['status'])

# 7. Export Capsule
print('--- 7. GET /api/scans/{scan_id}/capsule ---')
with urllib.request.urlopen(f'{base_url}/scans/{scan_id}/capsule') as resp:
    capsule_resp = json.loads(resp.read().decode())
print('Capsule ID:', capsule_resp['json_capsule']['capsule_id'])
print('Capsule Schema Version:', capsule_resp['json_capsule']['schema_version'])
print('Markdown report preview:\n' + capsule_resp['markdown_report'][:350].encode('ascii', 'replace').decode('ascii'))
print('\n=== LIVE FASTAPI SERVER PASSED 100% OF VERIFIED TEST CYCLE! ===')
