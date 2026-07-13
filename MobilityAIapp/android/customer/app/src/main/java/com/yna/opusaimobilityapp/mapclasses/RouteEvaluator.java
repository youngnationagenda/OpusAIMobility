package com.yna.opusaimobilityapp.mapclasses;

import android.animation.TypeEvaluator;

import com.google.android.gms.maps.model.LatLng;


public class RouteEvaluator implements TypeEvaluator<LatLng> {

    double lat,lng;

    @Override
    public LatLng evaluate(float t, LatLng startPoint, LatLng endPoint) {

        if (startPoint != null && endPoint !=null){
            lat = startPoint.latitude + t * (endPoint.latitude - startPoint.latitude);
            lng = startPoint.longitude + t * (endPoint.longitude - startPoint.longitude);
        }

        return new LatLng(lat,lng);
    }

}
