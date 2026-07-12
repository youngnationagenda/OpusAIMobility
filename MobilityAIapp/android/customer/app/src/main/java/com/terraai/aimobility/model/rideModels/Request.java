package com.terraai.aimobility.model.rideModels;

import com.google.gson.annotations.SerializedName;

   
public class Request {

   @SerializedName("id")
   String id;

   @SerializedName("user_id")
   String userId;

   @SerializedName("vehicle_id")
   String vehicleId;

   @SerializedName("driver_id")
   String driverId;

   @SerializedName("schedule")
   String schedule;

   @SerializedName("schedule_datetime")
   String scheduleDatetime;

   @SerializedName("note")
   String note;

   @SerializedName("coupon_id")
   String couponId;

   @SerializedName("pickup_lat")
   String pickupLat;

   @SerializedName("pickup_long")
   String pickupLong;

   @SerializedName("dropoff_lat")
   String dropoffLat;

   @SerializedName("dropoff_long")
   String dropoffLong;

   @SerializedName("pickup_location")
   String pickupLocation;

   @SerializedName("dropoff_location")
   String dropoffLocation;

   @SerializedName("pickup_location_short_string")
   String pickupLocationShortString;

   @SerializedName("dropoff_location_short_string")
   String dropoffLocationShortString;

   @SerializedName("request")
   String request;

   @SerializedName("status")
   String status;

   @SerializedName("driver_response_datetime")
   String driverResponseDatetime;

   @SerializedName("driver_ride_response")
   String driverRideResponse;

   @SerializedName("user_ride_response")
   String userRideResponse;

   @SerializedName("reason")
   String reason;

   @SerializedName("on_the_way")
   String onTheWay;

   @SerializedName("arrive_on_location")
   String arriveOnLocation;

   @SerializedName("arrive_on_location_datetime")
   String arriveOnLocationDatetime;

   @SerializedName("start_ride")
   String startRide;

   @SerializedName("end_ride")
   String endRide;

   @SerializedName("start_ride_datetime")
   String startRideDatetime;

   @SerializedName("end_ride_datetime")
   String endRideDatetime;

   @SerializedName("estimated_fare")
   String estimatedFare;

   @SerializedName("payment_type")
   String paymentType;

   @SerializedName("payment_method_id")
   String paymentMethodId;

   @SerializedName("collect_payment")
   String collectPayment;

   @SerializedName("created")
   String created;


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
    
    public void setVehicleId(String vehicleId) {
        this.vehicleId = vehicleId;
    }
    public String getVehicleId() {
        return vehicleId;
    }
    
    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }
    public String getDriverId() {
        return driverId;
    }
    
    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }
    public String getSchedule() {
        return schedule;
    }
    
    public void setScheduleDatetime(String scheduleDatetime) {
        this.scheduleDatetime = scheduleDatetime;
    }
    public String getScheduleDatetime() {
        return scheduleDatetime;
    }
    
    public void setNote(String note) {
        this.note = note;
    }
    public String getNote() {
        return note;
    }
    
    public void setCouponId(String couponId) {
        this.couponId = couponId;
    }
    public String getCouponId() {
        return couponId;
    }
    
    public void setPickupLat(String pickupLat) {
        this.pickupLat = pickupLat;
    }
    public String getPickupLat() {
        return pickupLat;
    }
    
    public void setPickupLong(String pickupLong) {
        this.pickupLong = pickupLong;
    }
    public String getPickupLong() {
        return pickupLong;
    }
    
    public void setDropoffLat(String dropoffLat) {
        this.dropoffLat = dropoffLat;
    }
    public String getDropoffLat() {
        return dropoffLat;
    }
    
    public void setDropoffLong(String dropoffLong) {
        this.dropoffLong = dropoffLong;
    }
    public String getDropoffLong() {
        return dropoffLong;
    }
    
    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }
    public String getPickupLocation() {
        return pickupLocation;
    }
    
    public void setDropoffLocation(String dropoffLocation) {
        this.dropoffLocation = dropoffLocation;
    }
    public String getDropoffLocation() {
        return dropoffLocation;
    }
    
    public void setPickupLocationShortString(String pickupLocationShortString) {
        this.pickupLocationShortString = pickupLocationShortString;
    }
    public String getPickupLocationShortString() {
        return pickupLocationShortString;
    }
    
    public void setDropoffLocationShortString(String dropoffLocationShortString) {
        this.dropoffLocationShortString = dropoffLocationShortString;
    }
    public String getDropoffLocationShortString() {
        return dropoffLocationShortString;
    }
    
    public void setRequest(String request) {
        this.request = request;
    }
    public String getRequest() {
        return request;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    public String getStatus() {
        return status;
    }
    
    public void setDriverResponseDatetime(String driverResponseDatetime) {
        this.driverResponseDatetime = driverResponseDatetime;
    }
    public String getDriverResponseDatetime() {
        return driverResponseDatetime;
    }
    
    public void setDriverRideResponse(String driverRideResponse) {
        this.driverRideResponse = driverRideResponse;
    }
    public String getDriverRideResponse() {
        return driverRideResponse;
    }
    
    public void setUserRideResponse(String userRideResponse) {
        this.userRideResponse = userRideResponse;
    }
    public String getUserRideResponse() {
        return userRideResponse;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    public String getReason() {
        return reason;
    }
    
    public void setOnTheWay(String onTheWay) {
        this.onTheWay = onTheWay;
    }
    public String getOnTheWay() {
        return onTheWay;
    }
    
    public void setArriveOnLocation(String arriveOnLocation) {
        this.arriveOnLocation = arriveOnLocation;
    }
    public String getArriveOnLocation() {
        return arriveOnLocation;
    }
    
    public void setArriveOnLocationDatetime(String arriveOnLocationDatetime) {
        this.arriveOnLocationDatetime = arriveOnLocationDatetime;
    }
    public String getArriveOnLocationDatetime() {
        return arriveOnLocationDatetime;
    }
    
    public void setStartRide(String startRide) {
        this.startRide = startRide;
    }
    public String getStartRide() {
        return startRide;
    }
    
    public void setEndRide(String endRide) {
        this.endRide = endRide;
    }
    public String getEndRide() {
        return endRide;
    }
    
    public void setStartRideDatetime(String startRideDatetime) {
        this.startRideDatetime = startRideDatetime;
    }
    public String getStartRideDatetime() {
        return startRideDatetime;
    }
    
    public void setEndRideDatetime(String endRideDatetime) {
        this.endRideDatetime = endRideDatetime;
    }
    public String getEndRideDatetime() {
        return endRideDatetime;
    }
    
    public void setEstimatedFare(String estimatedFare) {
        this.estimatedFare = estimatedFare;
    }
    public String getEstimatedFare() {
        return estimatedFare;
    }
    
    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }
    public String getPaymentType() {
        return paymentType;
    }
    
    public void setPaymentMethodId(String paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
    }
    public String getPaymentMethodId() {
        return paymentMethodId;
    }
    
    public void setCollectPayment(String collectPayment) {
        this.collectPayment = collectPayment;
    }
    public String getCollectPayment() {
        return collectPayment;
    }
    
    public void setCreated(String created) {
        this.created = created;
    }
    public String getCreated() {
        return created;
    }
    
}