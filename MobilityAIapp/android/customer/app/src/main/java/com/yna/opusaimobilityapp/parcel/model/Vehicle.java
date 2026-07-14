package com.yna.opusaimobilityapp.parcel.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public class Vehicle implements Serializable {
    public String id;
    public String user_id;
    public String driver_id;
    public String make;
    public String model;
    public String year;
    public String license_plate;
    public String color;
    public String ride_type_id;
    public String image;
    public String lat;
    @JsonProperty("long")
    public String mylong;
    public String online;
    public String available;
    public String updated;
    public String created;
}
