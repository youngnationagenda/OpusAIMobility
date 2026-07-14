package com.yna.opusaimobilityapp.model;

import java.io.Serializable;

public class PaymentMethodsModel implements Serializable {

    String cardName;
    String cardFour;
    String userName;
    String cardId;
    String date;

    public String getCardFour() {
        return cardFour;
    }

    public void setCardFour(String cardFour) {
        this.cardFour = cardFour;
    }

    public String getCardId() {
        return cardId;
    }

    public void setCardId(String cardId) {
        this.cardId = cardId;
    }

    public String getCardName() {
        return cardName;
    }

    public void setCardName(String cardName) {
        this.cardName = cardName;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
