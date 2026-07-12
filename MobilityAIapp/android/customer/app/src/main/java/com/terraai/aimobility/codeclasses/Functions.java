package com.terraai.aimobility.codeclasses;

import static com.terraai.aimobility.codeclasses.Variables.PACKAGE_URL_SCHEME;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.PorterDuff;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.location.Address;
import android.location.Geocoder;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Parcel;
import android.os.Parcelable;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.text.TextUtils;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.util.Log;
import android.util.Patterns;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewParent;
import android.view.Window;
import android.view.inputmethod.InputMethodManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import com.bumptech.glide.Glide;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentManager;

import com.google.android.material.datepicker.CalendarConstraints;
import com.google.android.material.datepicker.MaterialDatePicker;
import com.google.android.material.datepicker.MaterialPickerOnPositiveButtonClickListener;
import com.google.android.gms.maps.model.LatLng;
import com.terraai.aimobility.BuildConfig;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.Callback;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.model.ResturantModel;

import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.text.NumberFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class Functions {

    public static long currentdate;
    static Dialog dialog;
    static Dialog dialog1;
    static Integer todayDay = 0;
    static int year, month, day;

    public static void logDMsg(String Msg) {
        if (!Constants.IS_SECUREINFO && BuildConfig.DEBUG)
            Log.d(Constants.TAG, Msg);
    }

    //////////Show KEYBOARD
    public static void showKeyboard(Activity activity) {
        View view = activity.findViewById(android.R.id.content);
        if (view != null) {
            InputMethodManager imm = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
            imm.toggleSoftInput(InputMethodManager.SHOW_FORCED, 0);
        }
    }


    //show permission setting screen
    public static void showPermissionSetting(Context context,String type) {

        Functions.customAlertDialogDenied(context, type, new CallbackResponse() {
            @Override
            public void responce(String resp) {
                Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse(PACKAGE_URL_SCHEME + context.getPackageName()));
                context.startActivity(intent);
            }
        });
    }


    //    for get valid phone number
    public static String getValidPhoneNumber(String code,String PhoneNo) {
        String phoneNumber=PhoneNo;
        if (phoneNumber.charAt(0)=='0')
        {
            phoneNumber=phoneNumber.substring(1);
        }
        if (phoneNumber.charAt(0) != '+') {
            phoneNumber = "+"+phoneNumber;
        }
        String countryCode=code;
        countryCode=countryCode.replace("+","");
        phoneNumber = phoneNumber.replace("+" + countryCode, "");
        phoneNumber = phoneNumber.replace("+", "");
        phoneNumber = phoneNumber.replace(" ", "");
        phoneNumber = phoneNumber.replace("(", "");
        phoneNumber = phoneNumber.replace(")", "");
        phoneNumber = phoneNumber.replace("-", "");
        phoneNumber = "+" + countryCode + phoneNumber;
        return phoneNumber;
    }


    public static void setWidthAndHeight(Context context, View view, int width, int height) {
        view.setLayoutParams(new LinearLayout.LayoutParams(width, height));
    }

    public static @Nullable
    String toUpperInvariant(@Nullable String text) {
        return text == null ? text : text.toUpperCase(Locale.US);
    }

    public static String getCountryCode(@Nullable Context context) {
        if (context != null) {
            TelephonyManager telephonyManager =
                    (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (telephonyManager != null) {
                String countryCode = telephonyManager.getNetworkCountryIso();
                if (!TextUtils.isEmpty(countryCode)) {
                    return toUpperInvariant(countryCode);
                }
            }
        }

        String countryCode = MyPreferences.getSharedPreference(context).getString(MyPreferences.countryIsoCode, "");
        return toUpperInvariant(countryCode);
    }

    public static Bitmap getResizedBitmap(Bitmap bm, float newHeight, float newWidth) {
        int width = bm.getWidth();
        int height = bm.getHeight();
        float scaleWidth = ((float) newWidth) / width;
        float scaleHeight = ((float) newHeight) / height;
        Matrix matrix = new Matrix();
        matrix.postScale(scaleWidth, scaleHeight);
        return Bitmap.createBitmap(bm, 0, 0, width, height, matrix, false);
    }

    public static float calculateDistance(double lat1, double lng1, double lat2, double lng2) {

        double earthRadius = 6371000; //meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        float dist = (float) (earthRadius * c);

        return dist;
    }

    public static float calculateDistance(LatLng source, LatLng destination) {
        double lat1 = source.latitude;
        double lng1 = source.longitude;
        double lat2 = destination.latitude;
        double lng2 = destination.longitude;
        double earthRadius = 6371000; //meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        float dist = (float) (earthRadius * c);

        return dist;
    }

    public static String getVersion(Context context) {
        String version = null;
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            version = (pInfo).versionName;
        } catch (PackageManager.NameNotFoundException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        return version;
    }

    public static Double roundoffDecimal(Double value) {
        try {
            String patern = "##.##"; //your pattern as per need
            DecimalFormat decimalFormat = (DecimalFormat) NumberFormat.getNumberInstance(Locale.ENGLISH);
            decimalFormat.applyPattern(patern);
            return Double.valueOf(decimalFormat.format(value));
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    public static String convertBitmapToBase64(Bitmap bitmap) {

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
        byte[] byteArray = byteArrayOutputStream.toByteArray();
        String encoded = Base64.encodeToString(byteArray, Base64.DEFAULT);

        return encoded;
    }

    public static String getStaticMapViewUrl(Context context, String latitude, String longtitude) {
        StringBuilder stringBuilder = new StringBuilder();
        stringBuilder.append("https://maps.googleapis.com/maps/api/staticmap?center=");
        stringBuilder.append(latitude);
        stringBuilder.append(",");
        stringBuilder.append(longtitude);
        stringBuilder.append("&zoom=16&size=600x300&maptype=roadmap");
        stringBuilder.append("&markers=icon:");
        stringBuilder.append(Constants.STATIC_MAP_MARKER_LINK);
        stringBuilder.append("|");
        stringBuilder.append(latitude);
        stringBuilder.append(",");
        stringBuilder.append(longtitude);
        stringBuilder.append("&key=");
        stringBuilder.append(context.getString(R.string.google_map_key));
        return stringBuilder.toString();
    }

    public static boolean isValidPassword(final String password) {

        Pattern pattern;
        Matcher matcher;

        final String PASSWORD_PATTERN = "(?=.*?[0-9#?!@$%^&*-]).{8,}$";

        pattern = Pattern.compile(PASSWORD_PATTERN);
        matcher = pattern.matcher(password);

        return matcher.matches();

    }

    /*Convert Dp to Pixel for marker*/
    public static int convertDpToPx(Context context, int dp) {
        return (int) ((int) dp * context.getResources().getDisplayMetrics().density);
    }

    public static void showToast(Context context, String msg) {
        if (Constants.IS_TOAST_ENABLE) {
            Toast.makeText(context, "" + msg, Toast.LENGTH_SHORT).show();
        }
    }

    public static void customAlertDialogDenied(Context context, String fromWhere, final CallbackResponse callbackResponse) {
        final Dialog dialog = new Dialog(context);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.item_alert_dialouge_location_denied);
        dialog.getWindow().setBackgroundDrawable(ContextCompat.getDrawable(context,R.drawable.d_round_corner_white_bkg));

        TextView okBtn = dialog.findViewById(R.id.tvPositive);
        TextView cancelBtn = dialog.findViewById(R.id.tvNegative);
        TextView tvTwo = dialog.findViewById(R.id.tvTwo);
        TextView title = dialog.findViewById(R.id.title);

        if (fromWhere.equals("location")) {
            title.setText(context.getString(R.string.location_heading_denied_heading));
            tvTwo.setText(context.getString(R.string.location_heading_denied_step_2));
        } else if (fromWhere.equals("camera")) {
            title.setText(R.string.to_upload_image_permission_string);
            tvTwo.setText(context.getString(R.string.genral_permison));
        } else {
            title.setText(context.getString(R.string.to_upload_image_permission_string_1));
            tvTwo.setText(context.getString(R.string.genral_permison));
        }

        okBtn.setOnClickListener(view -> {
            callbackResponse.responce("okay");
            dialog.dismiss();
        });

        cancelBtn.setOnClickListener(view -> {
            dialog.dismiss();
        });

        dialog.show();
    }

    public static LatLng getCoordinate(double lat0, double lng0, long dy, long dx) {
        double lat = lat0 + (180 / Math.PI) * (dy / 6378137);
        double lng = lng0 + (180 / Math.PI) * (dx / 6378137) / Math.cos(lat0);
        return new LatLng(lat, lng);
    }

    //This method will show loader when getting data from server
    public static void showLoader(Context context, boolean outside_touch, boolean cancleable) {

        if (dialog1 != null) {
            cancelLoader();
            dialog1 = null;
        }
        {
            dialog1 = new Dialog(context);
            dialog1.requestWindowFeature(Window.FEATURE_NO_TITLE);
            dialog1.setContentView(R.layout.loader_dialog);
            dialog1.getWindow().setBackgroundDrawable(ContextCompat.getDrawable(context,R.drawable.d_round_corner_white_bkg));

            if (!outside_touch)
                dialog1.setCanceledOnTouchOutside(false);

            if (!cancleable)
                dialog1.setCancelable(false);

            dialog1.show();
        }

    }

    //This method will cancel the running loader
    public static void cancelLoader() {
        if (dialog1 != null) {
            dialog1.cancel();
            dialog1.dismiss();
        }
    }

    public static Bitmap getMarkerPickupPinView(Context context) {
        View customMarkerView = ((LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE)).inflate(R.layout.view_custom_pickup_marker, null);
        ImageView markerImageView = customMarkerView.findViewById(R.id.marker_layout);
        customMarkerView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        customMarkerView.layout(0, 0, customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight());
        customMarkerView.buildDrawingCache();
        Bitmap returnedBitmap = Bitmap.createBitmap(customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(returnedBitmap);
        canvas.drawColor(Color.WHITE, PorterDuff.Mode.SRC_IN);
        Drawable drawable = customMarkerView.getBackground();
        if (drawable != null)
            drawable.draw(canvas);
        customMarkerView.draw(canvas);
        return returnedBitmap;
    }

    public static Bitmap getMarkerDropPinView(Context context) {
        View customMarkerView = ((LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE)).inflate(R.layout.view_custom_drop_marker, null);
        ImageView markerImageView = customMarkerView.findViewById(R.id.marker_layout);
        customMarkerView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        customMarkerView.layout(0, 0, customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight());
        customMarkerView.buildDrawingCache();
        Bitmap returnedBitmap = Bitmap.createBitmap(customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(returnedBitmap);
        canvas.drawColor(Color.WHITE, PorterDuff.Mode.SRC_IN);
        Drawable drawable = customMarkerView.getBackground();
        if (drawable != null)
            drawable.draw(canvas);
        customMarkerView.draw(canvas);
        return returnedBitmap;
    }

    public static Bitmap getDriverPickUpView(Context context) {
        View customMarkerView = ((LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE)).inflate(R.layout.view_custom_driver_marker, null);
        ImageView markerImageView = customMarkerView.findViewById(R.id.marker_layout);
        customMarkerView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        customMarkerView.layout(0, 0, customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight());
        customMarkerView.buildDrawingCache();
        Bitmap returnedBitmap = Bitmap.createBitmap(customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(returnedBitmap);
        canvas.drawColor(Color.WHITE, PorterDuff.Mode.SRC_IN);
        Drawable drawable = customMarkerView.getBackground();
        if (drawable != null)
            drawable.draw(canvas);
        customMarkerView.draw(canvas);
        return returnedBitmap;
    }

    public static void hideSoftKeyboard(Activity activity) {
        InputMethodManager imm = (InputMethodManager) activity.getSystemService(Activity.INPUT_METHOD_SERVICE);
        View view = activity.getCurrentFocus();
        if (view == null) {
            view = new View(activity);
        }
        imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
    }

    public static void customAlertDialog(Context context, String title, String message, String buttonText,boolean isShowDouble, final CallbackResponse callbackResponse) {
        final Dialog dialog = new Dialog(context);
        dialog.setCancelable(true);
        dialog.setContentView(R.layout.show_defult_alert_popup_dialog);
        dialog.getWindow().setBackgroundDrawable(new ColorDrawable(android.graphics.Color.TRANSPARENT));

        final TextView txtYes, txtNo, txtTitle, txtMessage;
        txtTitle = dialog.findViewById(R.id.defult_alert_txt_title);
        txtMessage = dialog.findViewById(R.id.defult_alert_txt_message);
        txtNo = dialog.findViewById(R.id.defult_alert_btn_cancel_no);
        txtYes = dialog.findViewById(R.id.defult_alert_btn_cancel_yes);

        txtTitle.setText("" + title);
        txtMessage.setText("" + message);
        txtYes.setText(buttonText);
        txtYes.setOnClickListener(view -> {
            if(callbackResponse!=null)
            callbackResponse.responce("okay");

            dialog.dismiss();
        });


        if(!isShowDouble){
            txtNo.setVisibility(View.GONE);
        }else {
            txtNo.setOnClickListener(view -> dialog.dismiss());
        }

        dialog.show();
    }

    public static void dialouge(Context context, String title, String message) {

        if (dialog != null) {
            dialog.dismiss();
        }

        dialog = new Dialog(context);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.item_alert_dialouge);
        dialog.getWindow().setBackgroundDrawable(ContextCompat.getDrawable(context,R.drawable.d_round_corner_white_bkg));

        TextView headerTxt = dialog.findViewById(R.id.header_txt);
        TextView messageTxt = dialog.findViewById(R.id.alert_msg_txt);
        TextView okBtn = dialog.findViewById(R.id.ok_btn);
        headerTxt.setText(title);
        messageTxt.setText(message);

        okBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {

                dialog.dismiss();
            }
        });
        dialog.show();

    }

    public static void dialougeNotCanclled(Context context, String title, String message, CallbackResponse callback) {

        if (dialog != null) {
            dialog.dismiss();
        }

        dialog = new Dialog(context);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(R.layout.item_alert_dialouge);
        dialog.getWindow().setBackgroundDrawable(ContextCompat.getDrawable(context,R.drawable.d_round_corner_white_bkg));
        dialog.setCancelable(false);
        TextView headerTxt = dialog.findViewById(R.id.header_txt);
        TextView messageTxt = dialog.findViewById(R.id.alert_msg_txt);
        TextView okBtn = dialog.findViewById(R.id.ok_btn);
        headerTxt.setText(title);
        messageTxt.setText(message);

        okBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                callback.responce("yes");
                dialog.dismiss();
            }
        });
        dialog.show();

    }

    //  claer previous all support level fragments
    public static void clearFragment(FragmentManager fm) {
        try {

            for (int i = fm.getBackStackEntryCount() - 1; i >= 0; i--) {
                fm.popBackStack();
            }


        } catch (Exception e) {
            Log.e("aimobility", "Popbackstack error: " + e.getMessage());
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
    }

    /*Clear the Background of AlertDialogues */
    @SuppressLint("ResourceType")
    public static void clearBackgrounds(View view) {

        while (view != null) {
            view.setBackgroundResource(android.graphics.Color.TRANSPARENT);
            final ViewParent parent = view.getParent();
            if (parent instanceof View) {
                view = (View) parent;
            } else {
                view = null;
            }
        }
    }

    public static boolean isValidEmail(CharSequence target) {
        return (!TextUtils.isEmpty(target) && Patterns.EMAIL_ADDRESS.matcher(target).matches());
    }

    public static String getAddressString(Context context, double LATITUDE, double LONGITUDE) {
        String strAdd = "";
        Geocoder geocoder = new Geocoder(context, Locale.getDefault());
        try {
            List<Address> addresses = geocoder.getFromLocation(LATITUDE, LONGITUDE, 1);
            if (addresses != null) {
                Address returnedAddress = addresses.get(0);
                StringBuilder strReturnedAddress = new StringBuilder("");
                strReturnedAddress.append(returnedAddress.getAddressLine(0));
                strAdd = strReturnedAddress.toString();
            }
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        return strAdd;
    }

    public static String getAddressSubString(Context context, LatLng latLng) {
        String strAdd = "";
        double LATITUDE = latLng.latitude;
        double LONGITUDE = latLng.longitude;
        Geocoder geocoder = new Geocoder(context, Locale.getDefault());
        try {
            List<Address> addresses = geocoder.getFromLocation(LATITUDE, LONGITUDE, 1);
            if (addresses != null) {
                Address returnedAddress = addresses.get(0);
                StringBuilder strReturnedAddress = new StringBuilder("");
                strReturnedAddress.append(returnedAddress.getSubLocality());
                strAdd = strReturnedAddress.toString();
            }
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        return strAdd;
    }

    @SuppressLint("WrongConstant")
    public static float getDPToPixels(int i) {
        return TypedValue.applyDimension(1, (float) i, AiMobilityApp.getAppContext().getResources().getDisplayMetrics());
    }

    public static String getPermissionStatus(Activity activity, String androidPermissionName) {
        if (ContextCompat.checkSelfPermission(activity, androidPermissionName) != PackageManager.PERMISSION_GRANTED) {
            if (!ActivityCompat.shouldShowRequestPermissionRationale(activity, androidPermissionName)) {
                return "blocked";
            }
            return "denied";
        }
        return "granted";
    }

    public static void showDoubleButtonAlert(Context context, String title, String message, String negTitle, String posTitle, boolean isCancelable, FragmentCallBack callBack) {
        final Dialog dialog = new Dialog(context);
        dialog.setCancelable(isCancelable);
        dialog.setContentView(R.layout.show_double_button_new_popup_dialog);
        dialog.getWindow().setBackgroundDrawable(new ColorDrawable(android.graphics.Color.TRANSPARENT));

        final TextView tvtitle, tvMessage, tvPositive, tvNegative;
        tvtitle = dialog.findViewById(R.id.tvtitle);
        tvMessage = dialog.findViewById(R.id.tvMessage);
        tvNegative = dialog.findViewById(R.id.tvNegative);
        tvPositive = dialog.findViewById(R.id.tvPositive);


        tvtitle.setText(title);
        tvMessage.setText(message);
        tvNegative.setText(negTitle);
        tvPositive.setText(posTitle);

        tvNegative.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dialog.dismiss();
                Bundle bundle = new Bundle();
                bundle.putBoolean("isShow", false);
                callBack.onItemClick(bundle);
            }
        });
        tvPositive.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                dialog.dismiss();
                Bundle bundle = new Bundle();
                bundle.putBoolean("isShow", true);
                callBack.onItemClick(bundle);
            }
        });
        dialog.show();
    }

    public static String getSuffix(String value) {
        try {

            if (value != null && (!value.equals("") && !value.equalsIgnoreCase("null"))) {
                long count = Long.parseLong(value);
                if (count < 1000)
                    return "" + count;
                int exp = (int) (Math.log(count) / Math.log(1000));
                return String.format("%.1f %c",
                        count / Math.pow(1000, exp),
                        "kMBTPE".charAt(exp - 1));
            } else {
                return "0";
            }
        } catch (Exception e) {
            return value;
        }

    }

    public static void methodOpenDateTimePicker(String olddate, FragmentManager manager, Callback callback) {
        try {

            MaterialDatePicker.Builder materialDateBuilder = MaterialDatePicker.Builder.datePicker();
            materialDateBuilder.setTitleText("SELECT A DATE");
            materialDateBuilder.setTheme(R.style.MaterialCalendarTheme);

            Calendar calendar = Calendar.getInstance();
            calendar.clear();

            if (!TextUtils.isEmpty(olddate)) {
                String date[] = olddate.split("/");
                month = Integer.parseInt(date[0]);
                day = Integer.parseInt(date[1]);
                year = Integer.parseInt(date[2]);
                calendar.set(Calendar.MONTH, month - 1);
                calendar.set(Calendar.YEAR, year);
                calendar.set(Calendar.DAY_OF_MONTH, day + 1);
                currentdate = calendar.getTimeInMillis();
            } else {
                Calendar calendarEnd = Calendar.getInstance();
                calendarEnd.add(Calendar.YEAR, -18);
                currentdate = calendarEnd.getTimeInMillis();
            }


            materialDateBuilder.setCalendarConstraints(limitRange().build());
            materialDateBuilder.setSelection(currentdate);
            final MaterialDatePicker materialDatePicker = materialDateBuilder.build();

            materialDatePicker.addOnPositiveButtonClickListener(
                    new MaterialPickerOnPositiveButtonClickListener() {
                        @SuppressLint("SetTextI18n")
                        @Override
                        public void onPositiveButtonClick(Object selection) {

                            String  dateConfirmed = DateOperations.getDate((Long) selection,"MM/dd/yyyy");

                            callback.onResponce(dateConfirmed);
                        }
                    });

            materialDatePicker.show(manager, "MATERIAL_DATE_PICKER");

        }
        catch (Exception e)
        {
            callback.onResponce(Functions.getCurrentDate("MM/dd/yyyy",14));
        }

    }


    public static CalendarConstraints.Builder limitRange() {

        CalendarConstraints.Builder constraintsBuilderRange = new CalendarConstraints.Builder();

        Calendar calendarStart = Calendar.getInstance();
        Calendar calendarEnd = Calendar.getInstance();

        int year = 1970;
        int startMonth = 1;
        int startDate = 15;


        calendarEnd.add(Calendar.YEAR, -18);

        calendarStart.set(year, startMonth - 1, startDate - 1);

        long minDate = calendarStart.getTimeInMillis();
        long maxDate = calendarEnd.getTimeInMillis();


        constraintsBuilderRange.setStart(minDate);
        constraintsBuilderRange.setEnd(maxDate);
        if (currentdate != 0) {
            constraintsBuilderRange.setOpenAt(currentdate);
        } else {
            constraintsBuilderRange.setOpenAt(maxDate);
        }

        constraintsBuilderRange.setValidator(new RangeValidator(minDate, maxDate));

        return constraintsBuilderRange;
    }

    public static String decodeString(String strData) {
        if (strData == null) {
            return "";
        }
        return strData.replaceAll("&lt;", "<").replace("&gt;", ">")
                .replace("&apos;", "'").replace("&quot;", "\"")
                .replace("&amp;", "&").replace("#039;", "'").replace("#", "");
    }

    public static void loadImage(android.widget.ImageView menuImage, Uri uri) {
        try {
            Glide.with(AiMobilityApp.getAppContext()).load(uri).into(menuImage);
        } catch (Exception e) {
            menuImage.setVisibility(android.view.View.GONE);
        }
    }

    public static ArrayList<ResturantModel> updatList(ArrayList<ResturantModel> recipeDataModels, ResturantModel model) {
        for (int i = 0; i < recipeDataModels.size(); i++) {
            if (recipeDataModels.get(i).getId().equals(model.getId())) {
                recipeDataModels.remove(i);
                recipeDataModels.add(i, model);
            }
        }
        return recipeDataModels;
    }

    public static class RangeValidator implements CalendarConstraints.DateValidator {

        public static final Parcelable.Creator<RangeValidator> CREATOR = new Parcelable.Creator<RangeValidator>() {

            @Override
            public RangeValidator createFromParcel(Parcel parcel) {
                return new RangeValidator(parcel);
            }

            @Override
            public RangeValidator[] newArray(int size) {
                return new RangeValidator[size];
            }
        };
        long minDate, maxDate;

        RangeValidator(long minDate, long maxDate) {
            this.minDate = minDate;
            this.maxDate = maxDate;
        }

        RangeValidator(Parcel parcel) {
            minDate = parcel.readLong();
            maxDate = parcel.readLong();
        }

        @Override
        public boolean isValid(long date) {
            return !(minDate > date || maxDate < date);
        }

        @Override
        public int describeContents() {
            return 0;
        }

        @Override
        public void writeToParcel(Parcel dest, int flags) {
            dest.writeLong(minDate);
            dest.writeLong(maxDate);
        }

    }

    public static String getAppFolder(Context activity)
    {
        return activity.getExternalFilesDir(null).getPath()+"/";
    }

    public static Boolean isConnectedToInternet(Context context) {
        try {

            ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(context.CONNECTIVITY_SERVICE);
            NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
            if (networkInfo != null && networkInfo.isConnected()) {
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            Log.e("NetworkChange", e.getMessage());
            return false;
        }
    }


    public static String fixSpecialCharacter(String s){
       return s.replaceAll("&amp;", "&");
    }



    public static void setLocale(String lang, Activity context, Class<?> className,boolean isRefresh) {


        String[] languageArray=context.getResources().getStringArray(R.array.app_language_code);
        List<String> languageCode = Arrays.asList(languageArray);
        if (languageCode.contains(lang)) {
            Locale myLocale = new Locale(lang);
            Resources res = context.getBaseContext().getResources();
            DisplayMetrics dm = res.getDisplayMetrics();
            Configuration conf = new Configuration();
            conf.setLocale(myLocale);
            res.updateConfiguration(conf, dm);
            context.onConfigurationChanged(conf);

            if (isRefresh)
            {
                updateActivity(context,className);
            }
        }
    }

    public static void updateActivity(Activity context, Class<?> className) {
        Intent intent = new Intent(context,className);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);

    }


    // getCurrent Date
    public static String getCurrentDate(String dateFormat,int yearAdded) {
        SimpleDateFormat format=new SimpleDateFormat(dateFormat,Locale.ENGLISH);
        Calendar date = Calendar.getInstance();
        date.add(Calendar.YEAR, yearAdded);
        return format.format(date.getTime());
    }

    public static int getScreenWidth(Context context) {
        return context.getResources().getDisplayMetrics().widthPixels;
    }

    public static int getScreenheight(Context context) {
        return context.getResources().getDisplayMetrics().heightPixels;
    }



    public static void open_google_map(Context context,LatLng origin,LatLng destination) {
        if (origin != null && destination!=null) {
            String gurl =
                    "https://maps.google.com/maps?saddr=" + origin.latitude + "," + origin.longitude + "&" + "daddr=" + destination.latitude + "," +destination.longitude;
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(gurl));
            context.startActivity(intent);
        }
    }

    public static double conversionUnit = 0.6214;
    public static double getDistanceFromLatLonInKm(LatLng pickupLatlng, LatLng dropoffLatlng) {
        long R = 6371; // Radius of the earth in km

        double lat1 = pickupLatlng.latitude;
        double lon1 = pickupLatlng.longitude;
        double lat2 = dropoffLatlng.latitude;
        double lon2 = dropoffLatlng.longitude;

        double dLat = deg2rad(lat2-lat1);  // deg2rad below

        double dLon = deg2rad(lon2-lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ;
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        double dInKm = R * c; // Distance in km
        double dInMiles = (dInKm* conversionUnit); // Distance in miles
        return dInMiles;
    }

    public static double deg2rad(double deg) {
        return deg * (Math.PI/180);
    }


}


