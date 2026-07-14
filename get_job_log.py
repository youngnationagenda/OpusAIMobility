import urllib.request, urllib.error, urllib.parse, gzip

REPO    = "youngnationagenda/OpusAIMobility"
TOKEN   = "$GITHUB_TOKEN"
JOB_ID  = 86633540958
HEADS   = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deploy/1.0"
}

# GitHub returns a redirect to Azure Blob SAS URL — follow it without Authorization header
class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Return a new request WITHOUT the Authorization header for the Azure redirect
        new_req = urllib.request.Request(newurl)
        return new_req

opener = urllib.request.build_opener(NoRedirectHandler())

req = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/actions/jobs/{JOB_ID}/logs",
    headers=HEADS
)

try:
    with opener.open(req) as r:
        data = r.read()
        try:
            log = gzip.decompress(data).decode("utf-8", errors="replace")
        except Exception:
            log = data.decode("utf-8", errors="replace")

        lines = log.splitlines()
        print(f"Total log lines: {len(lines)}")

        # Key sections to look for
        keywords = ['apk', 'gradle', 'assemble', 'keystore', 'upload', 'release', 's3', 
                    'warning', 'error', 'sign', 'build', 'found', 'skip']
        apk_lines = [l for l in lines if any(kw in l.lower() for kw in keywords)]
        print(f"Relevant lines: {len(apk_lines)}")
        print("\n--- Relevant log lines ---")
        for line in apk_lines[-100:]:
            print(line)

except urllib.error.HTTPError as e:
    loc = e.headers.get("Location", "")
    if loc:
        print(f"Redirect to: {loc[:100]}")
        # Follow the redirect without auth
        req2 = urllib.request.Request(loc)
        with urllib.request.urlopen(req2) as r2:
            data = r2.read()
            try:
                log = gzip.decompress(data).decode("utf-8", errors="replace")
            except Exception:
                log = data.decode("utf-8", errors="replace")
            lines = log.splitlines()
            print(f"Total lines: {len(lines)}")
            keywords = ['apk', 'gradle', 'assemble', 'upload', 'release', 's3', 'warning', 'error', 'sign', 'found', 'skip']
            for line in lines:
                if any(kw in line.lower() for kw in keywords):
                    print(line)
    else:
        print(f"HTTP {e.code}: {e.read()[:300]}")
