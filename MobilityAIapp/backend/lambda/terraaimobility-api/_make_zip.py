"""
Build terraaimobility-api-v5.zip for Lambda deployment
Uses Python's built-in zipfile - no external dependencies
"""
import zipfile
import os
import sys

src_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(src_dir, '..', '..', '..', 'aws', 'lambda', 'terraaimobility-api-v5.zip')
out_path = os.path.normpath(out_path)

print(f"Source: {src_dir}")
print(f"Output: {out_path}")

# Core JS files to include
core_files = [
    'index.js', 'db.js', 'auth.js', 'mailer.js', 'storage.js',
    'sms.js', 'maps.js', 'notify.js', 'admin-handler.js', 'admin-index.js',
    'seed-config.js', 'package.json'
]

# Check all core files exist
missing = []
for f in core_files:
    fp = os.path.join(src_dir, f)
    if not os.path.exists(fp):
        missing.append(f)
        print(f"  MISSING: {f}")
    else:
        print(f"  OK: {f}")

if missing:
    print(f"\nERROR: Missing files: {missing}")
    sys.exit(1)

print(f"\nCreating zip: {out_path}")

nm_dir = os.path.join(src_dir, 'node_modules')

# Dev-only packages to exclude (archiver and its deps)
exclude_packages = {
    'archiver', 'archiver-utils', 'lazystream', 'zip-stream', 
    'async', 'buffer-crc32', 'tar-stream', 'crc32-stream',
    'readable-stream', 'normalize-path', 'glob', 'lodash.defaults',
    'lodash.flatten', 'lodash.isplainobject', 'lodash.union',
    'lodash.without'
}

written = 0
with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    # Add core JS files
    for f in core_files:
        fp = os.path.join(src_dir, f)
        zf.write(fp, f)
        written += 1
    
    # Add node_modules
    for root, dirs, files in os.walk(nm_dir):
        # Skip dev-only packages
        rel_root = os.path.relpath(root, nm_dir)
        top_pkg = rel_root.split(os.sep)[0].lstrip('@')
        if top_pkg.split(os.sep)[0] in exclude_packages:
            continue
        
        for file in files:
            full_path = os.path.join(root, file)
            arc_name = 'node_modules/' + os.path.relpath(full_path, nm_dir).replace(os.sep, '/')
            zf.write(full_path, arc_name)
            written += 1
            if written % 1000 == 0:
                size_mb = os.path.getsize(out_path) / 1024 / 1024
                print(f"  {written} files written, {size_mb:.1f} MB so far...")

size_mb = os.path.getsize(out_path) / 1024 / 1024
print(f"\nDone! {written} files, {size_mb:.2f} MB -> {out_path}")
