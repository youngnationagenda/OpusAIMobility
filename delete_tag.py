import urllib.request, urllib.error

REPO  = "youngnationagenda/OpusAIMobility"
TOKEN = "$GITHUB_TOKEN"
HEADS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy/1.0"
}

req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/git/refs/tags/v1.0.0",
    headers=HEADS, method="DELETE"
)
try:
    with urllib.request.urlopen(req) as r:
        print(f"Deleted remote tag v1.0.0: HTTP {r.status}")
except urllib.error.HTTPError as e:
    body = e.read()
    print(f"HTTP {e.code}: {body[:200]}")
