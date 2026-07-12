package com.terraai.aimobility.model.rideModels;

import com.google.gson.annotations.SerializedName;

import java.io.Serializable;


public class Driver implements Serializable {

   @SerializedName("id")
   String id;

   @SerializedName("first_name")
   String firstName;

   @SerializedName("last_name")
   String lastName;

   @SerializedName("gender")
   String gender;

   @SerializedName("dob")
   String dob;

   @SerializedName("social_id")
   String socialId;

   @SerializedName("email")
   String email;

   @SerializedName("phone")
   String phone;

   @SerializedName("password")
   String password;

   @SerializedName("image")
   String image;

   @SerializedName("role")
   String role;

   @SerializedName("username")
   String username;

   @SerializedName("social")
   String social;

   @SerializedName("device_token")
   String deviceToken;

   @SerializedName("token")
   String token;

   @SerializedName("active")
   String active;

   @SerializedName("lat")
   String lat;

   @SerializedName("lng")
   String lng;

   @SerializedName("online")
   String online;

   @SerializedName("verified")
   String verified;

   @SerializedName("auth_token")
   String authToken;

   @SerializedName("version")
   String version;

   @SerializedName("device")
   String device;

   @SerializedName("ip")
   String ip;

   @SerializedName("country_id")
   String countryId;

   @SerializedName("wallet")
   String wallet;

   @SerializedName("paypal")
   String paypal;

   @SerializedName("ride_hailing")
   String rideHailing;

   @SerializedName("rider_fee_food_parcel")
   String riderFeeFoodParcel;

   @SerializedName("rider_commission_ride_hailing")
   String riderCommissionRideHailing;

   @SerializedName("created")
   String created;


    public void setId(String id) {
        this.id = id;
    }
    public String getId() {
        return id;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    public String getFirstName() {
        return firstName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    public String getLastName() {
        return lastName;
    }
    
    public void setGender(String gender) {
        this.gender = gender;
    }
    public String getGender() {
        return gender;
    }
    
    public void setDob(String dob) {
        this.dob = dob;
    }
    public String getDob() {
        return dob;
    }
    
    public void setSocialId(String socialId) {
        this.socialId = socialId;
    }
    public String getSocialId() {
        return socialId;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    public String getEmail() {
        return email;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    public String getPhone() {
        return phone;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    public String getPassword() {
        return password;
    }
    
    public void setImage(String image) {
        this.image = image;
    }
    public String getImage() {
        return image;
    }
    
    public void setRole(String role) {
        this.role = role;
    }
    public String getRole() {
        return role;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    public String getUsername() {
        return username;
    }
    
    public void setSocial(String social) {
        this.social = social;
    }
    public String getSocial() {
        return social;
    }
    
    public void setDeviceToken(String deviceToken) {
        this.deviceToken = deviceToken;
    }
    public String getDeviceToken() {
        return deviceToken;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    public String getToken() {
        return token;
    }
    
    public void setActive(String active) {
        this.active = active;
    }
    public String getActive() {
        return active;
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
    
    public void setVerified(String verified) {
        this.verified = verified;
    }
    public String getVerified() {
        return verified;
    }
    
    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }
    public String getAuthToken() {
        return authToken;
    }
    
    public void setVersion(String version) {
        this.version = version;
    }
    public String getVersion() {
        return version;
    }
    
    public void setDevice(String device) {
        this.device = device;
    }
    public String getDevice() {
        return device;
    }
    
    public void setIp(String ip) {
        this.ip = ip;
    }
    public String getIp() {
        return ip;
    }
    
    public void setCountryId(String countryId) {
        this.countryId = countryId;
    }
    public String getCountryId() {
        return countryId;
    }
    
    public void setWallet(String wallet) {
        this.wallet = wallet;
    }
    public String getWallet() {
        return wallet;
    }
    
    public void setPaypal(String paypal) {
        this.paypal = paypal;
    }
    public String getPaypal() {
        return paypal;
    }
    
    public void setRideHailing(String rideHailing) {
        this.rideHailing = rideHailing;
    }
    public String getRideHailing() {
        return rideHailing;
    }
    
    public void setRiderFeeFoodParcel(String riderFeeFoodParcel) {
        this.riderFeeFoodParcel = riderFeeFoodParcel;
    }
    public String getRiderFeeFoodParcel() {
        return riderFeeFoodParcel;
    }
    
    public void setRiderCommissionRideHailing(String riderCommissionRideHailing) {
        this.riderCommissionRideHailing = riderCommissionRideHailing;
    }
    public String getRiderCommissionRideHailing() {
        return riderCommissionRideHailing;
    }
    
    public void setCreated(String created) {
        this.created = created;
    }
    public String getCreated() {
        return created;
    }
    
}