package com.google.maps;
/** Stub for com.google.maps:google-maps-services GeoApiContext. */
public class GeoApiContext {
    public static class Builder {
        public Builder apiKey(String key) { return this; }
        public GeoApiContext build() { return new GeoApiContext(); }
        public Builder queryRateLimit(int limit) { return this; }
        public Builder connectTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
        public Builder readTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
        public Builder writeTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
        public Builder retryTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
    }
    public void shutdown() {}
}
