package com.terraai.aimobility.model;

import java.io.Serializable;
import java.util.ArrayList;

public class MenuModel implements Serializable {

    String title;
    String menuName;
    String menuDetails;
    String amount;
    String menuImage;
    String active;
    String menuId;
    String description;
    ArrayList<MenuDetailsModel> menuModelArrayList;

    public ArrayList<MenuDetailsModel> getMenuModelArrayList() {
        return menuModelArrayList;
    }

    public void setMenuModelArrayList(ArrayList<MenuDetailsModel> menuModelArrayList) {
        this.menuModelArrayList = menuModelArrayList;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMenuId() {
        return menuId;
    }

    public void setMenuId(String menuId) {
        this.menuId = menuId;
    }

    public String getActive() {
        return active;
    }

    public void setActive(String active) {
        this.active = active;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMenuName() {
        return menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }

    public String getMenuDetails() {
        return menuDetails;
    }

    public void setMenuDetails(String menuDetails) {
        this.menuDetails = menuDetails;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    public String getMenuImage() {
        return menuImage;
    }

    public void setMenuImage(String menuImage) {
        this.menuImage = menuImage;
    }
}
