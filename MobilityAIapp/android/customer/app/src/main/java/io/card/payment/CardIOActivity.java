package io.card.payment;
import android.app.Activity;
import android.os.Bundle;
/** Stub for card.io CardIOActivity. */
public class CardIOActivity extends Activity {
    public static final String EXTRA_APP_TOKEN = "io.card.payment.appToken";
    public static final String EXTRA_REQUIRE_CVV = "io.card.payment.requireCVV";
    public static final String EXTRA_REQUIRE_EXPIRY = "io.card.payment.requireExpiry";
    public static final String EXTRA_REQUIRE_POSTAL_CODE = "io.card.payment.requirePostalCode";
    public static final String EXTRA_RESULT_CARD_INFO = "io.card.payment.result.cardInfo";
    public static final String EXTRA_REQUIRE_CARDHOLDER_NAME = "io.card.payment.requireCardholderName";
    @Override protected void onCreate(Bundle b) { super.onCreate(b); finish(); }
}
