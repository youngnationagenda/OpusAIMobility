package com.terraai.aimobility.model;


import com.terraai.aimobility.R;

import java.io.Serializable;
import java.util.ArrayList;

public class ParentExpandListModel implements Serializable {
    public String parentName;
    public String parentId;
    public String isRequired;
    public String active;
    ArrayList<ChildExpandListModel> ChildExpandListModel;

    public ParentExpandListModel() {

    }

    public String getIsRequired() {
        return isRequired;
    }

    public void setIsRequired(String isRequired) {
        this.isRequired = isRequired;
    }

    public String getActive() {
        return active;
    }

    public void setActive(String active) {
        this.active = active;
    }

    public ArrayList<ChildExpandListModel> getChildExpandListModel() {
        return ChildExpandListModel;
    }

    public void setChildExpandListModel(ArrayList<ChildExpandListModel> childExpandListModel) {
        ChildExpandListModel = childExpandListModel;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String parentName) {
        this.parentName = parentName;
    }

    public int getLayoutId() {
        return R.layout.parentexpandview;
    }
}
