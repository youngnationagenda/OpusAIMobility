package com.terraai.aimobility.ride.activeride;

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
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.View;
import android.widget.Toast;

import androidx.annotation.NonNull;
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
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
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
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SingleClickListener;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.databinding.ActivityFindingCaptainBinding;
import com.terraai.aimobility.mapclasses.MapAnimator;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.ActiveRequestModel;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.ride.account.AccountFragment;
import com.terraai.aimobility.ride.bookride.WheretoFragment;
import com.terraai.aimobility.ride.history.HistoryFragment;
import com.terraai.aimobility.userschat.ChatA;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.Query;
import java.util.List;
import com.firebase.geofire.GeoFire;
import com.firebase.geofire.GeoQuery;
import com.firebase.geofire.GeoLocation;
import com.firebase.geofire.GeoQueryEventListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;


public class ActiveRideA extends AppCompatLocaleActivity implements View.OnClickListener, OnMapReadyCallback, GoogleMap.OnCameraMoveListener {


    String userId, call;
    String whichScreen = "opening_screen";
    Marker pickupMarker, dropoffMarker, driverMarker;
    LatLng pickupLatlng, dropoffLatlng, driverLatlng;
    Bitmap dropoffMarkerBitmap, driverMarkerBitmap, pickupMarkerBitmap;
    Context context;
    BottomSheetBehavior btsBehavior;
    MapWorker mapWorker;
    // [AWS] DatabaseReference rootRef replaced — use AWSManager REST API
        DatabaseReference rootRef = null;
    Boolean mapCheck = false;
    Double vehcileLat, vehcileLong, pickLat, pickLong, dropLat, dropLong;
    Boolean trafficCheck = false;
    float maxZoomLevel = Constants.maxZoomLevel;
    String fname, lname, driverFullName;
    long mBackPressed = 0;
    Polyline polyLine;
    String currencySymbol;
    ActiveRequestModel activeRequestModel;
    String rideType;
    GoogleMap mGoogleMap;
    double earthradius = 6371000;
    String userImage;
    String driverPic, vehicleImage;
    String request;
    String driverId, requestId;
    ActivityFindingCaptainBinding binding;
    BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String type = intent.getExtras().getString("type");
            if (type != null && type.equals("request_accepted")) {
                callapiShowactiverequest();
            }

            else if (type != null && (type.equals("ride_cancel") ||
                    type.equalsIgnoreCase("no_driver_found"))) {

                if (call != null && call.equals("map")) {
                    Intent intent1 = new Intent(ActiveRideA.this, HomeActivity.class);
                    startActivity(intent1);
                    intent1.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    finish();
                    overridePendingTransition(R.anim.in_from_left, R.anim.out_to_right);
                }

                else if (call != null && call.equals("splash")) {
                    Intent intent1 = new Intent(ActiveRideA.this, HomeActivity.class);
                    startActivity(intent1);
                    intent1.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    finish();
                    overridePendingTransition(R.anim.in_from_left, R.anim.out_to_right);
                }

                else {
                    Intent intent1 = new Intent(ActiveRideA.this, HomeActivity.class);
                    startActivity(intent1);
                    intent1.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    finish();
                    overridePendingTransition(R.anim.in_from_left, R.anim.out_to_right);
                }


            }

            else if (type != null && type.contains("collect_payment")) {
                binding.cancelRideLayout.setVisibility(View.GONE);
                callAPiForRideDetail();
            }

            else {
                Functions.logDMsg("called else");
                callapiShowactiverequest();
            }


        }
    };
    private String reason;

    public ActiveRideA() {
        // Required empty public constructor
    }




    private void callAPiForRideDetail() {
        JSONObject params = new JSONObject();
        try {
            params.put("request_id", requestId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRequestDetails(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONObject msg = respobj.optJSONObject("msg");
                                        if (msg.has("Trip")) {
                                            JSONObject trip = msg.getJSONObject("Trip");

                                            String rideFare = " " + trip.optString("ride_fare", "");

                                            String paymenttpe = "" + trip.optJSONObject("TripPayment").optString("payment_type");
                                            String payCollectFromWallet = "" + trip.optJSONObject("TripPayment").optString("payment_collect_from_wallet");
                                            String payCollectFromCash = "" + trip.optJSONObject("TripPayment").optString("payment_collect_from_cash");
                                            String walletAdd = "" + trip.optJSONObject("TripPayment").optString("debit_credit_amount");
                                            Functions.logDMsg("walletAdd at api: " + walletAdd);

                                            RatingFragment ratingFragment = new RatingFragment();
                                            Bundle bundle = new Bundle();
                                            bundle.putString("ridefare", rideFare);
                                            bundle.putString("drivePic", activeRequestModel.driver.getImage());
                                            bundle.putString("driverNameText", binding.driverNameText.getText().toString());
                                            bundle.putString("end_ride_datetime", activeRequestModel.getEnd_ride_datetime());
                                            bundle.putString("paymentType", paymenttpe);
                                            bundle.putString("requestId", activeRequestModel.getRequestId());
                                            bundle.putString("driverId", activeRequestModel.driver.getId());
                                            bundle.putString("wallet_add", walletAdd);
                                            bundle.putString("wallet_pay", payCollectFromWallet);
                                            bundle.putString("amount_collected", payCollectFromCash);
                                            bundle.putString("type", "trip");
                                            ratingFragment.setArguments(bundle);
                                            ratingFragment.setCancelable(false);
                                            ratingFragment.show(getSupportFragmentManager(), "");
                                        }
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

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        binding = ActivityFindingCaptainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("request_responce");

        registerReceiver(broadcastReceiver, intentFilter);


        binding.mapView.onCreate(savedInstanceState);
        context = getApplicationContext();
        userId = MyPreferences.getSharedPreference(ActiveRideA.this).getString(MyPreferences.USER_ID, "");
        currencySymbol = MyPreferences.getSharedPreference(ActiveRideA.this).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        fname = MyPreferences.getSharedPreference(ActiveRideA.this).getString(MyPreferences.fname, "");
        lname = MyPreferences.getSharedPreference(ActiveRideA.this).getString(MyPreferences.lname, "");
        rootRef = null; // [AWS-MIGRATED] FirebaseDatabase removed
        userImage = MyPreferences.getSharedPreference(ActiveRideA.this).getString(MyPreferences.image, "");

        pickupMarkerBitmap = Functions.getMarkerPickupPinView(ActiveRideA.this);
        dropoffMarkerBitmap = Functions.getMarkerDropPinView(ActiveRideA.this);
        driverMarkerBitmap = Functions.getDriverPickUpView(ActiveRideA.this);

        Intent intent = getIntent();
        String call = intent.getStringExtra("call");
        Bundle bundle = intent.getExtras();
        binding.mapView.onResume();
        binding.mapView.getMapAsync(ActiveRideA.this);
        setupMapIfNeeded();
        methodInitLayouts();
        methodInitClickListener();

        if (call.equals("splash")) {
            activeRequestModel = (ActiveRequestModel) bundle.getSerializable("dataModel");
            setUpScreenData();
        } else {
            binding.dropOffLocation.setText(intent.getStringExtra("destination_address"));
            binding.tvDropoffLabel.setText(intent.getStringExtra("destination_address_short"));
            binding.tvPickupAddressLabel.setText(intent.getStringExtra("pickup_address_short"));
            binding.tvPickUpAddressFull.setText(intent.getStringExtra("pickup_address"));
        }

        binding.findingYourCaptainText.setText(context.getString(R.string.find_your_captain));


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
        binding.cancelRideLayout.setOnClickListener(this);
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
        binding.directionBtn.setOnClickListener(this);



        binding.changeDestinationBtn.setOnClickListener(new SingleClickListener() {
            @Override
            public void performClick(View v) {

                Functions.logDMsg("dropoffLatlng at finding captain: " + dropoffLatlng);
                WheretoFragment wheretoFragment = new WheretoFragment(true, false, new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        LocationModel locationModel = (LocationModel) bundle.getSerializable("locationModel");
                        LatLng latlng = new LatLng(locationModel.getDropOfflat(), locationModel.getDropOfflng());
                        new Handler(Looper.getMainLooper()).postDelayed(() -> callApiForChangeDestination(locationModel, latlng), 1000);
                    }
                });
                Bundle bundle = new Bundle();
                LocationModel model = new LocationModel();
                model.setDropOfflat(dropoffLatlng.latitude);
                model.setDropOfflng(dropoffLatlng.longitude);
                model.setDropOffAddress(activeRequestModel.getDropoffLocationShortString());
                bundle.putSerializable("dataModel", model);
                wheretoFragment.setArguments(bundle);
                FragmentTransaction fragmentTransaction = getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.track_container, wheretoFragment, "wheretoFragment").addToBackStack("wheretoFragment").commit();


            }
        });

    }

    private void callApiForChangeDestination(LocationModel locationModel, LatLng latlng) {

        JSONObject sendobj = new JSONObject();
        try {
            sendobj.put("request_id", activeRequestModel.getRequestId());
            sendobj.put("dropoff_lat", "" + latlng.latitude);
            sendobj.put("dropoff_long", "" + latlng.longitude);
            sendobj.put("dropoff_location_short_string", "" + locationModel.getDropOffAddress());
        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).changeDropoffLocation(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at callApiForChangeDestination : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        callapiShowactiverequest();
                                    } else {
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (JSONException e) {
                                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }

    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, googleMap);
        if (mGoogleMap != null) {
            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    ActiveRideA.this, R.raw.gray_map));


            if (ActivityCompat.checkSelfPermission(ActiveRideA.this
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(ActiveRideA.this
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
                    callapiShowactiverequest();
                }
            });
        }
    }

    ///Call api for show active ride
    private void callapiShowactiverequest() {
        Functions.logDMsg("called api");
        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showActiveRequest(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at callapiShowactiverequest : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.orderParseData(respobj, new APICallBack() {
                                            @Override
                                            public void onParseData(Object model) {
                                                activeRequestModel = (ActiveRequestModel) model;
                                                request = activeRequestModel.getRequest();
                                                setUpScreenData();
                                                methodSetaddresses();

                                                new Handler().postDelayed(new Runnable() {
                                                    @Override
                                                    public void run() {
                                                        if (request.equals("1")) {
                                                            methodAdjustviews("1", whichScreen);
                                                        } else {
                                                            methodAdjustviews("0", whichScreen);
                                                        }
                                                    }
                                                }, 100);
                                            }
                                        });

                                    } else {
                                        startActivity(new Intent(ActiveRideA.this, HomeActivity.class));
                                        finish();
                                    }
                                } catch (JSONException e) {
                                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }

    private void setUpScreenData() {

        if (activeRequestModel.getPaymentType().equalsIgnoreCase("cash")) {
            binding.paymentType.setText(binding.getRoot().getContext().getString(R.string.cash));
            binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_cash));
        }

        else if (activeRequestModel.getPaymentType().equalsIgnoreCase("card")) {
            binding.paymentType.setText(binding.getRoot().getContext().getString(R.string.card));
            binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_credit_debut_card));
        }

        else {
            binding.paymentType.setText(binding.getRoot().getContext().getString(R.string.paypal));
            binding.ivCash.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_paypall));
        }

        if (activeRequestModel.getWalletPay().equalsIgnoreCase("1")) {
            binding.paymentType.setText(binding.getRoot().getContext().getString(R.string.wallet) + " , " + binding.paymentType.getText().toString());
        }

        driverPic = activeRequestModel.driver.getImage();
        if (driverPic != null && !driverPic.equalsIgnoreCase("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + driverPic);
            binding.driverImage.setImageURI(uri);
        }

        vehicleImage = activeRequestModel.vehical.getImage();
        if (vehicleImage != null && !vehicleImage.equalsIgnoreCase("")) {
            Uri url = Uri.parse(Constants.BASE_URL + vehicleImage);
            binding.imageGo.setImageURI(url);
        }

        binding.vehcileInfo.setText(activeRequestModel.vehical.getMake() + " " + activeRequestModel.vehical.getModel());
        driverFullName = activeRequestModel.driver.getFirstName()+" "+activeRequestModel.driver.getLastName();
        if(TextUtils.isEmpty(driverFullName.replaceAll("\\s+",""))){
            driverFullName = activeRequestModel.driver.getUsername();
        }
        binding.driverNameText.setText(driverFullName);

        binding.cartype.setText(activeRequestModel.rideType.getName()+" ("+activeRequestModel.vehical.getColor()+")");

        binding.tvWalletValue.setText(currencySymbol + " - " + activeRequestModel.getUserWallet() + " " + binding.getRoot().getContext().getString(R.string.credit_remaining));
        vehcileLat = Double.valueOf(activeRequestModel.vehical.getLat());
        vehcileLong = Double.valueOf(activeRequestModel.vehical.getLng());

        pickLat = Double.valueOf(activeRequestModel.getPickupLat());
        pickLong = Double.valueOf(activeRequestModel.getPickupLong());
        dropLat = Double.valueOf(activeRequestModel.getDestinationLat());
        dropLong = Double.valueOf(activeRequestModel.getDestinationLong());

        pickupLatlng = new LatLng(pickLat, pickLong);
        dropoffLatlng = new LatLng(dropLat, dropLong);

        request = activeRequestModel.getRequest();
        driverId = activeRequestModel.driver.getId();
        requestId = activeRequestModel.getRequestId();
        rideType = activeRequestModel.getPaymentType();


        binding.tvPickupAddressLabel.setText(activeRequestModel.getPickupLocationShortString());
        binding.tvPickUpAddressFull.setText(activeRequestModel.getPickupAddressLoc());

        binding.dropOffLocation.setText(activeRequestModel.getDestinationLocation());
        binding.tvDropoffLabel.setText(activeRequestModel.getDropoffLocationShortString());

        methodChangeridestatus();
    }

    private void methodSetaddresses() {

        if (vehcileLat != null && vehcileLong != null && vehcileLat != 0.0) {
            driverLatlng = new LatLng(vehcileLat, vehcileLong);
        }

        //Place Pickup marker for Pick up Location on Mak
        if (mGoogleMap != null && pickupMarker == null && pickupLatlng != null) {
            pickupMarker = mapWorker.addMarker(pickupLatlng, pickupMarkerBitmap);
        } else {
            pickupMarker.remove();
            pickupMarker = mapWorker.addMarker(pickupLatlng, pickupMarkerBitmap);
        }

        if (mGoogleMap != null && dropoffLatlng.latitude != 0.0 && dropoffLatlng.longitude != 0.0) {
            if (dropoffMarker == null && dropoffLatlng != null) {
                dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);
            } else {
                dropoffMarker.remove();
                dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);
            }
        }

    }

    private void methodChangeridestatus() {
        if (!request.equals("0")) {
            binding.captainDetailLayout.setVisibility(View.VISIBLE);
            binding.tvCaptainComing.setVisibility(View.VISIBLE);
            binding.findingLayout.setVisibility(View.GONE);
            stopRequestTimer();

            if (activeRequestModel.getCollectPayment().equals("1")) {
                binding.changeDestinationBtn.setEnabled(false);
                binding.changeDestinationBtn.setClickable(false);
                binding.cancelRideLayout.setVisibility(View.GONE);
                binding.infoWindowPickup.setVisibility(View.GONE);
                callAPiForRideDetail();
            }

            else if (activeRequestModel.getEndRide().equals("1")) {
                binding.infoWindowPickup.setVisibility(View.GONE);
                binding.changeDestinationBtn.setVisibility(View.GONE);
                whichScreen = "end_ride";
                binding.cancelRideLayout.setVisibility(View.GONE);
                binding.tvCaptainComing.setText(R.string.your_destination_arrived);
                btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._240sdp));
            }

            else if (activeRequestModel.getStartRide().equals("1")) {
                whichScreen = "start_ride";
                binding.tvCaptainComing.setText(R.string.started_the_ride);
                binding.tvTitle.setText(R.string.arrive_at);
                btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._240sdp));
                binding.cancelRideLayout.setVisibility(View.GONE);
            }

            else if (activeRequestModel.getArriveOnLocation().equals("1")) {
                binding.tvTitle.setText(R.string.arrive_at);
                whichScreen = "arrive_on_location";
                binding.tvCaptainComing.setText(R.string.your_captain_is_arrived);
                btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._240sdp));
                binding.cancelRideLayout.setVisibility(View.GONE);
            }

            else if (activeRequestModel.getOnTheWay().equals("1")) {
                binding.tvTitle.setText(R.string.pickup_at);
                whichScreen = "on_the_way";
                binding.tvCaptainComing.setText(R.string.get_ready_captain_on_the_way);
                btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._240sdp));
            }

            else if (request.equals("1")) {
                binding.tvTitle.setText(R.string.pickup_at);
                whichScreen = "request_accepted";
                btsBehavior.setPeekHeight((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._240sdp));
                binding.tvCaptainComing.setText(R.string.captain_accepted_your_ride_request);
            }

            binding.safetyLayout.setVisibility(View.VISIBLE);
            binding.crossbtn.setVisibility(View.VISIBLE);
            binding.directionBtn.setVisibility(View.VISIBLE);

        }

        else {
            binding.tvTitle.setText(R.string.arrive_at);
            whichScreen = "opening_screen";

            startRequestTimer();
        }

    }


    CountDownTimer countDownTimer;
    private void startRequestTimer(){

        if(countDownTimer==null) {
            countDownTimer = new CountDownTimer(60000, 1000) {
                @Override
                public void onTick(long millisUntilFinished) {
                    binding.requestTimerTxt.setText(String.format("%02d", millisUntilFinished / 1000));

                }

                @Override
                public void onFinish() {
                    callApiForcancel("Request finding Time out");
                }
            }.start();
        }
    }

    public void stopRequestTimer(){
        if(countDownTimer!=null){
            countDownTimer.cancel();
            countDownTimer=null;
        }
    }


    //Adjust View according to status
    private void methodAdjustviews(String rideStatus, String whichScreen) {

        Functions.logDMsg("whichScreen : " + whichScreen);
        Functions.logDMsg("rideStatus : " + rideStatus);

        if (rideStatus.contains("1")) {

            if (!whichScreen.equalsIgnoreCase("opening_screen") && mapWorker != null && driverLatlng != null) {
                methodAddCarMarker();
            }

            if (whichScreen.equalsIgnoreCase("request_accepted")) {
                showLatLngBoundZoom(pickupMarker, driverMarker);
                drawRoute(pickupLatlng, driverLatlng);
            }

            if (whichScreen.equalsIgnoreCase("on_the_way")) {
                if (dropoffMarker != null)
                    dropoffMarker.remove();
                showLatLngBoundZoom(driverMarker, pickupMarker);
                drawRoute(pickupLatlng, driverLatlng);
                methodUpdatedriverlatlng();
            }

            if (whichScreen.equalsIgnoreCase("arrive_on_location")) {
                if (dropoffMarker != null)
                    dropoffMarker.remove();
                binding.cancelRideLayout.setVisibility(View.GONE);
                showLatLngBoundZoom(driverMarker, pickupMarker);
                drawRoute(pickupLatlng, driverLatlng);
                methodUpdatedriverlatlng();
            }

            if (whichScreen.equalsIgnoreCase("start_ride") ||
                    whichScreen.equalsIgnoreCase("end_ride")) {

                binding.cancelRideLayout.setVisibility(View.GONE);
                if (dropoffLatlng.latitude != 0.0 && dropoffLatlng.longitude != 0.0) {
                    if (dropoffMarker == null && dropoffLatlng != null) {
                        dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);
                    } else {
                        dropoffMarker.remove();
                        dropoffMarker = mapWorker.addMarker(dropoffLatlng, dropoffMarkerBitmap);
                    }

                    if (whichScreen.equalsIgnoreCase("start_ride")) {
                        drawRoute(driverLatlng, dropoffLatlng);
                        methodUpdatedriverlatlng();
                    }


                    if (whichScreen.equalsIgnoreCase("end_ride")) {
                        findViewById(R.id.ll_chat_call).setVisibility(View.GONE);
                        mapWorker.removePolylineWithAnimation();
                        showLatLngBoundZoom(dropoffMarker);
                    } else {
                        if (dropoffMarker != null) {
                            showLatLngBoundZoom(driverMarker, dropoffMarker);
                        } else {
                            showLatLngBoundZoom(driverMarker);
                        }
                    }
                } else {
                    showLatLngBoundZoom(driverMarker);
                }

                if (pickupMarker != null) {
                    pickupMarker.remove();
                }
            }

        } else {
            binding.captainDetailLayout.setVisibility(View.GONE);
            binding.tvCaptainComing.setVisibility(View.GONE);
            binding.findingYourCaptainText.setVisibility(View.VISIBLE);
            binding.progressBarLayout.setVisibility(View.VISIBLE);

            if (pickupMarker != null && dropoffMarker != null) {
                if (mGoogleMap != null && pickupMarker.getPosition() != null && dropoffMarker.getPosition() != null) {
                    showLatLngBoundZoom(pickupMarker, dropoffMarker);
                }
            }

            drawRoute(pickupLatlng, dropoffLatlng);

        }

        binding.tvCaptainCarBts.setText(activeRequestModel.vehical.getLicensePlate());

        Functions.cancelLoader();
    }


    private void methodAddCarMarker() {

        if (driverMarker == null) {
            driverMarker = mapWorker.addMarker(driverLatlng, driverMarkerBitmap);
        }
    }

    // [AWS-MIGRATED] DatabaseReference mGetReference ; → use AWSManager REST API
    // [stub-fix] DatabaseReference mGetReference = null; // [AWS] placeholder ? use AWSManager
    ValueEventListener valueEventListener;
    private void methodUpdatedriverlatlng() {
        if (driverId != null && !driverId.equalsIgnoreCase("") && requestId != null) {
            mGetReference = rootRef.child("DriversTrips").child(requestId + "_" + driverId);
            valueEventListener = new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {

                    if (dataSnapshot.exists() && dataSnapshot.getValue() != null) {
                        double lat = (Double) dataSnapshot.child("l").child("0").getValue();
                        double lng = (Double) dataSnapshot.child("l").child("1").getValue();

                        double distanceOld = calculateDistance(lat, lng, driverLatlng.latitude, driverLatlng.longitude);
                        driverLatlng = new LatLng(lat, lng);

                        methodRotatemarker(driverLatlng);

                        if (Constants.ALLOW_ROUTE_MUTIPLE) {
                            if (distanceOld > 100) {
                                distanceOld = 0;
                                if (whichScreen.equalsIgnoreCase("request_accepted") ||
                                        whichScreen.equalsIgnoreCase("on_the_way") ||
                                        whichScreen.equalsIgnoreCase("arrive_on_location")) {

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

                                } else {
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

    private void methodRotatemarker(LatLng location) {
        mapWorker.rotateMarker(driverMarker, (float) mapWorker.getBearingBetweenTwoPoints1(driverMarker.getPosition(), location));
        if (whichScreen.equalsIgnoreCase("start_ride")) {
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
                    binding.tvTime.setText(mapWorker.durationInTraffic(directionsResult));
                } else {
                    drawRoutetolocation(pickUp, dropOff);
                }
            });
        }


    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(ActiveRideA.this);
            binding.mapView.onResume();
            binding.mapView.getMapAsync(this);
        }

    }


    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.directionBtn:

                if(activeRequestModel.getStartRide().equals("1")
                        || activeRequestModel.getEndRide().equals("1")
                        || activeRequestModel.getCollectPayment().equals("1")){

                    Functions.open_google_map(this,driverLatlng,dropoffLatlng);

                }
                else if(activeRequestModel.getRequest().equals("1")
                        || activeRequestModel.getOnTheWay().equals("1") || activeRequestModel.getArriveOnLocation().equals("1")){
                    Functions.open_google_map(this,driverLatlng,pickupLatlng);
                }
                break;

            case R.id.cancelRideLayout:
                new CancelRideBottomSheet(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            reason = bundle.getString("reason");
                            callApiForcancel(reason);
                        }
                    }
                }).show(ActiveRideA.this.getSupportFragmentManager(), "");
                break;

            case R.id.iv_change_map_type:
                methodChangemaptype();
                break;

            case R.id.setting_btn:
                AccountFragment payWithFragment = new AccountFragment();
                FragmentTransaction transaction = getSupportFragmentManager().beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.add(R.id.track_container, payWithFragment).addToBackStack(null).commit();

                break;

            case R.id.trafficBtn:
                methodChangeTrafficType();
                break;

            case R.id.crossbtn:
                startActivity(new Intent(ActiveRideA.this, HomeActivity.class));
                finish();
                break;


            case R.id.shareDetailLayout:
                final Intent intent = new Intent(Intent.ACTION_SEND);
                String link = "Your GO Grab Detail:" + "\n\n"
                        + "PickUp Location : " + activeRequestModel.getPickupLocationShortString() + "\n\n"
                        + "Dropoff Location : " + binding.dropOffLocation.getText().toString() + "\n\n"
                        + "Driver : " + driverFullName + "\n\n"
                        + activeRequestModel.driver.getPhone() + "\n\n"
                        + activeRequestModel.vehical.getMake() + " " + activeRequestModel.vehical.getModel() + " " + activeRequestModel.vehical.getLicensePlate() + "\n\n" +
                        "Track Here " + "\n" + "https://www.google.com/";

                intent.putExtra(Intent.EXTRA_TEXT, link);
                intent.setType("text/plain");
                startActivity(Intent.createChooser(intent, getString(R.string.share_image_via)));
                break;

            case R.id.get_support_layout:
                openWebView(binding.getRoot().getContext().getString(R.string.get_support), Constants.HELP_URL);
                break;

            case R.id.profileLayout:

                Fragment accountFragment = new AccountFragment();
                FragmentTransaction tr = getSupportFragmentManager().beginTransaction();
                tr.add(R.id.track_container, accountFragment).addToBackStack(null).commit();
                binding.drawerLayout.closeDrawers();

                break;


            case R.id.chatLayout:
                methodOpenchatactivity(driverFullName, driverId, driverPic, requestId);

                break;
            case R.id.yourRidesLayout:

                Fragment historyFragment = new HistoryFragment();
                FragmentTransaction fragmentTransaction = getSupportFragmentManager().beginTransaction();
                fragmentTransaction.add(R.id.track_container, historyFragment).addToBackStack(null).commit();
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
                if (activeRequestModel.driver.getPhone() != null) {
                    Intent tel = new Intent(Intent.ACTION_DIAL,
                            Uri.fromParts("tel", activeRequestModel.driver.getPhone(), null));
                    startActivity(tel);
                }
                break;
            default:
                break;
        }
    }


    public void openWebView(String urlTitle, String sliderUrl) {
        Functions.hideSoftKeyboard(ActiveRideA.this);
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
            params.put("request_id", requestId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(ActiveRideA.this, false, false);

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
                                        Intent intent1 = new Intent(ActiveRideA.this, HomeActivity.class);
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

        if (broadcastReceiver != null) {
            unregisterReceiver(broadcastReceiver);
            broadcastReceiver = null;
        }

        if(valueEventListener != null){
            mGetReference.removeEventListener(valueEventListener);
        }

        stopRequestTimer();

        super.onDestroy();
    }

    @Override
    protected void onResume() {
        super.onResume();
        binding.mapView.onResume();
        binding.mapView.getMapAsync(this);
        // callapiShowactiverequest();
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
    public void onBackPressed() {

        int count = this.getSupportFragmentManager().getBackStackEntryCount();
        if (count > 0) {
            super.onBackPressed();
        } else {
            if (mBackPressed + 2000 > System.currentTimeMillis()) {
                super.onBackPressed();
                return;
            } else {
                Toast.makeText(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.tap_again), Toast.LENGTH_SHORT).show();
                mBackPressed = System.currentTimeMillis();
            }
        }

    }

    @Override
    public void onCameraMove() {

        maxZoomLevel = mGoogleMap.getCameraPosition().zoom;
        float zoom = mGoogleMap.getCameraPosition().zoom;

        Marker updtedMarker = driverMarker;

        if (updtedMarker != null) {
            if (zoom != maxZoomLevel) {
                float height = driverMarkerBitmap.getHeight() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                float width = driverMarkerBitmap.getWidth() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                Bitmap car = Functions.getResizedBitmap(driverMarkerBitmap, height, width);
                updtedMarker.setIcon(BitmapDescriptorFactory.fromBitmap(car));
                zoom = maxZoomLevel;
            } else {
                float height = driverMarkerBitmap.getHeight() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                float width = driverMarkerBitmap.getWidth() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                Bitmap car = Functions.getResizedBitmap(driverMarkerBitmap, height, width);
                updtedMarker.setIcon(BitmapDescriptorFactory.fromBitmap(car));
            }
        }


        if (whichScreen.equalsIgnoreCase("request_accepted") ||
                whichScreen.equalsIgnoreCase("on_the_way") ||
                whichScreen.equalsIgnoreCase("arrive_on_location")) {
            Projection projection = mGoogleMap.getProjection();
            LatLng markerLocation = pickupMarker.getPosition();
            Point screenPosition = projection.toScreenLocation(markerLocation);
            binding.infoWindowPickup.setVisibility(View.VISIBLE);
            binding.infoWindowPickup.setX(screenPosition.x - (binding.infoWindowPickup.getWidth() / 2));
            binding.infoWindowPickup.setY(screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(ActiveRideA.this, 42)));

        }
        if (whichScreen.equalsIgnoreCase("start_ride")
                || whichScreen.equalsIgnoreCase("end_ride")
                || request.equals("0")) {
            Projection projection = mGoogleMap.getProjection();
            LatLng markerLocation = dropoffMarker.getPosition();
            Point screenPosition = projection.toScreenLocation(markerLocation);
            binding.infoWindowPickup.setVisibility(View.VISIBLE);
            binding.infoWindowPickup.setX(screenPosition.x - (binding.infoWindowPickup.getWidth() / 2));
            binding.infoWindowPickup.setY(screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(ActiveRideA.this, 42)));

        }

    }

}