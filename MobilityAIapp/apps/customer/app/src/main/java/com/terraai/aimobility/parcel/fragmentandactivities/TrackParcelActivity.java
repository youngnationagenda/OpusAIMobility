package com.terraai.aimobility.parcel.fragmentandactivities;

import android.util.Log;

import static com.terraai.aimobility.codeclasses.Functions.calculateDistance;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.text.TextUtils;
import android.view.View;

import androidx.annotation.NonNull;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.codeclasses.AppCompatLocaleActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.GravityCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.Projection;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
// AWS-MIGRATED: import com.google.firebase.database.DataSnapshot;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseError;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseReference;
// AWS-MIGRATED: import com.google.firebase.database.FirebaseDatabase;
// AWS-MIGRATED: import com.google.firebase.database.ValueEventListener;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.R;
import com.terraai.aimobility.activitiesandfragment.HomeActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.databinding.ActivityTrackParcelBinding;
import com.terraai.aimobility.mapclasses.MapAnimator;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.parcel.adapter.DropOffAdapter;
import com.terraai.aimobility.parcel.model.ParcelHistoryModel;
import com.terraai.aimobility.parcel.model.RecipientModel;
import com.terraai.aimobility.parcel.model.RiderOrderMultiStop;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.ride.account.AccountFragment;
import com.terraai.aimobility.ride.history.HistoryFragment;
import com.terraai.aimobility.userschat.ChatA;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.Query;
import java.util.concurrent.TimeUnit;
import com.firebase.geofire.GeoFire;
import com.firebase.geofire.GeoQuery;
import com.firebase.geofire.GeoLocation;
import com.firebase.geofire.GeoQueryEventListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;


public class TrackParcelActivity extends AppCompatLocaleActivity implements View.OnClickListener, OnMapReadyCallback, GoogleMap.OnCameraMoveListener {

    ActivityTrackParcelBinding binding;

    String userId;
    String whichScreen = "opening_screen";

    Marker pickupMarker, dropoffMarker, driverMarker;
    LatLng pickupLatlng, dropoffLatlng, driverLatlng;
    Bitmap dropoffMarkerBitmap, driverMarkerBitmap, pickupMarkerBitmap;

    Context context;
    BottomSheetBehavior btsBehavior;
    MapWorker mapWorker;
    // [AWS] DatabaseReference rootRef replaced — use AWSManager REST API
        DatabaseReference rootRef = null;
    boolean moveToCurrent = false;
    Boolean mapCheck = false;

    Boolean trafficCheck = false;
    String fname, lname;
    Polyline polyLine;
    String currencySymbol;
    ParcelHistoryModel parcelHistoryModel;
    GoogleMap mGoogleMap;
    double earthradius = 6371000;
    String userImage;

    Handler handler;
    Runnable runable;
    String orderId;
    String orderStatus;


    BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String type = intent.getExtras().getString("type");
            if (type != null && type.equals("request_accepted")) {
                callApiDetail();
            } else {
                Functions.logDMsg("called else");
                callApiDetail();
            }
        }
    };


    public TrackParcelActivity() {
        // Required empty public constructor
    }



    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        binding = ActivityTrackParcelBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());


        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("request_responce");

        registerReceiver(broadcastReceiver, intentFilter);

        binding.mapView.onCreate(savedInstanceState);
        context = getApplicationContext();
        userId = MyPreferences.getSharedPreference(TrackParcelActivity.this).getString(MyPreferences.USER_ID, "");
        currencySymbol = MyPreferences.getSharedPreference(TrackParcelActivity.this).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        fname = MyPreferences.getSharedPreference(TrackParcelActivity.this).getString(MyPreferences.fname, "");
        lname = MyPreferences.getSharedPreference(TrackParcelActivity.this).getString(MyPreferences.lname, "");
        rootRef = null; // [AWS-MIGRATED] FirebaseDatabase removed
        userImage = MyPreferences.getSharedPreference(TrackParcelActivity.this).getString(MyPreferences.image, "");

        pickupMarkerBitmap = Functions.getMarkerPickupPinView(TrackParcelActivity.this);
        dropoffMarkerBitmap = Functions.getMarkerDropPinView(TrackParcelActivity.this);
        driverMarkerBitmap = Functions.getDriverPickUpView(TrackParcelActivity.this);


        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        parcelHistoryModel = (ParcelHistoryModel) bundle.getSerializable("dataModel");
        orderId = intent.getStringExtra("order_id");
        orderStatus = intent.getStringExtra("status");
        binding.mapView.onResume();
        binding.mapView.getMapAsync(TrackParcelActivity.this);

        methodInitLayouts();
        methodInitClickListener();

        setupMapIfNeeded();

        parseData();
        setReceipentAdapter();
    }


    private void callApiDetail() {
        JSONObject params = new JSONObject();
        try {
            params.put("parcel_order_id", orderId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.logDMsg("sendobj at showOrderDetail : " + params.toString());


        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRiderOrderDetails(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.optString("code").equals("200")) {
                                        JSONObject msg = respobj.getJSONObject("msg");

//                                        JSONObject parcelOrderObj = msg.getJSONObject("ParcelOrder");
//                                        JSONObject riderObj = msg.getJSONObject("Rider");
//                                        JSONObject RiderOrder = msg.getJSONObject("RiderOrder");
//                                        JSONArray riderOrderMultiStop = msg.getJSONArray("RiderOrderMultiStop");
//
//                                        parcelHistoryModel.setPaymentCardId(parcelOrderObj.optString("payment_card_id"));
//
//                                        parcelHistoryModel.setSenderLocationLat(parcelOrderObj.optString("sender_location_lat"));
//                                        parcelHistoryModel.setSenderLocationLong(parcelOrderObj.optString("sender_location_long"));
//
//                                        parcelHistoryModel.setOrderId(parcelOrderObj.optString("id"));
//                                        parcelHistoryModel.setStatus(parcelOrderObj.optString("status"));
//                                        parcelHistoryModel.setTotal(parcelOrderObj.optString("total"));
//                                        parcelHistoryModel.setSenderName(parcelOrderObj.optString("sender_name"));
//                                        parcelHistoryModel.setSenderPhone(parcelOrderObj.optString("sender_phone"));
//
//
//                                        parcelHistoryModel.onTheWayToPickup = RiderOrder.getString("on_the_way_to_pickup");
//                                        parcelHistoryModel.pickupDatetime = RiderOrder.getString("pickup_datetime");
//
//
//                                        ObjectMapper om = new ObjectMapper();
//                                        try {
//                                            parcelHistoryModel.rider  = om.readValue(riderObj.toString(), Rider.class);
//                                        } catch (JsonProcessingException e) {
//                                            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
//                                        }
//
//
//                                        parcelHistoryModel.orderMultiStops.clear();
//                                        for (int i=0;i<riderOrderMultiStop.length();i++){
//                                            JSONObject object=riderOrderMultiStop.getJSONObject(i);
//                                            RiderOrderMultiStop orderStatus= new RiderOrderMultiStop();
//                                            orderStatus.id = object.optString("id");
//                                            orderStatus.rider_order_id = object.optString("rider_order_id");
//                                            orderStatus.parcel_order_id = object.optString("parcel_order_id");
//                                            orderStatus.on_the_way_to_pickup = object.optString("on_the_way_to_pickup");
//                                            orderStatus.pickup_datetime = object.optString("pickup_datetime");
//                                            orderStatus.on_the_way_to_dropoff = object.optString("on_the_way_to_dropoff");
//                                            orderStatus.delivered = object.optString("delivered");
//                                            orderStatus.signature = object.optString("signature");
//                                            orderStatus.created = object.optString("created");
//                                            parcelHistoryModel.orderMultiStops.add(orderStatus);
//                                        }

                                        parcelHistoryModel= DataParse.parseParcelOrderResponce(msg,parcelHistoryModel);
                                        showButtonStatus();
                                        parseData();
                                        showMarker();
                                    }
                                } catch (JSONException e) {
                                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                                    Functions.logDMsg("exception at showRiderOrderDetails : "+e.toString());
                                    Functions.logDMsg("exception at showRiderOrderDetails : "+e.getMessage().toString());
                                }

                            }
                        }

                    }
                });

    }


    public void showButtonStatus(){

        if(parcelHistoryModel.onTheWayToPickup.equals(Variables.emptyTime)){
            orderStatus = "0";
        }
        else if(parcelHistoryModel.pickupDatetime.equals(Variables.emptyTime)) {
            orderStatus = "1";
        }
        else if (parcelHistoryModel.orderMultiStops.isEmpty()) {
            orderStatus = "2";
        }
        else {
            RiderOrderMultiStop item=parcelHistoryModel.orderMultiStops.get(parcelHistoryModel.orderMultiStops.size()-1);

            if(parcelHistoryModel.recipientList.size()==parcelHistoryModel.orderMultiStops.size() && !TextUtils.isEmpty(item.signature)){
                orderStatus = "4";
            }

            else if (!TextUtils.isEmpty(item.signature)) {

                orderStatus = "4";
            }

            else if(item.on_the_way_to_dropoff.equals(Variables.emptyTime)) {
                orderStatus = "2";
            }

            else if(item.delivered.equals(Variables.emptyTime)){
                orderStatus = "3";
            }

            else if(TextUtils.isEmpty(item.signature)){
                orderStatus = "4";
            }

        }

        adapter.notifyDataSetChanged();
    }


    /*Method InitLayouts*/
    private void methodInitLayouts() {
        binding.navigationDrawer.usernameTxt.setText(fname + " " + lname);
        if (userImage != null && !userImage.equalsIgnoreCase("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + userImage);
            binding.navigationDrawer.userProfileImage.setImageURI(uri);
        }

        btsBehavior = BottomSheetBehavior.from(binding.bottomSheetLayout);

        btsBehavior.addBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {

            @Override
            public void onStateChanged(@NonNull View bottomSheet, int newState) {
                if (newState == BottomSheetBehavior.STATE_HIDDEN) {
                    btsBehavior.setState(BottomSheetBehavior.STATE_HALF_EXPANDED);
                }
            }

            @Override
            public void onSlide(@NonNull View bottomSheet, float slideOffset) {
            }

        });
    }

    /*Method InitCLickListener*/
    private void methodInitClickListener() {

        binding.menuBtn.setOnClickListener(this);
        binding.chatLayout.setOnClickListener(this);
        binding.navigationDrawer.profileLayout.setOnClickListener(this);
        binding.llChatCall.setOnClickListener(this);
        binding.getSupportLayout.setOnClickListener(this);
        binding.ivChangeMapType.setOnClickListener(this);
        binding.shareDetailLayout.setOnClickListener(this);
        binding.crossbtn.setOnClickListener(this);
        binding.navigationDrawer.yourRidesLayout.setOnClickListener(this);
        binding.trafficBtn.setOnClickListener(this);
        binding.safetyLayout.setOnClickListener(this);
        binding.navigationDrawer.settingBtn.setOnClickListener(this);
    }


    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, googleMap);
        if (mGoogleMap != null) {
            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    TrackParcelActivity.this, R.raw.gray_map));


            if (ActivityCompat.checkSelfPermission(TrackParcelActivity.this
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(TrackParcelActivity.this
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            }
            mGoogleMap.setMyLocationEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            mGoogleMap.getUiSettings().setRotateGesturesEnabled(false);
            mGoogleMap.setOnCameraMoveListener(this);

            mGoogleMap.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
                @Override
                public void onMapLoaded() {
                    callApiDetail();
                }
            });
        }
    }

    private void parseData() {
        if (parcelHistoryModel.getPaymentCardId().equalsIgnoreCase("0")) {
            binding.paymentType.setText(getResources().getString(R.string.cash));
            binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_cash));
        } else {
            binding.paymentType.setText("****" + parcelHistoryModel.getLastFour());
            String cardType = parcelHistoryModel.getCardType();
            if (cardType.equalsIgnoreCase("visa")) {
                binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_visa_card));
            } else if (cardType.equalsIgnoreCase("mastercard")) {
                binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_mastercard));
            } else {
                binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_card_any));
            }
        }


        pickupLatlng = new LatLng(Double.valueOf(parcelHistoryModel.getSenderLocationLat()), Double.valueOf(parcelHistoryModel.getSenderLocationLong()));
        if (parcelHistoryModel.rider.vehicle.lat != null && parcelHistoryModel.rider.vehicle.mylong != null) {
            driverLatlng = new LatLng(Double.valueOf(parcelHistoryModel.rider.vehicle.lat), Double.valueOf(parcelHistoryModel.rider.vehicle.mylong));
        }

        binding.tvPickupAddressLabel.setText(Functions.getAddressSubString(context , pickupLatlng));
        binding.tvPickUpAddressFull.setText(Functions.getAddressString(context, pickupLatlng.latitude, pickupLatlng.longitude));

        setUpScreenData();

    }

    private void setUpScreenData() {

        Uri uri = Uri.parse(Constants.BASE_URL + parcelHistoryModel.rider.image);
        binding.driverImage.setImageURI(uri);


        Uri url = Uri.parse(Constants.BASE_URL + parcelHistoryModel.rider.vehicle.image);
        binding.imageGo.setImageURI(url);




        binding.vehcileInfo.setText(parcelHistoryModel.rider.vehicle.make + " " + parcelHistoryModel.rider.vehicle.model);
        binding.driverNameText.setText(parcelHistoryModel.rider.first_name+" "+parcelHistoryModel.rider.last_name );
         binding.tvCaptainCarBts.setText(parcelHistoryModel.rider.vehicle.license_plate);

        methodChangeridestatus();
    }


    DropOffAdapter adapter;
    private void setReceipentAdapter() {
        adapter = new DropOffAdapter(this, parcelHistoryModel.recipientList,parcelHistoryModel.orderMultiStops, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

            }
        });
        binding.recyclerview.setAdapter(adapter);
    }

    private void methodChangeridestatus() {
        binding.captainDetailLayout.setVisibility(View.VISIBLE);
        binding.tvCaptainComing.setVisibility(View.VISIBLE);

        btsBehavior.setPeekHeight((int) getResources().getDimension(R.dimen._280sdp));
        if (orderStatus.equalsIgnoreCase("0")) {
            binding.tvTitle.setText(R.string.pickup_at);
            binding.tvCaptainComing.setText(context.getString(R.string.order_has_assigned));
        } else if (orderStatus.equalsIgnoreCase("1")) {
            binding.tvTitle.setText(R.string.pickup_at);
            binding.tvCaptainComing.setText(context.getString(R.string.on_the_way_to_pickup_location));
        } else if (orderStatus.equalsIgnoreCase("2")) {
            binding.tvTitle.setText(R.string.arrive_at);
            binding.tvCaptainComing.setText(context.getString(R.string.your_order_has_been_picked_up));
        } else if (orderStatus.equalsIgnoreCase("3")) {
            binding.tvTitle.setText(R.string.arrive_at);
            binding.tvCaptainComing.setText(context.getString(R.string.on_the_way_to_dropoff_location)
                    +" of "+parcelHistoryModel.recipientList.get(parcelHistoryModel.orderMultiStops.size()-1).getRecipientName());
        } else if (orderStatus.equalsIgnoreCase("4")) {
            binding.infoWindowPickup.setVisibility(View.GONE);
            binding.tvTitle.setText(R.string.arrive_at);
            binding.tvCaptainComing.setText(context.getString(R.string.your_order_has_been_delivered)
                    +" to "+parcelHistoryModel.recipientList.get(parcelHistoryModel.orderMultiStops.size()-1).getRecipientName());
        }

    }

    private void showMarker() {

        if(parcelHistoryModel.orderMultiStops.isEmpty()){
            dropoffLatlng = new LatLng(parcelHistoryModel.recipientList.get(0).getRecipientLat(),
                    parcelHistoryModel.recipientList.get(0).getRecipientLong());
        }

        else {
            RecipientModel recipientModel= parcelHistoryModel.recipientList.get(parcelHistoryModel.orderMultiStops.size()-1);
            dropoffLatlng = new LatLng(recipientModel.getRecipientLat(),
                    recipientModel.getRecipientLong());
        }


        if (orderStatus != null && ( orderStatus.equalsIgnoreCase("0") ||  orderStatus.equalsIgnoreCase("1"))){
            methodSetaddresses(true, false);
            methodAddCarMarker();
            showLatLngBoundZoom(driverMarker, pickupMarker);
            drawRoute(pickupLatlng, driverLatlng);
            methodUpdateDriver(pickupLatlng.latitude, pickupLatlng.longitude);
            binding.infoWindowPickup.setVisibility(View.VISIBLE);
        }


        else if (orderStatus != null && orderStatus.equalsIgnoreCase("2")) {
            methodSetaddresses(false, true);
            methodAddCarMarker();
            showLatLngBoundZoom(driverMarker, dropoffMarker);
            drawRoute(driverLatlng, dropoffLatlng);
            methodUpdateDriver(dropoffLatlng.latitude, dropoffLatlng.longitude);
            binding.infoWindowPickup.setVisibility(View.VISIBLE);
        }

        else if (orderStatus != null && orderStatus.equalsIgnoreCase("3")) {
            methodSetaddresses(false, true);
            methodAddCarMarker();
            showLatLngBoundZoom(driverMarker, dropoffMarker);
            drawRoute(driverLatlng, dropoffLatlng);
            methodUpdateDriver(dropoffLatlng.latitude, dropoffLatlng.longitude);
            binding.infoWindowPickup.setVisibility(View.VISIBLE);
        }

        else if (orderStatus != null && orderStatus.equalsIgnoreCase("4")) {
            if(parcelHistoryModel.recipientList.size()==parcelHistoryModel.orderMultiStops.size()){
                methodSetaddresses(false, true);
                showLatLngBoundZoom(dropoffMarker);
                if (driverMarker != null) {
                    driverMarker.remove();
                    driverMarker=null;
                }
                mapWorker.removePolylineWithAnimation();

            }else {

                methodSetaddresses(false, true);
                methodAddCarMarker();
                showLatLngBoundZoom(driverMarker, dropoffMarker);
                drawRoute(driverLatlng, dropoffLatlng);
                methodUpdateDriver(dropoffLatlng.latitude, dropoffLatlng.longitude);
                binding.infoWindowPickup.setVisibility(View.VISIBLE);
            }

        }


    }


    private void methodSetaddresses(boolean addpickup, boolean adddrop) {

        if(mGoogleMap!=null){

            if(pickupMarker!=null)
                pickupMarker.remove();

            if(dropoffMarker!=null)
                dropoffMarker.remove();

            if(addpickup && pickupLatlng != null)
                pickupMarker = mapWorker.addMarker(pickupLatlng, pickupMarkerBitmap);

            if(adddrop && dropoffLatlng != null)
                dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);

        }

    }

    private void methodUpdateDriver(double lat, double lng) {

        if (handler != null && runable != null) {
            handler.removeCallbacks(runable);
        }

        if (handler == null)
            handler = new Handler();

        if (runable == null) {
            runable = () -> methodUpdatedriverlatlng();
        }

        handler.postDelayed(runable, 1000);
    }


    private void methodAddCarMarker() {
        if (driverMarker == null) {
            driverMarker = mapWorker.addMarker(driverLatlng, driverMarkerBitmap);
        }
    }


    // [AWS] DatabaseReference mGetReference replaced — use AWSManager REST API
        DatabaseReference mGetReference = null;
    ValueEventListener valueEventListener;
    private void methodUpdatedriverlatlng() {
        Functions.logDMsg("driverId : " + parcelHistoryModel.rider.id + " : "+parcelHistoryModel.rider.vehicle.ride_type_id);


        if (parcelHistoryModel.rider != null && !parcelHistoryModel.rider.id.equalsIgnoreCase("")) {
            mGetReference = rootRef.child("Drivers").child(parcelHistoryModel.rider.id + "_" + parcelHistoryModel.rider.vehicle.ride_type_id);
            valueEventListener = new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    Functions.logDMsg("driverId : " + parcelHistoryModel.rider.id + " : "+parcelHistoryModel.rider.vehicle.ride_type_id);
                    if (dataSnapshot.exists() && dataSnapshot.getValue() != null) {
                        double lat = (Double) dataSnapshot.child("l").child("0").getValue();
                        double lng = (Double) dataSnapshot.child("l").child("1").getValue();

                        double distanceOld = calculateDistance(lat, lng, driverLatlng.latitude, driverLatlng.longitude);
                        driverLatlng = new LatLng(lat, lng);
                        methodRotatemarker(lat, lng);
                        if (Constants.ALLOW_ROUTE_MUTIPLE) {
                            if (distanceOld > 100) {
                                distanceOld = 0;
                                if (whichScreen.equalsIgnoreCase("0") ||
                                        whichScreen.equalsIgnoreCase("1")) {

                                    mapWorker.getDirection(driverLatlng, pickupLatlng, directionsResult -> {
                                        if (directionsResult != null) {
                                            if (polyLine != null) {
                                                polyLine.remove();
                                            }
                                            mapWorker.removePolylineWithAnimation();
                                            polyLine = mapWorker.addPolyline(directionsResult, mGoogleMap);
                                            binding.tvTime.setText(mapWorker.durationInTraffic(directionsResult));
                                        } else {
                                            drawRoutetolocation(driverLatlng, pickupLatlng);
                                        }
                                    });

                                }else{
                                    mapWorker.getDirection(driverLatlng, dropoffLatlng, directionsResult -> {
                                        if (directionsResult != null) {
                                            if (polyLine != null) {
                                                polyLine.remove();
                                            }
                                            mapWorker.removePolylineWithAnimation();
                                            polyLine = mapWorker.addPolyline(directionsResult, mGoogleMap);
                                            binding.tvTime.setText(mapWorker.durationInTraffic(directionsResult));
                                        } else {
                                            drawRoutetolocation(driverLatlng, dropoffLatlng);
                                        }
                                    });
                                }

                            }
                        }
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                    databaseError.getMessage();
                }
            };
            mGetReference.addValueEventListener(valueEventListener);
        }
    }

    private void methodRotatemarker(Double lat, Double lng) {
        LatLng location = new LatLng(lat,lng);
        if(driverMarker!=null) {


            mapWorker.rotateMarker(driverMarker, (float) mapWorker.getBearingBetweenTwoPoints1(driverMarker.getPosition(), location));
            if (!moveToCurrent) {
                mapWorker.animateMarkerTo(driverMarker, lat, lng);
                if (!orderStatus.equals("4")) {
                    if (dropoffMarker != null)
                        showLatLngBoundZoom(dropoffMarker, driverMarker);
                    else
                        showLatLngBoundZoom(driverMarker);
                } else {
                    showLatLngBoundZoom(pickupMarker, driverMarker);
                }

            }

            else {
                mapWorker.animateMarkerTo(driverMarker, lat, lng);
                mapWorker.animateCameraTo(mGoogleMap, lat, lng, Constants.maxZoomLevel);
            }

        }

    }

    private void drawRoutetolocation(LatLng pickUp, LatLng dropOff) {
        List<LatLng> route = null;

        if (route == null) {
            route = new ArrayList<>();
        } else {
            route.clear();
            MapAnimator.getInstance().clearMapRoute();
        }

        route.add(new LatLng(pickUp.latitude, pickUp.longitude));
        route.add(new LatLng(dropOff.latitude, dropOff.longitude));

        if (mGoogleMap != null && route != null && route.size() > 0) {
            MapAnimator.getInstance().animateRoute(mGoogleMap, route, true);
        } else {
            Functions.showToast(getApplicationContext(), "Map not ready");
        }

    }

    private void drawRoute(LatLng pickUp, LatLng dropOff) {
        mapWorker.removePolylineWithAnimation();
        if (mGoogleMap != null && mapWorker != null && (pickUp != null && dropOff != null)) {
            mapWorker.getDirection(pickUp, dropOff, directionsResult -> {
                if (directionsResult != null) {
                    mapWorker.addPolylineWithAnimation(directionsResult, mGoogleMap);
                    String estTime = mapWorker.getDistanceTime(directionsResult);
                    String[] times = estTime.split(" ");
                    long time = System.currentTimeMillis();
                    time = time + TimeUnit.MINUTES.toMillis(Long.parseLong(times[0]));
                    binding.tvTime.setText(DateOperations.getDate(time, "hh:mm aaaa"));

                } else {
                    drawRoutetolocation(pickUp, dropOff);
                }
            });
        } else {
            Functions.showToast(this, "latlong missing");
        }
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(TrackParcelActivity.this);
            binding.mapView.onResume();
            binding.mapView.getMapAsync(this);
        }

    }


    @Override
    public void onClick(View view) {
        switch (view.getId()) {


            case R.id.iv_change_map_type:
                methodChangemaptype();
                break;

            case R.id.trafficBtn:
                methodChangeTrafficType();
                break;

            case R.id.crossbtn:
                startActivity(new Intent(TrackParcelActivity.this, HomeActivity.class));
                finish();
                break;


            case R.id.shareDetailLayout:


                RecipientModel recipientModel;
                if(parcelHistoryModel.orderMultiStops.isEmpty()){
                    recipientModel=parcelHistoryModel.recipientList.get(0);
                }
                else {
                    recipientModel= parcelHistoryModel.recipientList.get(parcelHistoryModel.orderMultiStops.size()-1);
                }
                final Intent intent = new Intent(Intent.ACTION_SEND);
                String link = "Your GO Grab Detail:" + "\n\n"
                        + "PickUp Location : " + parcelHistoryModel.getSenderLocationLat() + "\n\n"
                        + "Dropoff Location : " + recipientModel.getRecipientAddress() + "\n\n"
                        + "Driver : " + parcelHistoryModel.rider.first_name+" "+parcelHistoryModel.rider.last_name + "\n\n"
                        + parcelHistoryModel.rider.phone + "\n\n"
                        + parcelHistoryModel.rider.vehicle.make + " " + parcelHistoryModel.rider.vehicle.model + " " + parcelHistoryModel.rider.vehicle.license_plate + "\n\n" +
                        "Track Here " + "\n" + "https://www.google.com/";

                intent.putExtra(Intent.EXTRA_TEXT, link);
                intent.setType("text/plain");
                startActivity(Intent.createChooser(intent, getString(R.string.share_image_via)));
                break;

            case R.id.get_support_layout:
                openWebView(getResources().getString(R.string.get_support), Constants.HELP_URL);
                break;


            case R.id.setting_btn:
                AccountFragment payWithFragment = new AccountFragment();
                FragmentTransaction transaction = getSupportFragmentManager().beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.add(R.id.track_container, payWithFragment).addToBackStack(null).commit();
                break;

            case R.id.profileLayout:
                Fragment accountFragment = new AccountFragment();
                FragmentTransaction tr = getSupportFragmentManager().beginTransaction();
                tr.add(R.id.track_container, accountFragment).addToBackStack(null).commit();
                binding.drawerLayout.closeDrawers();
                break;


            case R.id.chatLayout:
                methodOpenchatactivity(parcelHistoryModel.rider.first_name+" "+parcelHistoryModel.rider.last_name,
                        parcelHistoryModel.rider.id, parcelHistoryModel.rider.image, orderId);
                break;

            case R.id.yourRidesLayout:
                Fragment yourRidesFragment = new HistoryFragment();
                FragmentTransaction fragmentTransaction = getSupportFragmentManager().beginTransaction();
                fragmentTransaction.add(R.id.track_container, yourRidesFragment).addToBackStack(null).commit();
                binding.drawerLayout.closeDrawers();
                break;

            case R.id.menuBtn:
                if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
                    binding.drawerLayout.closeDrawer(GravityCompat.START);
                } else {
                    binding.drawerLayout.openDrawer(GravityCompat.START);
                }
                break;

            case R.id.ll_chat_call:
                if (parcelHistoryModel.rider.phone != null) {
                    Intent tel = new Intent(Intent.ACTION_DIAL,
                            Uri.fromParts("tel", parcelHistoryModel.rider.phone, null));
                    startActivity(tel);
                }
                break;

            default:
                break;
        }
    }


    public void openWebView(String urlTitle, String sliderUrl) {
        Functions.hideSoftKeyboard(TrackParcelActivity.this);
        WebViewFragment webviewF = new WebViewFragment();
        FragmentTransaction transaction = getSupportFragmentManager().beginTransaction();
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        Bundle bundle = new Bundle();
        bundle.putString("url", sliderUrl);
        bundle.putString("title", urlTitle);
        webviewF.setArguments(bundle);
        transaction.addToBackStack(null);
        transaction.replace(R.id.track_container, webviewF).commit();
    }

    private void methodChangemaptype() {
        if (mGoogleMap != null) {
            if (mapCheck) {
                binding.ivChangeMapType.setImageResource(R.drawable.ic_normal_map);
                mGoogleMap.setMapType(GoogleMap.MAP_TYPE_NORMAL);
                mapCheck = false;
            } else {
                binding.ivChangeMapType.setImageResource(R.drawable.ic_earth_map);
                mGoogleMap.setMapType(GoogleMap.MAP_TYPE_SATELLITE);
                mapCheck = true;
            }
        }
    }

    private void methodChangeTrafficType() {
        if (mGoogleMap != null) {
            if (trafficCheck) {
                binding.trafficBtn.setImageResource(R.drawable.ic_map_route);
                mGoogleMap.setTrafficEnabled(false);
                trafficCheck = false;
            } else {
                binding.trafficBtn.setImageResource(R.drawable.ic_traffic_on);
                mGoogleMap.setTrafficEnabled(true);
                trafficCheck = true;
            }
        }
    }

    private void showLatLngBoundZoom(Marker... marker) {

        if (marker[0] == null && marker[1] == null) {
            return;
        }

        LatLngBounds.Builder latlngBuilder = new LatLngBounds.Builder();
        for (Marker mrk : marker) {
            try {
                latlngBuilder.include(mrk.getPosition());
            } catch (Exception e) {
                Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
            }
        }

        LatLngBounds bounds = latlngBuilder.build();

        LatLng center = bounds.getCenter();
        LatLng northEast = move(center, 709, 709);
        LatLng southWest = move(center, -709, -709);
        latlngBuilder.include(southWest);
        latlngBuilder.include(northEast);
        if (areBoundsTooSmall(bounds, 300)) {
            mapWorker.animateCameraTo(mGoogleMap, CameraUpdateFactory.newLatLngZoom(bounds.getCenter(), Constants.maxZoomLevel));
        } else {
            mapWorker.animateCameraTo(mGoogleMap, CameraUpdateFactory.newLatLngBounds(bounds, 300));
        }
    }

    private boolean areBoundsTooSmall(LatLngBounds bounds, int minDistanceInMeter) {
        float[] result = new float[1];
        Location.distanceBetween(bounds.southwest.latitude, bounds.southwest.longitude, bounds.northeast.latitude, bounds.northeast.longitude, result);
        return result[0] < minDistanceInMeter;
    }

    private LatLng move(LatLng startLL, double toNorth, double toEast) {
        double lonDiff = meterToLongitude(toEast, startLL.latitude);
        double latDiff = meterToLatitude(toNorth);
        return new LatLng(startLL.latitude + latDiff, startLL.longitude
                + lonDiff);
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
    public void onDestroy() {
        if (binding.mapView != null)
            binding.mapView.onDestroy();

        if (broadcastReceiver != null) {
            unregisterReceiver(broadcastReceiver);
            broadcastReceiver = null;
        }

        if(valueEventListener != null){
            mGetReference.removeEventListener(valueEventListener);
        }

        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();
        binding.mapView.onResume();
        //binding.mapView.getMapAsync(this);
    }

    @Override
    protected void onPause() {
        if (binding.mapView != null)
            binding.mapView.onPause();
        super.onPause();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        if (binding.mapView != null)
            binding.mapView.onLowMemory();
    }

    private void methodOpenchatactivity(String receiverName, String receiverid, String receiverPic, String requestId) {
        Intent args = new Intent(this, ChatA.class);
        args.putExtra("senderid", userId);
        args.putExtra("Receiverid", receiverid);
        args.putExtra("Receiver_name", receiverName);
        args.putExtra("Receiver_pic", receiverPic);
        args.putExtra("request_id", requestId);
        startActivity(args);

    }


    @Override
    public void onCameraMove() {

        if (orderStatus != null & (orderStatus.equals("0") || orderStatus.equals("1"))) {
            Projection projection = mGoogleMap.getProjection();
            LatLng markerLocation = pickupMarker.getPosition();
            Point screenPosition = projection.toScreenLocation(markerLocation);
            binding.infoWindowPickup.setX(screenPosition.x - (binding.infoWindowPickup.getWidth() / 2));
            binding.infoWindowPickup.setY(screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(TrackParcelActivity.this, 42)));
        }

        if (orderStatus != null & (orderStatus.equals("2") || orderStatus.equals("3"))) {
                Projection projection = mGoogleMap.getProjection();
                LatLng markerLocation = dropoffMarker.getPosition();
                Point screenPosition = projection.toScreenLocation(markerLocation);
                binding.infoWindowPickup.setX(screenPosition.x - (binding.infoWindowPickup.getWidth() / 2));
                binding.infoWindowPickup.setY(screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(TrackParcelActivity.this, 42)));
        }
    }

}