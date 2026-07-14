import urllib.request, json, time

REPO  = "youngnationagenda/OpusAIMobility"
TOKEN = "$GITHUB_TOKEN"
HEADS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy/1.0"
}

def gh_get(path):
    req = urllib.request.Request(f"https://api.github.com{path}", headers=HEADS)
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

# Find the latest v1.0.0 Deploy run
runs = gh_get(f"/repos/{REPO}/actions/runs?per_page=10")["workflow_runs"]
run_id = None
for run in runs:
    if run["name"] == "Deploy" and run.get("head_branch") == "v1.0.0":
        run_id  = run["id"]
        run_num = run["run_number"]
        run_url = run["html_url"]
        break

if not run_id:
    print("No Deploy run found for v1.0.0")
    exit(1)

print(f"Watching Deploy run #{run_num} (id:{run_id}) for v1.0.0")
print(f"URL: {run_url}")

STATUS_ICON = {"success": "PASS", "failure": "FAIL", "skipped": "SKIP",
               "cancelled": "CNCL", None: "    "}

for attempt in range(40):
    jobs_data = gh_get(f"/repos/{REPO}/actions/runs/{run_id}/jobs")
    jobs = jobs_data["jobs"]

    all_done = True
    print(f"\n--- Poll {attempt+1:>2} ---")
    for job in jobs:
        st  = job["status"]
        con = job.get("conclusion")
        if st == "in_progress":
            icon = "...."
            all_done = False
        elif st == "queued":
            icon = "WAIT"
            all_done = False
        else:
            icon = STATUS_ICON.get(con, "    ")
        print(f"  [{icon}] {job['name'][:65]}")

    if all_done:
        run_info = gh_get(f"/repos/{REPO}/actions/runs/{run_id}")
        print(f"\nRun #{run_num} FINAL: {run_info['status']} / {run_info.get('conclusion','?')}")
        print(f"URL: {run_url}")
        break

    time.sleep(30)
