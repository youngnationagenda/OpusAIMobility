import os

# The problem: build.gradle has namespace "com.opusaimobility.customer"
# but ALL Java source files use package "com.terraai.aimobility"
# ViewBinding and R class are generated under the namespace.
# Fix: change namespace to match the Java source package.

path = 'MobilityAIapp/apps/customer/app/build.gradle'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old = 'namespace "com.opusaimobility.customer"'
new = 'namespace "com.terraai.aimobility"'

if old in content:
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed: namespace changed to "com.terraai.aimobility"')
    print('ViewBinding will now generate classes at com.terraai.aimobility.databinding.*')
    print('R class will be at com.terraai.aimobility.R')
    print('This matches all 226 Java source files.')
else:
    print(f'Namespace already correct or not found. Current content around namespace:')
    idx = content.find('namespace')
    if idx >= 0:
        print(f'  {content[idx:idx+60]}')
    else:
        print('  "namespace" not found in build.gradle!')

# Note: applicationId stays as "com.opusaimobility.customer" - that's fine.
# applicationId = Play Store identity (can differ from namespace)
# namespace = where generated code (R, ViewBinding) lives (must match source imports)

print('\nDone! Run:')
print('  git add -A')
print('  git commit -m "fix(android): set namespace to com.terraai.aimobility to match source code"')
print('  git push origin main')
