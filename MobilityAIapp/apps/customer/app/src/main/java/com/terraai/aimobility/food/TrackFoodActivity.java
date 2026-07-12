package com.terraai.aimobility.food;

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
import com.terraai.aimobility.codeclasses.AppCompatLocaleActivity;
import androidx.core.app.ActivityCompat;
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
import com.terraai.aimobility.Interface.APICallBack;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.activitiesandfragment.HomeActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.databinding.ActivityFoodTackBinding;
import com.terraai.aimobility.mapclasses.MapAnimator;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.YourOrdersModel;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.ride.account.AccountFragment;
import com.terraai.aimobility.ride.activeride.CancelRideBottomSheet;
import com.terraai.aimobility.userschat.ChatA;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;


public class TrackFoodActivity extends AppCompatLocaleActivity implements View.OnClickListener, OnMapReadyCallback, GoogleMap.OnCameraMoveListener {

    ActivityFoodTackBinding binding;

    String userId;
    String whichScreen = "opening_screen";
    Marker pickupMarker, dropoffMarker, driverMarker;
    LatLng pickupLatlng, dropoffLatlng, driverLatlng;
    Bitmap dropoffMarkerBitmap, driverMarkerBitmap, pickupMarkerBitmap;
    Context context;
    BottomSheetBehavior btsBehavior;
    MapWorker mapWorker;
    // [AWS] DatabaseReference rootRef replaced — use AWSManager REST API
        Object rootRef = null;
    Boolean mapCheck = false;
    Double vehcileLat, vehcileLong, pickLat, pickLong, dropLat, dropLong;
    Boolean trafficCheck = false;
    String fname, lname, driverFullName;
    Polyline polyLine;
    String currencySymbol;
    YourOrdersModel yourOrdersModel;
    String rideType;
    GoogleMap mGoogleMap;
    double earthradius = 6371000;
    String userImage;
    String driverPic;
    String request;
    String driverId, requestId;
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


    private String reason;

    public TrackFoodActivity() {
        // Required empty public constructor
    }


    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        binding = ActivityFoodTackBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("request_responce");

        registerReceiver(broadcastReceiver, intentFilter);

        binding.mapView.onCreate(savedInstanceState);
        context = getApplicationContext();
        userId = MyPreferences.getSharedPreference(TrackFoodActivity.this).getString(MyPreferences.USER_ID, "");
        currencySymbol = MyPreferences.getSharedPreference(TrackFoodActivity.this).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        fname = MyPreferences.getSharedPreference(TrackFoodActivity.this).getString(MyPreferences.fname, "");
        lname = MyPreferences.getSharedPreference(TrackFoodActivity.this).getString(MyPreferences.lname, "");
        rootRef = null; // [AWS-MIGRATED] FirebaseDatabase removed
        userImage = MyPreferences.getSharedPreference(TrackFoodActivity.this).getString(MyPreferences.image, "");

        pickupMarkerBitmap = Functions.getMarkerPickupPinView(TrackFoodActivity.this);
        dropoffMarkerBitmap = Functions.getMarkerDropPinView(TrackFoodActivity.this);
        driverMarkerBitmap = Functions.getDriverPickUpView(TrackFoodActivity.this);

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        yourOrdersModel = (YourOrdersModel) bundle.getSerializable("dataModel");
        orderId = intent.getStringExtra("order_id");
        request = intent.getStringExtra("status");
        binding.mapView.onResume();
        binding.mapView.getMapAsync(TrackFoodActivity.this);

        methodInitLayouts();
        methodInitClickListener();

        setupMapIfNeeded();
        parseData();
    }


    private void callApiDetail() {
        JSONObject params = new JSONObject();
        try {
            params.put("food_order_id", orderId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showOrderDetail(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONObject msg = respobj.optJSONObject("msg");
                                        DataParse.showOrderDetail(msg, new APICallBack() {
                                            @Override
                                            public void onParseData(Object model) {
                                                yourOrdersModel = (YourOrdersModel) model;
                                                orderStatus = yourOrdersModel.getOrderStatus();
                                                if(orderStatus.equals("")){
                                                    orderStatus = "accepted_by_restaurant";
                                                }
                                            }

                                        });
                                    }

                                    setUpScreenData();
                                    showMarker();

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

    /*Method InitLayouts*/
    private void methodInitLayouts() {


        binding.changeArrow.setVisibility(View.GONE);
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

        binding.chatLayout.setOnClickListener(this);
       binding.llChatCall.setOnClickListener(this);
        binding.ivChangeMapType.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.trafficBtn.setOnClickListener(this);
        }


    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, googleMap);
        if (mGoogleMap != null) {
            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    TrackFoodActivity.this, R.raw.gray_map));


            if (ActivityCompat.checkSelfPermission(TrackFoodActivity.this
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(TrackFoodActivity.this
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

    private void parseData(){

        binding.tvPickupAddressLabel.setText(yourOrdersModel.getResturantModel().getResturantName());
        binding.tvPickUpAddressFull.setText(yourOrdersModel.getResturantModel().getLocation_string());

        binding.dropOffLocation.setText(yourOrdersModel.getNearbyModelClass().address);
        binding.tvDropoffLabel.setText(yourOrdersModel.getNearbyModelClass().addressLabel);

        orderStatus = yourOrdersModel.getOrderStatus();

        if(orderStatus.equals("")){
            orderStatus = "accepted_by_restaurant";
        }

        setUpScreenData();
    }

    private void setUpScreenData() {


        driverPic = yourOrdersModel.getDrivePic();
        if (driverPic != null && !driverPic.equalsIgnoreCase("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + driverPic);
            binding.driverImage.setImageURI(uri);
        }


        if (!TextUtils.isEmpty(yourOrdersModel.getVehicleLat()) && !TextUtils.isEmpty(yourOrdersModel.getVehicleLng())) {
            vehcileLat = Double.valueOf(yourOrdersModel.getVehicleLat());
            vehcileLong = Double.valueOf(yourOrdersModel.getVehicleLng());
            driverLatlng = new LatLng(vehcileLat, vehcileLong);
        }

        binding.vehcileInfo.setText(yourOrdersModel.getVehicleMake() + " " + yourOrdersModel.getVehicleModel());
        binding.driverNameText.setText(yourOrdersModel.getDriverUsername());
        driverFullName = yourOrdersModel.getDriverFullName();
        binding.tvCaptainCarBts.setText(yourOrdersModel.getLicensePlate());


        dropLat = Double.valueOf(yourOrdersModel.getNearbyModelClass().lat);
        dropLong = Double.valueOf(yourOrdersModel.getNearbyModelClass().lng);
        pickLat = Double.valueOf(yourOrdersModel.getResturantModel().getResturantLat());
        pickLong = Double.valueOf(yourOrdersModel.getResturantModel().getResturantLong());

        pickupLatlng = new LatLng(pickLat, pickLong);
        dropoffLatlng = new LatLng(dropLat, dropLong);

        request = yourOrdersModel.getStatus();
        driverId = yourOrdersModel.getDriverId();
        requestId = yourOrdersModel.getRequestId();
        rideType = yourOrdersModel.getRideTypeId();
        Functions.logDMsg("TrackFoodActivity : "+"driverId : "+driverId +" : "+"rideType " + ":" +rideType);
        methodChangeridestatus();
    }

    private void methodChangeridestatus() {

        Functions.logDMsg("TrackFoodActivity : "+"status : "+whichScreen +" : "+orderStatus + ":" +request);
        if (request.equals("0")) {
            binding.findingYourCaptainText.setText(context.getString(R.string.order_processing));
        }else if(request.equals("1")&& yourOrdersModel.getHotelAccepted().equals("1") && orderStatus.equals("accepted_by_restaurant")){
            binding.findingYourCaptainText.setText(context.getString(R.string.your_order_restaurent));
        } else if (request.equals("1")) {
            binding.captainDetailLayout.setVisibility(View.VISIBLE);
            binding.tvCaptainComing.setVisibility(View.VISIBLE);
            binding.findingYourCaptainText.setVisibility(View.GONE);
            binding.progressBarLayout.setVisibility(View.GONE);
            btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._280sdp));
            if (orderStatus.equalsIgnoreCase("created")) {
                binding.tvTitle.setText(R.string.pickup_at);
                binding.tvCaptainComing.setText(context.getString(R.string.order_has_assigned));
            }else if (orderStatus.equalsIgnoreCase("ontheway")) {
                binding.tvTitle.setText(R.string.pickup_at);
                binding.tvCaptainComing.setText(context.getString(R.string.on_the_way_to_pickup_location));
            }else if (orderStatus.equalsIgnoreCase("pickupDatetime")) {
                binding.tvTitle.setText(R.string.arrive_at);
                binding.tvCaptainComing.setText(context.getString(R.string.your_order_has_been_picked_up));
            }
            else if (orderStatus.equalsIgnoreCase("onTheWayToDropoff")) {
                binding.tvTitle.setText(R.string.arrive_at);
                binding.tvCaptainComing.setText(context.getString(R.string.on_the_way_to_dropoff_location));
            }else if (orderStatus.equalsIgnoreCase("delivered")) {
                binding.infoWindowPickup.setVisibility(View.GONE);
                binding.tvTitle.setText(R.string.arrive_at);
                binding.tvCaptainComing.setText(context.getString(R.string.your_order_has_been_delivered));
                if(driverMarker != null){
                    driverMarker.remove();
                }
            }

        } else if(request.equals("2") && orderStatus.equalsIgnoreCase("delivered")){
            binding.captainDetailLayout.setVisibility(View.VISIBLE);
            binding.tvCaptainComing.setVisibility(View.VISIBLE);
            binding.findingYourCaptainText.setVisibility(View.GONE);
            binding.progressBarLayout.setVisibility(View.GONE);
            btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._300sdp));
            binding.infoWindowPickup.setVisibility(View.GONE);
            binding.tvCaptainComing.setText(context.getString(R.string.your_order_has_been_delivered));
            mapWorker.removePolylineWithAnimation();
            if(driverMarker != null){
                driverMarker.remove();
            }
        }

    }

    private void showMarker(){
        if (request.equals("0")) {
            methodSetaddresses(true , true);
            showLatLngBoundZoom(dropoffMarker, pickupMarker);
            drawRoute(pickupLatlng, dropoffLatlng);
        }else if(request.equals("1")&& yourOrdersModel.getHotelAccepted().equals("1") && orderStatus.equals("accepted_by_restaurant")){
            methodSetaddresses(true , true);
            showLatLngBoundZoom(dropoffMarker, pickupMarker);
            drawRoute(pickupLatlng, dropoffLatlng);
        } else if (request.equals("1")) {
            if (orderStatus != null && orderStatus.equalsIgnoreCase("created")) {
                methodSetaddresses(true , false);
                methodAddCarMarker();
                showLatLngBoundZoom(driverMarker, pickupMarker);
                drawRoute(pickupLatlng, driverLatlng);
                binding.infoWindowPickup.setVisibility(View.VISIBLE);
            }else if (orderStatus != null && orderStatus.equalsIgnoreCase("ontheway")) {
                methodSetaddresses(true , false);
                methodAddCarMarker();
                showLatLngBoundZoom(driverMarker, pickupMarker);
                drawRoute(pickupLatlng, driverLatlng);
                methodUpdateDriver();
                binding.infoWindowPickup.setVisibility(View.VISIBLE);
            }else if (orderStatus != null && orderStatus.equalsIgnoreCase("pickupDatetime")) {
                methodSetaddresses(false , true);
                methodAddCarMarker();
                showLatLngBoundZoom(driverMarker, dropoffMarker);
                drawRoute(driverLatlng, dropoffLatlng);
                methodUpdateDriver();
                binding.infoWindowPickup.setVisibility(View.VISIBLE);
            }

            else if (orderStatus != null && orderStatus.equalsIgnoreCase("onTheWayToDropoff")) {
                methodSetaddresses(false , true);
                methodAddCarMarker();
                showLatLngBoundZoom(driverMarker, dropoffMarker);
                drawRoute(driverLatlng, dropoffLatlng);
                methodUpdateDriver();
                binding.infoWindowPickup.setVisibility(View.VISIBLE);
            }else if (orderStatus != null && orderStatus.equalsIgnoreCase("delivered")) {
                methodSetaddresses(false , true);
                showLatLngBoundZoom(dropoffMarker);
                if(driverMarker != null){
                    driverMarker.remove();
                }
            }

        } else if(request.equals("2") && orderStatus.equalsIgnoreCase("delivered")){
            methodSetaddresses(false , true);
            showLatLngBoundZoom(dropoffMarker);
            if(driverMarker != null){
                driverMarker.remove();
            }
        }
    }



    private void methodSetaddresses(boolean addpickup  , boolean adddrop) {

        if(addpickup) {
            if (mGoogleMap != null && pickupMarker == null && pickupLatlng != null) {
                pickupMarker = mapWorker.addMarker(pickupLatlng, pickupMarkerBitmap);
            } else {
                pickupMarker.remove();
                pickupMarker = mapWorker.addMarker(pickupLatlng, pickupMarkerBitmap);
            }
        }else{
            if(pickupMarker != null)
              pickupMarker.remove();
        }

        if(adddrop) {
            if (mGoogleMap != null && dropoffLatlng.latitude != 0.0 && dropoffLatlng.longitude != 0.0) {
                if (dropoffMarker == null && dropoffLatlng != null) {
                    dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);
                } else {
                    dropoffMarker.remove();
                    dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);
                }
            }
        }else{
            if(dropoffMarker != null)
                 dropoffMarker.remove();
        }

    }

    private void methodUpdateDriver() {

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
    Object /* ValueEventListener stub */ valueEventListener;
    // [AWS] DatabaseReference mGetReference replaced — use AWSManager REST API
        Object mGetReference = null;
    private void methodUpdatedriverlatlng() {
        if (driverId != null && !driverId.equalsIgnoreCase("")) {

            mGetReference = rootRef.child("Drivers").child(driverId + "_" + rideType);

            valueEventListener = new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    if (dataSnapshot.exists() && dataSnapshot.getValue() != null) {

                        double lat = (Double) dataSnapshot.child("l").child("0").getValue();
                        double lng = (Double) dataSnapshot.child("l").child("1").getValue();

                        double distanceOld = calculateDistance(lat, lng, driverLatlng.latitude, driverLatlng.longitude);
                        driverLatlng = new LatLng(lat, lng);

                        if (Constants.ALLOW_ROUTE_MUTIPLE) {
                            if (distanceOld > 100) {
                                distanceOld = 0;
                                if (orderStatus != null & (orderStatus.equals("created")|| orderStatus.equals("ontheway"))){

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

                        methodRotatemarker(lat, lng);
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
        mapWorker.rotateMarker(driverMarker, (float) mapWorker.getBearingBetweenTwoPoints1(driverMarker.getPosition(), location));
        if (request.equals("1") && (orderStatus.equals("pickupDatetime")|| orderStatus.equals("onTheWayToDropoff"))) {
                showLatLngBoundZoom(dropoffMarker, driverMarker);
            } else {
               showLatLngBoundZoom(pickupMarker, driverMarker);
           }

        mapWorker.animateMarkerTo(driverMarker, location.latitude, location.longitude);

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

        if (mGoogleMap != null && mapWorker != null && (pickUp != null && dropOff != null)) {
            mapWorker.getDirection(pickUp, dropOff, directionsResult -> {
                if (directionsResult != null) {
                    mapWorker.removePolylineWithAnimation();
                    mapWorker.addPolylineWithAnimation(directionsResult, mGoogleMap);
                    String estTime = mapWorker.getDistanceTime(directionsResult);
                    String[] times = estTime.split(" ");
                    long time= System.currentTimeMillis();
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
        if (mGoogleMap == null) {
            MapsInitializer.initialize(TrackFoodActivity.this);
            binding.mapView.onResume();
            binding.mapView.getMapAsync(this);
        }

    }


    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.cancelRideLayout:
                new CancelRideBottomSheet(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            reason = bundle.getString("reason");
                            callApiForcancel(reason);
                        }
                    }
                }).show(TrackFoodActivity.this.getSupportFragmentManager(), "");

                break;

            case R.id.iv_change_map_type:
                methodChangemaptype();
                break;

            case R.id.trafficBtn:
                methodChangeTrafficType();
                break;

            case R.id.crossbtn:
                startActivity(new Intent(TrackFoodActivity.this, HomeActivity.class));
                finish();
                break;

            case R.id.back_btn:
               finish();
                break;

            case R.id.shareDetailLayout:

                final Intent intent = new Intent(Intent.ACTION_SEND);
                String link = "Your GO Grab Detail:" + "\n\n"
                        + "PickUp Location : " + yourOrdersModel.getResturantModel().getResturantName() + "\n\n"
                        + "Dropoff Location : " + binding.dropOffLocation.getText().toString() + "\n\n"
                        + "Driver : " + driverFullName + "\n\n"
                        + yourOrdersModel.getDriverPhoneNo() + "\n\n"
                        + yourOrdersModel.getVehicleMake() + " " + yourOrdersModel.getVehicleModel() + " " + yourOrdersModel.getLicensePlate() + "\n\n" +
                        "Track Here " + "\n" + "https://www.google.com/";

                intent.putExtra(Intent.EXTRA_TEXT, link);
                intent.setType("text/plain");
                startActivity(Intent.createChooser(intent, getString(R.string.share_image_via)));
                break;

            case R.id.get_support_layout:
                openWebView(binding.getRoot().getContext().getString(R.string.get_support), Constants.HELP_URL);
                break;



            case R.id.chatLayout:
                methodOpenchatactivity(driverFullName, driverId, driverPic, orderId);
                break;


            case R.id.setting_btn:
                AccountFragment payWithFragment = new AccountFragment();
                FragmentTransaction transaction = getSupportFragmentManager().beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.add(R.id.track_container, payWithFragment).addToBackStack(null).commit();

                break;





            case R.id.ll_chat_call:
                if (yourOrdersModel.getDriverPhoneNo() != null) {
                    Intent tel = new Intent(Intent.ACTION_DIAL,
                            Uri.fromParts("tel", yourOrdersModel.getDriverPhoneNo(), null));
                    startActivity(tel);
                }
                break;

            default:
                break;
        }
    }


    public void openWebView(String urlTitle, String sliderUrl) {
        Functions.hideSoftKeyboard(TrackFoodActivity.this);
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

    private void callApiForcancel(String reason) {
        JSONObject params = new JSONObject();

        try {
            params.put("reason", reason);
            params.put("user_id", "" + userId);
            params.put("request_id", orderId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(TrackFoodActivity.this, false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).rideCancelled(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at callApiForcancel : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        Intent intent1 = new Intent(TrackFoodActivity.this, HomeActivity.class);
                                        startActivity(intent1);
                                        intent1.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                        finish();
                                        overridePendingTransition(R.anim.in_from_left, R.anim.out_to_right);
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

                        }
                    }
                });

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

        if(valueEventListener != null){
            mGetReference.removeEventListener(valueEventListener);
        }

        if (broadcastReceiver != null) {
            unregisterReceiver(broadcastReceiver);
            broadcastReceiver = null;
        }

        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();
        binding.mapView.onResume();
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
        if(request.equals("1")) {
            if (orderStatus != null & (orderStatus.equals("created")|| orderStatus.equals("ontheway"))) {
                Projection projection = mGoogleMap.getProjection();
                LatLng markerLocation = pickupMarker.getPosition();
                Point screenPosition = projection.toScreenLocation(markerLocation);
                binding.infoWindowPickup.setX(screenPosition.x - (binding.infoWindowPickup.getWidth() / 2));
                binding.infoWindowPickup.setY(screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(TrackFoodActivity.this, 42)));
            }

            if (orderStatus != null & (orderStatus.equals("pickupDatetime")|| orderStatus.equals("onTheWayToDropoff"))) {
                Projection projection = mGoogleMap.getProjection();
                LatLng markerLocation = dropoffMarker.getPosition();
                Point screenPosition = projection.toScreenLocation(markerLocation);
                binding.infoWindowPickup.setX(screenPosition.x - (binding.infoWindowPickup.getWidth() / 2));
                binding.infoWindowPickup.setY(screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(TrackFoodActivity.this, 42)));
            }
        }

    }

}