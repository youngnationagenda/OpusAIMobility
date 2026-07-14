package com.yna.opusaimobilityapp.model;

import com.yna.opusaimobilityapp.R;

import java.io.Serializable;

public class ChildExpandListModel implements Serializable {

    public String childName;
    public String priceAddOns;
    public String menuExtraChildid;
    public String active;
    public boolean lastItem;
    public boolean isChecked;
    public boolean isCheckedRequired;

    public ChildExpandListModel() {

    }

    public boolean isCheckedRequired() {
        return isCheckedRequired;
    }

    public void setCheckedRequired(boolean checkedRequired) {
        isCheckedRequired = checkedRequired;
    }

    public boolean isLastItem() {
        return lastItem;
    }

    public void setLastItem(boolean lastItem) {
        this.lastItem = lastItem;
    }

    public boolean isChecked() {
        return isChecked;
    }

    public void setChecked(boolean checked) {
        isChecked = checked;
    }

    public String getChildName() {
        return childName;
    }

    public void setChildName(String childName) {
        this.childName = childName;
    }

    public String getPriceAddOns() {
        return priceAddOns;
    }

    public void setPriceAddOns(String priceAddOns) {
        this.priceAddOns = priceAddOns;
    }

    public String getMenuExtraChildid() {
        return menuExtraChildid;
    }

    public void setMenuExtraChildid(String menuExtraChildid) {
        this.menuExtraChildid = menuExtraChildid;
    }

    public String getActive() {
        return active;
    }

    public void setActive(String active) {
        this.active = active;
    }

    public int getLayoutId() {
        return R.layout.childexpandlistview;
    }
}
