package com.terraai.aimobility.model;

import com.google.android.gms.maps.model.LatLng;

import java.io.Serializable;

public class ConfirmLocationModel implements Serializable {
    public String title;
    public String additionalInfo;
    public double lat, lng;
    public String placeId;
    public String id;
    public String isLiked;
}
