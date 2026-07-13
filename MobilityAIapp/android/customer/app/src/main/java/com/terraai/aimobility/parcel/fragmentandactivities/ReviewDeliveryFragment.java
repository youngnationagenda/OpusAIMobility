package com.terraai.aimobility.parcel.fragmentandactivities;

import android.util.Log;

import android.animation.Animator;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.ColorDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewPropertyAnimator;
import android.view.Window;
import android.view.WindowManager;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.RelativeLayout;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.github.florent37.singledateandtimepicker.SingleDateAndTimePicker;
import com.google.android.gms.maps.model.LatLng;
import com.google.maps.model.Distance;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.parcel.adapter.DropOffAdapter;
import com.terraai.aimobility.parcel.adapter.RecipientAdapter;
import com.terraai.aimobility.parcel.model.RecipientModel;
import com.terraai.aimobility.ride.payment.PayWithBottomSheetFragment;
import com.terraai.aimobility.ride.bookride.BookGrabCarBottomSheet;
import com.terraai.aimobility.ride.bookride.PromoCodeFragment;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.GrabCarModel;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.model.RideTypeModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.DateSheduleDialogBinding;
import com.yna.opusaimobilityapp.databinding.FragmentReviewDeliveryBinding;
import com.terraai.aimobility.parcel.adapter.ParcelChangeAddress;
import com.terraai.aimobility.parcel.model.DeliveryMainModel;
import com.rilixtech.widget.countrycodepicker.CountryCodePicker;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;


public class ReviewDeliveryFragment extends RootFragment implements View.OnClickListener {

    public static String selectedGrab = "";
    public Date date;
    FragmentReviewDeliveryBinding binding;
    Bundle arguments;
    DeliveryMainModel deliveryMainModel;
    double pickUpLat, pickUpLong, dropOffLat, dropOffLong;
    ArrayList<GrabCarModel> vehicleList = new ArrayList<>();
    ArrayList<RideTypeModel> vehicleCategoriesList = new ArrayList<>();
    String paymentType = "Cash", paymentMethodId = "0", estimatedFare;
    String rideTypeId = "";
    String schedule = "0";
    String scheduleDateTime = "";
    String rideType = "";
    LatLng pickLatLng, dropLatLng;
    String couponId = "";
    String discount = "0";
    Context context;
    String  countryCode, currencySymbol, userId;
    String finalTotal;
    Date pickedDate;
    String pickedDateSt;
    FragmentCallBack fragmentCallBack;


    public ReviewDeliveryFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack=fragmentCallBack;
    }

    public ReviewDeliveryFragment() {
        // Required empty public constructor
    }



    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentReviewDeliveryBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        arguments = getArguments();
        if (arguments != null) {
            deliveryMainModel = (DeliveryMainModel) arguments.getSerializable("dataModel");
        }
        context = getActivity();
        currencySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        countryCode = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.country_code, "");
        binding.shimmerRideType.startShimmer();
        initializeListeners();
        setUpScreenData();

        getRecipientOrderByDistance();

        if(deliveryMainModel.getRecipientList().size()>1){
            binding.orderTxt.setVisibility(View.VISIBLE);
        }

        return view;
    }


    ArrayList<RecipientModel> orderList=new ArrayList<>();
    public void getRecipientOrderByDistance(){
        if(deliveryMainModel.getRecipientList().isEmpty()){
            deliveryMainModel.getRecipientList().addAll(orderList);
            setReceipentAdapter();
            callapiOfShowridetypes(pickLatLng);

        }
        else {
            double shortestDistance = 0;
            int position = 0;
            for (int i = 0; i < deliveryMainModel.getRecipientList().size(); i++) {
                RecipientModel recipientModel = deliveryMainModel.getRecipientList().get(i);

                if(orderList.isEmpty()) {
                    if (shortestDistance == 0) {
                        position = i;
                        shortestDistance = Functions.getDistanceFromLatLonInKm(pickLatLng, new LatLng(recipientModel.getRecipientLat(), recipientModel.getRecipientLong()));
                    }

                    else {
                        double distance = Functions.getDistanceFromLatLonInKm(pickLatLng, new LatLng(recipientModel.getRecipientLat(), recipientModel.getRecipientLong()));
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            position = i;
                        }
                    }
                }
                else {

                    RecipientModel startRecipient=orderList.get(orderList.size()-1);

                    if (shortestDistance == 0) {
                        position = i;
                        shortestDistance = Functions.getDistanceFromLatLonInKm(new LatLng(startRecipient.getRecipientLat(),startRecipient.getRecipientLong()), new LatLng(recipientModel.getRecipientLat(), recipientModel.getRecipientLong()));
                    }

                    else {
                        double distance = Functions.getDistanceFromLatLonInKm(new LatLng(startRecipient.getRecipientLat(),startRecipient.getRecipientLong()), new LatLng(recipientModel.getRecipientLat(), recipientModel.getRecipientLong()));
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            position = i;
                        }
                    }


                }

                Functions.logDMsg(recipientModel.getRecipientName()+" Distance:"+shortestDistance);
            }


            orderList.add(deliveryMainModel.getRecipientList().get(position));
            deliveryMainModel.getRecipientList().remove(position);

            getRecipientOrderByDistance();
        }

    }




    private void calculateTotal() {
        Functions.logDMsg("price:"+deliveryMainModel.getTotalPrice());
        double subtotal = Double.parseDouble(deliveryMainModel.getTotalPrice());
        double estimatefare = Double.parseDouble(estimatedFare);
        double total = subtotal + estimatefare;
        double discountDouble = Functions.roundoffDecimal((total * Double.parseDouble(discount)) / 100);
        double discountValue = Functions.roundoffDecimal(total - discountDouble);
        finalTotal = String.valueOf(discountValue);
        binding.totalPrice.setText(currencySymbol + finalTotal);
    }

    private void setUpScreenData() {
        binding.tvSenderName.setText(deliveryMainModel.getSenderName());
        binding.tvSenderAddress.setText(deliveryMainModel.getSenderAddress());

        pickUpLat = deliveryMainModel.getSenderLat();
        pickUpLong = deliveryMainModel.getSenderLong();
        pickLatLng = new LatLng(pickUpLat, pickUpLong);
        dropLatLng = new LatLng(dropOffLat, dropOffLong);



    }

    DropOffAdapter adapter;
    private void setReceipentAdapter() {
        adapter = new DropOffAdapter(getActivity(), deliveryMainModel.getRecipientList(),null, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

            }
        });
        binding.recyclerview.setAdapter(adapter);
    }

    private void initializeListeners() {

        binding.vehicleLayout.setOnClickListener(this);
        binding.bookADeliveryBtn.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.shareDetailBtn.setOnClickListener(this);
        binding.scheduleOrderBtn.setOnClickListener(this);
        binding.paymentTypeBtn.setOnClickListener(this);
        binding.addPromoCodeBtn.setOnClickListener(this);
        binding.icArrowSchedule.setOnClickListener(this);
        binding.changeAddressBtn.setOnClickListener(this);
        binding.icArrowSchedule.setEnabled(false);
        binding.icArrowSchedule.setClickable(false);
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.vehicleLayout:

                Bundle args = new Bundle();
                BookGrabCarBottomSheet bookGrabCarBottomSheet = new BookGrabCarBottomSheet(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            GrabCarModel grabCarModel = (GrabCarModel) bundle.getSerializable("dataModel");
                            selectedGrab = grabCarModel.id;
                            BookGrabCarBottomSheet.selectedItem = grabCarModel;
                            estimatedFare = grabCarModel.estimatedFare;
                            rideTypeId = grabCarModel.id;
                            binding.tvBike.setText(grabCarModel.vehicleName);
                            binding.tvRideDescription.setText(grabCarModel.vehicleDesc);
                            if (grabCarModel.vehicleImage != null && !grabCarModel.vehicleImage.equals("")) {
                                Uri uri;
                                if (grabCarModel.vehicleImage.contains("http")) {
                                    uri = Uri.parse(grabCarModel.vehicleImage);
                                } else {
                                    uri = Uri.parse(Constants.BASE_URL + grabCarModel.vehicleImage);
                                }
                                binding.icBike.setImageURI(uri);
                            }

                            calculateTotal();
                        }
                    }
                });
                args.putSerializable("vehicleList", vehicleList);
                args.putSerializable("vehicleCategoriesList", vehicleCategoriesList);
                args.putString("selectedGrab", selectedGrab);
                args.putString("rideType", rideType);
                bookGrabCarBottomSheet.setArguments(args);
                bookGrabCarBottomSheet.show(getActivity().getSupportFragmentManager(), "bookGrabCarBottomSheet");

                break;

            case R.id.bookADeliveryBtn:
                callAPiForBook();
                break;


                case R.id.change_address_btn:
                    getParentFragmentManager().popBackStack();
                    break;


            case R.id.backBtn:
                getActivity().onBackPressed();
                break;


            case R.id.schedule_order_btn:
                dateSchedulePicker();
                break;


            case R.id.share_detail_btn:

                StringBuilder stringBuilder = new StringBuilder();
                for (int i=0;i<deliveryMainModel.getRecipientList().size();i++){
                    if(i>0)
                        stringBuilder.append("\n");

                    stringBuilder.append(i+1+": ");
                    stringBuilder.append(deliveryMainModel.getRecipientList().get(i).getRecipientAddress());
                }

                final Intent intent = new Intent(Intent.ACTION_SEND);
                String link = "Your GO Grab Delivery Detail:" + "\n\n"
                        + "PickUp Location : " + binding.tvSenderAddress.getText().toString() + "\n\n"
                        + "Dropoff Location : " + stringBuilder + "\n\n"
                        + "Sender Name : " + deliveryMainModel.getSenderName() + "\n\n";

                intent.putExtra(Intent.EXTRA_TEXT, link);
                intent.setType("text/plain");
                startActivity(Intent.createChooser(intent, getString(R.string.share_image_via)));
                break;


            case R.id.ic_arrow_schedule:
                schedule = "0";
                scheduleDateTime = "";
                binding.tvInstant.setText(context.getString(R.string.instant));
                binding.icArrowSchedule.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_arrow_right));
                binding.icArrowSchedule.setEnabled(false);
                binding.icArrowSchedule.setClickable(false);
                break;


            case R.id.payment_type_btn:
                PayWithBottomSheetFragment payWithBottomSheetFragment = new PayWithBottomSheetFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            paymentType = bundle.getString("payment_type");
                            paymentMethodId = bundle.getString("payment_method_id");
                            String cardInfo = bundle.getString("card_info");

                            if (bundle.containsKey("card_type")) {
                                String cardType = bundle.getString("card_type");

                                if (cardType.equalsIgnoreCase("visa")) {
                                    binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_visa_card));
                                } else if (cardType.equalsIgnoreCase("mastercard")) {
                                    binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_mastercard));
                                } else {
                                    binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_card_any));
                                }
                            }

                            if (cardInfo != null && !cardInfo.equalsIgnoreCase("")) {
                                binding.tvCashType.setText("****" + " " + bundle.getString("card_info"));
                            } else {
                                binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_cash));
                                binding.tvCashType.setText(paymentType);
                            }
                        }
                    }
                }, R.id.review_delivery_container, false,paymentType);
                payWithBottomSheetFragment.show(getActivity().getSupportFragmentManager(), "payWithBottomSheetFragment");

                break;


            case R.id.add_promo_code_btn:
                new PromoCodeFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            binding.tvPromoCode.setText(bundle.getString("coupon_code"));
                            discount = bundle.getString("discount");
                            couponId = bundle.getString("coupon_id");
                            calculateTotal();
                        }
                    }
                }).show(getActivity().getSupportFragmentManager(), "");

                break;

            default:
                break;
        }
    }

    private void callAPiForBook() {
        JSONObject sendobj = new JSONObject();
        try {

            sendobj.put("user_id", userId);
            sendobj.put("ride_type_id", "" + rideTypeId);



            if (schedule.equals("0")) {
                sendobj.put("pickup_datetime", "");
            } else {
                sendobj.put("pickup_datetime", "" + scheduleDateTime);
            }

            sendobj.put("sender_name", deliveryMainModel.getSenderName());
            sendobj.put("sender_email", "");
            sendobj.put("sender_phone", deliveryMainModel.getSenderNumber());



            sendobj.put("sender_location_lat", deliveryMainModel.getSenderLat());
            sendobj.put("sender_location_long", deliveryMainModel.getSenderLong());
            sendobj.put("sender_location_string", deliveryMainModel.getSenderAddress());
            sendobj.put("sender_address_detail", deliveryMainModel.getSenderFloor());
            sendobj.put("sender_note_driver", deliveryMainModel.getSenderNote());



            sendobj.put("payment_card_id", paymentMethodId);

            if (TextUtils.isEmpty("" + deliveryMainModel.getTotalPrice())) {
                sendobj.put("price", "0");
            } else {
                sendobj.put("price",deliveryMainModel.getTotalPrice());
            }

            if (TextUtils.isEmpty(discount)) {
                sendobj.put("discount", "0");
            } else {
                sendobj.put("discount", discount);
            }
            if (TextUtils.isEmpty("" + estimatedFare)) {
                sendobj.put("delivery_fee", "0");
            } else {
                sendobj.put("delivery_fee", estimatedFare);
            }

            if (TextUtils.isEmpty(couponId)) {
                sendobj.put("coupon_id", "0");
            } else {
                sendobj.put("coupon_id", "" + couponId);
            }

            sendobj.put("schedule", "" + schedule);

            if (TextUtils.isEmpty(discount)) {
                sendobj.put("cod", "0");
            } else {
                sendobj.put("cod", "" + discount);
            }

            if (TextUtils.isEmpty("" + finalTotal)) {
                sendobj.put("total", "0");
            } else {
                sendobj.put("total", finalTotal);
            }

            JSONArray recipientArray=new JSONArray();
            for (RecipientModel model:deliveryMainModel.getRecipientList()){
                JSONObject recipientObject=new JSONObject();

                recipientObject.put("receiver_name", model.getRecipientName());
                recipientObject.put("receiver_email", "");
                recipientObject.put("receiver_phone", model.getRecipientNumber());
                recipientObject.put("delivery_instruction", model.getDeliveryInstruction());
                recipientObject.put("receiver_location_lat", ""+model.getRecipientLat());
                recipientObject.put("receiver_location_long", ""+model.getRecipientLong());
                recipientObject.put("receiver_location_string", model.getRecipientAddress());
                recipientObject.put("receiver_address_detail", model.getRecipientFloor());
                recipientObject.put("receiver_note_driver", model.getRecipientNote());
                recipientObject.put("package_size_id", model.getPackageID());
                recipientObject.put("good_type_id", "" + model.getTypeOfItemId());
                recipientObject.put("item_title", "" + model.getTypeOfItem());
                recipientObject.put("item_description", "");
                recipientArray.put(recipientObject);
            }
            sendobj.put("recipients",recipientArray);


        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.logDMsg(sendobj.toString());

        Functions.showLoader(binding.getRoot().getContext(),false,false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).placeParcelOrder(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if(resp != null) {
                                try {
                                    JSONObject responseObj = new JSONObject(resp);
                                    int code = responseObj.optInt("code");
                                    if(code ==200){

                                        Functions.dialougeNotCanclled(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.order_status), binding.getRoot().getContext().getString(R.string.order_created_successfully_done), new CallbackResponse() {
                                            @Override
                                            public void responce(String resp) {
                                                if (resp != null && resp.equalsIgnoreCase("yes")) {

                                                    if(fragmentCallBack!=null)
                                                        fragmentCallBack.onItemClick(null);

                                                    getParentFragmentManager().popBackStack();

                                                }
                                            }
                                        });

                                    }else{
                                        Functions.dialouge(getActivity(), "" + getActivity().getString(R.string.delivery), "" + responseObj.getString("msg"));
                                    }

                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }

                            }

                        }
                        else
                        {

                        }
                    }
                });

    }

    private void callapiOfShowridetypes(LatLng pickupLatlong) {

        JSONObject params = new JSONObject();
        try {
            params.put("pickup_lat", "" + pickupLatlong.latitude);
            params.put("pickup_long", "" + pickupLatlong.longitude);
            params.put("dropoff_lat", "" + deliveryMainModel.getRecipientList().get(deliveryMainModel.getRecipientList().size()-1).getRecipientLat());
            params.put("dropoff_long", "" + deliveryMainModel.getRecipientList().get(deliveryMainModel.getRecipientList().size()-1).getRecipientLong());

            JSONArray dropOffArray=new JSONArray();
            for (int i=0;i<(deliveryMainModel.getRecipientList().size()-1);i++) {
                JSONObject jsonObject=new JSONObject();
                jsonObject.put("dropoff_lat", "" + deliveryMainModel.getRecipientList().get(i).getRecipientLat());
                jsonObject.put("dropoff_long", "" + deliveryMainModel.getRecipientList().get(i).getRecipientLong());
                dropOffArray.put(jsonObject);
            }
            params.put("waypoints",dropOffArray);

        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRideTypes(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msgobj = respobj.getJSONArray("msg");
                                        vehicleList.clear();
                                        vehicleCategoriesList.clear();
                                        for (int i = 0; i < msgobj.length(); i++) {
                                            JSONObject obj = msgobj.getJSONObject(i).getJSONObject("RideSection");

                                            JSONArray ridetype = msgobj.getJSONObject(i).getJSONArray("RideType");
                                            RideTypeModel rideTypeModel = new RideTypeModel();
                                            rideTypeModel.rideType = "" + obj.optString("title");
                                            rideTypeModel.rideId = "" + obj.optString("id");
                                            vehicleCategoriesList.add(rideTypeModel);

                                            for (int z = 0; z < ridetype.length(); z++) {
                                                GrabCarModel grabCarModel = new GrabCarModel();
                                                grabCarModel.rideType = "" + obj.optString("title");
                                                JSONObject rideObj = ridetype.getJSONObject(z);
                                                grabCarModel.id = "" + rideObj.optString("id");
                                                grabCarModel.chargesPerKm = "" + rideObj.optString("charges_per_km");
                                                grabCarModel.vehicleName = "" + rideObj.optString("name");
                                                grabCarModel.vehicleDesc = "" + rideObj.optString("description");
                                                grabCarModel.baseFare = "" + rideObj.optString("base_fare");
                                                grabCarModel.costPerMinute = "" + rideObj.optString("cost_per_minute");
                                                grabCarModel.costPerDistance = "" + rideObj.optString("cost_per_distance");
                                                grabCarModel.estimatedFare = "" + rideObj.optString("estimated_fare");
                                                grabCarModel.vehicleImage = "" + rideObj.optString("image");
                                                grabCarModel.time = "" + rideObj.optString("time");
                                                grabCarModel.vehicleDesc = "" + rideObj.optString("description");
                                                grabCarModel.avgSpeed = "" + "50";

                                                vehicleList.add(grabCarModel);

                                                Functions.logDMsg("grabCarModel.estimatedFare:"+grabCarModel.estimatedFare);
                                            }
                                        }

                                        for (int i = 0; i < vehicleList.size(); i++) {
                                            if (i == 0) {
                                                GrabCarModel grabCarModel = vehicleList.get(0);
                                                grabCarModel.isSelected = true;
                                                selectedGrab = "" + grabCarModel.id;
                                                grabCarModel.isFirstTime = true;
                                                rideTypeId = "" + grabCarModel.id;
                                                estimatedFare = "" + grabCarModel.estimatedFare;

                                                binding.tvBike.setText(grabCarModel.vehicleName);
                                                binding.tvRideDescription.setText(grabCarModel.vehicleDesc);

                                                if (grabCarModel.vehicleImage != null && !grabCarModel.vehicleImage.equals("")) {
                                                    Uri uri;
                                                    if (grabCarModel.vehicleImage.contains("http")) {
                                                        uri = Uri.parse(grabCarModel.vehicleImage);
                                                    } else {
                                                        uri = Uri.parse(Constants.BASE_URL + grabCarModel.vehicleImage);
                                                    }
                                                    binding.icBike.setImageURI(uri);
                                                }
                                            }
                                        }

                                        binding.shimmerRideType.stopShimmer();
                                        binding.shimmerRideType.setVisibility(View.GONE);
                                        binding.riderLayout.setVisibility(View.VISIBLE);
                                        calculateTotal();

                                    } else {
                                        Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }
                            }

                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });

    }

    /*DateSchedule Dialog*/
    private void dateSchedulePicker() {

        Dialog dialog = new Dialog(getActivity());
        DateSheduleDialogBinding datebinding = DateSheduleDialogBinding.inflate(LayoutInflater.from(getContext()));
        dialog.setContentView(datebinding.getRoot());

        Functions.clearBackgrounds(datebinding.getRoot());
        Window window = dialog.getWindow();
        window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);
        WindowManager.LayoutParams wlp = window.getAttributes();
        wlp.gravity = Gravity.BOTTOM;
        window.setAttributes(wlp);

        final Calendar calendarMin = Calendar.getInstance();
        final Date minDate = calendarMin.getTime();
        datebinding.singleDateTimePicker.setMinDate(minDate);

        Date date = new Date(System.currentTimeMillis() + ((long) (Constants.timeForScheculeRide * 60000)));
        pickedDate = date;
        Calendar instance = Calendar.getInstance();
        this.date = instance.getTime();
        datebinding.singleDateTimePicker.setDefaultDate(date);

        datebinding.dateText.setText(DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "EEE MMM dd hh:mm a", "" + date.toString()));
        datebinding.dateTextLabel.setText(context.getString(R.string.schedule_a_ride_for));

        datebinding.singleDateTimePicker.addOnDateChangedListener(new SingleDateAndTimePicker.OnDateChangedListener() {
            @Override
            public void onDateChanged(String displayed, Date date) {
                pickedDateSt = displayed;
                pickedDate = date;
                datebinding.dateText.setText(displayed);
            }
        });

        datebinding.buttonSelectDate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                final Date now = new Date();
                String formatted = DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "yyyy-MM-dd HH:mm:ss", "" + pickedDate.toString());
                String formattednow = DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "yyyy-MM-dd HH:mm:ss", "" + now.toString());

                String timeCalculate = DateOperations.calculateTime(formattednow, formatted, false);
                Functions.logDMsg("timeCalculated : " + timeCalculate);
                if (!timeCalculate.contains("hour")) {
                    timeCalculate = timeCalculate.replace("-", "");
                    double time = Double.parseDouble(timeCalculate);
                    if (time < Constants.timeForScheculeRide) {
                        datebinding.warningAlertLayout.setVisibility(View.VISIBLE);
                        datebinding.warningAlert.setText("Please select time 30 min after current time");
                        return;
                    }
                }
                datebinding.warningAlertLayout.setVisibility(View.GONE);

                binding.tvInstant.setText(pickedDateSt);
                binding.icArrowSchedule.setEnabled(true);
                binding.icArrowSchedule.setClickable(true);
                binding.icArrowSchedule.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_cross));
                schedule = "1";
                scheduleDateTime = formatted;
                dialog.dismiss();
            }
        });

        dialog.show();
    }


}