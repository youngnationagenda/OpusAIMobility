package com.google.firebase.database;
/** Stub - Firebase Database ValueEventListener. */
public interface ValueEventListener {
    void onDataChange(DataSnapshot snapshot);
    void onCancelled(DatabaseError error);
}
