import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

fpath = "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/userschat/ChatA.java"
with open(fpath, 'rb') as f:
    lines = f.read().decode('utf-8', errors='replace').split('\n')
print(f"ChatA.java total lines: {len(lines)}")
print("First 50 lines:")
for i in range(min(50, len(lines))):
    safe = ''.join(c if ord(c)<128 else f'<{ord(c):04X}>' for c in lines[i])
    print(f"  {i+1}: {safe.rstrip()}")
