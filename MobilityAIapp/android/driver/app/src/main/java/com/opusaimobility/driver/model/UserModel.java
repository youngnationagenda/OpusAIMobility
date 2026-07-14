package com.opusaimobility.driver.model;

import com.google.gson.annotations.SerializedName;

/**
 * UserModel — Maps to DynamoDB aimobility-users table item.
 */
public class UserModel {

    @SerializedName("userId")
    public String userId;

    @SerializedName("id")
    public String id;

    @SerializedName("first_name")
    public String firstName;

    @SerializedName("last_name")
    public String lastName;

    @SerializedName("email")
    public String email;

    @SerializedName("phone")
    public String phone;

    @SerializedName("role")
    public String role;

    @SerializedName("image")
    public String image;

    @SerializedName("lat")
    public String lat;

    @SerializedName("long")
    public String lng;

    @SerializedName("device_token")
    public String deviceToken;

    @SerializedName("wallet")
    public String wallet;

    @SerializedName("rating")
    public String rating;

    @SerializedName("total_trips")
    public String totalTrips;

    @SerializedName("active")
    public int active;

    @SerializedName("country_id")
    public String countryId;

    @SerializedName("created")
    public String created;

    public String getFullName() {
        StringBuilder sb = new StringBuilder();
        if (firstName != null) sb.append(firstName);
        if (lastName  != null) sb.append(" ").append(lastName);
        return sb.toString().trim();
    }

    public String getIdSafe() {
        return userId != null ? userId : (id != null ? id : "");
    }
}
