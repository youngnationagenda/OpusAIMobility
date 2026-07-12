package com.google.maps;
import com.google.maps.model.DirectionsResult;
import com.google.maps.model.TravelMode;
import com.google.maps.model.TrafficModel;
/** Stub for com.google.maps:google-maps-services DirectionsApi. */
public class DirectionsApi {
    public static DirectionsApiRequest newRequest(GeoApiContext ctx) {
        return new DirectionsApiRequest();
    }
    public static class DirectionsApiRequest {
        public DirectionsApiRequest origin(String origin) { return this; }
        public DirectionsApiRequest destination(String destination) { return this; }
        public DirectionsApiRequest mode(TravelMode mode) { return this; }
        public DirectionsApiRequest trafficModel(TrafficModel model) { return this; }
        public DirectionsResult await() { return new DirectionsResult(); }
    }
}
