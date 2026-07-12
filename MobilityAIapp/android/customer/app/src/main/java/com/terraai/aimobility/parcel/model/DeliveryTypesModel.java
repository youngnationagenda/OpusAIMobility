package com.terraai.aimobility.parcel.model;

import java.io.Serializable;

public class DeliveryTypesModel implements Serializable {

    private String vehicleImage,vehicleName,vehicleDesc,chargesPerKM,time,id;

    public DeliveryTypesModel() {
    }

    public String getVehicleImage() {
        return vehicleImage;
    }

    public void setVehicleImage(String vehicleImage) {
        this.vehicleImage = vehicleImage;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getVehicleDesc() {
        return vehicleDesc;
    }

    public void setVehicleDesc(String vehicleDesc) {
        this.vehicleDesc = vehicleDesc;
    }

    public String getChargesPerKM() {
        return chargesPerKM;
    }

    public void setChargesPerKM(String chargesPerKM) {
        this.chargesPerKM = chargesPerKM;
    }

    public String getTime() {
        return time;
    }

    public void setTime(String time) {
        this.time = time;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
}
