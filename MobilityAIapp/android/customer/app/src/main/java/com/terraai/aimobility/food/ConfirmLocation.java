package com.terraai.aimobility.food;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.ConfirmLocationModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentConfirmLocationBinding;


public class ConfirmLocation extends RootFragment implements OnMapReadyCallback, View.OnClickListener, GoogleMap.OnCameraMoveListener {

    FragmentConfirmLocationBinding binding;
    Bitmap pickUpMarkerBitmap;
    Context context;
    String latitude, longitude;
    Bundle bundle;
    ConfirmLocationModel confirmLocationModel = new ConfirmLocationModel();
    CircleOptions options;
    private GoogleMap mGoogleMap;
    private GoogleMap.OnCameraIdleListener onCameraIdleListener;
    private LatLng mDefaultLocation;
    FragmentCallBack fragmentCallBack;

    public ConfirmLocation(FragmentCallBack fragmentCallBack) {
       this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        binding = FragmentConfirmLocationBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        latitude = MyPreferences.getSharedPreference(context).getString(MyPreferences.myCurrentFoodLat, "0.0");
        longitude = MyPreferences.getSharedPreference(context).getString(MyPreferences.myCurrentFoodLng, "0.0");

        bundle = getArguments();
        if (bundle != null) {
            confirmLocationModel = (ConfirmLocationModel) bundle.getSerializable("nearModel");
            binding.tvAddress.setText(confirmLocationModel.title);
            if (confirmLocationModel.additionalInfo != null && !confirmLocationModel.additionalInfo.equals("")) {
                binding.tvAddressAdditional.setText(confirmLocationModel.additionalInfo);
            } else {
                binding.tvAddressAdditional.setVisibility(View.GONE);
            }
        }

        if (latitude.equals("0.0") && longitude.equals("0.0")) {
            latitude = MyPreferences.getSharedPreference(context).getString(MyPreferences.myCurrentLat, "0.0");
            longitude = MyPreferences.getSharedPreference(context).getString(MyPreferences.myCurrentLng, "0.0");


        }


        mDefaultLocation = new LatLng(Double.parseDouble(latitude), Double.parseDouble(longitude));

        binding.confrimLocation.setOnClickListener(this);

        context = getActivity();

        binding.mapView.onCreate(savedInstanceState);
        binding.mapView.onResume();
        binding.mapView.getMapAsync(ConfirmLocation.this);

        setupMapIfNeeded();

        return view;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.mapView.onResume();
            binding.mapView.getMapAsync(this);
            configureCameraIdle();
        }
        pickUpMarkerBitmap = Functions.getMarkerPickupPinView(context);

    }

    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        if (mGoogleMap != null) {

            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(getActivity(), R.raw.gray_map));

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
           //googleMap.addCircle(createCircle(20, restutantLatLng));
        }
    }

    private CircleOptions createCircle(int lockKm, LatLng latLng) {
        options = new CircleOptions()
                .fillColor(Color.TRANSPARENT)
                .strokeWidth(5)
                .center(latLng)
                .strokeColor(ContextCompat.getColor(context,R.color.text_color_black))
                .radius(lockKm * 100);

        return options;
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
                mDefaultLocation = latLng2;
                binding.confrimLocation.stopLoading();

               /* float[] distance = new float[2];

                Location.distanceBetween(mDefaultLocation.latitude, mDefaultLocation.longitude, options.getCenter().latitude, options.getCenter().longitude, distance);

                if (distance[0] > options.getRadius()) {
                    binding.confrimLocation.setClickable(false);
                    binding.confrimLocation.setEnabled(false);
                    binding.confrimLocation.setBackground(ContextCompat.getDrawable(context, R.drawable.un_selected_btn_grey));
                } else {
                    binding.confrimLocation.setClickable(true);
                    binding.confrimLocation.setEnabled(true);
                    binding.confrimLocation.setBackground(ContextCompat.getDrawable(context, R.drawable.app_color_bg_btn));
                }*/
            }
        };
    }


    @Override
    public void onResume() {
        super.onResume();
        binding.mapView.onResume();
    }

    @Override
    public void onPause() {
        binding.mapView.onPause();
        super.onPause();
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        binding.mapView.onLowMemory();
    }

    @Override
    public void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        binding.mapView.onSaveInstanceState(outState);
    }


    @Override
    public void onCameraMove() {
        binding.confrimLocation.startLoading();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()){
            case R.id.confrim_location:
                ConfirmLocationModel confirmLocationModel = new ConfirmLocationModel();
                confirmLocationModel.lat=mDefaultLocation.latitude;
                confirmLocationModel.lng=mDefaultLocation.longitude;
                Bundle bundle = new Bundle();
                bundle.putSerializable("dataModel" , confirmLocationModel);
                fragmentCallBack.onItemClick(bundle);
                getActivity().onBackPressed();
                break;

            default:
                break;
        }
    }
}