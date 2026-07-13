package com.yna.opusaimobilityapp.model;

import com.google.android.gms.maps.model.LatLng;

import java.io.Serializable;

public class NearbyModelClass implements Serializable {

    public String title;
    public String address;
    public LatLng latLng;
    public double lat, lng;
    public String placeId;
    public String id;
    public String isLiked;
    public String flat;
    public String buildingName;
    public String addressLabel;
    public String additonalAddressInformation;
    public String addInstruction;
    public boolean isEditable;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LatLng getLatLng() {
        return latLng;
    }

    public void setLatLng(LatLng latLng) {
        this.latLng = latLng;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLng() {
        return lng;
    }

    public void setLng(double lng) {
        this.lng = lng;
    }

    public String getPlaceId() {
        return placeId;
    }

    public void setPlaceId(String placeId) {
        this.placeId = placeId;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIsLiked() {
        return isLiked;
    }

    public void setIsLiked(String isLiked) {
        this.isLiked = isLiked;
    }

    public String getFlat() {
        return flat;
    }

    public void setFlat(String flat) {
        this.flat = flat;
    }

    public String getBuildingName() {
        return buildingName;
    }

    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }

    public String getAddressLabel() {
        return addressLabel;
    }

    public void setAddressLabel(String addressLabel) {
        this.addressLabel = addressLabel;
    }

    public String getAdditonalAddressInformation() {
        return additonalAddressInformation;
    }

    public void setAdditonalAddressInformation(String additonalAddressInformation) {
        this.additonalAddressInformation = additonalAddressInformation;
    }

    public String getAddInstruction() {
        return addInstruction;
    }

    public void setAddInstruction(String addInstruction) {
        this.addInstruction = addInstruction;
    }

    public boolean isEditable() {
        return isEditable;
    }

    public void setEditable(boolean editable) {
        isEditable = editable;
    }

}
