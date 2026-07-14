package com.yna.opusaimobilityapp.model.rideModels;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;


public class Vehicle implements Serializable {

   @SerializedName("id")
   String id;

   @SerializedName("user_id")
   String userId;

   @SerializedName("driver_id")
   String driverId;

   @SerializedName("make")
   String make;

   @SerializedName("model")
   String model;

   @SerializedName("year")
   String year;

   @SerializedName("license_plate")
   String licensePlate;

   @SerializedName("color")
   String color;

   @SerializedName("ride_type_id")
   String rideTypeId;

   @SerializedName("image")
   String image;

   @SerializedName("lat")
   String lat;

   @SerializedName("lng")
   String lng;

   @SerializedName("online")
   String online;

   @SerializedName("updated")
   String updated;

   @SerializedName("created")
   String created;

   @SerializedName("RideType")
   RideType RideType;


    public void setId(String id) {
        this.id = id;
    }
    public String getId() {
        return id;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public String getUserId() {
        return userId;
    }
    
    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }
    public String getDriverId() {
        return driverId;
    }
    
    public void setMake(String make) {
        this.make = make;
    }
    public String getMake() {
        return make;
    }
    
    public void setModel(String model) {
        this.model = model;
    }
    public String getModel() {
        return model;
    }
    
    public void setYear(String year) {
        this.year = year;
    }
    public String getYear() {
        return year;
    }
    
    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }
    public String getLicensePlate() {
        return licensePlate;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
    public String getColor() {
        return color;
    }
    
    public void setRideTypeId(String rideTypeId) {
        this.rideTypeId = rideTypeId;
    }
    public String getRideTypeId() {
        return rideTypeId;
    }
    
    public void setImage(String image) {
        this.image = image;
    }
    public String getImage() {
        return image;
    }
    
    public void setLat(String lat) {
        this.lat = lat;
    }
    public String getLat() {
        return lat;
    }
    
    public void setLong(String lng) {
        this.lng = lng;
    }
    public String getLng() {
        return lng;
    }
    
    public void setOnline(String online) {
        this.online = online;
    }
    public String getOnline() {
        return online;
    }
    
    public void setUpdated(String updated) {
        this.updated = updated;
    }
    public String getUpdated() {
        return updated;
    }
    
    public void setCreated(String created) {
        this.created = created;
    }
    public String getCreated() {
        return created;
    }
    
    public void setRideType(RideType RideType) {
        this.RideType = RideType;
    }
    public RideType getRideType() {
        return RideType;
    }
    
}