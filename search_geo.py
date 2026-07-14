import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

terms = ['geoFire', 'GeoQueryEventListener', 'geoObject', 'mGetReference', 'rootRef']

for root, dirs, files in os.walk('MobilityAIapp/apps/customer/app/src'):
    for f in files:
        if not f.endswith('.java'):
            continue
        fpath = os.path.join(root, f)
        with open(fpath, 'rb') as fp:
            content = fp.read().decode('utf-8', errors='replace')
        matches = [(i+1, line) for i, line in enumerate(content.split('\n')) 
                   if any(t in line for t in terms) and not line.strip().startswith('//')]
        if matches:
            short = fpath.split('aimobility/')[-1]
            print(f"=== {short} ===")
            for lineno, line in matches[:10]:
                safe = ''.join(c if ord(c)<128 else f'<{ord(c):04X}>' for c in line)
                print(f"  {lineno}: {safe.rstrip()[:120]}")
            print()
