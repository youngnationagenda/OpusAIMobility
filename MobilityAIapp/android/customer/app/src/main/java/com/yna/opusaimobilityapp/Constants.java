package com.yna.opusaimobilityapp;

/**
 * OpusAIMobility — App-wide constants.
 *
 * All network traffic is routed through the AWS CloudFront WAF proxy
 * (opusaimobility infrastructure). No direct calls to Firebase/PHP backend.
 *
 * ─── AWS Infrastructure ──────────────────────────────────────────────────────
 *  CloudFront endpoint : https://opusaimobility.yna.co.ke/
 *  Cognito User Pool   : us-east-1_LKa4ElQem
 *  Cognito App Client  : 3a207uin5o3p4k1ngk334crntl
 *  Identity Pool       : us-east-1:a89c4453-5965-4a4e-97c7-3ba1a99cdd38
 *  WebSocket           : wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod
 *  S3 Uploads bucket   : aimobility-uploads-683541453923
 */
public class Constants {

    // ─── Primary AWS API (WAF-protected CloudFront proxy) ──────────────────────
    public static final String BASE_URL = "https://opusaimobility.yna.co.ke/";
    public static final String APILINK  = Constants.BASE_URL + "api/";

    // ─── Legacy API_KEY field kept for Singleton compatibility (not used) ──────
    // Auth is Cognito JWT only — no plain API keys.
    public static final String API_KEY  = "";

    // ─── App Policy Links ─────────────────────────────────────────────────────
    public static final String TERMS_CONDITIONS = APILINK + "getHtmlPage?name=terms_conditions";
    public static final String HELP_URL         = APILINK + "getHelp";
    public final static String PRIVACY_POLICY   = APILINK + "getHtmlPage?name=privacy_policy";

    // ─── AWS Cognito ──────────────────────────────────────────────────────────
    public static final String COGNITO_REGION        = "us-east-1";
    public static final String COGNITO_USER_POOL_ID  = "us-east-1_LKa4ElQem";
    public static final String COGNITO_APP_CLIENT_ID = "3a207uin5o3p4k1ngk334crntl";
    public static final String COGNITO_IDENTITY_POOL = "us-east-1:a89c4453-5965-4a4e-97c7-3ba1a99cdd38";

    // ─── AWS WebSocket (real-time notifications, replaces FCM) ───────────────
    public static final String WS_ENDPOINT = "wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod";

    // ─── AWS S3 Uploads ───────────────────────────────────────────────────────
    public static final String S3_BUCKET = "aimobility-uploads-683541453923";
    public static final String S3_REGION = "us-east-1";

    // ─── SNS Notifications ───────────────────────────────────────────────────
    public static final String SNS_TOPIC = "arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications";

    // ─── Logging ─────────────────────────────────────────────────────────────
    public final static String TAG = "OpusAIMobility_";

    // ─── Localisation defaults (Kenya) ───────────────────────────────────────
    public final static String defaultCurrency       = "KSh";
    public final static String defaultCountryName    = "KENYA";
    public final static String defaultCountryCode    = "+254";
    public final static String defaultCountryISOCode = "KE";
    public final static String defaultCountryId      = "1";

    // ─── Auth mode keys ───────────────────────────────────────────────────────
    public final static String fromSocial = "fromSocial";
    public final static String fromEmail  = "fromEmail";
    public final static String fromPhone  = "fromPhone";

    // ─── Map marker ──────────────────────────────────────────────────────────
    public final static String STATIC_MAP_MARKER_LINK = "https://buyclothesproducts.000webhostapp.com/images/locationp.png";

    // ─── Support ─────────────────────────────────────────────────────────────
    public final static String SUPPORT_EMAIL = "support@opusaimobility.com";
    public static final String PHONE_NO      = "+254700000001";

    // ─── Feature flags ───────────────────────────────────────────────────────
    public static final boolean IS_TOAST_ENABLE      = true;
    public final static boolean IS_SECUREINFO        = false;
    public final static boolean ALLOW_ROUTE_MUTIPLE  = true;

    // ─── Ride / map settings ─────────────────────────────────────────────────
    public static float  maxZoomLevel        = 16;
    public static double radiusToFindDriver  = 15.0;
    public static double radiusToFavPlace    = 100;
    public static int    timeForScheculeRide = 30;
    public static int    timeForScheculeFood = 45;
}
