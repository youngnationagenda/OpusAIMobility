package com.terraai.aimobility.ride.bookride;

import static android.Manifest.permission.ACCESS_FINE_LOCATION;
import static com.terraai.aimobility.codeclasses.Variables.PACKAGE_URL_SCHEME;
import static com.terraai.aimobility.bottomsheet.AnchorSheetBehavior.STATE_COLLAPSED;
import static com.terraai.aimobility.bottomsheet.AnchorSheetBehavior.STATE_EXPANDED;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.location.Address;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.LinearLayout;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.libraries.places.api.Places;
import com.google.android.libraries.places.api.model.AutocompletePrediction;
import com.google.android.libraries.places.api.model.AutocompleteSessionToken;
import com.google.android.libraries.places.api.model.LocationBias;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.api.model.RectangularBounds;
import com.google.android.libraries.places.api.model.TypeFilter;
import com.google.android.libraries.places.api.net.FetchPlaceRequest;
import com.google.android.libraries.places.api.net.FetchPlaceResponse;
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest;
import com.google.android.libraries.places.api.net.PlacesClient;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.terraai.aimobility.adapter.ShowLocationsAdapter;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.GeoHelper;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.AdapterLongClickListener;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.Interface.IOnBackPressed;
import com.terraai.aimobility.codeclasses.PermissionUtils;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.R;
import com.terraai.aimobility.bottomsheet.AnchorSheetBehavior;
import com.terraai.aimobility.databinding.FragmentWhereToBinding;
import com.terraai.aimobility.parcel.adapter.ParcelChangeAddress;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;


public class WheretoFragment extends Fragment
        implements OnMapReadyCallback, View.OnClickListener, GoogleMap.OnCameraMoveListener, IOnBackPressed {

    FragmentWhereToBinding binding;
    Bundle bundle;

    MapWorker mapWorker;
    Context context;
    Bitmap pickUpMarkerBitmap, dropOofMarkerBitmap;
    LocationModel locationModel;
    boolean isClicked = false;
    Handler handler;
    Runnable runable;
    ArrayList<NearbyModelClass> nearLocationList = new ArrayList<>();
    ArrayList<NearbyModelClass> recentPlaceList = new ArrayList<>();
    double pickUpLat, pickUpLong;
    ShowLocationsAdapter showRecentLocationsAdapter;
    ShowLocationsAdapter showLocationsAdapter;
    TextWatcher textWatcher, textWatcherPickup;

    boolean isFirst = false, hasFocusFirst = true;
    boolean goBack = false, fromPickUp = false;
    boolean isBack = false;

    FragmentCallBack fragmentCallBack;
    LocationModel locationModelBundle;

    GeoHelper geoHelper;
    LatLng pickupLatlong, dropLatlong, currentLatLng;

    BottomSheetBehavior anchorBehavior;

    FusedLocationProviderClient mFusedLocationProviderClient;
    GoogleMap mGoogleMap;
    GoogleMap.OnCameraIdleListener onCameraIdleListener;
    LatLng mDefaultLocation;
    PlacesClient placesClient;
    AutocompleteSessionToken sessionToken;
    String scheduleDatetime, rideType;
    String schedule;
    String whichScreenOpen = "";
    String locality = "", latitude, longtitude, userId, currentAddress;
    PermissionUtils takePermissionUtils;




    public WheretoFragment() {
        // Required empty public constructor
    }

    public WheretoFragment(boolean goback, boolean fromPickUp, FragmentCallBack fragmentCallBack) {
        this.goBack = goback;
        this.fromPickUp = fromPickUp;
        this.fragmentCallBack = fragmentCallBack;
    }

    public WheretoFragment(boolean goback) {
        this.goBack = goback;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentWhereToBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        geoHelper = new GeoHelper();
        geoHelper.initGeocoder(getActivity());

        getActivity().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);

        locationModel = new LocationModel();

        context = getActivity();


        binding.mMapView.onCreate(savedInstanceState);

        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());

        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longtitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");

        pickUpLat = Double.parseDouble(latitude);
        pickUpLong = Double.parseDouble(longtitude);

        pickupLatlong = new LatLng(pickUpLat, pickUpLong);
        currentLatLng = new LatLng(pickUpLat, pickUpLong);

        if (!Places.isInitialized()) {
            Places.initialize(binding.getRoot().getContext().getApplicationContext(), binding.getRoot().getContext().getString(R.string.google_map_key));
        }

        placesClient = Places.createClient(getActivity());
        sessionToken = AutocompleteSessionToken.newInstance();

        methodInitLayouts();
        methodInitClickListener();
        methodSetRecentAdapter();
        callApiOfShowUserPlaces();
        methodSetUpScreenData();
        methodInitFocusListener();
        methodInitTextWatcher();
        methodSetNearLocationAdapter();
        takePermissionUtils=new PermissionUtils(getActivity(),locationPermissionCallback);
        if (takePermissionUtils.isLocationPermissionGranted()) {
            getCurrentLocation();
            setupMapIfNeeded();
        }
        else
        {
            takePermissionUtils.showLocationPermissionDailog(getActivity().getString(R.string.we_need_acurate_ride_permission));
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


    private void methodSetUpScreenData() {
        bundle = getArguments();
        if (goBack) {
            locationModelBundle = (LocationModel) bundle.getSerializable("dataModel");
            if (fromPickUp) {
                binding.etCurrentLocation.setText(locationModelBundle.getPickUpAddress());
                currentAddress = locationModelBundle.getPickUpAddress();
                mDefaultLocation = new LatLng(locationModelBundle.getPicklat(), locationModelBundle.getPicklng());
                binding.etdropOffLocation.setClickable(false);
                binding.etdropOffLocation.setEnabled(false);
                binding.etdropOffLocation.setVisibility(View.GONE);
                binding.dropOffLocation.setVisibility(View.GONE);
                binding.viewLayout.setVisibility(View.GONE);
                binding.separator.setVisibility(View.GONE);
                binding.etCurrentLocation.requestFocus();
                binding.etCurrentLocation.selectAll();
                binding.etCurrentLocation.setSelectAllOnFocus(true);
                binding.confrimLocation.setText(binding.getRoot().getContext().getString(R.string.confirm_pick_up));
            } else {
                dropLatlong = new LatLng(locationModelBundle.getDropOfflat(), locationModelBundle.getDropOfflng());
                mDefaultLocation = new LatLng(locationModelBundle.getDropOfflat(), locationModelBundle.getDropOfflng());
                binding.etdropOffLocation.setText(locationModelBundle.getDropOffAddress());
                binding.etdropOffLocation.requestFocus();
                binding. etCurrentLocation.setClickable(false);
                binding.etCurrentLocation.setEnabled(false);
                binding. etCurrentLocation.setVisibility(View.GONE);
                binding. pickImageView.setVisibility(View.GONE);
                binding. viewLayout.setVisibility(View.GONE);
                binding. separator.setVisibility(View.GONE);
                binding. confrimLocation.setText(binding.getRoot().getContext().getString(R.string.confrim_destination));
            }
        } else {
            if (bundle != null) {
                schedule = bundle.getString("schedule");
                scheduleDatetime = bundle.getString("schedule_datetime");
                rideType = bundle.getString("rideType");
            }

            currentAddress = Functions.getAddressSubString(getActivity(), pickupLatlong);

            binding.etCurrentLocation.setText(currentAddress);
            locationModel.setPicklat(pickUpLat);
            locationModel.setPicklng(pickUpLong);
            locationModel.setPickUpAddress(currentAddress);
            binding.etCurrentLocation.setFocusable(false);
            binding.etdropOffLocation.requestFocus();
        }
        Functions.showKeyboard(getActivity());
    }

    private void methodInitLayouts() {

        anchorBehavior = BottomSheetBehavior.from(binding.linearBottomSheet);

        anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
        anchorBehavior.setHideable(false);
        anchorBehavior.addBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {
            @Override
            public void onStateChanged(@NonNull View bottomSheet, int newState) {

                switch (anchorBehavior.getState()) {

                    case STATE_COLLAPSED:
                        Functions.hideSoftKeyboard(getActivity());
                        methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._12sdp), (int) getResources().getDimension(R.dimen._12sdp));
                        break;

                    case STATE_EXPANDED:
                        methodSetbottomSheetMargin(0, 0);
                        break;

                    default:
                        break;
                }
            }

            @Override
            public void onSlide(@NonNull View bottomSheet, float slideOffset) {
                double oldOffSet = 0f;
                if (slideOffset >= 0.0 && slideOffset <= 0.1) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._12sdp), (int) getResources().getDimension(R.dimen._12sdp));
                } else if (slideOffset > 0.1 && slideOffset <= 0.2) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._10sdp), (int) getResources().getDimension(R.dimen._10sdp));
                } else if (slideOffset > 0.2 && slideOffset <= 0.3) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._9sdp), (int) getResources().getDimension(R.dimen._9sdp));
                } else if (slideOffset > 0.3 && slideOffset <= 0.4) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._8sdp), (int) getResources().getDimension(R.dimen._8sdp));
                } else if (slideOffset > 0.4 && slideOffset <= 0.5) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._7sdp), (int) getResources().getDimension(R.dimen._7sdp));
                } else if (slideOffset > 0.5 && slideOffset <= 0.6) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._6sdp), (int) getResources().getDimension(R.dimen._6sdp));
                } else if (slideOffset > 0.6 && slideOffset <= 0.7) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._5sdp), (int) getResources().getDimension(R.dimen._5sdp));
                } else if (slideOffset > 0.7 && slideOffset <= 0.8) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._4sdp), (int) getResources().getDimension(R.dimen._4sdp));
                } else if (slideOffset > 0.8 && slideOffset <= 0.9) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._2sdp), (int) getResources().getDimension(R.dimen._2sdp));
                } else if (slideOffset > 0.9 && slideOffset <= 1.0) {
                    methodSetbottomSheetMargin((int) binding.getRoot().getContext().getResources().getDimension(R.dimen._1sdp), (int) getResources().getDimension(R.dimen._1sdp));
                } else if (slideOffset == 1.0) {
                    methodSetbottomSheetMargin(0, 0);
                }
                oldOffSet = slideOffset;
            }
        });
    }

    private void methodInitClickListener() {
        binding.backBtn.setOnClickListener(this);
        binding.selectmaplayout.setOnClickListener(this);
        binding.savedPlacesLayout.setOnClickListener(this);
        binding.confrimLocation.setOnClickListener(this);
        binding.etdropOffLocation.setOnClickListener(this);
        binding.etCurrentLocation.setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.confrim_location:
                Functions.hideSoftKeyboard(getActivity());
                if (!goBack) {
                    if (whichScreenOpen.equals("pickUpScreen")) {
                        if (dropLatlong != null) {
                            StartRideFragment startRideFragment = new StartRideFragment();
                            FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                            locationModel = new LocationModel();
                            locationModel.setPickUpAddress(binding.etCurrentLocation.getText().toString());
                            locationModel.setPicklat(pickupLatlong.latitude);
                            locationModel.setPicklng(pickupLatlong.longitude);
                            locationModel.setDropOffAddress(binding.etdropOffLocation.getText().toString());
                            locationModel.setDropOfflat(dropLatlong.latitude);
                            locationModel.setDropOfflng(dropLatlong.longitude);
                            locationModel.setScheduledatetime(schedule);
                            locationModel.setSchedule(scheduleDatetime);
                            locationModel.setRideType(rideType);
                            Bundle bundle = new Bundle();
                            bundle.putSerializable("locationModel", locationModel);
                            startRideFragment.setArguments(bundle);
                            fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                            fragmentTransaction.add(R.id.whereTo_Container, startRideFragment, "startRideFragment").addToBackStack("startRideFragment").commit();
                        } else {
                            anchorBehavior.setHideable(false);
                            binding.etCurrentLocation.clearFocus();
                            currentAddress =  binding.etCurrentLocation.getText().toString();
                            binding.etCurrentLocation.setFocusable(false);
                            binding.etCurrentLocation.requestFocus();
                            whichScreenOpen = "dropOffScreen";
                            binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                            isClicked = false;
                            binding.etdropOffLocation.requestFocus();
                            Functions.showKeyboard(getActivity());
                        }
                    } else if (whichScreenOpen.equals("dropOffScreen")) {
                        if (dropLatlong != null) {
                            StartRideFragment startRideFragment = new StartRideFragment();
                            FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                            locationModel = new LocationModel();
                            locationModel.setPickUpAddress( binding.etCurrentLocation.getText().toString());
                            locationModel.setPicklat(pickupLatlong.latitude);
                            locationModel.setPicklng(pickupLatlong.longitude);
                            locationModel.setDropOffAddress( binding.etdropOffLocation.getText().toString());
                            locationModel.setDropOfflat(dropLatlong.latitude);
                            locationModel.setDropOfflng(dropLatlong.longitude);
                            locationModel.setScheduledatetime(schedule);
                            locationModel.setSchedule(scheduleDatetime);
                            locationModel.setRideType(rideType);
                            Bundle bundle = new Bundle();
                            bundle.putSerializable("locationModel", locationModel);
                            startRideFragment.setArguments(bundle);
                            fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                            fragmentTransaction.add(R.id.whereTo_Container, startRideFragment, "startRideFragment").addToBackStack("startRideFragment").commit();
                        } else {
                            anchorBehavior.setHideable(false);
                            Functions.hideSoftKeyboard(getActivity());
                            whichScreenOpen = "pickUpScreen";
                            binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confirm_pick_up));
                            methodSetbottomSheetMargin((int) getResources().getDimension(R.dimen._12sdp), (int) getResources().getDimension(R.dimen._12sdp));
                            binding.etCurrentLocation.setFocusable(true);
                            binding.etCurrentLocation.setFocusableInTouchMode(true);
                            binding.etCurrentLocation.setClickable(true);
                            binding.etCurrentLocation.requestFocus();
                            isClicked = true;
                        }
                    }
                } else {
                    if (fromPickUp) {
                        LocationModel model = new LocationModel();
                        model.setPickUpAddress(binding.etCurrentLocation.getText().toString());
                        model.setPicklat(pickupLatlong.latitude);
                        model.setPicklng(pickupLatlong.longitude);
                        model.setDropOffAddress(locationModelBundle.getDropOffAddress());
                        model.setDropOfflat(locationModelBundle.getDropOfflat());
                        model.setDropOfflng(locationModelBundle.getDropOfflng());
                        model.setDriverNote(locationModelBundle.getDriverNote());
                        locationModel.setRideType(rideType);
                        locationModel.setScheduledatetime(schedule);
                        locationModel.setSchedule(scheduleDatetime);
                        Bundle bundle = new Bundle();
                        bundle.putSerializable("locationModel", model);
                        if (fragmentCallBack != null) {
                            fragmentCallBack.onItemClick(bundle);
                        }
                        getActivity().getSupportFragmentManager().popBackStackImmediate();

                    } else {

                        if (dropLatlong!=null)
                        {
                            LocationModel model = new LocationModel();
                            model.setPickUpAddress(locationModelBundle.getPickUpAddress());
                            model.setPicklat(locationModelBundle.getPicklat());
                            model.setPicklng(locationModelBundle.getPicklng());
                            model.setDriverNote(locationModelBundle.getDriverNote());
                            model.setDropOffAddress( binding.etdropOffLocation.getText().toString());
                            model.setDropOfflat(dropLatlong.latitude);
                            locationModel.setRideType(rideType);
                            model.setDropOfflng(dropLatlong.longitude);
                            locationModel.setScheduledatetime(schedule);
                            locationModel.setSchedule(scheduleDatetime);
                            Bundle bundle = new Bundle();
                            bundle.putSerializable("locationModel", model);
                            if (fragmentCallBack != null) {
                                fragmentCallBack.onItemClick(bundle);
                            }
                            getActivity().getSupportFragmentManager().popBackStackImmediate();
                        }

                    }

                }
                break;

            case R.id.et_current_location:
                hasFocusFirst = false;
                binding.etdropOffLocation.clearFocus();
                binding.progressBar.setVisibility(View.GONE);
                binding.etdropOffLocation.removeTextChangedListener(textWatcher);
                if (!isClicked) {
                    if (!nearLocationList.isEmpty())
                        nearLocationList.clear();

                    binding.placeRecyclerview.setVisibility(View.GONE);
                    anchorBehavior.setHideable(false);
                    whichScreenOpen = "pickUpScreen";
                    binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confirm_pick_up));
                    anchorBehavior.setState(BottomSheetBehavior.STATE_COLLAPSED);
                    methodSetbottomSheetMargin((int) getResources().getDimension(R.dimen._12sdp), (int) getResources().getDimension(R.dimen._12sdp));
                    binding.etCurrentLocation.setFocusable(true);
                    binding. etCurrentLocation.setFocusableInTouchMode(true);
                    binding.etCurrentLocation.setClickable(true);
                    binding.etCurrentLocation.requestFocus();
                    isClicked = true;
                } else {
                    anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                    whichScreenOpen = "pickUpScreen";
                    if (!isFirst) {
                        binding.etCurrentLocation.selectAll();
                        binding.etCurrentLocation.setSelectAllOnFocus(true);
                        isFirst = true;
                        isClicked = true;
                        checkListenerWatcher(true);
                    }
                    binding.etCurrentLocation.setInputType(InputType.TYPE_TEXT_VARIATION_POSTAL_ADDRESS);
                    isClicked = true;
                }
                break;

            case R.id.etdropOffLocation:
                anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                checkListenerWatcher(false);
                anchorBehavior.setHideable(false);
                whichScreenOpen = "dropOffScreen";
                binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                isClicked = false;
                isFirst = false;
                binding.etCurrentLocation.setFocusable(false);
                binding.etCurrentLocation.setFocusableInTouchMode(false);
                binding.etCurrentLocation.setClickable(false);
                break;


            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;

            case R.id.selectmaplayout:
                Functions.hideSoftKeyboard(getActivity());
                if (!goBack) {
                    if (whichScreenOpen.equals("")) {
                        whichScreenOpen = "dropOffScreen";
                        binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                    } else if (whichScreenOpen.equals("dropOffScreen")) {
                        binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                    } else {
                        binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_pickUp));
                    }
                } else {
                    if (fromPickUp) {
                        whichScreenOpen = "pickUpScreen";
                        binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_pickUp));
                    } else {
                        whichScreenOpen = "dropOffScreen";
                        binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                    }
                }

                anchorBehavior.setHideable(true);
                anchorBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
                break;

            //bottom sheet saved places
            case R.id.savedPlacesLayout:
                Functions.hideSoftKeyboard(getActivity());
                anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                SavePlacesFragment searchLocationFragment = new SavePlacesFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            if (goBack) {
                                LocationModel model = new LocationModel();
                                if (fromPickUp) {
                                    model.setPickUpAddress(bundle.getString("Address"));
                                    model.setPicklat(Double.parseDouble(bundle.getString("Latitude")));
                                    model.setPicklng(Double.parseDouble(bundle.getString("Longitude")));
                                    model.setDropOffAddress(locationModelBundle.getDropOffAddress());
                                    model.setDropOfflat(locationModelBundle.getDropOfflat());
                                    model.setDropOfflng(locationModelBundle.getDropOfflng());
                                    model.setDriverNote(locationModelBundle.getDriverNote());
                                    model.setRideType(locationModel.getRideType());
                                    ;
                                    model.setScheduledatetime(schedule);
                                    model.setSchedule(scheduleDatetime);
                                } else {
                                    model.setPickUpAddress(locationModelBundle.getPickUpAddress());
                                    model.setPicklat(locationModelBundle.getPicklat());
                                    model.setPicklng(locationModelBundle.getPicklng());
                                    model.setDriverNote(locationModelBundle.getDriverNote());
                                    model.setDropOffAddress(bundle.getString("Address"));
                                    model.setDropOfflat(Double.parseDouble(bundle.getString("Latitude")));
                                    model.setDropOfflng(Double.parseDouble(bundle.getString("Longitude")));
                                    model.setScheduledatetime(schedule);
                                    model.setRideType(locationModel.getRideType());
                                    model.setSchedule(scheduleDatetime);
                                }
                                Bundle startBundle = new Bundle();
                                startBundle.putSerializable("locationModel", model);
                                if (fragmentCallBack != null) {
                                    fragmentCallBack.onItemClick(startBundle);
                                }
                                getActivity().onBackPressed();

                            } else {
                                pickUpLat = Double.parseDouble(bundle.getString("Latitude"));
                                pickUpLong = Double.parseDouble(bundle.getString("Longitude"));
                                currentAddress = bundle.getString("Address");
                                pickupLatlong = new LatLng(pickUpLat, pickUpLong);
                                binding.etCurrentLocation.setText(currentAddress);
                                binding.etdropOffLocation.requestFocus();
                                whichScreenOpen = "dropOffScreen";
                                binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                            }

                        }
                    }
                });
                Bundle bundle = new Bundle();
                locationModel = new LocationModel();
                if (!goBack) {
                    locationModel.setPickUpAddress(currentAddress);
                    locationModel.setPicklng(pickupLatlong.longitude);
                    locationModel.setPicklat(pickupLatlong.latitude);
                    locationModel.setScheduledatetime(schedule);
                    locationModel.setSchedule(scheduleDatetime);
                    locationModel.setRideType(rideType);
                } else {
                    locationModel = locationModelBundle;
                }

                bundle.putSerializable("locationModel", locationModel);
                if (whichScreenOpen.equals("")) {
                    whichScreenOpen = "dropOffScreen";
                }
                bundle.putString("fromWhere", whichScreenOpen);
                bundle.putBoolean("goBack", goBack);
                searchLocationFragment.setArguments(bundle);
                FragmentTransaction tr = getActivity().getSupportFragmentManager().beginTransaction();
                tr.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                tr.add(R.id.whereTo_Container, searchLocationFragment).addToBackStack(null).commit();
                break;

            default:
                break;

        }
    }

    private void methodInitFocusListener() {
        binding.etdropOffLocation.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                    anchorBehavior.setHideable(false);
                    if ( binding.etdropOffLocation.getText().length() > 0) {
                        binding.etdropOffLocation.selectAll();
                        binding.etdropOffLocation.setSelectAllOnFocus(true);
                    } else {
                        nearLocationList.clear();
                        if(!recentPlaceList.isEmpty()) {
                            binding.recentLayout.setVisibility(View.VISIBLE);
                        }
                        binding.placeRecyclerview.setVisibility(View.GONE);
                        binding.progressBar.setVisibility(View.GONE);
                        showLocationsAdapter.notifyDataSetChanged();
                    }
                    if (!hasFocusFirst) {
                        whichScreenOpen = "dropOffScreen";
                    }

                    checkListenerWatcher(false);

                    binding.etCurrentLocation.setText(currentAddress);
                    isClicked = false;
                    isFirst = false;
                    binding.etCurrentLocation.setFocusable(false);
                    binding.etCurrentLocation.setClickable(false);
                    binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                }
            }
        });
    }

    String searchQuery;
    private void methodInitTextWatcher() {

        textWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
                nearLocationList.clear();
                if ( binding.etdropOffLocation.getText().length() > 0) {
                    binding.progressBar.setVisibility(View.VISIBLE);
                    searchQuery = charSequence.toString();
                    binding.recentLayout.setVisibility(View.GONE);
                    binding.placeRecyclerview.setVisibility(View.VISIBLE);
                    timerCallApi();
                } else {
                    nearLocationList.clear();
                    if(!recentPlaceList.isEmpty()) {
                        binding.recentLayout.setVisibility(View.VISIBLE);
                    }
                    binding.placeRecyclerview.setVisibility(View.GONE);
                    binding.progressBar.setVisibility(View.GONE);
                    showLocationsAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        };

        textWatcherPickup = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
                nearLocationList.clear();
                if (! binding.etCurrentLocation.getText().toString().equals("")) {
                    binding.progressBar.setVisibility(View.VISIBLE);
                    searchQuery = charSequence.toString();
                    binding.recentLayout.setVisibility(View.GONE);
                    binding.placeRecyclerview.setVisibility(View.VISIBLE);
                    timerCallApi();
                } else {
                    nearLocationList.clear();
                    if(!recentPlaceList.isEmpty()) {
                        binding.recentLayout.setVisibility(View.VISIBLE);
                    }
                    binding.placeRecyclerview.setVisibility(View.GONE);
                    binding.progressBar.setVisibility(View.GONE);
                    showLocationsAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        };

        if (goBack) {
            if (!fromPickUp) {
                checkListenerWatcher(false);
            } else {
                checkListenerWatcher(true);
            }
        } else {
            checkListenerWatcher(false);

        }

    }

    public void timerCallApi() {

        if (handler != null && runable != null) {
            handler.removeCallbacks(runable);
        }

        if (handler == null)
            handler = new Handler();

        if (runable == null) {
            runable = () -> getPlacePredictions();
        }

        handler.postDelayed(runable, 1000);
    }

    private void getPlacePredictions() {


        final LocationBias bias = RectangularBounds.newInstance(
                Functions.getCoordinate(Double.parseDouble(latitude), Double.parseDouble(longtitude), -500, -500),
                Functions.getCoordinate(Double.parseDouble(latitude), Double.parseDouble(longtitude), 500, 500)
        );

        final FindAutocompletePredictionsRequest newRequest = FindAutocompletePredictionsRequest
                .builder()
                .setSessionToken(sessionToken)
                .setTypeFilter(TypeFilter.ESTABLISHMENT)
                .setQuery("" + searchQuery)
                .setLocationBias(bias)
                .setCountries(Functions.getCountryCode(getActivity()))
                .setCountry(Functions.getCountryCode(getActivity()))
                .build();

        placesClient.findAutocompletePredictions(newRequest).addOnSuccessListener((response) -> {
            for (AutocompletePrediction prediction : response.getAutocompletePredictions()) {
                List<Place.Field> fields = Arrays.asList(Place.Field.ID, Place.Field.NAME, Place.Field.LAT_LNG, Place.Field.ADDRESS);
                FetchPlaceRequest placeRequest = FetchPlaceRequest.builder(prediction.getPlaceId(), fields).build();
                placesClient.fetchPlace(placeRequest).addOnSuccessListener(new OnSuccessListener<FetchPlaceResponse>() {
                    @Override
                    public void onSuccess(FetchPlaceResponse fetchPlaceResponse) {

                        binding.progressBar.setVisibility(View.GONE);

                        Place place = fetchPlaceResponse.getPlace();
                        NearbyModelClass model = new NearbyModelClass();

                        model.title = place.getName();
                        model.address = place.getAddress();
                        model.lat = place.getLatLng().latitude;
                        model.lng = place.getLatLng().longitude;
                        LatLng latLng = new LatLng(place.getLatLng().latitude, place.getLatLng().longitude);
                        model.latLng = latLng;
                        model.placeId = place.getId();
                        model.isLiked = "0";
                        nearLocationList.add(model);
                        showLocationsAdapter.notifyDataSetChanged();
                    }
                });
            }
        }).addOnFailureListener((exception) -> {
            if (exception instanceof ApiException) {
                ApiException apiException = (ApiException) exception;
                Log.e("aimobility", apiException.getMessage() != null ? apiException.getMessage() : apiException.toString(), apiException);
            }
        });
    }

    /*Method SetRecentLocationAdapter*/
    private void methodSetNearLocationAdapter() {
        LinearLayoutManager layoutManager = new LinearLayoutManager(getActivity());
        binding.placeRecyclerview.setLayoutManager(layoutManager);
        showLocationsAdapter = new ShowLocationsAdapter(getActivity(), false, nearLocationList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                switch (view.getId()) {
                    case R.id.locationLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        NearbyModelClass nearbyModelClass = (NearbyModelClass) model;
                        handleAdapterClick(nearbyModelClass);

                        break;

                    default:
                        break;
                }

            }
        }, new AdapterLongClickListener() {
            @Override
            public void onLongItemClick(int postion, Object model, View view) {
                //for long press
            }
        }, false);
        binding.placeRecyclerview.setAdapter(showLocationsAdapter);


    }

    private void handleAdapterClick(NearbyModelClass nearbyModelClass) {

        if (!goBack) {
            if (whichScreenOpen.equals("pickUpScreen")) {
                if (dropLatlong != null) {
                    StartRideFragment startRideFragment = new StartRideFragment();
                    FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                    locationModel.setPickUpAddress(nearbyModelClass.title);
                    locationModel.setPicklat(nearbyModelClass.lat);
                    locationModel.setPicklng(nearbyModelClass.lng);
                    locationModel.setDropOffAddress( binding.etdropOffLocation.getText().toString());
                    locationModel.setDropOfflat(dropLatlong.latitude);
                    locationModel.setDropOfflng(dropLatlong.longitude);
                    locationModel.setScheduledatetime(schedule);
                    locationModel.setSchedule(scheduleDatetime);
                    locationModel.setRideType(rideType);
                    Bundle bundle = new Bundle();
                    bundle.putSerializable("locationModel", locationModel);
                    startRideFragment.setArguments(bundle);
                    fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    fragmentTransaction.add(R.id.whereTo_Container, startRideFragment, "startRideFragment").addToBackStack("startRideFragment").commit();
                } else {
                    anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                    Functions.showKeyboard(getActivity());
                    binding.etdropOffLocation.requestFocus();
                    nearLocationList.clear();
                    if(!recentPlaceList.isEmpty()) {
                        binding.recentLayout.setVisibility(View.VISIBLE);
                    }
                    checkListenerWatcher(false);
                    binding.etCurrentLocation.setText(currentAddress);
                    anchorBehavior.setHideable(false);
                    whichScreenOpen = "dropOffScreen";
                    binding.confrimLocation.setText(getActivity().getResources().getString(R.string.confrim_destination));
                    isClicked = false;
                    binding.etCurrentLocation.setFocusable(false);
                    binding.etCurrentLocation.setFocusableInTouchMode(false);
                    binding.etCurrentLocation.setClickable(false);
                    currentAddress = nearbyModelClass.title;
                    binding.etCurrentLocation.setText(currentAddress);
                    pickUpLat = nearbyModelClass.lat;
                    pickUpLong = nearbyModelClass.lng;
                    pickupLatlong = new LatLng(pickUpLat, pickUpLong);
                    nearLocationList.clear();
                }
            } else {
                if (pickupLatlong != null) {
                    StartRideFragment startRideFragment = new StartRideFragment();
                    FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                    locationModel.setPickUpAddress( binding.etCurrentLocation.getText().toString());
                    locationModel.setPicklat(pickupLatlong.latitude);
                    locationModel.setPicklng(pickupLatlong.longitude);
                    locationModel.setDropOffAddress(nearbyModelClass.title);
                    locationModel.setDropOfflat(nearbyModelClass.lat);
                    locationModel.setDropOfflng(nearbyModelClass.lng);
                    locationModel.setScheduledatetime(schedule);
                    locationModel.setRideType(rideType);
                    locationModel.setSchedule(scheduleDatetime);
                    Bundle bundle = new Bundle();
                    bundle.putSerializable("locationModel", locationModel);
                    startRideFragment.setArguments(bundle);
                    fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    fragmentTransaction.add(R.id.whereTo_Container, startRideFragment, "startRideFragment").addToBackStack("startRideFragment").commit();
                }
            }
        } else {
            if (fromPickUp) {
                LocationModel model = new LocationModel();
                model.setPickUpAddress(nearbyModelClass.title);
                model.setPicklat(nearbyModelClass.lat);
                model.setPicklng(nearbyModelClass.lng);
                model.setDropOffAddress(locationModelBundle.getDropOffAddress());
                model.setDropOfflat(locationModelBundle.getDropOfflat());
                model.setDropOfflng(locationModelBundle.getDropOfflng());
                model.setScheduledatetime(schedule);
                model.setSchedule(scheduleDatetime);
                model.setDriverNote(locationModelBundle.getDriverNote());
                model.setRideType(locationModel.getRideType());
                Bundle bundle = new Bundle();
                bundle.putSerializable("locationModel", model);
                if (fragmentCallBack != null) {
                    fragmentCallBack.onItemClick(bundle);
                }
                getActivity().onBackPressed();

            } else {

                LocationModel model = new LocationModel();
                model.setPickUpAddress(locationModelBundle.getPickUpAddress());
                model.setPicklat(locationModelBundle.getPicklat());
                model.setPicklng(locationModelBundle.getPicklng());
                model.setDriverNote(locationModelBundle.getDriverNote());
                model.setDropOffAddress(nearbyModelClass.title);
                model.setDropOfflat(nearbyModelClass.lat);
                model.setDropOfflng(nearbyModelClass.lng);
                model.setScheduledatetime(schedule);
                model.setSchedule(scheduleDatetime);
                model.setRideType(locationModel.getRideType());
                Bundle bundle = new Bundle();
                bundle.putSerializable("locationModel", model);
                if (fragmentCallBack != null) {
                    fragmentCallBack.onItemClick(bundle);
                }
                getActivity().onBackPressed();
            }
        }

    }

    private void methodSetbottomSheetMargin(int start, int end) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
        );
        params.setMargins(start, 0, end, 0);
        binding.scrollView.setLayoutParams(params);
    }

    private void callApiOfShowUserPlaces() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        recentPlaceList.clear();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRecentLocations(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        binding.recentLayout.setVisibility(View.VISIBLE);
                                        JSONArray msgarray = respobj.getJSONArray("msg");

                                        for (int i = 0; i < msgarray.length(); i++) {
                                            JSONObject msgobj = msgarray.getJSONObject(i);
                                            JSONObject userPlace = msgobj.getJSONObject("RecentLocation");

                                            String name = userPlace.getString("short_name");
                                            String lat = userPlace.getString("lat");
                                            String lng = userPlace.getString("long");
                                            String id = userPlace.getString("id");
                                            String locationString = userPlace.getString("location_string");

                                            double latitude = Double.parseDouble(lat);
                                            double longitude = Double.parseDouble(lng);
                                            LatLng latlng = new LatLng(latitude, longitude);

                                            NearbyModelClass model = new NearbyModelClass();

                                            model.title = name;
                                            model.address = locationString;
                                            model.id = id;
                                            model.latLng = latlng;
                                            model.lat = latitude;
                                            model.lng = longitude;

                                            recentPlaceList.add(model);
                                        }
                                        showRecentLocationsAdapter.notifyDataSetChanged();
                                    } else {
                                        binding.recentLayout.setVisibility(View.GONE);
                                        recentPlaceList.clear();
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

    /*Method SetSavedLocationAdapter*/
    private void methodSetRecentAdapter() {
        binding.recentLocationRecycler.setLayoutManager(new LinearLayoutManager(getActivity()));
        Functions.logDMsg("list size at fragment : " + recentPlaceList.size());
        showRecentLocationsAdapter = new ShowLocationsAdapter(getActivity(), false, recentPlaceList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                switch (view.getId()) {
                    case R.id.locationLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        NearbyModelClass nearbyModelClass = (NearbyModelClass) model;
                        handleAdapterClick(nearbyModelClass);
                        break;

                    default:
                        break;
                }

            }
        }, new AdapterLongClickListener() {
            @Override
            public void onLongItemClick(int postion, Object model, View view) {
                NearbyModelClass modelClass = (NearbyModelClass) model;
                deleteMessageDialog(modelClass);
            }
        } , false);
        binding.recentLocationRecycler.setAdapter(showRecentLocationsAdapter);
        showRecentLocationsAdapter.notifyDataSetChanged();
    }


    // this is the delete message diloge which will show after long press in chat message
    private void deleteMessageDialog(final NearbyModelClass modelClass) {
        final CharSequence[] options;
        options = new CharSequence[]{getString(R.string.delete_this_place), getString(R.string.cancel)};
        AlertDialog.Builder builder = new AlertDialog.Builder(context, R.style.AlertDialogCustom);
        builder.setTitle(null);
        builder.setItems(options, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int item) {
                if (options[item].equals(getString(R.string.delete_this_place))) {
                    updateRecent(modelClass.id);
                } else if (options[item].equals(getString(R.string.cancel))) {
                    dialog.dismiss();
                }
            }
        });
        builder.show();
    }

    private void updateRecent(String id) {
        JSONObject params = new JSONObject();
        try {
            params.put("id", id);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(getActivity(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).deleteRecentLocation(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();

                        if (isSuccess)
                        {
                            if (resp != null) {

                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        callApiOfShowUserPlaces();
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

                new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        getActivity().runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                zoomToCurrentLocation();
                            }
                        });
                    }
                },1000);
                mGoogleMap.setOnCameraIdleListener(onCameraIdleListener);

            }
            googleMap.setOnCameraMoveListener(this);
            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);

        }
    }

    /*Method zoom to current location*/
    private void zoomToCurrentLocation() {
        if (mDefaultLocation==null)
        {
            return;
        }

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
                try {

                    if (whichScreenOpen.equals("pickUpScreen")) {
                        pickupLatlong = latLng2;
                    } else if (whichScreenOpen.equals("dropOffScreen")) {
                        dropLatlong = latLng2;
                    } else if (whichScreenOpen.equals("")) {
                        if (anchorBehavior.getState() == BottomSheetBehavior.STATE_COLLAPSED || anchorBehavior.getState() == BottomSheetBehavior.STATE_HIDDEN) {
                            if (goBack) {
                                if (fromPickUp) {
                                    whichScreenOpen = "pickUpScreen";
                                    pickupLatlong = latLng2;
                                }
                            } else {
                                whichScreenOpen = "dropOffScreen";
                                dropLatlong = latLng2;
                            }
                        }
                    }

                    binding.confrimLocation.stopLoading();

                    List<Address> address = GeoHelper.getAddressesAtPoint(latLng2, 1, 0);
                    if (address != null) {
                        locality = "" + address.get(0).getFeatureName();
                        if (whichScreenOpen.equals("pickUpScreen")) {
                            Functions.logDMsg("pickUpScreen address : " + locality);
                            binding.etCurrentLocation.setText(locality);
                            binding.etCurrentLocation.setSelection( binding.etCurrentLocation.getText().length());
                            currentAddress = locality;
                        } else if (whichScreenOpen.equals("dropOffScreen")) {
                            binding.etdropOffLocation.setText(locality);
                        }
                    }

                }
                catch (Exception e)
                {
                    Log.d(Constants.TAG,"OnCameraIdle");
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
                        if (!goBack) {
                            mDefaultLocation = new LatLng(location.getLatitude(), location.getLongitude());
                        }

                        binding.mMapView.onResume();
                        binding.mMapView.getMapAsync(WheretoFragment.this);
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
        pickUpMarkerBitmap = Functions.getMarkerPickupPinView(context);
        dropOofMarkerBitmap = Functions.getMarkerDropPinView(context);

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
        if (textWatcher != null) {
            binding.etdropOffLocation.removeTextChangedListener(textWatcher);
        }
        if (textWatcherPickup != null) {
            binding.etCurrentLocation.removeTextChangedListener(textWatcherPickup);
        }
        if (handler != null) {
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


    @Override
    public void onCameraMove() {
        int state = anchorBehavior.getState();

        binding.confrimLocation.startLoading();

        if (textWatcher != null && (state == AnchorSheetBehavior.STATE_COLLAPSED || state == AnchorSheetBehavior.STATE_HIDDEN)) {
            binding.etdropOffLocation.removeTextChangedListener(textWatcher);
        }

        if (textWatcherPickup != null && (state == AnchorSheetBehavior.STATE_COLLAPSED || state == AnchorSheetBehavior.STATE_HIDDEN)) {
            binding.etCurrentLocation.removeTextChangedListener(textWatcherPickup);
        }

        if (!whichScreenOpen.equals("")) {
            anchorBehavior.setHideable(true);
            anchorBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
        } else {
            if (anchorBehavior.getState() == BottomSheetBehavior.STATE_COLLAPSED && whichScreenOpen.equals("")) {
                anchorBehavior.setHideable(true);
                anchorBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
                if (goBack) {
                    if (fromPickUp) {
                        whichScreenOpen = "pickUpScreen";
                    } else {
                        whichScreenOpen = "dropOffScreen";
                    }
                } else {
                    whichScreenOpen = "dropOffScreen";
                }

            }
        }
    }

    @Override
    public boolean onBackPressed() {
        int state = anchorBehavior.getState();

        Functions.logDMsg("state at back press : " + state);
        if (state == AnchorSheetBehavior.STATE_COLLAPSED || state == AnchorSheetBehavior.STATE_HIDDEN) {
            if (whichScreenOpen.equals("dropOffScreen") || whichScreenOpen.equals("")) {
                if (isBack) {
                    anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                    if (!goBack) {
                        binding.etdropOffLocation.setText("");
                        binding.etdropOffLocation.clearComposingText();
                    } else {
                        binding.etdropOffLocation.setText(locationModelBundle.getDropOffAddress());
                    }
                    dropLatlong = null;
                    isBack = false;
                } else {
                    if (state == AnchorSheetBehavior.STATE_COLLAPSED) {
                        anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);

                        isBack = false;
                    } else if (state == AnchorSheetBehavior.STATE_HIDDEN) {
                        if (dropLatlong == null || dropLatlong.equals(mDefaultLocation)) {
                            anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                            isBack = false;
                            return true;
                        }
                        mGoogleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(mDefaultLocation, Constants.maxZoomLevel));
                        isBack = true;
                    }

                }

            } else if (whichScreenOpen.equals("pickUpScreen")) {
                if (isBack) {
                    anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                    binding.etCurrentLocation.setText(currentAddress);
                    isBack = false;
                } else {
                    if (state == AnchorSheetBehavior.STATE_COLLAPSED) {
                        anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                        binding.etCurrentLocation.setText(currentAddress);
                        binding.etCurrentLocation.requestFocus();
                        binding.etCurrentLocation.selectAll();
                        binding.etCurrentLocation.setSelectAllOnFocus(true);
                        isBack = false;
                    } else if (state == AnchorSheetBehavior.STATE_HIDDEN) {
                        if (pickupLatlong.equals(currentLatLng)) {
                            anchorBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                            binding.etCurrentLocation.setText(currentAddress);
                            binding.etCurrentLocation.requestFocus();
                            binding.etCurrentLocation.selectAll();
                            binding.etCurrentLocation.setSelectAllOnFocus(true);
                            isBack = false;
                            return true;
                        }
                        mGoogleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(mDefaultLocation, Constants.maxZoomLevel));
                        isBack = true;
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    }


    private void checkListenerWatcher(boolean pickUp) {
        if (pickUp) {
            if (textWatcherPickup != null) {
                binding.etCurrentLocation.removeTextChangedListener(textWatcherPickup);
                binding.etCurrentLocation.addTextChangedListener(textWatcherPickup);
            } else {
                binding.etCurrentLocation.addTextChangedListener(textWatcherPickup);
            }
            if (textWatcher != null) {
                binding.etdropOffLocation.removeTextChangedListener(textWatcher);
            }

        } else {
            if (textWatcher != null) {
                binding.etdropOffLocation.removeTextChangedListener(textWatcher);
                binding.etdropOffLocation.addTextChangedListener(textWatcher);
            } else {
                binding.etdropOffLocation.addTextChangedListener(textWatcher);
            }

            if (textWatcherPickup != null) {
                binding.etCurrentLocation.removeTextChangedListener(textWatcherPickup);
            }
        }
    }
}