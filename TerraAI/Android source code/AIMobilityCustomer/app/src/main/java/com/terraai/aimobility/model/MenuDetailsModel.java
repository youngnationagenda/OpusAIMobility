package com.terraai.aimobility.model;

import java.io.Serializable;
import java.util.ArrayList;

public class MenuDetailsModel implements Serializable {

    String menuName;
    String menuId;
    String menuItemId;
    String name;
    String description;
    String price;
    String image;
    String active;
    String outOfOrder;
    String extraRequired;
    ArrayList<ParentExpandListModel> menuSectionList;

    public String isExtraRequired() {
        return extraRequired;
    }

    public void setExtraRequired(String extraRequired) {
        this.extraRequired = extraRequired;
    }

    public ArrayList<ParentExpandListModel> getMenuSectionList() {
        return menuSectionList;
    }

    public void setMenuSectionList(ArrayList<ParentExpandListModel> menuSectionList) {
        this.menuSectionList = menuSectionList;
    }

    public String getMenuId() {
        return menuId;
    }

    public void setMenuId(String menuId) {
        this.menuId = menuId;
    }

    public String getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(String menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getActive() {
        return active;
    }

    public void setActive(String active) {
        this.active = active;
    }

    public String getOutOfOrder() {
        return outOfOrder;
    }

    public void setOutOfOrder(String outOfOrder) {
        this.outOfOrder = outOfOrder;
    }

    public String getMenuName() {
        return menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }
}
