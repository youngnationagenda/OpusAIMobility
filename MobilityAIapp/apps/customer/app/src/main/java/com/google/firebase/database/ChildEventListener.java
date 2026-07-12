package com.google.firebase.database;
/** Stub - Firebase Database ChildEventListener. */
public interface ChildEventListener {
    void onChildAdded(DataSnapshot snapshot, String previousChildName);
    void onChildChanged(DataSnapshot snapshot, String previousChildName);
    void onChildRemoved(DataSnapshot snapshot);
    void onChildMoved(DataSnapshot snapshot, String previousChildName);
    void onCancelled(DatabaseError error);
}
