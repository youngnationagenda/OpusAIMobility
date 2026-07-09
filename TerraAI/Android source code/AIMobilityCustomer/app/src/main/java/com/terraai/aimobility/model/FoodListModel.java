package com.terraai.aimobility.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;

public class FoodListModel implements Serializable {

    String tvQuantity;
    String itemName;
    String amount;
    String menuId;
    String image;
    ArrayList<HashMap<String, String>> extraItem;

    public ArrayList<HashMap<String, String>> getExtraItem() {
        return extraItem;
    }

    public void setExtraItem(ArrayList<HashMap<String, String>> extraItem) {
        this.extraItem = extraItem;
    }

    public String getMenuId() {
        return menuId;
    }

    public void setMenuId(String menuId) {
        this.menuId = menuId;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getTvQuantity() {
        return tvQuantity;
    }

    public void setTvQuantity(String tvQuantity) {
        this.tvQuantity = tvQuantity;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }
}
