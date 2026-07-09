import shutil, os, sys

src = r'D:\omnisonietest\OpusAIMobility\omniride'
dst = r'D:\omnisonietest\OpusAIMobility_git'

dirs  = ['src', 'aws', 'packages', 'tests', 'apps', 'infra', 'scripts', 'public', 'server']
files = ['package.json', 'tsconfig.json', 'vite.config.ts', 'vitest.config.ts', 'metadata.json']

count = 0
errors = 0

for d in dirs:
    s = os.path.join(src, d)
    t = os.path.join(dst, d)
    if not os.path.exists(s):
        print(f'[SKIP] {d} — not found')
        continue
    try:
        if os.path.exists(t):
            shutil.rmtree(t)
        shutil.copytree(s, t, ignore=shutil.ignore_patterns('*.zip', 'node_modules', '.git', '__pycache__'))
        count += 1
        print(f'[OK] {d}')
    except Exception as e:
        print(f'[ERR] {d}: {e}')
        errors += 1

for f in files:
    s = os.path.join(src, f)
    t = os.path.join(dst, f)
    if not os.path.exists(s):
        continue
    try:
        shutil.copy2(s, t)
        count += 1
        print(f'[OK] {f}')
    except Exception as e:
        print(f'[ERR] {f}: {e}')
        errors += 1

# Also copy .github/workflows from omniride
wf_src = os.path.join(src, '.github', 'workflows')
wf_dst = os.path.join(dst, '.github', 'workflows')
if os.path.exists(wf_src):
    os.makedirs(wf_dst, exist_ok=True)
    for wf in os.listdir(wf_src):
        try:
            shutil.copy2(os.path.join(wf_src, wf), os.path.join(wf_dst, wf))
            print(f'[OK] .github/workflows/{wf}')
            count += 1
        except Exception as e:
            print(f'[ERR] .github/workflows/{wf}: {e}')

print(f'\nResult: {count} copied, {errors} errors')

# Verify key new files
checks = [
    'src/services/wsService.ts',
    'src/services/syncService.ts',
    'src/services/pwaService.ts',
    'tests/migration/defi-settlement.property.test.ts',
    'tests/routing/i18n.property.test.ts',
    'packages/common/src/i18n.ts',
    'public/sw.js',
    'apps/customer/app/src/main/java/com/terraai/aimobility/aws/LocationWebSocketService.java',
]
print('\nKey file verification:')
for c in checks:
    p = os.path.join(dst, c)
    print(f'  {"[+]" if os.path.exists(p) else "[!] MISSING"} {c}')
