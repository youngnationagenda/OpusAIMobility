package com.firebase.geofire;
/** Stub for Firebase GeoFire. Driver location is handled via AWS Lambda /getNearbyDrivers. */
public class GeoFire {
    public GeoFire(Object ref) {}
    public GeoQuery queryAtLocation(GeoLocation center, double radius) { return new GeoQuery(); }
    public void setLocation(String key, GeoLocation location) {}
    public void removeLocation(String key) {}
}
