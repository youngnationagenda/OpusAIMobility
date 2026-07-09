package com.terraai.aimobility.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;


public class CalculationModel implements Serializable {

    String mItemID;
    String schedule;
    String key;
    String mName;
    String mPrice;
    String mQuantity;
    String required;
    String instruction;
    String restID;
    String rest_name;
    String mCurrency;
    String mDesc;
    String mFee;
    ArrayList<HashMap<String, String>> extraItem;
    ResturantModel resturantModel;
    MenuDetailsModel menuDetailsModel;
    String grandTotal;
    String scheduleDatetime;
    String minimumOrderPrice;
    String mID;
    String rest_lat;
    String rest_lng;


    public CalculationModel(String mID, String mItemID, String mName, String mPrice,
                            String grandTotal, String mQuantity, String required,
                            String minimumOrderPrice,
                            ArrayList<HashMap<String, String>> extraItem,
                            String instruction,
                            String RestID,
                            String rest_name,
                            String mCurrency,
                            String mDesc,
                            String mFee,
                            ResturantModel resturantModel,
                            MenuDetailsModel menuDetailsModel,
                            String schedule,
                            String scheduleDatetime,
                            String rest_lat,
                            String rest_lng) {

        this.mID = mID;
        this.mItemID = mItemID;
        this.mName = mName;
        this.mPrice = mPrice;
        this.grandTotal = grandTotal;
        this.mQuantity = mQuantity;
        this.required = required;
        this.minimumOrderPrice = minimumOrderPrice;
        this.instruction = instruction;
        this.restID = RestID;
        this.rest_name = rest_name;
        this.mCurrency = mCurrency;
        this.mDesc = mDesc;
        this.mFee = mFee;
        this.extraItem = extraItem;
        this.resturantModel = resturantModel;
        this.menuDetailsModel = menuDetailsModel;
        this.schedule = schedule;
        this.scheduleDatetime = scheduleDatetime;
        this.rest_lat = rest_lat;
        this.rest_lng = rest_lng;

    }

    public CalculationModel() {

    }

    public ResturantModel getResturantModel() {
        return resturantModel;
    }

    public void setResturantModel(ResturantModel resturantModel) {
        this.resturantModel = resturantModel;
    }


    public MenuDetailsModel getRecipeMenuDetailsModel() {
        return menuDetailsModel;
    }

    public void setRecipeMenuDetailsModel(MenuDetailsModel menuDetailsModel) {
        this.menuDetailsModel = menuDetailsModel;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String schedule) {
        this.schedule = schedule;
    }

    public MenuDetailsModel getMenuDetailsModel() {
        return menuDetailsModel;
    }

    public void setMenuDetailsModel(MenuDetailsModel menuDetailsModel) {
        this.menuDetailsModel = menuDetailsModel;
    }

    public String getScheduleDatetime() {
        return scheduleDatetime;
    }

    public void setScheduleDatetime(String scheduleDatetime) {
        this.scheduleDatetime = scheduleDatetime;
    }

    public String getmItemID() {
        return mItemID;
    }

    public void setmItemID(String mItemID) {
        this.mItemID = mItemID;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(String grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getMinimumOrderPrice() {
        return minimumOrderPrice;
    }

    public void setMinimumOrderPrice(String minimumOrderPrice) {
        this.minimumOrderPrice = minimumOrderPrice;
    }

    public String getmID() {
        return mID;
    }

    public void setmID(String mID) {
        this.mID = mID;
    }

    public String getmName() {
        return mName;
    }

    public void setmName(String mName) {
        this.mName = mName;
    }

    public String getmPrice() {
        return mPrice;
    }

    public void setmPrice(String mPrice) {
        this.mPrice = mPrice;
    }

    public String getmQuantity() {
        return mQuantity;
    }

    public void setmQuantity(String mQuantity) {
        this.mQuantity = mQuantity;
    }

    public String getRequired() {
        return required;
    }

    public void setRequired(String required) {
        this.required = required;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

    public String getRestID() {
        return restID;
    }

    public void setRestID(String restID) {
        this.restID = restID;
    }

    public String getRest_name() {
        return rest_name;
    }

    public void setRest_name(String rest_name) {
        this.rest_name = rest_name;
    }

    public String getmCurrency() {
        return mCurrency;
    }

    public void setmCurrency(String mCurrency) {
        this.mCurrency = mCurrency;
    }

    public String getmDesc() {
        return mDesc;
    }

    public void setmDesc(String mDesc) {
        this.mDesc = mDesc;
    }

    public String getmFee() {
        return mFee;
    }

    public void setmFee(String mFee) {
        this.mFee = mFee;
    }

    public ArrayList<HashMap<String, String>> getExtraItem() {
        return extraItem;
    }

    public void setExtraItem(ArrayList<HashMap<String, String>> extraItem) {
        this.extraItem = extraItem;
    }

}
