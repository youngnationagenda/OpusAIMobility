package com.yna.opusaimobilityapp.model;

import java.io.Serializable;
import java.util.ArrayList;

public class ResturantModel implements Serializable {

    String resturantImage;
    String resturantLat;
    String resturantLong;
    String block;
    String slogan;
    String about;
    String speciality;
    String phone;
    String preparation_time;
    String minOrderPrice;
    String deliveryFreeRange;
    String coverImage;
    String distance;
    String resturantName;
    String deliveryAmount;
    String tvTime;
    String isLiked;
    String deliveryFee;
    String deliveryMinTime;
    String deliveryMaxTime;
    String totalRatings;
    String totalRatingCount;
    String id;
    String location_string;
    String state;
    String city;
    String country;
    String open;
    ArrayList<TimeModel> timeModelArrayList;
    ArrayList<RestaurantRatingModel> restaurantRatingModelArrayList;

    public String getOpen() {
        return open;
    }

    public void setOpen(String open) {
        this.open = open;
    }

    public String getBlock() {
        return block;
    }

    public void setBlock(String block) {
        this.block = block;
    }

    public String getLocation_string() {
        return location_string;
    }

    public void setLocation_string(String location_string) {
        this.location_string = location_string;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getTotalRatingCount() {
        return totalRatingCount;
    }

    public void setTotalRatingCount(String totalRatingCount) {
        this.totalRatingCount = totalRatingCount;
    }

    public String getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(String deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public String getDeliveryMinTime() {
        return deliveryMinTime;
    }

    public void setDeliveryMinTime(String deliveryMinTime) {
        this.deliveryMinTime = deliveryMinTime;
    }

    public String getDeliveryMaxTime() {
        return deliveryMaxTime;
    }

    public void setDeliveryMaxTime(String deliveryMaxTime) {
        this.deliveryMaxTime = deliveryMaxTime;
    }

    public String getTotalRatings() {
        return totalRatings;
    }

    public void setTotalRatings(String totalRatings) {
        this.totalRatings = totalRatings;
    }

    public ArrayList<RestaurantRatingModel> getRestaurantRatingModelArrayList() {
        return restaurantRatingModelArrayList;
    }

    public void setRestaurantRatingModelArrayList(ArrayList<RestaurantRatingModel> restaurantRatingModelArrayList) {
        this.restaurantRatingModelArrayList = restaurantRatingModelArrayList;
    }

    public ArrayList<TimeModel> getTimeModelArrayList() {
        return timeModelArrayList;
    }

    public void setTimeModelArrayList(ArrayList<TimeModel> timeModelArrayList) {
        this.timeModelArrayList = timeModelArrayList;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(String distance) {
        this.distance = distance;
    }

    public String getResturantLat() {
        return resturantLat;
    }

    public void setResturantLat(String resturantLat) {
        this.resturantLat = resturantLat;
    }

    public String getResturantLong() {
        return resturantLong;
    }

    public void setResturantLong(String resturantLong) {
        this.resturantLong = resturantLong;
    }

    public String getSlogan() {
        return slogan;
    }

    public void setSlogan(String slogan) {
        this.slogan = slogan;
    }

    public String getAbout() {
        return about;
    }

    public void setAbout(String about) {
        this.about = about;
    }

    public String getSpeciality() {
        return speciality;
    }

    public void setSpeciality(String speciality) {
        this.speciality = speciality;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPreparation_time() {
        return preparation_time;
    }

    public void setPreparation_time(String preparation_time) {
        this.preparation_time = preparation_time;
    }

    public String getMinOrderPrice() {
        return minOrderPrice;
    }

    public void setMinOrderPrice(String minOrderPrice) {
        this.minOrderPrice = minOrderPrice;
    }

    public String getDeliveryFreeRange() {
        return deliveryFreeRange;
    }

    public void setDeliveryFreeRange(String deliveryFreeRange) {
        this.deliveryFreeRange = deliveryFreeRange;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIsLiked() {
        return isLiked;
    }

    public void setIsLiked(String isLiked) {
        this.isLiked = isLiked;
    }

    public String getResturantImage() {
        return resturantImage;
    }

    public void setResturantImage(String resturantImage) {
        this.resturantImage = resturantImage;
    }

    public String getResturantName() {
        return resturantName;
    }

    public void setResturantName(String resturantName) {
        this.resturantName = resturantName;
    }

    public String getDeliveryAmount() {
        return deliveryAmount;
    }

    public void setDeliveryAmount(String deliveryAmount) {
        this.deliveryAmount = deliveryAmount;
    }

    public String getTvTime() {
        return tvTime;
    }

    public void setTvTime(String tvTime) {
        this.tvTime = tvTime;
    }
}
