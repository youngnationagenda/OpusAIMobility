package com.yna.opusaimobilityapp.model;

import java.io.Serializable;

public class TypesOfItemModel implements Serializable {

    String itemName;
    String id;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }
}
