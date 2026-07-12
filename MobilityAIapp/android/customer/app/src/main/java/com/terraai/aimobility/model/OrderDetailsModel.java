package com.terraai.aimobility.model;

import java.io.Serializable;

public class OrderDetailsModel implements Serializable {

    String cityName ;
    String  address ;

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
