package com.opusaimobility.driver;

/**
 * OpusAIMobility Driver App — Global Constants
 *
 * All network traffic routes through AWS CloudFront WAF proxy.
 * Backend: terraaimobility-api Lambda (nodejs22.x) on API Gateway pg4ulam66a
 *
 * ─── AWS Infrastructure ──────────────────────────────────────────────────────
 *  CloudFront (WAF proxy) : https://opusaimobility.yna.co.ke/
 *  API Gateway (direct)   : https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/
 *  Admin API              : https://wqhukwpxqc.execute-api.us-east-1.amazonaws.com/prod/
 *  Cognito User Pool      : us-east-1_LKa4ElQem   (terraaimobility-production)
 *  Cognito App Client     : 2am01r4fmsp0s08991ftgub887  (terraaimobility-android)
 *  Cognito Identity Pool  : us-east-1:a89c4453-5965-4a4e-97c7-3ba1a99cdd38
 *  Cognito Hosted UI      : https://auth-opusaimobility.auth.us-east-1.amazoncognito.com
 *  WebSocket (AWS)        : wss://z4sof7ojdf.execute-api.us-east-1.amazonaws.com/prod
 *  S3 Assets bucket       : opusaimobility-assets-prod
 *  SNS topic              : arn:aws:sns:us-east-1:683541453923:opusaimobility-notifications
 *  IoT endpoint           : arqymixni12gc-ats.iot.us-east-1.amazonaws.com
 *  Firebase project       : opusaimobility
 */
public class Constants {

    // ── Primary API (CloudFront WAF-protected) ────────────────────────────────
    public static final String BASE_URL    = BuildConfig.BASE_URL;
    public static final String API_URL     = BuildConfig.API_URL;

    // ── Direct API Gateway (fallback / admin) ─────────────────────────────────
    public static final String API_GATEWAY = BuildConfig.API_GATEWAY_URL;
    public static final String ADMIN_API   = BuildConfig.ADMIN_API_URL;

    // ── No plain API key — Cognito JWT is sole auth mechanism ─────────────────
    public static final String API_KEY     = "";

    // ── AWS Cognito ───────────────────────────────────────────────────────────
    public static final String COGNITO_REGION        = BuildConfig.COGNITO_REGION;
    public static final String COGNITO_USER_POOL_ID  = BuildConfig.COGNITO_USER_POOL_ID;
    public static final String COGNITO_CLIENT_ID     = BuildConfig.COGNITO_CLIENT_ID;
    public static final String COGNITO_IDENTITY_POOL = BuildConfig.COGNITO_IDENTITY_POOL;

    // ── AWS WebSocket ─────────────────────────────────────────────────────────
    public static final String WS_ENDPOINT = BuildConfig.WS_ENDPOINT;

    // ── AWS S3 ────────────────────────────────────────────────────────────────
    public static final String S3_BUCKET   = BuildConfig.S3_BUCKET;
    public static final String S3_REGION   = BuildConfig.S3_REGION;
    public static final String CDN_BASE    = "https://" + S3_BUCKET + ".s3." + S3_REGION + ".amazonaws.com";

    // ── AWS SNS ───────────────────────────────────────────────────────────────
    public static final String SNS_TOPIC   = BuildConfig.SNS_TOPIC;

    // ── AWS IoT Core (real-time driver telemetry & MQTT) ─────────────────────
    public static final String IOT_ENDPOINT = BuildConfig.IOT_ENDPOINT;

    // ── App-specific API endpoints ────────────────────────────────────────────
    public static final String ENDPOINT_LOGIN            = API_URL + "login";
    public static final String ENDPOINT_REGISTER         = API_URL + "registerUser";
    public static final String ENDPOINT_SEND_OTP         = API_URL + "sendOtp";
    public static final String ENDPOINT_VERIFY_OTP       = API_URL + "verifyOtp";
    public static final String ENDPOINT_FORGOT_PASSWORD  = API_URL + "forgotPassword";
    public static final String ENDPOINT_PROFILE          = API_URL + "getUserProfile";
    public static final String ENDPOINT_UPDATE_PROFILE   = API_URL + "editProfile";
    public static final String ENDPOINT_CHANGE_PASSWORD  = API_URL + "changePassword";
    public static final String ENDPOINT_UPDATE_FCM_TOKEN = API_URL + "updateFcmToken";
    public static final String ENDPOINT_UPLOAD_ASSET     = API_URL + "upload";
    public static final String ENDPOINT_RIDE_TYPES       = API_URL + "getRideTypes";
    public static final String ENDPOINT_RIDE_HISTORY     = API_URL + "getRideHistory";
    public static final String ENDPOINT_SETTINGS         = API_URL + "getSettings";
    public static final String ENDPOINT_COUNTRIES        = API_URL + "showCountries";
    public static final String ENDPOINT_NOTIFICATIONS    = API_URL + "getNotifications";
    public static final String ENDPOINT_ESTIMATE_FARE    = API_URL + "estimateFare";
    public static final String ENDPOINT_NEARBY_DRIVERS   = API_URL + "getNearbyDrivers";
    public static final String ENDPOINT_TRACK_DRIVER     = API_URL + "trackDriver";
    public static final String ENDPOINT_FOOD_ORDERS      = API_URL + "getFoodOrders";
    public static final String ENDPOINT_UPDATE_ORDER     = API_URL + "updateOrderStatus";
    public static final String ENDPOINT_PARCEL_ORDERS    = API_URL + "showParcelOrders";
    public static final String ENDPOINT_PARCEL_STATUS    = API_URL + "parcel_changeStatus";
    public static final String ENDPOINT_GOOD_TYPES       = API_URL + "getGoodTypes";
    public static final String ENDPOINT_REPORT_REASONS   = API_URL + "getReportReasons";
    public static final String ENDPOINT_SERVICE_CHARGES  = API_URL + "getServiceCharges";

    // ── Policy links ──────────────────────────────────────────────────────────
    public static final String TERMS_CONDITIONS = API_URL + "getHtmlPage?name=terms_conditions";
    public static final String PRIVACY_POLICY   = API_URL + "getHtmlPage?name=privacy_policy";
    public static final String HELP_URL         = API_URL + "getHelp";

    // ── App role ──────────────────────────────────────────────────────────────
    public static final String APP_ROLE     = BuildConfig.APP_ROLE;   // "driver"
    public static final String ROLE_DRIVER  = "driver";
    public static final String ROLE_RIDER   = "rider";

    // ── Localisation (Kenya defaults) ─────────────────────────────────────────
    public static final String DEFAULT_CURRENCY        = "KSh";
    public static final String DEFAULT_CURRENCY_CODE   = "KES";
    public static final String DEFAULT_COUNTRY_NAME    = "Kenya";
    public static final String DEFAULT_COUNTRY_CODE    = "+254";
    public static final String DEFAULT_COUNTRY_ISO     = "KE";
    public static final String DEFAULT_COUNTRY_ID      = "1";

    // ── Support ───────────────────────────────────────────────────────────────
    public static final String SUPPORT_EMAIL = "support@opusaimobility.yna.co.ke";
    public static final String SUPPORT_PHONE = "+254700000001";

    // ── SharedPreferences keys ────────────────────────────────────────────────
    public static final String PREFS_NAME        = "DriverPrefs";
    public static final String KEY_USER_ID       = "user_id";
    public static final String KEY_TOKEN         = "id_token";
    public static final String KEY_ACCESS_TOKEN  = "access_token";
    public static final String KEY_REFRESH_TOKEN = "refresh_token";
    public static final String KEY_FCM_TOKEN     = "fcm_token";
    public static final String KEY_USER_DATA     = "user_data";
    public static final String KEY_IS_ONLINE     = "is_online";
    public static final String KEY_FIRST_LAUNCH  = "first_launch";

    // ── Notification channels ─────────────────────────────────────────────────
    public static final String CHANNEL_RIDES       = "ride_requests";
    public static final String CHANNEL_DELIVERIES  = "delivery_requests";
    public static final String CHANNEL_GENERAL     = "general";
    public static final String CHANNEL_TRACKING    = "location_tracking";

    // ── Location tracking ─────────────────────────────────────────────────────
    public static final int    LOCATION_UPDATE_INTERVAL_MS      = 5000;   // 5 sec
    public static final int    LOCATION_FASTEST_INTERVAL_MS     = 3000;   // 3 sec
    public static final float  LOCATION_MIN_DISTANCE_METERS     = 10f;    // 10m
    public static final int    LOCATION_TRACKING_NOTIFICATION_ID = 1001;

    // ── Map ───────────────────────────────────────────────────────────────────
    public static final float  MAP_DEFAULT_ZOOM   = 15f;
    public static final double DEFAULT_LAT        = -1.2921;   // Nairobi, Kenya
    public static final double DEFAULT_LNG        = 36.8219;

    // ── WebSocket actions ─────────────────────────────────────────────────────
    public static final String WS_ACTION_CONNECT        = "connect";
    public static final String WS_ACTION_RIDE_REQUEST   = "ride_request";
    public static final String WS_ACTION_RIDE_CANCEL    = "ride_cancel";
    public static final String WS_ACTION_DELIVERY_REQ   = "delivery_request";
    public static final String WS_ACTION_LOCATION_UPDATE= "location_update";
    public static final String WS_ACTION_DRIVER_ONLINE  = "driver_online";
    public static final String WS_ACTION_DRIVER_OFFLINE = "driver_offline";

    // ── Request timeouts ─────────────────────────────────────────────────────
    public static final int    HTTP_CONNECT_TIMEOUT = 30;   // seconds
    public static final int    HTTP_READ_TIMEOUT    = 60;   // seconds
    public static final int    HTTP_WRITE_TIMEOUT   = 30;   // seconds

    // ── Ride request acceptance window ────────────────────────────────────────
    public static final int    RIDE_REQUEST_TIMEOUT_SEC   = 30;
    public static final int    DELIVERY_REQUEST_TIMEOUT_SEC = 30;

    // ── Log tag ───────────────────────────────────────────────────────────────
    public static final String TAG = "DriverApp_";
}
