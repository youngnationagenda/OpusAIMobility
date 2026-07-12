package com.google.firebase.database;
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
