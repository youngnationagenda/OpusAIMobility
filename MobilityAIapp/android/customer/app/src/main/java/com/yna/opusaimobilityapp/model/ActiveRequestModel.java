package com.yna.opusaimobilityapp.model;

import com.yna.opusaimobilityapp.model.rideModels.Driver;
import com.yna.opusaimobilityapp.model.rideModels.RideType;
import com.yna.opusaimobilityapp.model.rideModels.Vehicle;

import java.io.Serializable;
import java.util.ArrayList;

public class ActiveRequestModel implements Serializable {

    String  distance,    onTheWay,
            pickupLat, pickupLong,  destinationLat, destinationLong,
            pickupLocation, destinationLocation, request = "0", walletPay,
            arriveOnLocation, startRide, endRide, requestId,  reason,
            collectPayment, avgRatings;
    String pickupLocationShortString, dropoffLocationShortString, end_ride_datetime;
    String pickupAddressLoc;
    String dropoffAddressLoc;
    String currencySymbol;
    String final_fare;
    String userWallet;
    String PaymentType;

    public Driver driver=new Driver();
    public Vehicle vehical=new Vehicle();
    public RideType rideType=new RideType();



    public String getUserWallet() {
        return userWallet;
    }

    public void setUserWallet(String userWallet) {
        this.userWallet = userWallet;
    }


    public String getPaymentType() {
        return PaymentType;
    }

    public void setPaymentType(String paymentType) {
        PaymentType = paymentType;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(String distance) {
        this.distance = distance;
    }


    public String getOnTheWay() {
        return onTheWay;
    }

    public void setOnTheWay(String onTheWay) {
        this.onTheWay = onTheWay;
    }

    public String getPickupLat() {
        return pickupLat;
    }

    public void setPickupLat(String pickupLat) {
        this.pickupLat = pickupLat;
    }

    public String getPickupLong() {
        return pickupLong;
    }

    public void setPickupLong(String pickupLong) {
        this.pickupLong = pickupLong;
    }


    public String getDestinationLat() {
        return destinationLat;
    }

    public void setDestinationLat(String destinationLat) {
        this.destinationLat = destinationLat;
    }

    public String getDestinationLong() {
        return destinationLong;
    }

    public void setDestinationLong(String destinationLong) {
        this.destinationLong = destinationLong;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getDestinationLocation() {
        return destinationLocation;
    }

    public void setDestinationLocation(String destinationLocation) {
        this.destinationLocation = destinationLocation;
    }

    public String getRequest() {
        return request;
    }

    public void setRequest(String request) {
        this.request = request;
    }

    public String getWalletPay() {
        return walletPay;
    }

    public void setWalletPay(String walletPay) {
        this.walletPay = walletPay;
    }

    public String getArriveOnLocation() {
        return arriveOnLocation;
    }

    public void setArriveOnLocation(String arriveOnLocation) {
        this.arriveOnLocation = arriveOnLocation;
    }

    public String getStartRide() {
        return startRide;
    }

    public void setStartRide(String startRide) {
        this.startRide = startRide;
    }

    public String getEndRide() {
        return endRide;
    }

    public void setEndRide(String endRide) {
        this.endRide = endRide;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }


    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getCollectPayment() {
        return collectPayment;
    }

    public void setCollectPayment(String collectPayment) {
        this.collectPayment = collectPayment;
    }

    public String getAvgRatings() {
        return avgRatings;
    }

    public void setAvgRatings(String avgRatings) {
        this.avgRatings = avgRatings;
    }

    public String getPickupLocationShortString() {
        return pickupLocationShortString;
    }

    public void setPickupLocationShortString(String pickupLocationShortString) {
        this.pickupLocationShortString = pickupLocationShortString;
    }

    public String getDropoffLocationShortString() {
        return dropoffLocationShortString;
    }

    public void setDropoffLocationShortString(String dropoffLocationShortString) {
        this.dropoffLocationShortString = dropoffLocationShortString;
    }

    public String getEnd_ride_datetime() {
        return end_ride_datetime;
    }

    public void setEnd_ride_datetime(String end_ride_datetime) {
        this.end_ride_datetime = end_ride_datetime;
    }

    public String getPickupAddressLoc() {
        return pickupAddressLoc;
    }

    public void setPickupAddressLoc(String pickupAddressLoc) {
        this.pickupAddressLoc = pickupAddressLoc;
    }

    public String getDropoffAddressLoc() {
        return dropoffAddressLoc;
    }

    public void setDropoffAddressLoc(String dropoffAddressLoc) {
        this.dropoffAddressLoc = dropoffAddressLoc;
    }

    public String getCurrencySymbol() {
        return currencySymbol;
    }

    public void setCurrencySymbol(String currencySymbol) {
        this.currencySymbol = currencySymbol;
    }

    public String getFinal_fare() {
        return final_fare;
    }

    public void setFinal_fare(String final_fare) {
        this.final_fare = final_fare;
    }

//    public String getVehicleMake() {
//        return vehicleMake;
//    }
//
//    public void setVehicleMake(String vehicleMake) {
//        this.vehicleMake = vehicleMake;
//    }
//
//    public String getVehicleModel() {
//        return vehicleModel;
//    }
//
//    public void setVehicleModel(String vehicleModel) {
//        this.vehicleModel = vehicleModel;
//    }
//
//    public String getVehicalColor() {
//        return vehicalcolor;
//    }
//
//    public void setVehicalColor(String vehicalcolor) {
//        this.vehicleModel = vehicalcolor;
//    }
//
//
//
//    public String getVehicleImage() {
//        return vehicleImage;
//    }
//
//    public void setVehicleImage(String vehicleImage) {
//        this.vehicleImage = vehicleImage;
//    }
//
//    public String getLicensePlate() {
//        return licensePlate;
//    }
//
//    public void setLicensePlate(String licensePlate) {
//        this.licensePlate = licensePlate;
//    }
//
//    public String getVehicleLat() {
//        return vehicleLat;
//    }
//
//    public void setVehicleLat(String vehicleLat) {
//        this.vehicleLat = vehicleLat;
//    }
//
//    public String getVehicleLng() {
//        return vehicleLng;
//    }
//
//    public void setVehicleLng(String vehicleLng) {
//        this.vehicleLng = vehicleLng;
//    }
//
//    public String getRideTypeId() {
//        return rideTypeId;
//    }
//
//    public void setRideTypeId(String rideTypeId) {
//        this.rideTypeId = rideTypeId;
//    }
//
//    public String getRideTypeName() {
//        return rideTypeName;
//    }
//
//    public void setRideTypeName(String rideTypeName) {
//        this.rideTypeName = rideTypeName;
//    }

}
