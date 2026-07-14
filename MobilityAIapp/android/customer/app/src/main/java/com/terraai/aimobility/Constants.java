package com.terraai.aimobility;

public class Constants {

    // API Configuration
    // Auth is Cognito JWT only (TERRA-002: API key fallback removed server-side)
    // WAF-protected CloudFront proxy - all client traffic must go through here (REQ-001)
    public static final String BASE_URL = "https://opusaimobility.yna.co.ke/";

    // API Base Link
    public static final String APILINK = Constants.BASE_URL + "api/";

    // AWS Cognito
    public static final String COGNITO_REGION        = "us-east-1";
    public static final String COGNITO_USER_POOL_ID  = "us-east-1_LKa4ElQem";
    public static final String COGNITO_APP_CLIENT_ID = "2am01r4fmsp0s08991ftgub887"; // terraaimobility-android
    public static final String COGNITO_IDENTITY_POOL = "us-east-1:a89c4453-5965-4a4e-97c7-3ba1a99cdd38";

    // AWS WebSocket
    public static final String WS_ENDPOINT = "wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod";

    // AWS S3 Assets
    public static final String S3_BUCKET    = "opusaimobility-assets-prod";
    public static final String S3_REGION    = "us-east-1";
    public static final String CDN_BASE_URL = "https://d22up4o3zhu9gf.cloudfront.net";
    public static final String UPLOAD_URL   = BASE_URL + "api/upload";

    // AWS SNS - account ID filled at runtime to avoid hardcoding in source
    public static final String SNS_TOPIC = "arn:aws:sns:us-east-1:<ACCOUNT_ID>:opusaimobility-notifications";

    // App Links
    public static final String TERMS_CONDITIONS = APILINK + "getHtmlPage?name=terms_conditions";
    public static final String HELP_URL         = APILINK + "getHelp";
    public final static String PRIVACY_POLICY   = APILINK + "getHtmlPage?name=privacy_policy";

    // Logging
    public final static String TAG = "aimobility_";

    // Defaults
    public final static String defaultCurrency       = "KSh";
    public final static String defaultCountryName    = "KENYA";
    public final static String defaultCountryCode    = "+254";
    public final static String defaultCountryISOCode = "KE";
    public final static String defaultCountryId      = "1";

    // Auth Modes
    public final static String fromSocial = "fromSocial";
    public final static String fromEmail  = "fromEmail";
    public final static String fromPhone  = "fromPhone";

    // Map
    public final static String STATIC_MAP_MARKER_LINK = "https://d22up4o3zhu9gf.cloudfront.net/assets/locationp.png";

    // Support
    public final static String SUPPORT_EMAIL = "support@opusaimobility.yna.co.ke";
    public static final String PHONE_NO      = "+254700000001";

    // Flags
    public static final boolean IS_TOAST_ENABLE   = true;
    public final static boolean IS_SECUREINFO     = false;
    public final static boolean ALLOW_ROUTE_MUTIPLE = true;

    // Map / Ride Settings
    public static float maxZoomLevel          = 16;
    public static double radiusToFindDriver   = 15.0;
    public static double radiusToFavPlace     = 100;
    public static int timeForScheculeRide     = 30;
    public static int timeForScheculeFood     = 45;

}
