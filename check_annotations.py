import urllib.request, json, urllib.error

REPO    = "youngnationagenda/OpusAIMobility"
TOKEN   = "$GITHUB_TOKEN"
RUN_ID  = 29186706523
HEADS   = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy/1.0"
}

# Get check runs for this workflow run
req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/actions/runs/{RUN_ID}/jobs",
    headers=HEADS
)
with urllib.request.urlopen(req) as r:
    jobs = json.loads(r.read())["jobs"]

for job in jobs:
    if "release" in job["name"].lower():
        job_id = job["id"]
        # Get annotations (warnings/errors) for this job
        ann_req = urllib.request.Request(
            f"https://api.github.com/repos/{REPO}/check-runs/{job_id}/annotations",
            headers=HEADS
        )
        try:
            with urllib.request.urlopen(ann_req) as r:
                annotations = json.loads(r.read())
                print(f"Annotations for job {job_id}: {len(annotations)}")
                for ann in annotations:
                    print(f"  [{ann['annotation_level']}] {ann.get('message','')[:200]}")
        except urllib.error.HTTPError as e:
            print(f"Annotations HTTP {e.code}: {e.read()[:200]}")
