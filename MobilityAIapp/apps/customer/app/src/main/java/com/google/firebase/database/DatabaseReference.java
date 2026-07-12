package com.google.firebase.database;
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
