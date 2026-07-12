package com.terraai.aimobility.model;

import java.io.Serializable;

public class VehicleTypeModel implements Serializable {

    String vehicleName ;
    String amount ;
    String forItem ;
    int VehicleImage ;
    String id ;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getVehicleName() {
        return vehicleName;
    }

    public void setVehicleName(String vehicleName) {
        this.vehicleName = vehicleName;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getForItem() {
        return forItem;
    }

    public void setForItem(String forItem) {
        this.forItem = forItem;
    }

    public int getVehicleImage() {
        return VehicleImage;
    }

    public void setVehicleImage(int vehicleImage) {
        VehicleImage = vehicleImage;
    }
}
