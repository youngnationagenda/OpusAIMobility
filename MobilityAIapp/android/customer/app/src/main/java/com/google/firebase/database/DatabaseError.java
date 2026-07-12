package com.google.firebase.database;
/** Stub - Firebase DatabaseError. */
public class DatabaseError {
    public String getMessage() { return "Firebase stub - using AWS"; }
    public int getCode() { return 0; }
    public Exception toException() { return new Exception(getMessage()); }
}
