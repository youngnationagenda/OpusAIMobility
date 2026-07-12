package com.terraai.aimobility.model;

import java.io.Serializable;

public class GrabCarModel implements Serializable {

    public String vehicleImage;
    public String vehicleName="";
    public String vehicleDesc;
    public String rideType;
    public String chargesPerKm;
    public String baseFare;
    public String estimatedFare;
    public String costPerMinute;
    public String costPerDistance;
    public String time;
    public String avgSpeed;
    public String id;
    public boolean isSelected;
    public boolean isFirstTime;

    public boolean isCheck() {
        return check;
    }

    public void setCheck(boolean check) {
        this.check = check;
    }

    public boolean check;
    public String discountValue;

}
