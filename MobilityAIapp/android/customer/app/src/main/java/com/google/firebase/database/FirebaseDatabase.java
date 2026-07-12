package com.google.firebase.database;
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
