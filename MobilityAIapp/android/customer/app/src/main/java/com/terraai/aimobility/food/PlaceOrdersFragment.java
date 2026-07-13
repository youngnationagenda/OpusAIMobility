package com.terraai.aimobility.food;

import static com.terraai.aimobility.codeclasses.Functions.calculateDistance;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Dialog;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.location.Location;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.github.florent37.singledateandtimepicker.SingleDateAndTimePicker;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.Projection;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.Constants;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentOrdersPlaceBinding;
import com.terraai.aimobility.foodadapter.ViewBucketAdapter;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.MenuDetailsModel;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.model.ResturantModel;
import com.terraai.aimobility.ride.bookride.PromoCodeFragment;
import com.terraai.aimobility.ride.payment.PayWithBottomSheetFragment;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;



public class PlaceOrdersFragment extends RootFragment implements View.OnClickListener, OnMapReadyCallback {

    double earthradius = 6371000;
    public Date dateOne;
    ViewBucketAdapter yourItemsAdapter;
    Bundle bundle;
    Context context;
    String currencySymbol;
    double subtotal;
    ResturantModel resturantModel;
    LatLng restutantLatLng;
    String paymentType = "Cash", paymentMethodId = "0";
    String couponId = "";
    String discount = "0";
    ArrayList<CalculationModel> carList = new ArrayList<>();
    boolean deliverySwitch = false;
    String finalTotal;
    Date pickedDate;
    String pickedDateSt;
    NearbyModelClass nearbyModel;
    FragmentOrdersPlaceBinding binding;
    HashMap<String, Object> valuesFinal;
    ArrayList<HashMap<String, Object>> extraItemArray;
    int count = 0;
    Bitmap pickUpMarkerBitmap;
    Marker pickupMarker;
    ArrayList<HashMap<String, String>> extraItem;
    MapWorker mapWorker;
    FoodActivity mainActivity;
    ArrayList<Double> grandTotal;
    String longitude;
    String latitude;
    LatLng mDefaultLocation;
    GoogleMap mGoogleMap;
    String schedule = "0";
    String scheduleDatetime = "";
    String userId = "", addressId = "0";
    String resturantOpened;

    public PlaceOrdersFragment() {
        // Required empty public constructor
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        mDefaultLocation = new LatLng(Double.parseDouble(latitude), Double.parseDouble(longitude));
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        binding = FragmentOrdersPlaceBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        mainActivity = (FoodActivity) this.getActivity();
        bundle = getArguments();
        context = getActivity();
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        mDefaultLocation = new LatLng(Double.parseDouble(latitude), Double.parseDouble(longitude));

        Functions.logDMsg("exceptuion  at  place mDefaultLocation at top : "+mDefaultLocation);

        updateList(false);
        carList = (ArrayList<CalculationModel>) bundle.getSerializable("carList");
        resturantModel = carList.get(0).getResturantModel();
        resturantOpened = resturantModel.getOpen();


        try {
            // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
            // Original: nearbyModel = /* AWS-MIGRATED: was Paper.book().read("nearModel" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""));
            // [AWS] Read result discarded
        } catch (Exception e) {
            Log.d(Constants.TAG,"nearbyModel: "+e );
        }

        checkLocation();

        checkSharedPreferences();

        restutantLatLng = new LatLng(Double.parseDouble(resturantModel.getResturantLat()), Double.parseDouble(resturantModel.getResturantLong()));


        binding.mapView.onCreate(savedInstanceState);

        setupMapIfNeeded();
        pickUpMarkerBitmap = Functions.getMarkerDropPinView(context);
        initializeListeners();

        methodSetYourItemsAdapter();

        setUpScreenData();

        return view;

    }

    private void checkSharedPreferences() {
        currencySymbol = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        userId = MyPreferences.getSharedPreference(context).getString(MyPreferences.USER_ID, "");
    }

    private void checkLocation() {

        if (nearbyModel != null) {
            addressId = nearbyModel.id;
            mDefaultLocation = nearbyModel.latLng;
            binding.cityName.setText(nearbyModel.title);
            binding.tvPickLocation.setText(nearbyModel.address);
            binding.tvMeetDoor.setText(""+nearbyModel.addInstruction);
        }
    }

    private void initializeListeners() {

        binding.placeOrderBtn.setOnClickListener(this);
        binding.cityLayout.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.nowLayout.setOnClickListener(this);
        binding.scheduleOrderLayout.setOnClickListener(this);
        binding.cashLayout.setOnClickListener(this);
        binding.promoCodeLayout.setOnClickListener(this);
        binding.switchToLayout.setOnClickListener(this);
        binding.seeMenuLayout.setOnClickListener(this);
        binding.addItemBtn.setOnClickListener(this);
        binding.addDeliveryNoteBtn.setOnClickListener(this);
    }

    private void setUpScreenData() {
        binding.tvResturantName.setText(carList.get(0).getRest_name());
        binding.tvDeliveryTime.setText(resturantModel.getDeliveryMinTime() + " - " + resturantModel.getDeliveryMaxTime() + context.getString(R.string.min_time));
        binding.tvSubtotal.setText(currencySymbol + subtotal);
        binding.tvDeliveryFee.setText(currencySymbol + resturantModel.getDeliveryFee());

        if (carList.get(0).getSchedule().equals("1")) {
            schedule = "1";
            scheduleDatetime = carList.get(0).getScheduleDatetime();
            binding.textSwitchPickup.setText(context.getString(R.string.switch_to_pickup));
            binding.tvScheduleTime.setText(DateOperations.changeDateFormat("yyyy-MM-dd HH:mm:ss", "EEE, MMM dd, hh:mm a", scheduleDatetime));
            binding.tvScheduleTime.setTextColor(ContextCompat.getColor(context, R.color.white));
            binding.tvNow.setTextColor(ContextCompat.getColor(context, R.color.text_color_black));
            binding.scheduleOrderLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_black));
            binding.nowLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_grey));
        } else {
            binding.textSwitchPickup.setText(context.getString(R.string.switch_to_delivery));
        }

        calculateTotal();
    }

    @SuppressLint("SetTextI18n")
    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.placeOrderBtn:
                if (!(binding.textSwitchPickup.getText().toString().equalsIgnoreCase(binding.getRoot().getContext().getString(R.string.switch_to_pickup)))
                        || !addressId.equals("0")) {
                    double minOrder = Double.parseDouble(resturantModel.getMinOrderPrice());
                    double orderFinal = Double.parseDouble(finalTotal);
                    if (minOrder < orderFinal) {

                        methodPlaceOrder();
                    } else {
                        Toast.makeText(getActivity(), "Your order should match the min order price that is : " + minOrder, Toast.LENGTH_SHORT).show();
                    }

                } else {

                    Toast.makeText(getActivity(), context.getString(R.string.please_select_address), Toast.LENGTH_SHORT).show();
                }

                break;

            case R.id.cityLayout:

                methodOpenDeliveryDetails();

                break;

            case R.id.backBtn:

                requireActivity().onBackPressed();

                break;


            case R.id.nowLayout:
                if (resturantOpened.equals("1")) {
                    schedule = "0";
                    scheduleDatetime = "";
                    binding.tvScheduleTime.setText(binding.getRoot().getContext().getString(R.string.schedule));
                    binding.tvScheduleTime.setTextColor(ContextCompat.getColor(context, R.color.text_color_black));
                    binding.tvNow.setTextColor(ContextCompat.getColor(context, R.color.white));
                    binding.scheduleOrderLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_grey));
                    binding.nowLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_black));

                } else {
                    ResturantClosedDialog closedDialog = new ResturantClosedDialog(R.id.main_food_container);
                    closedDialog.setArguments(bundle);
                    closedDialog.show(requireActivity().getSupportFragmentManager(), "closedDialog");
                }


                break;


            case R.id.schedule_order_layout:

                Functions.customAlertDialog(context,"Schedule Order","Schecdule order will be coming soon","Okay",false,null);

                //dateSchedulePicker();

                break;

            case R.id.add_delivery_note_btn:
                Functions.hideSoftKeyboard(requireActivity());
                AddDeliveryNote addDeliveryNote = new AddDeliveryNote(bundle -> {
                    if (bundle != null) {
                        nearbyModel = (NearbyModelClass) bundle.getSerializable("model");
                        // [AWS-MIGRATED] PaperDB write → SharedPreferences
                        com.terraai.aimobility.codeclasses.MyPreferences.getSharedPreference(requireActivity()).edit()
                                .putString(com.terraai.aimobility.codeclasses.MyPreferences.USER_ID + "_nearModel_lat", Double.toString(nearbyModel.lat))
                                .putString(com.terraai.aimobility.codeclasses.MyPreferences.USER_ID + "_nearModel_lng", Double.toString(nearbyModel.lng))
                                .putString(com.terraai.aimobility.codeclasses.MyPreferences.USER_ID + "_nearModel_title", nearbyModel.title)
                                .apply();
                        checkLocation();
                        mDefaultLocation = nearbyModel.latLng;
                        binding.mapOverlay.setVisibility(View.VISIBLE);
                        showlatlngboundzoom(mDefaultLocation, restutantLatLng);
                        sendScreenPosition(false);
                    }
                });
                FragmentManager fragmentManager = requireActivity().getSupportFragmentManager();
                Bundle bundle = new Bundle();
                if (nearbyModel == null) {
                    nearbyModel = new NearbyModelClass();
                    nearbyModel.title = Functions.getAddressSubString(context, mDefaultLocation);
                    nearbyModel.latLng = mDefaultLocation;
                    nearbyModel.lat = mDefaultLocation.latitude;
                    nearbyModel.lng = mDefaultLocation.longitude;
                }
                bundle.putSerializable("nearModel", nearbyModel);
                addDeliveryNote.setArguments(bundle);
                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
                ft.replace(R.id.checkout_container, addDeliveryNote).addToBackStack(null).commit();
                break;

            case R.id.cashLayout:
                PayWithBottomSheetFragment payWithBottomSheetFragment = new PayWithBottomSheetFragment(bundle1 -> {
                    if (bundle1 != null) {
                        paymentType = bundle1.getString("payment_type");
                        paymentMethodId = bundle1.getString("payment_method_id");
                        if (paymentType.equals("Cash")) {
                            binding.ivCard.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_cash));
                        } else if (paymentType.equals("Card")) {
                            String cardType = bundle1.getString("card_type");
                            if (cardType.equalsIgnoreCase("visa")) {
                                binding.ivCard.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_visa_card));
                            } else if (cardType.equalsIgnoreCase("mastercard")) {
                                binding.ivCard.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_mastercard));
                            } else {
                                binding.ivCard.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_card_any));
                            }
                        }
                    }
                }, R.id.checkout_container , true,paymentType);
                payWithBottomSheetFragment.show(requireActivity().getSupportFragmentManager(), "payWithBottomSheetFragment");

                break;

            case R.id.promoCodeLayout:

                new PromoCodeFragment(bundle12 -> {
                    if (bundle12 != null) {
                        binding.tvCouponName.setText(bundle12.getString("coupon_code"));
                        discount = bundle12.getString("discount");
                        couponId = bundle12.getString("coupon_id");
                        calculateTotal();
                    }
                }).show(requireActivity().getSupportFragmentManager(), "");

                break;

            case R.id.add_item_btn:
            case R.id.see_menu_layout:

                Fragment currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromCheckout");
                FragmentManager manager = requireActivity().getSupportFragmentManager();
                FragmentTransaction transaction = manager.beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.replace(R.id.checkout_container, currentFragment).addToBackStack(null).commit();

                break;

            case R.id.switch_to_layout:

                if (!deliverySwitch) {
                    setUpDataForPickUp();
                } else {
                    setUpDataForDelivery();
                }

                calculateTotal();
                break;


            default:
                break;
        }
    }

    @SuppressLint("DefaultLocale")
    private void setUpDataForPickUp() {
        binding.cityName.setText(resturantModel.getResturantName());
        binding.tvPickLocation.setText(resturantModel.getLocation_string());
        binding.tvMeetAtDoorTitle.setText(context.getString(R.string.distance));
        double distanceOld = calculateDistance(Double.parseDouble(resturantModel.getResturantLat()), Double.parseDouble(resturantModel.getResturantLong()), mDefaultLocation.latitude, mDefaultLocation.longitude);
        binding.tvMeetDoor.setText(String.format("%.2f", (distanceOld) * 0.001) + " km");
        binding.cityLayout.setEnabled(false);
        binding.addDeliveryNoteBtn.setEnabled(false);
        binding.ivLocation.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_store));
        binding.ivUser.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_walk));
        binding.textSwitchPickup.setText(context.getString(R.string.switch_to_delivery));
        binding.tvDeliveryFee.setText(currencySymbol + "0");
        zoomToCurrentLocation();
        sendScreenPosition(true);
        deliverySwitch = true;
    }

    private void setUpDataForDelivery() {
        if (nearbyModel != null) {
            binding.cityName.setText(nearbyModel.title);
            binding.tvPickLocation.setText(nearbyModel.address);
            binding.tvMeetDoor.setText(""+nearbyModel.addInstruction);
        } else {
            binding.tvPickLocation.setText("");
            binding.tvMeetDoor.setText("");
            binding.cityName.setText("");
        }
        binding.cityLayout.setEnabled(true);
        binding.addDeliveryNoteBtn.setEnabled(true);
        binding.tvMeetAtDoorTitle.setText(context.getString(R.string.meet_at_door));
        binding.ivUser.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_user_black));
        binding.ivLocation.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_location_pin_black));
        binding.textSwitchPickup.setText(context.getString(R.string.switch_to_pick_up));
        binding.tvDeliveryFee.setText(currencySymbol + resturantModel.getDeliveryFee());
        showlatlngboundzoom(mDefaultLocation, restutantLatLng);
        sendScreenPosition(false);
        deliverySwitch = false;
    }

    private void methodPlaceOrder() {
        extraItemArray = new ArrayList<>();

        for (int i = 0; i < carList.size(); i++) {

            valuesFinal = new HashMap<>();

            extraItem = carList.get(i).getExtraItem();
            if (extraItem != null && !extraItem.isEmpty()) {
                valuesFinal.put("menu_extra_item", extraItem);
            }
            int quantity = Integer.parseInt(carList.get(i).getmQuantity());
            count = count + quantity;
            valuesFinal.put("menu_item_price", carList.get(i).getmPrice());
            valuesFinal.put("menu_item_quantity", ""+quantity);
            valuesFinal.put("menu_item_name", carList.get(i).getmName());
            valuesFinal.put("instruction", carList.get(i).getInstruction());
            extraItemArray.add(valuesFinal);
        }

        JSONArray menuItem = new JSONArray(extraItemArray);

        Calendar c = Calendar.getInstance();

        SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        String formattedDate = df.format(c.getTime());

        JSONObject jsonObject = new JSONObject();
        try {

            jsonObject.put("user_id", ""+userId);
            jsonObject.put("price", ""+finalTotal);
            jsonObject.put("sub_total", ""+subtotal);
            jsonObject.put("tax", "0");
            jsonObject.put("quantity", ""+count);

            if (deliverySwitch) {
                jsonObject.put("delivery_address_id", "");
                jsonObject.put("address_id", "");
                jsonObject.put("delivery", "0");
            } else {
                jsonObject.put("delivery", "1");
                jsonObject.put("delivery_address_id", ""+addressId);
                jsonObject.put("address_id", ""+addressId);
                jsonObject.put("rider_instruction", ""+nearbyModel.addInstruction);
            }

            jsonObject.put("restaurant_id", ""+resturantModel.getId());
            jsonObject.put("restaurant_instruction", "");

            jsonObject.put("coupon_id", ""+couponId);
            jsonObject.put("discount", ""+discount);

            jsonObject.put("order_time", ""+formattedDate);
            jsonObject.put("delivery_fee", ""+resturantModel.getDeliveryFee());
            jsonObject.put("version", ""+Functions.getVersion(requireActivity()));

            if (schedule.equals("0")) {
                jsonObject.put("delivery_date_time", "");
            } else {
                jsonObject.put("delivery_date_time", ""+pickedDateSt);
            }

            jsonObject.put("rider_tip", "0");

            jsonObject.put("device", "android");

            jsonObject.put("cod", "1");

            jsonObject.put("payment_id", ""+paymentMethodId);

            jsonObject.put("menu_item", menuItem);

            jsonObject.put("lang", "english");

        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);

        }

        Functions.showLoader(binding.getRoot().getContext(),false,false);
        RetrofitRequest.JsonPostRequest(context,
                jsonObject.toString(),
                Singleton.getApiCall(context).placeFoodOrder(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if(resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        // [AWS-MIGRATED] PaperDB delete
                                        // Original: /* AWS-MIGRATED: was Paper.book().delete("carList" + MyPreferences.getSharedPreference(getActivity() */).getString(MyPreferences.USER_ID, ""));
                                        Functions.dialougeNotCanclled(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.order_status), binding.getRoot().getContext().getString(R.string.order_created_successfully_done), new CallbackResponse() {
                                            @Override
                                            public void responce(String resp) {
                                                if (resp != null && resp.equalsIgnoreCase("yes")) {
                                                    mainActivity.checkFragment();

                                                    new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                                        @Override
                                                        public void run() {
                                                            getActivity().runOnUiThread(new Runnable() {
                                                                @Override
                                                                public void run() {
                                                                    mainActivity.foodMainFragment.binding.viewPager.setCurrentItem(2,true);
                                                                    Functions.clearFragment(getActivity().getSupportFragmentManager());
                                                                }
                                                            });
                                                        }
                                                    },400);
                                                }
                                            }
                                        });
                                    } else {
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }
                            }
                        }
                        else
                        {
                            if (resp.toString().contains("No Internet Connection")) {
                                NoInternetDialog internetDialog = new NoInternetDialog(bundle -> methodPlaceOrder());
                                internetDialog.show(requireActivity().getSupportFragmentManager(), "internetDialog");
                            }
                        }
                    }
                });


    }

    private void dateSchedulePicker() {
        Dialog dialog = new Dialog(requireActivity());
        View view1 = LayoutInflater.from(requireActivity()).inflate(R.layout.date_shedule_dialog_food, null);
        dialog.setContentView(view1);

        Functions.clearBackgrounds(view1);
        Window window = dialog.getWindow();
        window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);
        WindowManager.LayoutParams wlp = window.getAttributes();
        wlp.gravity = Gravity.BOTTOM;
        window.setAttributes(wlp);

        TextView tvOpenTime = view1.findViewById(R.id.tv_open_time);
        Calendar calendar = Calendar.getInstance();
        int day = calendar.get(Calendar.DAY_OF_WEEK);
        tvOpenTime.setText(binding.getRoot().getContext().getString(R.string.open_at) + " " + DateOperations.changeDateFormat("HH:mm:ss", "hh:mm a", resturantModel.getTimeModelArrayList().get(day - 1).getOpening_time()));

        RelativeLayout buttonSelectDate = view1.findViewById(R.id.buttonSelectDate);
        TextView warningAlert = view1.findViewById(R.id.warning_alert);
        LinearLayout warningAlertLayout = view1.findViewById(R.id.warning_alert_layout);
        final SingleDateAndTimePicker singleDateAndTimePicker = view1.findViewById(R.id.singleDateTimePicker);

        try {
            dateOne = new SimpleDateFormat("HH:mm:ss").parse(resturantModel.getTimeModelArrayList().get(day - 1).getOpening_time());
        } catch (ParseException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
            Functions.logDMsg("minDate : " + e.toString());
        }

        singleDateAndTimePicker.setMinDate(dateOne);

        Date date = new Date(System.currentTimeMillis() + Constants.timeForScheculeFood * 60000L);
        pickedDate = date;

        singleDateAndTimePicker.setDefaultDate(date);

        singleDateAndTimePicker.addOnDateChangedListener((displayed, date1) -> {
            pickedDateSt = displayed;
            pickedDate = date1;
        });

        buttonSelectDate.setOnClickListener(v -> {
            final Date now = new Date();
            String formatted = DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "yyyy-MM-dd HH:mm:ss", "" + pickedDate.toString());
            String formattednow = DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "yyyy-MM-dd HH:mm:ss", "" + now.toString());
            String timeCalculate = DateOperations.calculateTime(formattednow, formatted, false);
            if (!timeCalculate.contains("hour")) {
                timeCalculate = timeCalculate.replace("-", "");
                double time = Double.parseDouble(timeCalculate);
                if (time < Constants.timeForScheculeRide) {
                    warningAlertLayout.setVisibility(View.VISIBLE);
                    warningAlert.setText("Please select time 45 min after current time");
                    return;
                }
            }
            warningAlertLayout.setVisibility(View.GONE);
            schedule = "1";
            scheduleDatetime = formatted;
            methodChangeScheduleView();
            dialog.dismiss();
        });

        dialog.show();
    }

    private void methodChangeScheduleView() {
        binding.tvScheduleTime.setText(DateOperations.changeDateFormat("yyyy-MM-dd HH:mm:ss", "EEE, MMM dd, hh:mm a", scheduleDatetime));
        binding.tvScheduleTime.setTextColor(ContextCompat.getColor(context, R.color.white));
        binding.tvNow.setTextColor(ContextCompat.getColor(context, R.color.black));
        binding.scheduleOrderLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_black));
        binding.nowLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_grey));
    }

    private void calculateTotal() {
        double subtotalPrice = 0.0;
        grandTotal = new ArrayList<>();
        for (int i = 0; i < carList.size(); i++) {
            double totalExtraItemPrice = 0.0;
            double price1;

            String price = carList.get(i).getmPrice();
            double dPrice = Double.parseDouble(price);
            double dQty = Double.parseDouble(carList.get(i).getmQuantity());
            ArrayList<HashMap<String, String>> extraItem = carList.get(i).getExtraItem();
            if (extraItem != null && extraItem.size() > 0) {
                for (int b = 0; b < extraItem.size(); b++) {
                    String extraPrice = extraItem.get(b).get("menu_extra_item_price");
                    double counter = Double.parseDouble(extraPrice);
                    totalExtraItemPrice = counter + totalExtraItemPrice;
                }
                price1 = (totalExtraItemPrice + dPrice) * dQty;
            } else {
                price1 = dPrice * dQty;
            }
            grandTotal.add(price1);
        }

        for (Double num : grandTotal) {
            subtotalPrice = Functions.roundoffDecimal(subtotalPrice + num);
        }

        subtotal = subtotalPrice;

        binding.tvSubtotal.setText(currencySymbol + subtotal);

        double total = subtotal;

        if (!deliverySwitch) {
            total = total + Double.parseDouble(resturantModel.getDeliveryFee());
        }

        double discountDouble = Functions.roundoffDecimal((total * Double.parseDouble(discount)) / 100);
        double discountValue = Functions.roundoffDecimal(total - discountDouble);
        finalTotal = String.valueOf(discountValue);
        binding.tvTotal.setText(currencySymbol + finalTotal);
        binding.tvCardTotal.setText(currencySymbol + finalTotal);
        binding.tvButtonTotal.setText(context.getString(R.string.place_order) + " " + currencySymbol + finalTotal);
    }

    private void methodSetYourItemsAdapter() {
        yourItemsAdapter = new ViewBucketAdapter(context, carList, (position, model, view) -> {
            CalculationModel dataModel = (CalculationModel) model;
            MenuDetailsModel menuDetailsModel = dataModel.getRecipeMenuDetailsModel();
            ResturantModel resturantModel = dataModel.getResturantModel();

            AddToCartFragment addToCartFragment = new AddToCartFragment(bundle -> updateList(true));

            ArrayList<HashMap<String, String>> extraItem = ((CalculationModel) model).getExtraItem();

            FragmentManager fragmentManager = requireActivity().getSupportFragmentManager();

            Bundle bundle = new Bundle();
            bundle.putSerializable("recipeMenuDetailsModel", menuDetailsModel);
            bundle.putSerializable("resturantModel", resturantModel);
            bundle.putString("fromWhere", "viewBucket");
            bundle.putSerializable("extraItem", extraItem);
            bundle.putInt("position", position);
            addToCartFragment.setArguments(bundle);

            FragmentTransaction ft = fragmentManager.beginTransaction();
            ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
            ft.replace(R.id.checkout_container, addToCartFragment).addToBackStack(null).commit();
        });

        binding.yourItemsRecyclerView.setLayoutManager(new LinearLayoutManager(context, LinearLayoutManager.VERTICAL, false));
        binding.yourItemsRecyclerView.setAdapter(yourItemsAdapter);
        yourItemsAdapter.notifyDataSetChanged();

    }

    public void updateList(boolean update) {
        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(context) */ null.getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        // [AWS] Read result discarded
        if (update) {
            if (carList.isEmpty()) {
                requireActivity().onBackPressed();
            } else {
                yourItemsAdapter.updateList(carList);
                yourItemsAdapter.notifyDataSetChanged();
                calculateTotal();
            }
        }
    }

    private void methodOpenDeliveryDetails() {
        Functions.hideSoftKeyboard(requireActivity());
        DeliveryAddressFragment deliveryAddressFragment = new DeliveryAddressFragment(bundle -> {
            if (bundle != null) {
                nearbyModel = (NearbyModelClass) bundle.getSerializable("model");
                mDefaultLocation = nearbyModel.latLng;
                checkLocation();
                // [AWS-MIGRATED] PaperDB write → SharedPreferences
                com.terraai.aimobility.codeclasses.MyPreferences.getSharedPreference(getActivity()).edit()
                        .putString(com.terraai.aimobility.codeclasses.MyPreferences.USER_ID + "_nearModel_lat", Double.toString(nearbyModel.lat))
                        .putString(com.terraai.aimobility.codeclasses.MyPreferences.USER_ID + "_nearModel_lng", Double.toString(nearbyModel.lng))
                        .putString(com.terraai.aimobility.codeclasses.MyPreferences.USER_ID + "_nearModel_title", nearbyModel.title)
                        .apply();
                binding.mapOverlay.setVisibility(View.VISIBLE);
                showlatlngboundzoom(mDefaultLocation, restutantLatLng);
                sendScreenPosition(false);
            }
        });
        FragmentManager fragmentManager = requireActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putSerializable("nearModel", nearbyModel);
        deliveryAddressFragment.setArguments(bundle);
        ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
        ft.replace(R.id.checkout_container, deliveryAddressFragment).addToBackStack(null).commit();
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.mapView.onResume();
            binding.mapView.getMapAsync(this);
        }
    }



    private void zoomToCurrentLocation() {
        mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(restutantLatLng, Constants.maxZoomLevel));
    }


    private void showlatlngboundzoom(LatLng... marker) {
        LatLngBounds.Builder latlngBuilder = new LatLngBounds.Builder();
        for (LatLng mrk : marker) {
            latlngBuilder.include(mrk);
        }

        LatLngBounds bounds = latlngBuilder.build();
        LatLng center = bounds.getCenter();
        LatLng northEast = move(center, 709, 709);
        LatLng southWest = move(center, -709, -709);
        latlngBuilder.include(southWest);
        latlngBuilder.include(northEast);
        if (areBoundsTooSmall(bounds)) {
            mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(bounds.getCenter(), Constants.maxZoomLevel));
        } else {
            int padding = (int) (getScreenWidth(requireActivity()) * 0.10);
            mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, padding));
        }
    }

    public int getScreenWidth(Context context) {
        return context.getResources().getDisplayMetrics().widthPixels;
    }

    private boolean areBoundsTooSmall(LatLngBounds bounds) {
        float[] result = new float[1];
        Location.distanceBetween(bounds.southwest.latitude, bounds.southwest.longitude, bounds.northeast.latitude, bounds.northeast.longitude, result);
        return result[0] < 300;
    }

    private LatLng move(LatLng startLL, double toNorth, double toEast) {
        double lonDiff = meterToLongitude(toEast, startLL.latitude);
        double latDiff = meterToLatitude(toNorth);
        return new LatLng(startLL.latitude + latDiff, startLL.longitude + lonDiff);
    }

    private double meterToLongitude(double meterToEast, double latitude) {
        double latArc = Math.toRadians(latitude);
        double radius = Math.cos(latArc) * earthradius;
        double rad = meterToEast / radius;
        return Math.toDegrees(rad);
    }

    private double meterToLatitude(double meterToNorth) {
        double rad = meterToNorth / earthradius;
        return Math.toDegrees(rad);
    }

    @Override
    public void onMapReady(@NonNull GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, this.mGoogleMap);

            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    requireActivity(), R.raw.gray_map));


            if (ActivityCompat.checkSelfPermission(requireActivity()
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(requireActivity()
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            }
            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setAllGesturesEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            mGoogleMap.getUiSettings().setCompassEnabled(false);
            mGoogleMap.setMyLocationEnabled(false);

            mGoogleMap.setOnMapLoadedCallback(() -> {
                showlatlngboundzoom(mDefaultLocation, restutantLatLng);
                if (Variables.deliveryType.equals("Deliver")) {
                    setUpDataForDelivery();
                } else {
                    setUpDataForPickUp();
                }


                Functions.logDMsg("exceptuion  at  place mDefaultLocation : "+mDefaultLocation);

                Functions.logDMsg("exceptuion  at  place restutantLatLng : "+restutantLatLng);

            });
    }


    private void sendScreenPosition(boolean value) {
        if (mGoogleMap != null) {
            if (value) {
                binding.archView.setVisibility(View.GONE);
                if (pickupMarker == null)
                    pickupMarker = mapWorker.addMarker(restutantLatLng, pickUpMarkerBitmap);
                else {
                    pickupMarker.remove();
                    pickupMarker = mapWorker.addMarker(restutantLatLng, pickUpMarkerBitmap);
                }
                binding.mapOverlay.setVisibility(View.GONE);

            } else {
                if (pickupMarker != null) {
                    pickupMarker.remove();
                }
                binding.archView.setVisibility(View.VISIBLE);
                Projection projection = mGoogleMap.getProjection();
                Projection projection1 = mGoogleMap.getProjection();
                binding.archView.setPoints(projection.toScreenLocation(mDefaultLocation), projection1.toScreenLocation(restutantLatLng));
                new Handler().postDelayed(() -> binding.mapOverlay.setVisibility(View.GONE), 800);
            }
        }
    }


    private final void sendScreenPosition() {
        if (getActivity() != null && mGoogleMap != null) {

            Projection projection = mGoogleMap.getProjection();
            Projection projection1 = mGoogleMap.getProjection();

            binding.archView.setPoints(projection.toScreenLocation(mDefaultLocation), projection1.toScreenLocation(restutantLatLng));

            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    binding.mapOverlay.setVisibility(View.GONE);
                }
            },800);
        }
    }

}
