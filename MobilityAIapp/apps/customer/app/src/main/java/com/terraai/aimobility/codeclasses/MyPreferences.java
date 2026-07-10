package com.terraai.aimobility.codeclasses;


import android.content.Context;
import android.content.SharedPreferences;

public class MyPreferences {

    public final static String USER_ID = "user_Id";
    public static SharedPreferences downloadSharedPreferences;
    public static SharedPreferences mPrefs;
    public static String prefName = "login_detail";
    public static String loginType = "loginType";
    public static String isLogin = "isLogin";
    public static String downloadPref = "download_pref";
    public static String myCurrentLat = "my_current_lat";
    public static String myCurrentLng = "my_current_lng";
    public static String myCurrentFoodLng = "my_current_lat_food";
    public static String myCurrentFoodLat = "my_current_lng_food";
    public static String flat = "flat";
    public static String chatRecieverId = "chat_reciever_id";
    public static String uToken = "u_token";
    public static String openedChatId = "null";
    public static String fname = "First_name";
    public static String lname = "Last_name";
    public static String email = "email";
    public static String image = "image";
    public static String phoneNo = "Phone_no";
    public static String gender = "gender";
    public static String driverId = "driver_id";
    public static String dob = "dob";
    public static String setLocale = "set_locale";
    public static String isloginwithSocail = "isloginwithfb";
    public static String setlocale = "setlocale";
    public static String deviceTokon = "device_tokon";
    public static String password = "password";
    public static String created = "created";
    public static String role = "role";

    public static String countryId = "country_id";
    public static String countryName = "country_name";
    public static String country_code = "country_code";
    public static String countryIsoCode = "countryIsoCode";

    public static String wallet = "wallet";
    public static String userName = "username";
    public static String currencyUnit = "currency_unit";
    public static String KEY_LOCALE_NAME = "user_locale_name";

    public static SharedPreferences getSharedPreference(Context context) {
        if (mPrefs != null)
            return mPrefs;
        else
            return mPrefs = context.getSharedPreferences(prefName, Context.MODE_PRIVATE);
    }


}
