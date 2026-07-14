"""Change iText7 in :pdf module from implementation to api so it's exposed to :app."""
path = "MobilityAIapp/apps/customer/pdf/build.gradle"
with open(path, 'rb') as f:
    content = f.read().decode('utf-8')

# Change implementation to api for itext7-core so :app can use it
old = "    implementation('com.itextpdf:itext7-core:7.2.3') {"
new = "    api('com.itextpdf:itext7-core:7.2.3') {"

if old in content:
    content = content.replace(old, new)
    print("Changed itext7-core from implementation to api")
else:
    # CRLF
    old_crlf = "    implementation('com.itextpdf:itext7-core:7.2.3') {\r\n"
    new_crlf = "    api('com.itextpdf:itext7-core:7.2.3') {\r\n"
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf)
        print("Changed (CRLF)")
    else:
        print("Pattern not found - showing itext lines:")
        for i, line in enumerate(content.split('\n'), 1):
            if 'itext' in line.lower():
                print(f"  {i}: {repr(line.rstrip())}")

with open(path, 'wb') as f:
    f.write(content.encode('utf-8'))

# Verify
with open(path) as f:
    for i, line in enumerate(f, 1):
        if 'itext' in line.lower():
            print(f"  pdf/build.gradle line {i}: {line.rstrip()}")
