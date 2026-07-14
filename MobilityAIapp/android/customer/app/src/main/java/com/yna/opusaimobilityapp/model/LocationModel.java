package com.yna.opusaimobilityapp.model;

import java.io.Serializable;

public class LocationModel implements Serializable {
    String pickUpAddress;
    String dropOffAddress;
    String fulldropOffAddress;
    String fullpickUpAddress;
    String driverNote = "";
    String scheduledatetime;
    String schedule;
    String rideType;
    double dropOfflat, dropOfflng;
    double picklat, picklng;

    public String getFullpickUpAddress() {
        return fullpickUpAddress;
    }

    public void setFullpickUpAddress(String fullpickUpAddress) {
        this.fullpickUpAddress = fullpickUpAddress;
    }

    public String getRideType() {
        return rideType;
    }

    public void setRideType(String rideType) {
        this.rideType = rideType;
    }

    public String getScheduledatetime() {
        return scheduledatetime;
    }

    public void setScheduledatetime(String scheduledatetime) {
        this.scheduledatetime = scheduledatetime;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    public String getFulldropOffAddress() {
        return fulldropOffAddress;
    }

    public void setFulldropOffAddress(String fulldropOffAddress) {
        this.fulldropOffAddress = fulldropOffAddress;
    }

    public String getDriverNote() {
        return driverNote;
    }

    public void setDriverNote(String driverNote) {
        this.driverNote = driverNote;
    }

    public String getPickUpAddress() {
        return pickUpAddress;
    }

    public void setPickUpAddress(String pickUpAddress) {
        this.pickUpAddress = pickUpAddress;
    }

    public String getDropOffAddress() {
        return dropOffAddress;
    }

    public void setDropOffAddress(String dropOffAddress) {
        this.dropOffAddress = dropOffAddress;
    }

    public double getDropOfflat() {
        return dropOfflat;
    }

    public void setDropOfflat(double dropOfflat) {
        this.dropOfflat = dropOfflat;
    }

    public double getDropOfflng() {
        return dropOfflng;
    }

    public void setDropOfflng(double dropOfflng) {
        this.dropOfflng = dropOfflng;
    }

    public double getPicklat() {
        return picklat;
    }

    public void setPicklat(double picklat) {
        this.picklat = picklat;
    }

    public double getPicklng() {
        return picklng;
    }

    public void setPicklng(double picklng) {
        this.picklng = picklng;
    }
}
