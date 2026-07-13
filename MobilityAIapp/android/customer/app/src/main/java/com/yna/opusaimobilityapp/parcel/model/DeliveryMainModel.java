package com.yna.opusaimobilityapp.parcel.model;

import java.io.Serializable;
import java.util.ArrayList;

public class DeliveryMainModel implements Serializable {
    String senderName;
    String senderNumber;
    String senderAddress;
    String senderFloor;
    String senderNote;
    double senderLat;
    double senderLong;

    ArrayList<RecipientModel> recipientList=new ArrayList<>();

    String totalPrice;

    public DeliveryMainModel() {
    }

    public double getSenderLat() {
        return senderLat;
    }

    public void setSenderLat(double senderLat) {
        this.senderLat = senderLat;
    }

    public double getSenderLong() {
        return senderLong;
    }

    public void setSenderLong(double senderLong) {
        this.senderLong = senderLong;
    }


    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderNumber() {
        return senderNumber;
    }

    public void setSenderNumber(String senderNumber) {
        this.senderNumber = senderNumber;
    }

    public String getSenderAddress() {
        return senderAddress;
    }

    public void setSenderAddress(String senderAddress) {
        this.senderAddress = senderAddress;
    }

    public String getSenderFloor() {
        return senderFloor;
    }

    public void setSenderFloor(String senderFloor) {
        this.senderFloor = senderFloor;
    }

    public String getSenderNote() {
        return senderNote;
    }

    public void setSenderNote(String senderNote) {
        this.senderNote = senderNote;
    }

    public ArrayList<RecipientModel> getRecipientList() {
        return recipientList;
    }

    public void setRecipientList(ArrayList<RecipientModel> recipientList) {
        this.recipientList = recipientList;
    }

    public String getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(String totalPrice) {
        this.totalPrice = totalPrice;
    }
}
