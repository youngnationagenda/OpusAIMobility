package com.terraai.aimobility.ride.bookride;

import static android.Manifest.permission.ACCESS_FINE_LOCATION;
import static android.content.Context.MODE_PRIVATE;
import static com.terraai.aimobility.codeclasses.Variables.PACKAGE_URL_SCHEME;

import android.Manifest;
import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.coordinatorlayout.widget.CoordinatorLayout;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.view.GravityCompat;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

// AWS-MIGRATED: import com.firebase.geofire.GeoFire;
// AWS-MIGRATED: import com.firebase.geofire.GeoLocation;
// AWS-MIGRATED: import com.firebase.geofire.GeoQuery;
// AWS-MIGRATED: import com.firebase.geofire.GeoQueryEventListener;
import com.github.florent37.singledateandtimepicker.SingleDateAndTimePicker;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
import com.google.android.libraries.places.api.Places;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.api.model.PlaceLikelihood;
import com.google.android.libraries.places.api.net.FindCurrentPlaceRequest;
import com.google.android.libraries.places.api.net.FindCurrentPlaceResponse;
import com.google.android.libraries.places.api.net.PlacesClient;
import com.google.android.material.appbar.AppBarLayout;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseError;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseReference;
// AWS-MIGRATED: import com.google.firebase.database.FirebaseDatabase;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.adapter.RideRentAdapter;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.PermissionUtils;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SingleClickListener;
import com.yna.opusaimobilityapp.databinding.DateSheduleDialogBinding;
import com.yna.opusaimobilityapp.databinding.FragmentRideOrRentBinding;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.ride.account.AccountFragment;
import com.terraai.aimobility.ride.history.HistoryFragment;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import com.google.firebase.database.ValueEventListener;
import com.google.firebase.database.ChildEventListener;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.Query;
import java.util.Map;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.FirebaseDatabase;
import com.firebase.geofire.GeoFire;
import com.firebase.geofire.GeoQuery;
import com.firebase.geofire.GeoLocation;
import com.firebase.geofire.GeoQueryEventListener;



public class RideOrRentFragment extends RootFragment implements OnMapReadyCallback, GoogleMap.OnCameraMoveListener, View.OnClickListener {

    public Date date;
    ArrayList<NearbyModelClass> nearbyList;
    LatLng latLng = null;
    String username, fname, lname, image, email, userImage;
    Bitmap carMarker;
    MapWorker mapWorker;
    GeoFire geoFire;
    // [AWS-MIGRATED] GeoFire → /getNearbyDrivers Lambda endpoint
    // Original: GeoQuery geoQuery;
    GeoQueryEventListener geoQueryEventListener;
    ArrayList<Marker> driverMarkersList = new ArrayList<>();
    ArrayList<String> driversIds = new ArrayList<>();
    String rideTypeDriver;
    Context context;
    float oldZoom = Constants.maxZoomLevel;
    String pickedDateSt;
    Date pickedDate;
    GoogleMap mGoogleMap;
    LatLng mDefaultLocation;
    FusedLocationProviderClient mFusedLocationProviderClient;
    PlacesClient placesClient;
    String schedule = "0";
    String scheduleDatetime = "";
    Bundle bundle;
    String rideType;
    FragmentRideOrRentBinding binding;
    PermissionUtils takePermissionUtils;


    public RideOrRentFragment() {
        // Required empty public constructor
    }


    @Override
    public void onDetach() {
        super.onDetach();
        if (geoQueryEventListener != null) {
            geoQuery.removeAllListeners();
        }
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentRideOrRentBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        context = getActivity();
        if (!Places.isInitialized()) {
            Places.initialize(getActivity(), getResources().getString(R.string.google_map_key));
        }
        bundle = getArguments();
        rideType = bundle.getString("rideType");
        placesClient = Places.createClient(getActivity());
        binding.mMapView.onCreate(savedInstanceState);
        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());

        fname = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.fname, "");
        email = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.email, "");
        lname = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.lname, "");
        image = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.image, "");
        username = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.userName, "");
        userImage = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.image, "");

        methodSetGoogleMapAppBar();
        methodInitClickListener();
        setUpScreenData();
        takePermissionUtils=new PermissionUtils(getActivity(),locationPermissionCallback);
        if (takePermissionUtils.isLocationPermissionGranted()) {
            getCurrentLocation();
        } else {
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

    private void setUpScreenData() {
        if (userImage != null && !userImage.equalsIgnoreCase("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + userImage);
            binding.navigationFrame.userProfileImage.setImageURI(uri);
        }

        binding.navigationFrame.usernameTxt.setText(fname + " " + lname);

    }

    private void findCurrentPlace() {
        List<Place.Field> placeFields = Arrays.asList(Place.Field.ID, Place.Field.NAME, Place.Field.LAT_LNG, Place.Field.ADDRESS);
        FindCurrentPlaceRequest request = FindCurrentPlaceRequest.newInstance(placeFields);

        if (ContextCompat.checkSelfPermission(getActivity(), ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            Task<FindCurrentPlaceResponse> placeResponse = placesClient.findCurrentPlace(request);
            placeResponse.addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    FindCurrentPlaceResponse response = task.getResult();
                    nearbyList = new ArrayList<>();
                    for (PlaceLikelihood placeLikelihood : response.getPlaceLikelihoods()) {
                        String formatedAddress = placeLikelihood.getPlace().getAddress();
                        String name = placeLikelihood.getPlace().getName();
                        String placeId = placeLikelihood.getPlace().getId();
                        NearbyModelClass model = new NearbyModelClass();
                        model.title = name;
                        model.address = formatedAddress;
                        model.lat = placeLikelihood.getPlace().getLatLng().latitude;
                        model.lng = placeLikelihood.getPlace().getLatLng().longitude;
                        model.latLng = placeLikelihood.getPlace().getLatLng();
                        model.placeId = placeId;
                        model.isLiked = "0";
                        nearbyList.add(model);

                        // [AWS-MIGRATED] PaperDB delete → no-op (SharedPreferences key auto-managed)
                        // [AWS-MIGRATED] PaperDB write → SharedPreferences
        android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext()).edit().putString("nearby_list".replace("/","_"), new com.google.gson.Gson().toJson(nearbyList)).apply();
                    }
                    methodSetPlacesAdapter();
                }else{
                        Exception exception = task.getException();
                        if (exception instanceof ApiException) {
                            ApiException apiException = (ApiException) exception;
                        }
                        Log.d(Constants.TAG, "Place not found: " + exception.toString());
                }
            });
        }
    }

    /*Method RideRent Adapter*/
    private void methodSetPlacesAdapter() {

        binding.placeRecyclerview.setHasFixedSize(true);
        binding.placeRecyclerview.setLayoutManager(new LinearLayoutManager(getActivity()));
        binding.progressBar.setVisibility(View.GONE);
        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
        binding.placeRecyclerview.setAdapter(new RideRentAdapter(getActivity(), nearbyList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                NearbyModelClass nearbyModelClass = (NearbyModelClass) model;
                ConfirmPickUpFragment confirmPickUpFragment = new ConfirmPickUpFragment();
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                Bundle bundle = new Bundle();
                bundle.putString("dropLatitude", "" + nearbyModelClass.lat);
                bundle.putString("dropLongitude", "" + nearbyModelClass.lng);
                bundle.putString("dropAddress", nearbyModelClass.title);
                bundle.putString("dropAddressfull", nearbyModelClass.address);
                bundle.putString("placeId", nearbyModelClass.placeId);
                bundle.putString("schedule", schedule);
                bundle.putString("schedule_datetime", scheduleDatetime);
                bundle.putString("rideType", rideType);
                confirmPickUpFragment.setArguments(bundle);
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.rideOrRent_Container, confirmPickUpFragment).addToBackStack(null).commit();
            }
        }));


    }


    /*Method InitClickListener*/
    private void methodInitClickListener() {

        binding.backBtn.setOnClickListener(this);
        binding.nowText.setOnClickListener(this);
        binding.laterRideText.setOnClickListener(new SingleClickListener() {
            @Override
            public void performClick(View v) {
                dateSchedulePicker();
            }
        });

        binding.whereToLayout.setOnClickListener(new SingleClickListener() {
            @Override
            public void performClick(View v) {

                WheretoFragment wheretoFragment = new WheretoFragment(false);
                Bundle bundle = new Bundle();
                bundle.putString("schedule", schedule);
                bundle.putString("schedule_datetime", scheduleDatetime);
                bundle.putString("rideType", rideType);
                wheretoFragment.setArguments(bundle);
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.fragment_main_container, wheretoFragment, "wheretoFragment").addToBackStack("wheretoFragment").commit();


            }
        });
        binding.navigationIcon.setOnClickListener(this);
        binding.navigationFrame.yourRidesLayout.setOnClickListener(this);
        binding.navigationFrame.profileLayout.setOnClickListener(this);

        binding.navigationFrame.settingBtn.setOnClickListener(this);
        binding.navigationFrame.becomeCaptionBtn.setOnClickListener(this);
    }

    /*Method Set Google map AppBarLayout*/
    private void methodSetGoogleMapAppBar() {

        // Disable "Drag" for AppBarLayout (i.e. User can't scroll appBarLayout by directly touching appBarLayout - User can only scroll appBarLayout by only using scrollContent)
        if (binding.appBarLayout.getLayoutParams() != null) {
            CoordinatorLayout.LayoutParams layoutParams = (CoordinatorLayout.LayoutParams) binding.appBarLayout.getLayoutParams();
            AppBarLayout.Behavior appBarLayoutBehaviour = new AppBarLayout.Behavior();
            appBarLayoutBehaviour.setDragCallback(new AppBarLayout.Behavior.DragCallback() {
                @Override
                public boolean canDrag(@NonNull AppBarLayout appBarLayout) {
                    return false;
                }
            });

            layoutParams.setBehavior(appBarLayoutBehaviour);

        }
    }

    @Override
    public void onResume() {
        super.onResume();
        binding.mMapView.onResume();
    }

    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, this.mGoogleMap);
        if (mGoogleMap != null) {
            mGoogleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    getActivity(), R.raw.gray_map));

            if (ActivityCompat.checkSelfPermission(getActivity()
                    , ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            }
            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setZoomControlsEnabled(false);
            mGoogleMap.getUiSettings().setMapToolbarEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            mGoogleMap.getUiSettings().setRotateGesturesEnabled(false);
            mGoogleMap.setMaxZoomPreference(Constants.maxZoomLevel);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            zoomToCurrentLocation();
            mGoogleMap.setOnMarkerClickListener(marker -> {
                googleMap.setOnMarkerClickListener(null);
                return false;
            });

            this.mGoogleMap.setOnCameraMoveListener(this);

        }
    }

    /*Method zoom to current location*/
    private void zoomToCurrentLocation() {
        if ((mDefaultLocation.latitude != 0.0 && mDefaultLocation.longitude != 0.0)) {
            mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(mDefaultLocation, 16));
        }
        if (geoFire == null)
            nearbyDrivers();
    }

    /*Method Get Current location*/
    private void getCurrentLocation() {
        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());
        if (ActivityCompat.checkSelfPermission(getActivity(), ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED &&
                ActivityCompat.checkSelfPermission(getActivity(), Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

            return;

        } else {
            mFusedLocationProviderClient.getLastLocation().addOnSuccessListener(getActivity(), new OnSuccessListener<Location>() {
                @Override
                public void onSuccess(Location location) {
                    if (location != null) {

                        mDefaultLocation = new LatLng(location.getLatitude(), location.getLongitude());
                        Functions.logDMsg("mDefaultLocation getCurrentLocation : " + mDefaultLocation);

                        latLng = new LatLng(location.getLatitude(), location.getLongitude());
                        double lat = (latLng.latitude);
                        double lon = (latLng.longitude);
                        MyPreferences.mPrefs = getActivity().getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);
                        android.content.SharedPreferences.Editor editor = MyPreferences.mPrefs.edit();
                        editor.putString(MyPreferences.myCurrentLat, Double.toString(lat));
                        editor.putString(MyPreferences.myCurrentLng, Double.toString(lon));
                        editor.commit();
                        setupMapIfNeeded();
                        findCurrentPlace();
                    }
                }
            });
        }
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        MapsInitializer.initialize(getActivity());
        binding.mMapView.onResume();
        binding.mMapView.getMapAsync(RideOrRentFragment.this);
        carMarker = Functions.getDriverPickUpView(context);
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
    public void onClick(View view) {

        switch (view.getId()) {

            case R.id.backBtn:
                getActivity().getSupportFragmentManager().popBackStack();
                break;


                case R.id.setting_btn:
                    AccountFragment payWithFragment = new AccountFragment();
                    FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                    transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    transaction.add(R.id.fragment_main_container, payWithFragment).addToBackStack(null).commit();
                break;

                case R.id.become_caption_btn:
                    final String appPackageName = "com.ubercab.eats"; // getPackageName() from Context or Activity object
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + appPackageName)));
                    } catch (android.content.ActivityNotFoundException anfe) {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + appPackageName)));
                    }
                break;


            case R.id.nowText:
                binding.laterRideText.setText(getActivity().getResources().getString(R.string.later));
                binding.nowText.setTextColor(ContextCompat.getColor(getActivity(), R.color.app_color));
                binding.nowText.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.green_border_bg));

                binding.laterRideText.setTextColor(ContextCompat.getColor(getActivity(), R.color.dark_gray));
                binding.laterRideText.setBackground(ContextCompat.getDrawable(getActivity(), R.color.transparent));

                schedule = "0";
                scheduleDatetime = "";
                break;

            case R.id.profileLayout:

                AccountFragment accountFragment = new AccountFragment();
                FragmentTransaction tr = getActivity().getSupportFragmentManager().beginTransaction();
                tr.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                tr.add(R.id.fragment_main_container, accountFragment).addToBackStack(null).commit();
                binding.drawerLayout.closeDrawers();

                break;

            case R.id.navigationIcon:

                if (binding.drawerLayout.isDrawerOpen(GravityCompat.START)) {
                    binding.drawerLayout.closeDrawer(GravityCompat.START);
                } else {
                    binding.drawerLayout.openDrawer(GravityCompat.START);
                }

                break;


            case R.id.yourRidesLayout:

                HistoryFragment yourRidesFragment = new HistoryFragment();
                FragmentTransaction tr1 = getActivity().getSupportFragmentManager().beginTransaction();
                tr1.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                tr1.add(R.id.fragment_main_container, yourRidesFragment).addToBackStack(null).commit();
                binding.drawerLayout.closeDrawers();

                break;

            default:
                break;

        }
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
                Functions.logDMsg("timeCalculated : "+timeCalculate);
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

                binding.laterRideText.setText(pickedDateSt);
                binding.laterRideText.setTextColor(ContextCompat.getColor(getActivity(), R.color.app_color));
                binding.laterRideText.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.green_border_bg));

                binding.nowText.setTextColor(ContextCompat.getColor(getActivity(), R.color.dark_gray));
                binding.nowText.setBackground(ContextCompat.getDrawable(getActivity(), R.color.transparent));

                schedule = "1";
                scheduleDatetime = formatted;
                dialog.dismiss();
            }
        });

        dialog.show();
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
                 /*   if (rideTypeDriver.equalsIgnoreCase("1")) {
                        marker = mapWorker.addMarker(key, new LatLng(location.latitude, location.longitude), carMarker);
                    } else if (rideTypeDriver.equalsIgnoreCase("2")) {
                        marker = mapWorker.addMarker(key, new LatLng(location.latitude, location.longitude), bikeMarker);
                    } else if (rideTypeDriver.equalsIgnoreCase("3")) {
                        marker = mapWorker.addMarker(key, new LatLng(location.latitude, location.longitude), vanMarker);
                    } else {
                        marker = mapWorker.addMarker(key, new LatLng(location.latitude, location.longitude), carMarker);
                    }*/
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

    @Override
    public void onCameraMove() {

        float zoom = mGoogleMap.getCameraPosition().zoom;

        for (int i = 0; i < driverMarkersList.size(); i++) {
            Marker updtedMarker = driverMarkersList.get(i);
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
    }

}
