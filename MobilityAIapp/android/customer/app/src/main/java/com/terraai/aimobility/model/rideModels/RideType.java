package com.terraai.aimobility.model.rideModels;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;


public class RideType implements Serializable {

   @SerializedName("id")
   String id;

   @SerializedName("name")
   String name;

   @SerializedName("description")
   String description;

   @SerializedName("ride_section_id")
   String rideSectionId;

   @SerializedName("passenger_capacity")
   String passengerCapacity;

   @SerializedName("base_fare")
   String baseFare;

   @SerializedName("cost_per_minute")
   String costPerMinute;

   @SerializedName("cost_per_distance")
   String costPerDistance;

   @SerializedName("distance_unit")
   String distanceUnit;

   @SerializedName("image")
   String image;

   @SerializedName("language_id")
   String languageId;

   @SerializedName("created")
   String created;


    public void setId(String id) {
        this.id = id;
    }
    public String getId() {
        return id;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    public String getName() {
        return name;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    public String getDescription() {
        return description;
    }
    
    public void setRideSectionId(String rideSectionId) {
        this.rideSectionId = rideSectionId;
    }
    public String getRideSectionId() {
        return rideSectionId;
    }
    
    public void setPassengerCapacity(String passengerCapacity) {
        this.passengerCapacity = passengerCapacity;
    }
    public String getPassengerCapacity() {
        return passengerCapacity;
    }
    
    public void setBaseFare(String baseFare) {
        this.baseFare = baseFare;
    }
    public String getBaseFare() {
        return baseFare;
    }
    
    public void setCostPerMinute(String costPerMinute) {
        this.costPerMinute = costPerMinute;
    }
    public String getCostPerMinute() {
        return costPerMinute;
    }
    
    public void setCostPerDistance(String costPerDistance) {
        this.costPerDistance = costPerDistance;
    }
    public String getCostPerDistance() {
        return costPerDistance;
    }
    
    public void setDistanceUnit(String distanceUnit) {
        this.distanceUnit = distanceUnit;
    }
    public String getDistanceUnit() {
        return distanceUnit;
    }
    
    public void setImage(String image) {
        this.image = image;
    }
    public String getImage() {
        return image;
    }
    
    public void setLanguageId(String languageId) {
        this.languageId = languageId;
    }
    public String getLanguageId() {
        return languageId;
    }
    
    public void setCreated(String created) {
        this.created = created;
    }
    public String getCreated() {
        return created;
    }
    
}