package com.yna.opusaimobilityapp.parcel.model;

import java.io.Serializable;
import java.util.ArrayList;

public class ParcelHistoryModel implements Serializable {
    String paymentCardId  ="0";
    String lastFour;
    String packageSizeId;
    String schedule;
    String price;
    String orderId;
    String discount;
    String delivery_fee;
    String couponId;
    String total;
    String senderName;
    String senderPhone;
    String senderLocationLat;
    String senderLocationLong;
    String senderLocationString;
    String senderNoteDriver;
    String status;
    String map;
    String created;
    String senderAddressDetail;
    String cardType;

    public String onTheWayToPickup, pickupDatetime;
   public Rider rider;
   public ArrayList<RecipientModel> recipientList=new ArrayList<>();
    public ArrayList<RiderOrderMultiStop> orderMultiStops=new ArrayList<>();

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public String getPaymentCardId() {
        return paymentCardId;
    }

    public void setPaymentCardId(String paymentCardId) {
        this.paymentCardId = paymentCardId;
    }

    public String getLastFour() {
        return lastFour;
    }

    public void setLastFour(String lastFour) {
        this.lastFour = lastFour;
    }



    public String getSenderAddressDetail() {
        return senderAddressDetail;
    }

    public void setSenderAddressDetail(String senderAddressDetail) {
        this.senderAddressDetail = senderAddressDetail;
    }


    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public String getPackageSizeId() {
        return packageSizeId;
    }

    public void setPackageSizeId(String packageSizeId) {
        this.packageSizeId = packageSizeId;
    }


    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }


    public String getDiscount() {
        return discount;
    }

    public void setDiscount(String discount) {
        this.discount = discount;
    }

    public String getDelivery_fee() {
        return delivery_fee;
    }

    public void setDelivery_fee(String delivery_fee) {
        this.delivery_fee = delivery_fee;
    }

    public String getCouponId() {
        return couponId;
    }

    public void setCouponId(String couponId) {
        this.couponId = couponId;
    }

    public String getTotal() {
        return total;
    }

    public void setTotal(String total) {
        this.total = total;
    }

    public String getPickupDatetime() {
        return pickupDatetime;
    }

    public void setPickupDatetime(String pickupDatetime) {
        this.pickupDatetime = pickupDatetime;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderPhone() {
        return senderPhone;
    }

    public void setSenderPhone(String senderPhone) {
        this.senderPhone = senderPhone;
    }


    public String getSenderLocationLat() {
        return senderLocationLat;
    }

    public void setSenderLocationLat(String senderLocationLat) {
        this.senderLocationLat = senderLocationLat;
    }

    public String getSenderLocationLong() {
        return senderLocationLong;
    }

    public void setSenderLocationLong(String senderLocationLong) {
        this.senderLocationLong = senderLocationLong;
    }

    public String getSenderLocationString() {
        return senderLocationString;
    }

    public void setSenderLocationString(String senderLocationString) {
        this.senderLocationString = senderLocationString;
    }




    public String getSenderNoteDriver() {
        return senderNoteDriver;
    }

    public void setSenderNoteDriver(String senderNoteDriver) {
        this.senderNoteDriver = senderNoteDriver;
    }


    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMap() {
        return map;
    }

    public void setMap(String map) {
        this.map = map;
    }


}
