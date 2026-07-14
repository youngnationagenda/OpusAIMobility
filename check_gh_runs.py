import urllib.request, json

REPO  = "youngnationagenda/OpusAIMobility"
TOKEN = "$GITHUB_TOKEN"
HEADS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy/1.0"
}

req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5",
    headers=HEADS
)
with urllib.request.urlopen(req) as r:
    d = json.loads(r.read())

runs = d.get("workflow_runs", [])
print(f"Latest {len(runs)} workflow runs:")
for run in runs:
    print()
    print(f"  #{run['run_number']} [{run['event']}] {run['name']}")
    print(f"    Status : {run['status']} / {run['conclusion'] or 'running'}")
    print(f"    Ref    : {run['head_branch']} | SHA: {run['head_sha'][:12]}")
    print(f"    URL    : {run['html_url']}")
