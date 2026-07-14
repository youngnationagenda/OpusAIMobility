import urllib.request, json

REPO  = "youngnationagenda/OpusAIMobility"
TOKEN = "$GITHUB_TOKEN"
HEADS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy/1.0"
}

# all runs sorted newest first
req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/actions/runs?per_page=15",
    headers=HEADS
)
with urllib.request.urlopen(req) as r:
    runs = json.loads(r.read())["workflow_runs"]

print("All recent runs:")
for run in runs:
    ref  = run.get("head_branch") or ""
    sha  = run.get("head_sha","")[:10]
    name = run["name"][:45]
    evt  = run["event"]
    st   = run["status"]
    con  = run.get("conclusion") or "running"
    print(f"  #{run['run_number']:>4} [{evt:>17}] {name:<47} ref={ref:<25} {st}/{con}")
