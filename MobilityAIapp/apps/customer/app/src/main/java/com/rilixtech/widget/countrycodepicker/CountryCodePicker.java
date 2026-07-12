package com.rilixtech.widget.countrycodepicker;
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
