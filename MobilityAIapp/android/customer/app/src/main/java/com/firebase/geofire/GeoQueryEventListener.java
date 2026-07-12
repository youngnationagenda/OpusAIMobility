package com.firebase.geofire;
/** Stub for Firebase GeoQueryEventListener. */
public interface GeoQueryEventListener {
    void onKeyEntered(String key, GeoLocation location);
    void onKeyExited(String key);
    void onKeyMoved(String key, GeoLocation location);
    void onGeoQueryReady();
    void onGeoQueryError(Exception error);
}
