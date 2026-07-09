package com.terraai.aimobility.model;

import java.io.Serializable;
import java.util.ArrayList;

public class HistoryModel implements Serializable {

    public String id, driverId, vehicleId, requestId,
            pickupLocation, destinationLocation, pickupLat, pickupLong,
            destinationLat, destinationLong, pickupDatetime, destinationDatetime,
            acceptedByRider, cancelledByRider, cancelledByUser, completed, finalFare,
            payType, payFromWallet, payCollectFromWallet, payCollectFromCard,
            payCollectFromCash, map, username, tripFare, debitCreditAmount;

    public String driverEmail, driverFirstName, driverLastName, vehicleColor,
            driverPhoneNo, driverImage, driverLat, driverLng, tripRating,
            vehicleMake, vehicleModel, vehiclePlate, vehicleType, initialWaitingTimePrice;

    public ArrayList<TripHistoryModel> tripHistoryModelArrayList;

    String DayTime;
    String Amount;
    String PickUp;
    String DroopOff;



    public String getDayTime() {
        return DayTime;
    }

    public void setDayTime(String dayTime) {
        DayTime = dayTime;
    }

    public String getAmount() {
        return Amount;
    }

    public void setAmount(String amount) {
        Amount = amount;
    }

    public String getPickUp() {
        return PickUp;
    }

    public void setPickUp(String pickUp) {
        PickUp = pickUp;
    }

    public String getDroopOff() {
        return DroopOff;
    }

    public void setDroopOff(String droopOff) {
        DroopOff = droopOff;
    }
}
