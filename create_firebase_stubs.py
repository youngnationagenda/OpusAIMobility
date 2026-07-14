"""Create Firebase Database stubs for AWS-migrated code that still references Firebase types."""
import os

BASE = "MobilityAIapp/apps/customer/app/src/main/java/"

def w(path, content):
    full = BASE + path
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  {path}")

stubs = {}

# GeoFire + GeoQuery stubs
stubs["com/firebase/geofire/GeoFire.java"] = """package com.firebase.geofire;
/** Stub for Firebase GeoFire. Driver location is handled via AWS Lambda /getNearbyDrivers. */
public class GeoFire {
    public GeoFire(Object ref) {}
    public GeoQuery queryAtLocation(GeoLocation center, double radius) { return new GeoQuery(); }
    public void setLocation(String key, GeoLocation location) {}
    public void removeLocation(String key) {}
}
"""

stubs["com/firebase/geofire/GeoQuery.java"] = """package com.firebase.geofire;
/** Stub for Firebase GeoQuery. */
public class GeoQuery {
    public void addGeoQueryEventListener(GeoQueryEventListener listener) {}
    public void removeAllListeners() {}
    public void setCenter(GeoLocation center) {}
    public void setRadius(double radius) {}
}
"""

stubs["com/firebase/geofire/GeoLocation.java"] = """package com.firebase.geofire;
/** Stub for Firebase GeoLocation. */
public class GeoLocation {
    public final double latitude;
    public final double longitude;
    public GeoLocation(double lat, double lng) { latitude = lat; longitude = lng; }
}
"""

stubs["com/firebase/geofire/GeoQueryEventListener.java"] = """package com.firebase.geofire;
/** Stub for Firebase GeoQueryEventListener. */
public interface GeoQueryEventListener {
    void onKeyEntered(String key, GeoLocation location);
    void onKeyExited(String key);
    void onKeyMoved(String key, GeoLocation location);
    void onGeoQueryReady();
    void onGeoQueryError(Exception error);
}
"""

# Firebase Database stubs - for rootRef.child(), mGetReference etc.
stubs["com/google/firebase/database/DatabaseReference.java"] = """package com.google.firebase.database;
/** Stub - Firebase Database is replaced by AWS DynamoDB + Lambda. */
public class DatabaseReference {
    public DatabaseReference child(String path) { return this; }
    public void addValueEventListener(ValueEventListener listener) {}
    public void removeEventListener(ValueEventListener listener) {}
    public void addChildEventListener(ChildEventListener listener) {}
    public void removeEventListener(ChildEventListener listener) {}
    public void setValue(Object value) {}
    public void setValue(Object value, Object priority) {}
    public DatabaseReference push() { return this; }
    public void removeValue() {}
    public Query orderByChild(String child) { return new Query(); }
    public Query orderByKey() { return new Query(); }
    public Query limitToLast(int limit) { return new Query(); }
    public Query limitToFirst(int limit) { return new Query(); }
    public String getKey() { return ""; }
}
"""

stubs["com/google/firebase/database/Query.java"] = """package com.google.firebase.database;
/** Stub - Firebase Database Query. */
public class Query {
    public void addValueEventListener(ValueEventListener listener) {}
    public void removeEventListener(ValueEventListener listener) {}
    public void addChildEventListener(ChildEventListener listener) {}
    public void removeEventListener(ChildEventListener listener) {}
    public Query addListenerForSingleValueEvent(ValueEventListener listener) { return this; }
    public Query orderByChild(String child) { return this; }
    public Query limitToLast(int limit) { return this; }
    public Query limitToFirst(int limit) { return this; }
    public Query startAt(Object value) { return this; }
    public Query endAt(Object value) { return this; }
    public DatabaseReference getRef() { return new DatabaseReference(); }
}
"""

stubs["com/google/firebase/database/ValueEventListener.java"] = """package com.google.firebase.database;
/** Stub - Firebase Database ValueEventListener. */
public interface ValueEventListener {
    void onDataChange(DataSnapshot snapshot);
    void onCancelled(DatabaseError error);
}
"""

stubs["com/google/firebase/database/ChildEventListener.java"] = """package com.google.firebase.database;
/** Stub - Firebase Database ChildEventListener. */
public interface ChildEventListener {
    void onChildAdded(DataSnapshot snapshot, String previousChildName);
    void onChildChanged(DataSnapshot snapshot, String previousChildName);
    void onChildRemoved(DataSnapshot snapshot);
    void onChildMoved(DataSnapshot snapshot, String previousChildName);
    void onCancelled(DatabaseError error);
}
"""

stubs["com/google/firebase/database/DataSnapshot.java"] = """package com.google.firebase.database;
/** Stub - Firebase DataSnapshot. */
public class DataSnapshot {
    public boolean exists() { return false; }
    public Object getValue() { return null; }
    public <T> T getValue(Class<T> cls) { return null; }
    public String getKey() { return ""; }
    public Iterable<DataSnapshot> getChildren() { return java.util.Collections.emptyList(); }
    public DataSnapshot child(String path) { return this; }
    public boolean hasChild(String path) { return false; }
}
"""

stubs["com/google/firebase/database/DatabaseError.java"] = """package com.google.firebase.database;
/** Stub - Firebase DatabaseError. */
public class DatabaseError {
    public String getMessage() { return "Firebase stub - using AWS"; }
    public int getCode() { return 0; }
    public Exception toException() { return new Exception(getMessage()); }
}
"""

stubs["com/google/firebase/database/FirebaseDatabase.java"] = """package com.google.firebase.database;
/** Stub - Firebase Database is replaced by AWS DynamoDB + Lambda. */
public class FirebaseDatabase {
    private static FirebaseDatabase instance;
    public static FirebaseDatabase getInstance() {
        if (instance == null) instance = new FirebaseDatabase();
        return instance;
    }
    public DatabaseReference getReference() { return new DatabaseReference(); }
    public DatabaseReference getReference(String path) { return new DatabaseReference(); }
    public DatabaseReference getReferenceFromUrl(String url) { return new DatabaseReference(); }
}
"""

print("Creating Firebase stubs...")
for path, content in stubs.items():
    w(path, content)
print(f"Created {len(stubs)} stubs")
