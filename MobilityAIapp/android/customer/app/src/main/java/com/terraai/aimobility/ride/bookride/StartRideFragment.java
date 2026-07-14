package com.terraai.aimobility.ride.bookride;

import android.util.Log;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Point;
import android.location.Location;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

// AWS-MIGRATED: import com.firebase.geofire.GeoFire;
// AWS-MIGRATED: import com.firebase.geofire.GeoLocation;
// AWS-MIGRATED: import com.firebase.geofire.GeoQuery;
// AWS-MIGRATED: import com.firebase.geofire.GeoQueryEventListener;
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
import com.google.android.material.bottomsheet.BottomSheetBehavior;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseError;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseReference;
// AWS-MIGRATED: import com.google.firebase.database.FirebaseDatabase;
import com.google.maps.model.DirectionsResult;
import com.terraai.aimobility.adapter.SuggestedGrabAdapter;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SingleClickListener;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.ride.activeride.ActiveRideA;
import com.terraai.aimobility.ride.payment.PayWithBottomSheetFragment;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.Interface.RouteCallBack;
import com.terraai.aimobility.mapclasses.MapAnimator;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.GrabCarModel;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.model.RideTypeModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentStartRideBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.Query;
import java.util.List;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.firebase.geofire.GeoFire;
import com.firebase.geofire.GeoQuery;
import com.firebase.geofire.GeoLocation;
import com.firebase.geofire.GeoQueryEventListener;

public class StartRideFragment extends RootFragment implements OnMapReadyCallback, View.OnClickListener, GoogleMap.OnCameraMoveListener {

    public static String selectedGrab = "";
    private final double earthradius = 6366198;
    public BottomSheetBehavior btsBehaviour;
    Context context;
    Bundle dataBundle;

    SuggestedGrabAdapter suggestedGrabAdapter;
    ArrayList<GrabCarModel> vehicleList = new ArrayList<>();
//    ArrayList<GrabCarModel> vehicleListTwo = new ArrayList<>();
//    ArrayList<GrabCarModel> vehicleListOne = new ArrayList<>();
//    ArrayList<GrabCarModel> vehicleListForTwo = new ArrayList<>();
    ArrayList<RideTypeModel> vehicleCategoriesList = new ArrayList<>();
    ArrayList<Marker> driverMarkersList = new ArrayList<>();
    ArrayList<String> driversIds = new ArrayList<>();

    LatLng pickupLatlong, dropLatlong;
    LatLngBounds bounds;

    String stDistance, dropoffAddress;
    String discount = "0";
    String userId;
    String paymentType = "Cash", paymentMethodId = "0";
    String couponId = "";
    String rideTypeId = "";
    String rideTypeDriver;    String schedule = "0";
    String scheduleDateTime = "";
    String rideType = "car";


    Marker pickupMarker, dropoffMarker;
    MapWorker mapWorker;

    Bitmap pickUpMarkerBitmap, dropOofMarkerBitmap;
    Bitmap carMarker;

    LocationModel locationModel;
    double dropLat, dropLong, pickLat, pickLong;

    GeoFire geoFire;
    // [AWS-MIGRATED] GeoFire → /getNearbyDrivers Lambda endpoint
    // Original: GeoQuery geoQuery;
    GeoQueryEventListener geoQueryEventListener;

    float oldZoom = Constants.maxZoomLevel;
    Handler handler;
    Runnable runable;
    GoogleMap mGoogleMap;
    FragmentStartRideBinding binding;

    public StartRideFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment

        binding = FragmentStartRideBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        binding.mMapView.onCreate(savedInstanceState);
        context = this.getActivity();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        dataBundle = getArguments();
        binding.mMapView.onResume();
        binding.mMapView.getMapAsync(StartRideFragment.this);
        setupMapIfNeeded();
        methodInitLayouts();
        setUpScreenData();

        pickUpMarkerBitmap = Functions.getMarkerPickupPinView(context);
        dropOofMarkerBitmap = Functions.getMarkerDropPinView(context);
        carMarker = Functions.getDriverPickUpView(context);
        methodInitClickListener();


        return view;
    }

    private void setUpScreenData() {
        if (dataBundle != null) {
            locationModel = (LocationModel) dataBundle.getSerializable("locationModel");
            dropLat = locationModel.getDropOfflat();
            dropLong = locationModel.getDropOfflng();
            dropLatlong = new LatLng(dropLat, dropLong);
            dropoffAddress = locationModel.getDropOffAddress();
            schedule = locationModel.getSchedule();
            rideType = locationModel.getRideType();
            scheduleDateTime = locationModel.getScheduledatetime();
            binding.infoWindowDrop.setText(dropoffAddress);
            binding.infoAddressPickup.setText(locationModel.getPickUpAddress());
            pickLat = locationModel.getPicklat();
            pickLong = locationModel.getPicklng();
            pickupLatlong = new LatLng(pickLat, pickLong);

        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        if (geoQueryEventListener != null) {
            geoQuery.removeAllListeners();
        }
    }

    private void methodInitLayouts() {

        btsBehaviour = BottomSheetBehavior.from(binding.bottomSheet.getRoot());

        btsBehaviour.addBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {

            @Override
            public void onStateChanged(@NonNull View bottomSheet, int newState) {
                if (newState == BottomSheetBehavior.STATE_DRAGGING) {
                    btsBehaviour.setState(BottomSheetBehavior.STATE_EXPANDED);
                }
            }

            @Override
            public void onSlide(@NonNull View bottomSheet, float slideOffset) {
                //auto generated method
            }

        });

    }

    private void methodInitClickListener() {

        binding.backIcon.setOnClickListener(this);
        binding.infoWindowDropOff.setOnClickListener(this);
        binding.infoWindowPickup.setOnClickListener(this);
        binding.bottomSheet.bookGrabCarBtn.setOnClickListener(this);
        binding.bottomSheet.promoCodeLayout.setOnClickListener(this);
        binding.bottomSheet.cashLayout.setOnClickListener(this);


        binding.infoWindowPickup.setOnClickListener(new SingleClickListener() {
            @Override
            public void performClick(View v) {

                WheretoFragment wheretoFragment = new WheretoFragment(true, true, new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        locationModel = (LocationModel) bundle.getSerializable("locationModel");
                        binding.infoAddressPickup.setText(locationModel.getPickUpAddress());
                        pickLat = locationModel.getPicklat();
                        pickLong = locationModel.getPicklng();
                        pickupLatlong = new LatLng(pickLat, pickLong);
                        methodSetDataForRide();
                    }
                });
                Bundle bundle = new Bundle();
                bundle.putSerializable("dataModel", locationModel);
                wheretoFragment.setArguments(bundle);
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.start_ride_container, wheretoFragment, "wheretoFragment").addToBackStack("wheretoFragment").commit();


            }
        });


        binding.infoWindowDropOff.setOnClickListener(new SingleClickListener() {
            @Override
            public void performClick(View v) {

                WheretoFragment wheretoFragment = new WheretoFragment(true, false, new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        locationModel = (LocationModel) bundle.getSerializable("locationModel");
                        dropLat = locationModel.getDropOfflat();
                        dropLong = locationModel.getDropOfflng();
                        dropLatlong = new LatLng(dropLat, dropLong);
                        dropoffAddress = locationModel.getDropOffAddress();
                        binding.infoWindowDrop.setText(dropoffAddress);
                        methodSetDataForRide();
                    }
                });

                Bundle bundle = new Bundle();
                bundle.putSerializable("dataModel", locationModel);
                wheretoFragment.setArguments(bundle);
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.start_ride_container, wheretoFragment, "wheretoFragment").addToBackStack("wheretoFragment").commit();


            }
        });

    }

    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, this.mGoogleMap);
        if (mGoogleMap != null) {

            mGoogleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    context, R.raw.gray_map));

            if (ActivityCompat.checkSelfPermission(context
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(context
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            }

            mGoogleMap.setOnCameraMoveListener(this);
            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setZoomControlsEnabled(false);
            mGoogleMap.getUiSettings().setMapToolbarEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            mGoogleMap.getUiSettings().setRotateGesturesEnabled(false);
            mGoogleMap.getUiSettings().setTiltGesturesEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);

            if (geoFire == null)
                nearbyDrivers();

        }

        mGoogleMap.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
            @Override
            public void onMapLoaded() {
                if (mGoogleMap != null) {
                    methodSetDataForRide();
                }
            }
        });

        googleMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
            @Override
            public void onCameraIdle() {

                LatLngBounds latestBounds = googleMap.getProjection().getVisibleRegion().latLngBounds;
                if (latestBounds.contains(pickupLatlong)) {
                    //found
                } else if (latestBounds.contains(dropLatlong)) {
                    //found
                } else {
                    if (handler != null && runable != null)
                        handler.removeCallbacks(runable);

                    if (handler == null)
                        handler = new Handler(Looper.myLooper());

                    if (runable == null)
                        runable = () -> showlatlngboundzoom(pickupMarker, dropoffMarker);

                    handler.postDelayed(runable, 8000);
                }

                adjustLocationWindows();

            }
        });

    }


    public void adjustLocationWindows() {
        if(mGoogleMap != null && getActivity() != null) {
            if (pickupMarker != null) {
                Projection projection = mGoogleMap.getProjection();
                LatLng markerLocation = pickupMarker.getPosition();
                Point screenPosition = projection.toScreenLocation(markerLocation);

                int x, y;

                if ((screenPosition.x - binding.infoWindowPickup.getWidth()) < 0)
                    x = screenPosition.x;
                else
                    x = screenPosition.x - binding.infoWindowPickup.getWidth();


                if ((screenPosition.y - binding.infoWindowPickup.getHeight()) < 0)
                    y = screenPosition.y;
                else
                    y = screenPosition.y - (binding.infoWindowPickup.getHeight() + Functions.convertDpToPx(getActivity(), 42));


                binding.infoWindowPickup.animate().x(x);
                binding.infoWindowPickup.animate().y(y);

            }

            if (dropoffMarker != null) {
                Projection projection = mGoogleMap.getProjection();
                LatLng markerLocation = dropoffMarker.getPosition();
                Point screenPosition = projection.toScreenLocation(markerLocation);

                int x, y;

                if ((screenPosition.x - binding.infoWindowDropOff.getWidth()) < 0)
                    x = screenPosition.x;
                else
                    x = screenPosition.x - binding.infoWindowDropOff.getWidth();


                if ((screenPosition.y - binding.infoWindowDropOff.getHeight()) < 0)
                    y = screenPosition.y;
                else
                    y = screenPosition.y - (binding.infoWindowDropOff.getHeight() + Functions.convertDpToPx(getActivity(), 42));


                binding.infoWindowDropOff.animate().x(x);
                binding.infoWindowDropOff.animate().y(y);


            }
        }

    }

    private void nearbyDrivers() {
        // [AWS-MIGRATED] DatabaseReference ref = /* AWS-MIGRATED: was FirebaseDatabase — use AWSManager.getInstance(context).post() for real-time updates */ → use AWSManager REST API
        // [stub-fix] Object ref = null; // [AWS] placeholder ? use AWSManager
        geoFire = null; // [stub] AWS-migrated
        geoQuery = null; // [AWS] Object /* GeoFire stub */ call removed

        geoQueryEventListener = new GeoQueryEventListener() {
            @RequiresApi(api = Build.VERSION_CODES.KITKAT)
            @Override
            public void onKeyEntered(String key, GeoLocation location) {
                if (!driversIds.contains(key) && key.contains("_")) {
                    String[] key_value = key.split("_");
                    rideTypeDriver = key_value[1];
                    Marker marker = mapWorker.addMarker(key, new LatLng(location.latitude, location.longitude), carMarker);
                    driverMarkersList.add(marker);
                    driversIds.add(key);
                }
            }

            @Override
            public void onKeyExited(String key) {
                for (int i = 0; i < driverMarkersList.size(); i++) {
                    if (driverMarkersList.get(i).getTag().equals(key)) {
                        Marker updted_marker = driverMarkersList.get(i);
                        updted_marker.remove();
                        driverMarkersList.remove(updted_marker);
                        driversIds.remove(key);
                    }
                }
            }

            @Override
            public void onKeyMoved(String key, GeoLocation location) {
                for (int i = 0; i < driverMarkersList.size(); i++) {
                    if (driverMarkersList.get(i).getTag().equals(key)) {
                        Marker updtedMarker = driverMarkersList.get(i);
                        mapWorker.rotateMarker(updtedMarker, mapWorker.getBearing(new
                                        LatLng(updtedMarker.getPosition().latitude,
                                        updtedMarker.getPosition().longitude),
                                new LatLng(location.latitude, location.longitude)));

                        mapWorker.animateMarkerTo(updtedMarker, location.latitude, location.longitude);
                    }
                }
            }

            @Override
            public void onGeoQueryReady() {

            }

            @Override
            public void onGeoQueryError(DatabaseError error) {
                Toast.makeText(getActivity(), "error : " + error.toString(), Toast.LENGTH_LONG).show();
            }
        };

        geoQuery.addGeoQueryEventListener(geoQueryEventListener);

    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.mMapView.onResume();
            binding.mMapView.getMapAsync(this);
        }

    }

    @Override
    public void onResume() {
        super.onResume();
        binding.mMapView.onResume();
    }

    @Override
    public void onPause() {
        binding.mMapView.onPause();
        super.onPause();
    }

    @Override
    public void onDestroy() {
        binding.mMapView.onDestroy();
        if (runable != null && handler != null) {
            handler.removeCallbacks(runable);
        }
        super.onDestroy();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        binding.mMapView.onLowMemory();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        binding.mMapView.onSaveInstanceState(outState);
    }

    private void methodSetDataForRide() {

        binding.bottomSheet.bookGrabCarBtn.startLoading();
//        binding.bottomSheet.viewAllLayout.setEnabled(false);
//        binding.bottomSheet.viewAllLayout.setClickable(false);
        binding.bottomSheet.confirmPickUpLayout.setVisibility(View.VISIBLE);

        btsBehaviour.setState(BottomSheetBehavior.STATE_EXPANDED);
        btsBehaviour.setPeekHeight((int) getResources().getDimension(R.dimen._340sdp));

        if (pickupMarker == null)
            pickupMarker = mapWorker.addMarker(pickupLatlong, pickUpMarkerBitmap);
        else {
            pickupMarker.remove();
            pickupMarker = mapWorker.addMarker(pickupLatlong, pickUpMarkerBitmap);
        }

        if (dropoffMarker == null)
            dropoffMarker = mapWorker.addMarker(dropLatlong, dropOofMarkerBitmap);
        else {
            dropoffMarker.remove();
            dropoffMarker = mapWorker.addMarker(dropLatlong, dropOofMarkerBitmap);
        }


        drawRoute(pickupLatlong, dropLatlong);
        binding.infoWindowPickup.setVisibility(View.VISIBLE);
        binding.infoWindowDropOff.setVisibility(View.VISIBLE);
        callapiOfShowridetypes(pickupLatlong, dropLatlong);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

//            case R.id.viewAllLayout:
//                Bundle args = new Bundle();
//                BookGrabCarBottomSheet bookGrabCarBottomSheet = new BookGrabCarBottomSheet(new FragmentCallBack() {
//                    @Override
//                    public void onItemClick(Bundle bundle) {
//                        if (bundle != null) {
//                            GrabCarModel grabCarModel = (GrabCarModel) bundle.getSerializable("dataModel");
//                            selectedGrab = grabCarModel.id;
//                            BookGrabCarBottomSheet.selectedItem = selectedGrab;
//                            estimatedFare = grabCarModel.estimatedFare;
//                            rideTypeId = grabCarModel.id;
//
//                            if (vehicleListForTwo.size()>0 && vehicleListForTwo.get(0).id.equals(grabCarModel.id)) {
//                                vehicleListForTwo.remove(0);
//                                vehicleListForTwo.add(0, grabCarModel);
//                                GrabCarModel carModel = vehicleListForTwo.get(1);
//                                carModel.isSelected = false;
//                                carModel.isFirstTime = false;
//                                vehicleListForTwo.remove(1);
//                                vehicleListForTwo.add(1, carModel);
//
//                            }
//
//                            else if (vehicleListForTwo.size()>1 && vehicleListForTwo.get(1).id.equals(grabCarModel.id)) {
//                                GrabCarModel carModel = vehicleListForTwo.get(0);
//                                carModel.isFirstTime = false;
//                                carModel.isSelected = false;
//                                vehicleListForTwo.remove(1);
//                                vehicleListForTwo.add(1, carModel);
//                                vehicleListForTwo.remove(0);
//                                vehicleListForTwo.add(0, grabCarModel);
//
//                            }
//
//                            else {
//                                GrabCarModel carModel = vehicleListForTwo.get(0);
//                                carModel.isFirstTime = false;
//                                carModel.isSelected = false;
//                                vehicleListForTwo.remove(0);
//                                vehicleListForTwo.add(0, grabCarModel);
//                                if(vehicleListForTwo.size()>1)
//                                vehicleListForTwo.add(1, carModel);
//                            }
//
//                            suggestedGrabAdapter.notifyDataSetChanged();
//                        }
//                    }
//                });
//                args.putSerializable("vehicleList", vehicleList);
//                args.putSerializable("vehicleCategoriesList", vehicleCategoriesList);
//                args.putString("selectedGrab", selectedGrab);
//                args.putString("rideType", rideType);
//                bookGrabCarBottomSheet.setArguments(args);
//                bookGrabCarBottomSheet.show(getActivity().getSupportFragmentManager(), "bookGrabCarBottomSheet");
//
//                break;

            case R.id.bookGrabCarBtn:
                if(BookGrabCarBottomSheet.selectedItem!=null) {
                    callApiOfRequestVehicle();
                }
                else {
                    Functions.showToast(getContext(),"Select the vehicle");
                }
                break;

            case R.id.promoCodeLayout:

                new PromoCodeFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            binding.bottomSheet.couponName.setText(bundle.getString("coupon_code"));
                            discount = bundle.getString("discount");
                            couponId = bundle.getString("coupon_id");
                            calculateDiscount();
                        }
                    }
                }).show(getActivity().getSupportFragmentManager(), "");

                break;


            case R.id.backIcon:
                backPress();
                break;


            case R.id.cashLayout:
                PayWithBottomSheetFragment payWithBottomSheetFragment = new PayWithBottomSheetFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            paymentType = bundle.getString("payment_type");
                            paymentMethodId = bundle.getString("payment_method_id");
                            String cardInfo = bundle.getString("card_info");
                            if (cardInfo != null && !cardInfo.equalsIgnoreCase("")) {
                                binding.bottomSheet.cashText.setText("****" + " " + bundle.getString("card_info"));
                            } else {

                                binding.bottomSheet.cashText.setText(paymentType);
                            }
                        }
                    }
                }, R.id.start_ride_container, false,paymentType);
                payWithBottomSheetFragment.show(getActivity().getSupportFragmentManager(), "payWithBottomSheetFragment");
                break;

            default:
                break;

        }
    }

    private void calculateDiscount() {
        for (int i = 0; i < vehicleList.size(); i++) {
            String estimatedFare = vehicleList.get(i).estimatedFare;
            double sum = Double.parseDouble(estimatedFare);
            double discountDouble = Functions.roundoffDecimal((sum * Double.parseDouble(discount)) / 100);
            double discountValue = sum - discountDouble;
            GrabCarModel carModel = vehicleList.get(i);
            vehicleList.remove(i);
            carModel.discountValue = String.valueOf(discountValue);
            vehicleList.add(i, carModel);
        }

//        for (int i = 0; i < vehicleListForTwo.size(); i++) {
//            String estimatedFare = vehicleListForTwo.get(i).estimatedFare;
//            double sum = Double.parseDouble(estimatedFare);
//            double discountDouble = Functions.roundoffDecimal((sum * Double.parseDouble(discount)) / 100);
//            double discountValue = Functions.roundoffDecimal( sum - discountDouble);
//
//            GrabCarModel carModel = vehicleListForTwo.get(i);
//            vehicleListForTwo.remove(i);
//            carModel.discountValue = String.valueOf(discountValue);
//            vehicleListForTwo.add(i, carModel);
//        }
        suggestedGrabAdapter.notifyDataSetChanged();
    }
    int x = 1;
    public void backPress() {
        FragmentManager manager = getActivity().getSupportFragmentManager();
        try {
            if (manager.getFragments() != null) {
                if (manager.getBackStackEntryCount() > 0) {
                    for (int i = x; i < manager.getBackStackEntryCount(); i++)
                        manager.popBackStack();
                }
            }
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

    }

    private void callapiOfShowridetypes(LatLng pickupLatlong, LatLng dropOffLatlong) {

        JSONObject params = new JSONObject();
        try {
            params.put("pickup_lat", "" + pickupLatlong.latitude);
            params.put("pickup_long", "" + pickupLatlong.longitude);
            params.put("dropoff_lat", "" + dropOffLatlong.latitude);
            params.put("dropoff_long", "" + dropOffLatlong.longitude);
        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (vehicleList.isEmpty()) {
            binding.bottomSheet.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.bottomSheet.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        } else {
            binding.bottomSheet.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRideTypes(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.bottomSheet.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.bottomSheet.shimmerFrameLayout.shimmerViewContainer.stopShimmer();

                        binding.bottomSheet.bookGrabCarBtn.stopLoading();
//                        binding.bottomSheet.viewAllLayout.setEnabled(true);
//                        binding.bottomSheet.viewAllLayout.setClickable(true);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msgobj = respobj.getJSONArray("msg");
                                        vehicleList.clear();
//                                        vehicleListOne.clear();
//                                        vehicleListTwo.clear();
//                                        vehicleListForTwo.clear();
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

//                                                if(grabCarModel.vehicleName!=null && grabCarModel.vehicleName.contains(""+rideType)){
//                                                    vehicleListOne.add(grabCarModel);
//                                                }else{
//                                                    vehicleListTwo.add(grabCarModel);
//                                                }

                                            }

                                        }

//                                        vehicleList.addAll(vehicleListOne);
//                                        vehicleList.addAll(vehicleListTwo);
//
//                                        if(!vehicleListOne.isEmpty() && vehicleListOne.size() > 1){
//                                            vehicleListForTwo.add(vehicleListOne.get(0));
//                                            vehicleListForTwo.add(vehicleListOne.get(1));
//                                        }
//
//                                        else if(!vehicleListOne.isEmpty() && vehicleListOne.size() == 1){
//                                            vehicleListForTwo.add(vehicleListOne.get(0));
//                                            vehicleListForTwo.add(vehicleListTwo.get(1));
//                                        }
//
//                                        else if(!vehicleListOne.isEmpty() && vehicleListOne.size() > 1){
//                                            vehicleListForTwo.add(vehicleListTwo.get(0));
//                                            vehicleListForTwo.add(vehicleListTwo.get(1));
//                                        }
//
//                                        else{
//                                            vehicleListForTwo.add(vehicleListTwo.get(0));
//                                        }
//
//
//                                        for(int i = 0 ; i < vehicleListForTwo.size() ; i++){
//                                            if(i == 0) {
//                                                GrabCarModel grabCarModel = vehicleListForTwo.get(0);
//                                                grabCarModel.isSelected = true;
//                                                selectedGrab = "" + grabCarModel.id;
//                                                grabCarModel.isFirstTime = true;
//                                                rideTypeId = "" + grabCarModel.id;
//                                                estimatedFare = "" + grabCarModel.estimatedFare;
//                                            }
//                                        }


                                        methodSuggestedCarRecycler();


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

    private void methodSuggestedCarRecycler() {
//        vehicleListForTwo
        binding.bottomSheet.suggestedCarRecycler.setHasFixedSize(true);
        binding.bottomSheet.suggestedCarRecycler.setLayoutManager(new LinearLayoutManager(getActivity()));
        suggestedGrabAdapter = new SuggestedGrabAdapter(getActivity(), vehicleList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                GrabCarModel model1 = (GrabCarModel) model;

                selectedGrab = model1.id;
                BookGrabCarBottomSheet.selectedItem = model1;
                rideTypeId = model1.id;
                for (int i = 0; i < vehicleList.size(); i++) {
                    GrabCarModel item = vehicleList.get(i);
                    if (i == postion) {
                        item.isSelected = true;
                        item.isFirstTime = false;
                    } else {
                        item.isSelected = false;
                        item.isFirstTime = false;
                    }

                    vehicleList.remove(i);
                    vehicleList.add(i, item);

                }
                suggestedGrabAdapter.notifyDataSetChanged();
            }
        });
        binding.bottomSheet.suggestedCarRecycler.setAdapter(suggestedGrabAdapter);

    }

    private void callApiOfRequestVehicle() {

        JSONObject params = new JSONObject();

        try {
            params.put("user_id", "" + userId);
            params.put("ride_type_id", "" + BookGrabCarBottomSheet.selectedItem.id);
            params.put("estimated_fare", "" + BookGrabCarBottomSheet.selectedItem.estimatedFare);
            params.put("wallet_pay", "");
            params.put("schedule", schedule);
            params.put("schedule_datetime", ""+scheduleDateTime);
            params.put("note", "" + locationModel.getDriverNote());
            params.put("coupon_id", "" + couponId);
            params.put("payment_type", "" + paymentType.toLowerCase());
            params.put("payment_method_id", "" + paymentMethodId);
            params.put("pickup_location_short_string", "" + locationModel.getPickUpAddress());
            params.put("dropoff_location_short_string", "" + locationModel.getDropOffAddress());
            params.put("pickup_location", "" + Functions.getAddressString(context , pickupMarker.getPosition().latitude , pickupMarker.getPosition().longitude));
            params.put("dropoff_location", "" + Functions.getAddressString(context , dropoffMarker.getPosition().latitude , dropoffMarker.getPosition().longitude));
            params.put("pickup_lat", "" + pickupMarker.getPosition().latitude);
            params.put("pickup_long", "" + pickupMarker.getPosition().longitude);
            params.put("dropoff_lat", "" + dropoffMarker.getPosition().latitude);
            params.put("dropoff_long", "" + dropoffMarker.getPosition().longitude);

        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
            Functions.logDMsg("Exception at requestVehicle : " + e.toString());
        }

        binding.bottomSheet.bookGrabCarBtn.startLoading();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).requestVehicle(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.bottomSheet.bookGrabCarBtn.stopLoading();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    callApiForAddRecent();

                                    if(!schedule.equals("1")) {
                                        JSONObject msgobj = respobj.getJSONObject("msg");
                                        JSONObject reqobj = msgobj.getJSONObject("Request");

                                        String id = reqobj.getString("id");
                                        MyPreferences.getSharedPreference(getActivity()).edit().putString("request_id", id).commit();
                                        Intent intent = new Intent(getActivity(), ActiveRideA.class);
                                        intent.putExtra("pickup_lat", pickupLatlong.latitude);
                                        intent.putExtra("pickup_long", pickupLatlong.longitude);
                                        intent.putExtra("pickup_address", reqobj.getString("pickup_location"));
                                        intent.putExtra("pickup_address_short", locationModel.getPickUpAddress());

                                        intent.putExtra("destination_lat", dropLatlong.latitude);
                                        intent.putExtra("destination_long", dropLatlong.longitude);
                                        intent.putExtra("destination_address_short", locationModel.getDropOffAddress());
                                        intent.putExtra("destination_address", reqobj.getString("dropoff_location"));
                                        intent.putExtra("call", "map");
                                        startActivity(intent);
                                        getActivity().finish();
                                    }else{
                                        x = 0;
                                        backPress();
                                    }
                                } else {
                                    Functions.dialouge(getActivity(), getActivity().getResources().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });

    }

    private void callApiForAddRecent() {
        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
            params.put("lat", dropoffMarker.getPosition().latitude);
            params.put("long", dropoffMarker.getPosition().longitude);
            params.put("short_name", locationModel.getPickUpAddress());
            params.put("location_string", Functions.getAddressString(getActivity(), dropoffMarker.getPosition().latitude, dropoffMarker.getPosition().longitude));
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).addRecentLocation(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });

    }

    private void drawRoute(LatLng pickup, LatLng dropoff) {
        if (pickup != null && dropoff != null) {
            mapWorker.getDirection(pickup, dropoff, new RouteCallBack() {
                @Override
                public void responce(DirectionsResult directionsResult) {
                    if (directionsResult != null && !directionsResult.equals("null") && !directionsResult.equals("")) {
                        mapWorker.addPolylineWithAnimation(directionsResult, mGoogleMap);
                        stDistance = mapWorker.getDistanceFromRoute(directionsResult);
                    } else {
                        drawRoutetolocation();
                    }
                }
            });

            LatLngBounds.Builder latlngBuilder = new LatLngBounds.Builder();

            LatLng pickupLatlng = pickupMarker.getPosition();
            latlngBuilder.include(pickupLatlng);

            int padding = Functions.convertDpToPx(getActivity(), 110);
            if (padding != 0) {
                mGoogleMap.setPadding(0, 0, 0, (int) getActivity().getResources().getDimension(R.dimen._90sdp));
            }

            showlatlngboundzoom(pickupMarker, dropoffMarker);
        }
    }

    private void showlatlngboundzoom(Marker... marker) {
       try {
           LatLngBounds.Builder latlngBuilder = new LatLngBounds.Builder();
           for (Marker mrk : marker) {
               if (mrk != null)
                   latlngBuilder.include(mrk.getPosition());
           }

           bounds = latlngBuilder.build();
           LatLng center = bounds.getCenter();
           LatLng northEast = move(center, 709, 709);
           LatLng southWest = move(center, -709, -709);
           latlngBuilder.include(southWest);
           latlngBuilder.include(northEast);
           if (areBoundsTooSmall(bounds, 300)) {
               mGoogleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(bounds.getCenter(), Constants.maxZoomLevel));
           } else {
               int padding = (int) (getScreenWidth(context) * 0.25);
               mGoogleMap.animateCamera(CameraUpdateFactory.newLatLngBounds(bounds, padding));
           }

       }catch (Exception e){}
    }

    public int getScreenWidth(Context context) {
        return context.getResources().getDisplayMetrics().widthPixels;
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

    private void drawRoutetolocation() {

        List<LatLng> route = null;

        if (route == null) {
            route = new ArrayList<>();
        } else {
            route.clear();
            MapAnimator.getInstance().clearMapRoute();
            mapWorker.removePolylineWithAnimation();
        }

        route.add(new LatLng(pickupMarker.getPosition().latitude, pickupMarker.getPosition().longitude));
        route.add(new LatLng(dropoffMarker.getPosition().latitude, dropoffMarker.getPosition().longitude));

        Functions.logDMsg("route : " + route);
        if (mGoogleMap != null && route != null && route.size() > 0) {
            MapAnimator.getInstance().animateRoute(mGoogleMap, route, true);
        } else {
            Functions.showToast(context, "Map not ready");
        }

    }

    @Override
    public void onCameraMove() {
        float zoom = mGoogleMap.getCameraPosition().zoom;

        for (int i = 0; i < driverMarkersList.size(); i++) {
            Marker updtedMarker = driverMarkersList.get(i);
            String updtedMarkerTag = driverMarkersList.get(i).getTag().toString();

            String[] keyValue = updtedMarkerTag.split("_");
            String rideDriver = keyValue[1];
            if (updtedMarker != null) {
                if (zoom != oldZoom) {
                    float height = carMarker.getHeight() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                    float width = carMarker.getWidth() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                    Bitmap car = Functions.getResizedBitmap(carMarker, height, width);
                    updtedMarker.setIcon(BitmapDescriptorFactory.fromBitmap(car));
                    zoom = oldZoom;
                } else {
                    float height = carMarker.getHeight() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                    float width = carMarker.getWidth() * (mGoogleMap.getCameraPosition().zoom / Constants.maxZoomLevel);
                    Bitmap car = Functions.getResizedBitmap(carMarker, height, width);
                    updtedMarker.setIcon(BitmapDescriptorFactory.fromBitmap(car));
                }
            }
        }

        if (pickupMarker != null) {
            Projection projection = mGoogleMap.getProjection();
            LatLng markerLocation = pickupMarker.getPosition();
            Point screenPosition = projection.toScreenLocation(markerLocation);
            binding.infoWindowPickup.setX(screenPosition.x - ( binding.infoWindowDropOff.getWidth() / 2));
            binding.infoWindowPickup.setY(screenPosition.y - ( binding.infoWindowDropOff.getHeight() + Functions.convertDpToPx(getActivity(), 35)));
        }

        if (dropoffMarker != null) {
            Projection projection = mGoogleMap.getProjection();
            LatLng markerLocation = dropoffMarker.getPosition();
            Point screenPosition = projection.toScreenLocation(markerLocation);
            binding.infoWindowDropOff.setX(screenPosition.x - ( binding.infoWindowDropOff.getWidth() / 2));
            binding.infoWindowDropOff.setY(screenPosition.y - ( binding.infoWindowDropOff.getHeight() + Functions.convertDpToPx(getActivity(), 35)));
        }
    }



}
