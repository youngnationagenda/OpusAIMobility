package com.terraai.aimobility.parcel.model;

import java.io.Serializable;

public class RecipientModel implements Serializable {
    String recipientName;
    String recipientNumber;
    String recipientAddress;
    String recipientFloor;
    String recipientNote;
    double recipientLat;
    double recipientLong;
    String deliveryInstruction;
    String typeOfItem;
    String typeOfItemId;
    String packageSize;
    String packageID;
    String price;

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientNumber() {
        return recipientNumber;
    }

    public void setRecipientNumber(String recipientNumber) {
        this.recipientNumber = recipientNumber;
    }

    public String getRecipientAddress() {
        return recipientAddress;
    }

    public void setRecipientAddress(String recipientAddress) {
        this.recipientAddress = recipientAddress;
    }

    public String getRecipientFloor() {
        return recipientFloor;
    }

    public void setRecipientFloor(String recipientFloor) {
        this.recipientFloor = recipientFloor;
    }

    public String getRecipientNote() {
        return recipientNote;
    }

    public void setRecipientNote(String recipientNote) {
        this.recipientNote = recipientNote;
    }

    public double getRecipientLat() {
        return recipientLat;
    }

    public void setRecipientLat(double recipientLat) {
        this.recipientLat = recipientLat;
    }

    public double getRecipientLong() {
        return recipientLong;
    }

    public void setRecipientLong(double recipientLong) {
        this.recipientLong = recipientLong;
    }

    public String getDeliveryInstruction() {
        return deliveryInstruction;
    }

    public void setDeliveryInstruction(String deliveryInstruction) {
        this.deliveryInstruction = deliveryInstruction;
    }

    public String getTypeOfItem() {
        return typeOfItem;
    }

    public void setTypeOfItem(String typeOfItem) {
        this.typeOfItem = typeOfItem;
    }

    public String getTypeOfItemId() {
        return typeOfItemId;
    }

    public void setTypeOfItemId(String typeOfItemId) {
        this.typeOfItemId = typeOfItemId;
    }


    public String getPackageSize() {
        return packageSize;
    }

    public void setPackageSize(String packageSize) {
        this.packageSize = packageSize;
    }

    public String getPackageID() {
        return packageID;
    }

    public void setPackageID(String packageID) {
        this.packageID = packageID;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }
}
