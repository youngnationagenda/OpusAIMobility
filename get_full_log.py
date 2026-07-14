import urllib.request, json, gzip, http.client, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

REPO    = "youngnationagenda/OpusAIMobility"
TOKEN   = "$GITHUB_TOKEN"
HEADS   = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
           "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "deploy/1.0"}

req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5", headers=HEADS)
with urllib.request.urlopen(req) as r:
    runs = json.loads(r.read())["workflow_runs"]
RUN_ID = next(r["id"] for r in runs if r["name"]=="Deploy" and r.get("head_branch")=="v1.0.0")
req = urllib.request.Request(f"https://api.github.com/repos/{REPO}/actions/runs/{RUN_ID}/jobs", headers=HEADS)
with urllib.request.urlopen(req) as r:
    jobs = json.loads(r.read())["jobs"]
job_id = next(j["id"] for j in jobs if "release" in j["name"].lower())

conn = http.client.HTTPSConnection("api.github.com")
conn.request("GET", f"/repos/{REPO}/actions/jobs/{job_id}/logs", headers=HEADS)
resp = conn.getresponse()
sas_url = resp.getheader("Location")
with urllib.request.urlopen(sas_url) as r:
    data = r.read()
try: log = gzip.decompress(data).decode("utf-8", errors="replace")
except: log = data.decode("utf-8", errors="replace")

lines = log.splitlines()
print(f"Total: {len(lines)} lines (run {RUN_ID})")

# Print all java error lines
print("\n=== JAVA ERRORS ===")
count = 0
for i, line in enumerate(lines):
    if '.java:' in line and 'error:' in line.lower():
        safe = ''.join(c if ord(c)<128 else f'<{ord(c):04X}>' for c in line)
        print(safe.strip())
        count += 1
        if count >= 40:
            print("... truncated")
            break

if count == 0:
    for i, line in enumerate(lines):
        if 'FAILED' in line or 'BUILD FAILED' in line:
            for l in lines[max(0,i-5):min(len(lines),i+25)]:
                safe = ''.join(c if ord(c)<128 else f'<{ord(c):04X}>' for c in l)
                print(safe)
            break
