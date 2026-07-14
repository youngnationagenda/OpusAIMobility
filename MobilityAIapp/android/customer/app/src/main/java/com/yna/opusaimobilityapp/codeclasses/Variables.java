package com.yna.opusaimobilityapp.codeclasses;

import java.text.SimpleDateFormat;
import java.util.Locale;

public class Variables {

    public  static  String deliveryType = "";

    public static final String PACKAGE_URL_SCHEME = "package:";

    public final static String foodImageUrl = "https://images.pexels.com/photos/3186654/pexels-photo-3186654.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

    public static SimpleDateFormat dateFormat = new SimpleDateFormat("dd-MM-yyyy HH:mm:ssZZ", Locale.ENGLISH);
    public static SimpleDateFormat dateFormat1 = new SimpleDateFormat("dd-MM-yyyy HH:mmZZ", Locale.ENGLISH);
    public static String df1Pattern = "yyyy-MM-dd HH:mm:ss";
    public static final String DEFAULT_LANGUAGE_CODE = "en";
    public static final String emptyTime = "0000-00-00 00:00:00";

}
