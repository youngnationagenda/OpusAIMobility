package com.google.firebase.database;
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
