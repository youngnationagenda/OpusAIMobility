package com.yna.opusaimobilityapp.model;

import java.io.Serializable;

public class LanguageModel implements Serializable {
    String name,key;

    public LanguageModel() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

}

