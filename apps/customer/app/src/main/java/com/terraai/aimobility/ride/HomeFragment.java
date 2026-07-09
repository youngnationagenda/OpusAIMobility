package com.terraai.aimobility.ride;

import static android.Manifest.permission.ACCESS_FINE_LOCATION;
import static com.terraai.aimobility.codeclasses.Variables.PACKAGE_URL_SCHEME;
import static com.terraai.aimobility.codeclasses.Variables.foodImageUrl;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.tasks.OnSuccessListener;
import com.terraai.aimobility.Interface.APICallBack;
import com.terraai.aimobility.Interface.CallbackResponse;
import com.terraai.aimobility.R;
import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.GpsUtils;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.PermissionUtils;
import com.terraai.aimobility.databinding.FragmentHomeBinding;
import com.terraai.aimobility.model.ActiveRequestModel;
import com.terraai.aimobility.parcel.fragmentandactivities.DeliveryDetailsFragment;
import com.terraai.aimobility.ride.activeride.ActiveRideA;
import com.terraai.aimobility.ride.bookride.RideOrRentFragment;
import com.terraai.aimobility.ride.bookride.WheretoFragment;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;


public class HomeFragment extends Fragment implements View.OnClickListener {


    FragmentHomeBinding binding;

    String rideType;

    private LatLng mDefaultLocation;
    PermissionUtils takePermissionUtils;
    String latitude , longitude;
    private FusedLocationProviderClient mFusedLocationProviderClient;

    public HomeFragment() {
        // Required empty public constructor
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
                        enablePermission();
                    }

                }
            });


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        binding = FragmentHomeBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        binding.selectDropOfBtn.setOnClickListener(this);
        binding.findCarLayout.setOnClickListener(this);
        binding.bikeLinLayout.setOnClickListener(this);
        binding.foodLayout.setOnClickListener(this);
        binding.deliveryLayout.setOnClickListener(this);
        binding.foodOrderBtn.setOnClickListener(this);
        binding.deliveryBtn.setOnClickListener(this);

        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        binding.orderFoodImage.setImageURI(foodImageUrl);


        takePermissionUtils=new PermissionUtils(getActivity(),locationPermissionCallback);
        mFusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(getActivity());
        if (takePermissionUtils.isLocationPermissionGranted()) {
            getCurrentLocation();
        }
        else
        {
            takePermissionUtils.showLocationPermissionDailog(getActivity().getString(R.string.location_heading_denied_heading));
        }

        return view;

    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.selectDropOfBtn:
                if (takePermissionUtils.isLocationPermissionGranted()) {
                        WheretoFragment wheretoFragment = new WheretoFragment();
                        FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                        fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        fragmentTransaction.add(R.id.fragment_main_container, wheretoFragment, "wheretoFragment").addToBackStack("wheretoFragment").commit();
                    } else {
                        takePermissionUtils.showLocationPermissionDailog(getActivity().getResources().getString(R.string.we_need_acurate_ride_permission));
                    }

                break;


            case R.id.findCarLayout:
                if (takePermissionUtils.isLocationPermissionGranted()) {
                    rideType = "car";
                    callapiShowactiverequest();
                } else {
                    takePermissionUtils.showLocationPermissionDailog(getActivity().getResources().getString(R.string.we_need_acurate_ride_permission));
                }

                break;

            case R.id.foodLayout:
            case R.id.food_order_btn:
                if (takePermissionUtils.isLocationPermissionGranted()) {
                    Intent intent = new Intent(getActivity(), FoodActivity.class);
                    startActivity(intent);
                } else {
                    takePermissionUtils.showLocationPermissionDailog(getActivity().getResources().getString(R.string.we_need_acurate_ride_permission));
                }

                break;

            case R.id.bikeLinLayout:

                if (takePermissionUtils.isLocationPermissionGranted()) {
                    rideType = "bike";
                    callapiShowactiverequest();
                } else {
                    takePermissionUtils.showLocationPermissionDailog(getActivity().getResources().getString(R.string.we_need_acurate_ride_permission));
                }

                break;

            case R.id.delivery_btn:
            case R.id.deliveryLayout:
                Functions.hideSoftKeyboard(getActivity());
                if (takePermissionUtils.isLocationPermissionGranted()) {
                    DeliveryDetailsFragment deliveryDetailsFragment = new DeliveryDetailsFragment();
                    FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                    FragmentTransaction ft = fragmentManager.beginTransaction();
                    ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    ft.replace(R.id.fragment_main_container, deliveryDetailsFragment).addToBackStack(null).commit();
                } else {
                    takePermissionUtils.showLocationPermissionDailog(getActivity().getResources().getString(R.string.we_need_acurate_ride_permission));
                }

                break;

            default:
                break;

        }
    }

    private void callapiShowactiverequest() {
        JSONObject params = new JSONObject();
        try {
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));

        } catch (JSONException e) {
            e.printStackTrace();
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
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.orderParseData(respobj, new APICallBack() {
                                            @Override
                                            public void onParseData(Object model) {
                                                ActiveRequestModel activeRequestModel = (ActiveRequestModel) model;
                                                Intent startIntent = new Intent(getActivity(), ActiveRideA.class);
                                                Bundle bundle = new Bundle();
                                                bundle.putSerializable("dataModel",activeRequestModel);
                                                startIntent.putExtra("call", "splash");
                                                startIntent.putExtras(bundle);
                                                startActivity(startIntent);
                                                getActivity().overridePendingTransition(R.anim.in_from_right, R.anim.out_to_left);
                                                getActivity().finish();
                                            }
                                        });
                                    } else {
                                        Fragment rideRent = new RideOrRentFragment();
                                        Bundle bundle = new Bundle();
                                        bundle.putString("rideType",rideType);
                                        rideRent.setArguments(bundle);
                                        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();

                                        transaction.add(R.id.fragment_main_container, rideRent).addToBackStack(null).commit();
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


    /*Method Enable Permission*/
    private void enablePermission() {

        LocationManager locationManager = (LocationManager) getActivity().getSystemService(Context.LOCATION_SERVICE);
        boolean GpsStatus = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        if (!GpsStatus) {
            new GpsUtils(getActivity()).turnGPSOn(new GpsUtils.onGpsListener() {
                @Override
                public void gpsStatus(boolean isGPSEnable) {
                    if (isGPSEnable) {
                        Functions.logDMsg("mDefaultLocation isGPSEnable : " + isGPSEnable);
                        getCurrentLocation();
                    }
                }
            });
        }else{
            getCurrentLocation();
        }
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
                        LatLng latLng = new LatLng(location.getLatitude(), location.getLongitude());
                        double lat = (latLng.latitude);
                        double lon = (latLng.longitude);
                        android.content.SharedPreferences.Editor editor = MyPreferences.getSharedPreference(getActivity()).edit();
                        editor.putString(MyPreferences.myCurrentLat, Double.toString(lat));
                        editor.putString(MyPreferences.myCurrentLng, Double.toString(lon));

                        editor.commit();
                        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
                        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
                        editor.commit();
                    }
                }
            });
        }
    }

}