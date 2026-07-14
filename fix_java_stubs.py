"""Force-add Firebase imports - properly check for active (uncommented) imports."""
import os, re

files = [
    "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/ride/bookride/RideOrRentFragment.java",
    "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/ride/bookride/StartRideFragment.java",
    "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/ride/activeride/ActiveRideA.java",
    "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/userschat/ChatA.java",
    "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/food/TrackFoodActivity.java",
    "MobilityAIapp/apps/customer/app/src/main/java/com/terraai/aimobility/parcel/fragmentandactivities/TrackParcelActivity.java",
]

NEW_IMPORTS = [
    "import com.google.firebase.database.DatabaseReference;",
    "import com.google.firebase.database.ValueEventListener;",
    "import com.google.firebase.database.ChildEventListener;",
    "import com.google.firebase.database.DataSnapshot;",
    "import com.google.firebase.database.DatabaseError;",
    "import com.google.firebase.database.FirebaseDatabase;",
    "import com.google.firebase.database.Query;",
    "import com.firebase.geofire.GeoFire;",
    "import com.firebase.geofire.GeoQuery;",
    "import com.firebase.geofire.GeoLocation;",
    "import com.firebase.geofire.GeoQueryEventListener;",
]

for fpath in files:
    with open(fpath, 'rb') as f:
        content = f.read().decode('utf-8', errors='replace')
    
    lines = content.split('\n')
    
    # Find which imports are NOT in active (non-commented) import statements
    active_imports = set()
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('import ') and not stripped.startswith('// '):
            active_imports.add(stripped.rstrip(';') + ';')
    
    missing = [imp for imp in NEW_IMPORTS if imp not in active_imports]
    
    if not missing:
        short = fpath.split('aimobility/')[-1]
        print(f"All active: {short}")
        continue
    
    # Find insertion point: after last active import
    last_import_idx = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith('import ') and not stripped.startswith('// '):
            last_import_idx = i
    
    # Insert missing imports one by one
    insert_block = '\n'.join(missing)
    lines.insert(last_import_idx + 1, insert_block)
    new_content = '\n'.join(lines)
    
    with open(fpath, 'wb') as f:
        f.write(new_content.encode('utf-8'))
    
    short = fpath.split('aimobility/')[-1]
    print(f"Added {len(missing)} imports to: {short}")
    for imp in missing:
        print(f"  + {imp}")
