import urllib.request, json

REPO    = "youngnationagenda/OpusAIMobility"
TOKEN   = "$GITHUB_TOKEN"
HEADS   = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json",
           "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "deploy/1.0"}

req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5", headers=HEADS)
with urllib.request.urlopen(req) as r:
    runs = json.loads(r.read())["workflow_runs"]
RUN_ID = next(r["id"] for r in runs if r["name"]=="Deploy" and r.get("head_branch")=="v1.0.0")
print(f"Checking run id:{RUN_ID}")

req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/actions/runs/{RUN_ID}/jobs", headers=HEADS)
with urllib.request.urlopen(req) as r:
    jobs = json.loads(r.read())["jobs"]

for job in jobs:
    if "release" in job["name"].lower():
        print(f"Job: {job['name']} -> {job['status']}/{job.get('conclusion')}")
        for step in job.get("steps", []):
            icon = "OK  " if step.get("conclusion") == "success" else (
                   "SKIP" if step.get("conclusion") == "skipped" else
                   "FAIL" if step.get("conclusion") == "failure" else "    ")
            print(f"  [{icon}] {step['name']}")
        ann_req = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/check-runs/{job['id']}/annotations",
            headers=HEADS)
        try:
            with urllib.request.urlopen(ann_req) as r:
                anns = json.loads(r.read())
            if anns:
                print(f"\nAnnotations ({len(anns)}):")
                for a in anns:
                    print(f"  [{a['annotation_level']}] {a.get('message','')[:200]}")
            else:
                print("\nNo annotations - CLEAN BUILD!")
        except Exception as e:
            print(f"Annotations err: {e}")
