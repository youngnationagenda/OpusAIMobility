with open('MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/mapclasses/MapWorker.java', encoding='utf-8') as f:
    lines = f.readlines()
print(f"Total lines: {len(lines)}")
for i in range(34, 50):
    if i < len(lines):
        print(f"  {i+1}: {lines[i].rstrip()}")
