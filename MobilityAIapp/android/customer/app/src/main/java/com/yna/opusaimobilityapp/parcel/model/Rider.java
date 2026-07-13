package com.yna.opusaimobilityapp.parcel.model;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public class Rider implements Serializable {

        public String id;
        public String first_name;
        public String last_name;
        public String gender;
        public String dob;
        public String social_id;
        public String email;
        public String phone;
        public String password;
        public String image;
        public String role;
        public String username;
        public String social;
        public String device_token;
        public String token;
        public String active;
        public String lat;
        @JsonProperty("long")
        public String mylong;
        public String online;
        public String verified;
        public String auth_token;
        public String version;
        public String device;
        public String ip;
        public String country_id;
        public String wallet;
        public String paypal;
        public String ride_hailing;
        public String rider_fee_food_parcel;
        public String rider_commission_ride_hailing;
        public String created;
        @JsonProperty("Vehicle")
        public Vehicle vehicle;

}
