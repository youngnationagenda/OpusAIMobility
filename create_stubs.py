"""Create all missing Android stub classes for OpusAIMobility release build."""
import os

def write_stub(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  Created: {path.split('main/java/')[-1]}")

BASE = "MobilityAIapp/apps/customer/app/src/main/java/"

stubs = {
    # ── LinkBuilder ────────────────────────────────────────────────────────────
    "com/klinker/android/link_builder/Link.java": """package com.klinker.android.link_builder;
import android.text.TextPaint;
import android.text.style.ClickableSpan;
import android.view.View;
/** Stub for klinker/Android-Link-Builder. */
public class Link extends ClickableSpan {
    public interface OnClickListener { void onClick(String text); }
    public interface OnLongClickListener { void onLongClick(String text); }
    private final String pattern;
    public Link(String pattern) { this.pattern = pattern; }
    public Link setOnClickListener(OnClickListener l) { return this; }
    public Link setOnLongClickListener(OnLongClickListener l) { return this; }
    public Link setTextColor(int color) { return this; }
    public Link setTextColorOfHighlightedLink(int color) { return this; }
    public Link setBold(boolean bold) { return this; }
    public Link setUnderline(boolean underline) { return this; }
    @Override public void onClick(View widget) {}
    @Override public void updateDrawState(TextPaint ds) {}
    public String getText() { return pattern; }
}
""",
    "com/klinker/android/link_builder/LinkBuilder.java": """package com.klinker.android.link_builder;
import android.text.SpannableString;
import android.widget.TextView;
/** Stub for klinker/Android-Link-Builder. */
public class LinkBuilder {
    private final TextView textView;
    private LinkBuilder(TextView tv) { this.textView = tv; }
    public static LinkBuilder on(TextView tv) { return new LinkBuilder(tv); }
    public LinkBuilder addLink(Link link) { return this; }
    public void build() {}
    public static SpannableString applyLinks(TextView tv, Link... links) {
        return new SpannableString(tv.getText());
    }
}
""",
    # ── Card.io ────────────────────────────────────────────────────────────────
    "io/card/payment/CardIOActivity.java": """package io.card.payment;
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
""",
    "io/card/payment/CreditCard.java": """package io.card.payment;
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
""",
    # ── Edmodo Cropper ─────────────────────────────────────────────────────────
    "com/theartofdev/edmodo/cropper/CropImage.java": """package com.theartofdev.edmodo.cropper;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.fragment.app.Fragment;
/** Stub for ArthurHub/Android-Image-Cropper (theartofdev.edmodo). */
public class CropImage {
    public static final int CROP_IMAGE_ACTIVITY_REQUEST_CODE = 203;
    public static final int CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE = 204;
    public static ActivityBuilder activity() { return new ActivityBuilder(); }
    public static ActivityBuilder activity(Uri uri) { return new ActivityBuilder(); }
    public static class ActivityBuilder {
        public ActivityBuilder setAspectRatio(int x, int y) { return this; }
        public ActivityBuilder setFixAspectRatio(boolean fix) { return this; }
        public ActivityBuilder setCropShape(CropImageView.CropShape shape) { return this; }
        public ActivityBuilder setRequestedSize(int w, int h) { return this; }
        public void start(Activity activity) {}
        public void start(Context ctx, Fragment fragment) {}
        public Intent getIntent(Context context) { return new Intent(); }
    }
    public static class ActivityResult {
        public Uri getUri() { return null; }
        public Exception getError() { return null; }
    }
    public static ActivityResult getActivityResult(Intent data) { return new ActivityResult(); }
}
""",
    "com/theartofdev/edmodo/cropper/CropImageView.java": """package com.theartofdev.edmodo.cropper;
import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;
/** Stub for ArthurHub/Android-Image-Cropper (theartofdev.edmodo). */
public class CropImageView extends FrameLayout {
    public enum CropShape { RECTANGLE, OVAL }
    public CropImageView(Context ctx) { super(ctx); }
    public CropImageView(Context ctx, AttributeSet attrs) { super(ctx, attrs); }
    public CropImageView(Context ctx, AttributeSet attrs, int def) { super(ctx, attrs, def); }
    public void setAspectRatio(int x, int y) {}
    public void setFixedAspectRatio(boolean fixed) {}
    public void setCropShape(CropShape shape) {}
    public android.net.Uri getCroppedImageUri() { return null; }
}
""",
    # ── RiLiXTech CountryCodePicker ───────────────────────────────────────────
    "com/rilixtech/widget/countrycodepicker/CountryCodePicker.java": """package com.rilixtech.widget.countrycodepicker;
import android.content.Context;
import android.util.AttributeSet;
import android.widget.RelativeLayout;
/** Stub for hbb20 CCP (rilixtech package name variant). */
public class CountryCodePicker extends RelativeLayout {
    public CountryCodePicker(Context ctx) { super(ctx); }
    public CountryCodePicker(Context ctx, AttributeSet a) { super(ctx, a); }
    public CountryCodePicker(Context ctx, AttributeSet a, int d) { super(ctx, a, d); }
    public String getSelectedCountryCode() { return "+254"; }
    public String getSelectedCountryNameCode() { return "KE"; }
    public void setCountryForPhoneCode(int code) {}
    public void setAutoDetectedCountry(boolean auto) {}
    public void setDefaultCountryUsingNameCode(String code) {}
    public void setCustomMasterCountries(String codes) {}
}
""",
    # ── Google Maps API (GeoApiContext + DirectionsApi) ───────────────────────
    "com/google/maps/GeoApiContext.java": """package com.google.maps;
/** Stub for com.google.maps:google-maps-services GeoApiContext. */
public class GeoApiContext {
    public static class Builder {
        public Builder apiKey(String key) { return this; }
        public GeoApiContext build() { return new GeoApiContext(); }
        public Builder queryRateLimit(int limit) { return this; }
        public Builder connectTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
        public Builder readTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
        public Builder writeTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
        public Builder retryTimeout(long timeout, java.util.concurrent.TimeUnit unit) { return this; }
    }
    public void shutdown() {}
}
""",
    "com/google/maps/DirectionsApi.java": """package com.google.maps;
import com.google.maps.model.DirectionsResult;
import com.google.maps.model.TravelMode;
import com.google.maps.model.TrafficModel;
/** Stub for com.google.maps:google-maps-services DirectionsApi. */
public class DirectionsApi {
    public static DirectionsApiRequest newRequest(GeoApiContext ctx) {
        return new DirectionsApiRequest();
    }
    public static class DirectionsApiRequest {
        public DirectionsApiRequest origin(String origin) { return this; }
        public DirectionsApiRequest destination(String destination) { return this; }
        public DirectionsApiRequest mode(TravelMode mode) { return this; }
        public DirectionsApiRequest trafficModel(TrafficModel model) { return this; }
        public DirectionsResult await() { return new DirectionsResult(); }
    }
}
""",
    "com/google/maps/android/PolyUtil.java": """package com.google.maps.android;
import java.util.ArrayList;
import java.util.List;
/** Stub for maps-utils PolyUtil. */
public class PolyUtil {
    public static List<com.google.android.gms.maps.model.LatLng> decode(String encodedPath) {
        return new ArrayList<>();
    }
    public static boolean containsLocation(double lat, double lng, 
            List<com.google.android.gms.maps.model.LatLng> polygon, boolean geodesic) {
        return false;
    }
}
""",
}

print("Creating stubs...")
for rel_path, content in stubs.items():
    write_stub(BASE + rel_path, content)

print(f"\nCreated {len(stubs)} stub files")
