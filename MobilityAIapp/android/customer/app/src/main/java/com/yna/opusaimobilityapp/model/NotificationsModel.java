package com.yna.opusaimobilityapp.model;

import java.io.Serializable;

public class NotificationsModel implements Serializable {

    String title ;
    String message ;
    String date ;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
