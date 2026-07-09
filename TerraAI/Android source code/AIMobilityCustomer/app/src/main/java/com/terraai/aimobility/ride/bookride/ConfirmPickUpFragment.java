package com.terraai.aimobility.ride.bookride;

import static android.Manifest.permission.ACCESS_FINE_LOCATION;
import static com.terraai.aimobility.codeclasses.Variables.PACKAGE_URL_SCHEME;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.GeoHelper;
import com.terraai.aimobility.codeclasses.PermissionUtils;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentConfirmPickUpBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;



public class ConfirmPickUpFragment extends RootFragment implements OnMapReadyCallback, View.OnClickListener, GoogleMap.OnCameraMoveListener {

    BottomSheetBehavior btsBehaviour;
    LatLng pickupLatlong, dropLatlong;
    String locality = "", subLocality = "", favPlaceId, dropoffAddress, dropoffAddressfull;
    int favPlacePosition;
    NearbyModelClass modelClass;
    ArrayList<NearbyModelClass> savedList = new ArrayList<>();
    MapWorker mapWorker;
    boolean isFav = false;
    Context context;
    Bundle bundle;
    LocationModel locationModel;
    String userId;
    FusedLocationProviderClient mFusedLocationProviderClient;
    GoogleMap mGoogleMap;
    GoogleMap.OnCameraIdleListener onCameraIdleListener;
    LatLng mDefaultLocation;
    String schedule;
    String scheduleDatetime, rideType;
    GeoHelper geoHelper;
    FragmentConfirmPickUpBinding binding;
    PermissionUtils takePermissionUtils;
    public ConfirmPickUpFragment() {
        // Required empty public constructor
    }



    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentConfirmPickUpBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        context = getActivity();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        binding.mMapView.onCreate(savedInstanceState);
        geoHelper = new GeoHelper();
        geoHelper.initGeocoder(getActivity());
        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());
        modelClass = new NearbyModelClass();
        savedList = new ArrayList<>();
        callApiOfShowUserPlaces();
        methodInitLayouts();

        bundle = getArguments();
        if (bundle != null) {
            Double dropLat = Double.valueOf(bundle.getString("dropLatitude"));
            Double dropLong = Double.valueOf(bundle.getString("dropLongitude"));
            dropoffAddress = bundle.getString("dropAddress");
            dropoffAddressfull = bundle.getString("dropAddressfull");
            schedule = bundle.getString("schedule");
            scheduleDatetime = bundle.getString("schedule_datetime");
            rideType = bundle.getString("rideType");
            dropLatlong = new LatLng(dropLat, dropLong);
        }

        methodInitClickListener();
        takePermissionUtils=new PermissionUtils(getActivity(),locationPermissionCallback);
        if (takePermissionUtils.isLocationPermissionGranted()) {
            getCurrentLocation();
        } else {
            takePermissionUtils.showLocationPermissionDailog(binding.getRoot().getContext().getString(R.string.we_need_acurate_ride_permission));
        }


        return view;
    }




    private ActivityResultLauncher<String[]> locationPermissionCallback = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(), new ActivityResultCallback<Map<String, Boolean>>() {
                @RequiresApi(api = Build.VERSION_CODES.M)
                @Override
                public void onActivityResult(Map<String, Boolean> result) {

                    boolean allPermissionClear=true;
                    List<String> blockPermissionCheck=new ArrayList<>();
                    for (String key : result.keySet())
                    {
                        if (!(result.get(key)))
                        {
                            allPermissionClear=false;
                            blockPermissionCheck.add(Functions.getPermissionStatus(getActivity(),key));
                        }
                    }
                    if (blockPermissionCheck.contains("blocked"))
                    {
                        Functions.showPermissionSetting(getActivity(),"location");
                    }
                    else
                    if (allPermissionClear)
                    {
                        getCurrentLocation();
                    }

                }
            });

    private void methodInitClickListener() {

        binding.backIcon.setOnClickListener(this);
        binding.confirmPickupSheet.confrimLocation.setOnClickListener(this);
        binding.confirmPickupSheet.locationLayout.setOnClickListener(this);
        binding.confirmPickupSheet.savedIcon.setOnClickListener(this);

    }

    private void methodInitLayouts() {

        btsBehaviour = BottomSheetBehavior.from(binding.confirmPickupSheet.getRoot());

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


        binding.confirmPickupSheet.addPickUpNotesEdit.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View view, boolean hasFocus) {

                if (hasFocus) {

                    binding.confirmPickupSheet.addPickUpLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.green_border_bg));

                }

            }
        });
    }

    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, this.mGoogleMap);
        if (mGoogleMap != null) {

            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    getActivity(), R.raw.gray_map));


            if (ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            } else {

                zoomToCurrentLocation();
                mGoogleMap.setOnCameraIdleListener(onCameraIdleListener);

            }
            googleMap.setOnCameraMoveListener(this);
            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);

        }
    }

    /*Method zoom to current location*/
    private void zoomToCurrentLocation() {
        if ((mDefaultLocation.latitude != 0.0 && mDefaultLocation.longitude != 0.0)) {
            mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(mDefaultLocation, 16));
        }
    }

    /*Method Configure CameraIdle*/
    private void configureCameraIdle() {
        onCameraIdleListener = new GoogleMap.OnCameraIdleListener() {
            @SuppressLint("StaticFieldLeak")
            @Override
            public void onCameraIdle() {

                LatLng latLng2 = mGoogleMap.getCameraPosition().target;
                pickupLatlong = latLng2;
                binding.confirmPickupSheet.confrimLocation.stopLoading();
                binding.confirmPickupSheet.savedIcon.setEnabled(true);
                binding.confirmPickupSheet.savedIcon.setClickable(true);
                methodCheckFav();

                List<Address> address = GeoHelper.getAddressesAtPoint(latLng2, 1, 0);
                if (address != null) {
                    locality = "" + address.get(0).getAddressLine(0);
                    if (address.get(0).getSubLocality() != null && !address.get(0).getSubLocality().equalsIgnoreCase("null") && !address.get(0).getSubLocality().equalsIgnoreCase("")) {
                        subLocality = "" + address.get(0).getSubLocality();
                    } else {
                        subLocality = locality;
                    }
                    binding.confirmPickupSheet.locationName.setText(subLocality);
                    binding.confirmPickupSheet.locationAddressText.setText(locality);
                }
            }
        };
    }

    /*Method Get Current location*/
    private void getCurrentLocation() {
        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());
        if (ActivityCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;

        } else {
            mFusedLocationProviderClient.getLastLocation().addOnSuccessListener(getActivity(), new OnSuccessListener<Location>() {
                @Override
                public void onSuccess(Location location) {
                    if (location != null) {

                        mDefaultLocation = new LatLng(location.getLatitude(), location.getLongitude());
                        binding.mMapView.onResume();
                        binding.mMapView.getMapAsync(ConfirmPickUpFragment.this);
                        setupMapIfNeeded();

                    }
                }
            });
        }
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.mMapView.onResume();
            binding.mMapView.getMapAsync(this);
            configureCameraIdle();
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

        StartRideFragment startRideFragment = new StartRideFragment();
        FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
        locationModel = new LocationModel();
        locationModel.setPickUpAddress(binding.confirmPickupSheet.locationName.getText().toString());
        locationModel.setPicklat(pickupLatlong.latitude);
        locationModel.setPicklng(pickupLatlong.longitude);
        locationModel.setDropOffAddress(dropoffAddress);
        locationModel.setDropOfflat(dropLatlong.latitude);
        locationModel.setDropOfflng(dropLatlong.longitude);
        locationModel.setDriverNote(binding.confirmPickupSheet.addPickUpNotesEdit.getText().toString());
        locationModel.setFulldropOffAddress(dropoffAddressfull);
        locationModel.setSchedule(schedule);
        locationModel.setScheduledatetime(scheduleDatetime);
        locationModel.setRideType(rideType);
        Bundle bundle = new Bundle();
        bundle.putSerializable("locationModel", locationModel);
        startRideFragment.setArguments(bundle);
        fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        fragmentTransaction.add(R.id.confirm_container, startRideFragment, "startRideFragment").addToBackStack("startRideFragment").commit();

    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.confrim_location:
                Functions.hideSoftKeyboard(getActivity());
                methodSetDataForRide();
                break;


            case R.id.savedIcon:
                if (isFav) {
                    Functions.customAlertDialog(getActivity(), "Remove Favourite", "Are you sure you want to remove this save location?", "Delete", true,new CallbackResponse() {
                        @Override
                        public void responce(String resp) {
                            if (resp != null && resp.equalsIgnoreCase("okay")) {
                                callApiForDeletePlace(favPlaceId);
                            }
                        }
                    });
                } else {
                    Functions.logDMsg("savedList : " + savedList.size());
                    AddToSavedPlacesFragment addToSavedPlacesFragment = new AddToSavedPlacesFragment(new FragmentCallBack() {
                        @Override
                        public void onItemClick(Bundle bundle) {
                            if (bundle != null) {
                                modelClass = (NearbyModelClass) bundle.getSerializable("model");
                                Functions.logDMsg("modelClass : " + modelClass.id);
                                Functions.logDMsg("modelClass : " + modelClass.placeId);
                                Functions.logDMsg("modelClass : " + modelClass.title);

                                savedList.add(modelClass);
                                // [AWS-MIGRATED] PaperDB write → SharedPreferences
        android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext()).edit().putString("saved_list".replace("/","_"), new com.google.gson.Gson().toJson(savedList)).apply();
                                methodCheckFav();
                            }
                        }
                    });
                    FragmentTransaction fragmentTransaction1 = getActivity().getSupportFragmentManager().beginTransaction();
                    Bundle bundle = new Bundle();
                    bundle.putString("address", locality);
                    bundle.putString("latitude", String.valueOf(pickupLatlong.latitude));
                    bundle.putString("longitude", String.valueOf(pickupLatlong.longitude));
                    bundle.putString("title", String.valueOf(subLocality));
                    addToSavedPlacesFragment.setArguments(bundle);
                    fragmentTransaction1.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    fragmentTransaction1.add(R.id.confirm_container, addToSavedPlacesFragment).addToBackStack(null).commit();
                }
                break;

            case R.id.backIcon:
                getParentFragmentManager().popBackStackImmediate();
                break;

            default:
                break;

        }
    }

    private void callApiForDeletePlace(String favPlaceId) {
        JSONObject params = new JSONObject();
        try {
            params.put("id", favPlaceId);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).deleteUserPlace(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    savedList.remove(favPlacePosition);
                                    // [AWS-MIGRATED] PaperDB write → SharedPreferences
        android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext()).edit().putString("saved_list".replace("/","_"), new com.google.gson.Gson().toJson(savedList)).apply();
                                    methodCheckFav();
                                } else {
                                    Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }

    private void methodCheckFav() {
        double distance = 0;
        if (savedList != null && savedList.size() > 0) {
            for (int i = 0; i < savedList.size(); i++) {
                distance = Functions.calculateDistance(pickupLatlong.latitude, pickupLatlong.longitude, savedList.get(i).lat, savedList.get(i).lng);
                if (distance < Constants.radiusToFavPlace) {
                    isFav = true;
                    favPlaceId = savedList.get(i).id;
                    favPlacePosition = i;
                    binding.confirmPickupSheet.savedIcon.setImageResource(R.drawable.ic_saved);
                    break;
                } else {
                    isFav = false;
                    binding.confirmPickupSheet.savedIcon.setImageResource(R.drawable.ic_unsaved);
                }
            }
        } else {
            isFav = false;
            binding.confirmPickupSheet.savedIcon.setImageResource(R.drawable.ic_unsaved);
        }
    }

    @Override
    public void onCameraMove() {
        binding.confirmPickupSheet.confrimLocation.startLoading();
        binding.confirmPickupSheet.savedIcon.setEnabled(false);
        binding.confirmPickupSheet.savedIcon.setClickable(false);
    }

    private void callApiOfShowUserPlaces() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (savedList != null && savedList.size() > 0) {
            savedList.clear();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showUserPlaces(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    JSONArray msgarray = respobj.getJSONArray("msg");
                                    for (int i = 0; i < msgarray.length(); i++) {
                                        JSONObject msgobj = msgarray.getJSONObject(i);
                                        JSONObject userPlace = msgobj.getJSONObject("UserPlace");

                                        String name = userPlace.getString("name");
                                        String lat = userPlace.getString("lat");
                                        String lng = userPlace.getString("long");
                                        String id = userPlace.getString("id");
                                        String locationString = userPlace.getString("location_string");
                                        String googlePlaceId = userPlace.getString("google_place_id");

                                        double latitude = Double.parseDouble(lat);
                                        double longitude = Double.parseDouble(lng);
                                        LatLng latlng = new LatLng(latitude, longitude);

                                        NearbyModelClass model = new NearbyModelClass();

                                        model.title = name;
                                        model.address = locationString;
                                        model.placeId = googlePlaceId;
                                        model.id = id;
                                        model.latLng = latlng;
                                        model.lat = latitude;
                                        model.lng = longitude;
                                        savedList.add(model);
                                    }
                                    if (!savedList.isEmpty()) {
                                        // [AWS-MIGRATED] PaperDB delete → no-op (SharedPreferences key auto-managed)
                                        // [AWS-MIGRATED] PaperDB write → SharedPreferences
        android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext()).edit().putString("saved_list".replace("/","_"), new com.google.gson.Gson().toJson(savedList)).apply();
                                    }
                                } else {
                                    // [AWS-MIGRATED] PaperDB delete → no-op (SharedPreferences key auto-managed)
                                    savedList.clear();
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }

}