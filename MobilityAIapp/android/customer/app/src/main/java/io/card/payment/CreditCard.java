package io.card.payment;
import android.os.Parcel;
import android.os.Parcelable;
/** Stub for card.io CreditCard. */
public class CreditCard implements Parcelable {
    public String cardNumber;
    public int expiryMonth;
    public int expiryYear;
    public String cvv;
    public String postalCode;
    public String cardholderName;
    public String getFormattedCardNumber() { return cardNumber != null ? cardNumber : ""; }
    @Override public int describeContents() { return 0; }
    @Override public void writeToParcel(Parcel dest, int flags) {}
    public static final Creator<CreditCard> CREATOR = new Creator<CreditCard>() {
        @Override public CreditCard createFromParcel(Parcel in) { return new CreditCard(); }
        @Override public CreditCard[] newArray(int size) { return new CreditCard[size]; }
    };
}
