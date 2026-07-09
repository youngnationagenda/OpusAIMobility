package com.terraai.aimobility;

public class Constants {

    // ─── API Configuration ────────────────────────────────────────────────────
    // Auth is Cognito JWT only (TERRA-002: API key fallback removed server-side)
    // WAF-protected CloudFront proxy — all client traffic must go through here (REQ-001)
    public static final String BASE_URL = "https://d22up4o3zhu9gf.cloudfront.net/";

    // ─── API Base Link ────────────────────────────────────────────────────────
    public static final String APILINK = Constants.BASE_URL + "api/";

    // ─── App Links ────────────────────────────────────────────────────────────
    public static final String TERMS_CONDITIONS = APILINK + "getHtmlPage?name=terms_conditions";
    public static final String HELP_URL         = APILINK + "getHelp";
    public final static String PRIVACY_POLICY   = APILINK + "getHtmlPage?name=privacy_policy";

    // ─── Logging ──────────────────────────────────────────────────────────────
    public final static String TAG = "aimobility_";

    // ─── Defaults ─────────────────────────────────────────────────────────────
    public final static String defaultCurrency       = "KSh";
    public final static String defaultCountryName    = "KENYA";
    public final static String defaultCountryCode    = "+254";
    public final static String defaultCountryISOCode = "KE";
    public final static String defaultCountryId      = "1";

    // ─── Auth Modes ───────────────────────────────────────────────────────────
    public final static String fromSocial = "fromSocial";
    public final static String fromEmail  = "fromEmail";
    public final static String fromPhone  = "fromPhone";

    // ─── Map ──────────────────────────────────────────────────────────────────
    public final static String STATIC_MAP_MARKER_LINK = "https://buyclothesproducts.000webhostapp.com/images/locationp.png";

    // ─── Support ──────────────────────────────────────────────────────────────
    public final static String SUPPORT_EMAIL = "support@opusaimobility.com";
    public static final String PHONE_NO      = "+254700000001";

    // ─── Flags ────────────────────────────────────────────────────────────────
    public static final boolean IS_TOAST_ENABLE   = true;
    public final static boolean IS_SECUREINFO     = false;
    public final static boolean ALLOW_ROUTE_MUTIPLE = true;

    // ─── Map / Ride Settings ──────────────────────────────────────────────────
    public static float maxZoomLevel          = 16;
    public static double radiusToFindDriver   = 15.0;
    public static double radiusToFavPlace     = 100;
    public static int timeForScheculeRide     = 30;
    public static int timeForScheculeFood     = 45;

}
