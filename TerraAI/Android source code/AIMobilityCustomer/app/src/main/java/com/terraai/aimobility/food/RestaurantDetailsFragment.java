package com.terraai.aimobility.food;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Point;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.Projection;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.material.appbar.AppBarLayout;
import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentRestaurantDetailsBinding;
import com.terraai.aimobility.foodadapter.TimeAdapter;
import com.terraai.aimobility.model.ResturantModel;
import com.terraai.aimobility.model.TimeModel;

import java.util.ArrayList;
import java.util.Calendar;


public class RestaurantDetailsFragment extends RootFragment implements View.OnClickListener,
        OnMapReadyCallback {


    FragmentRestaurantDetailsBinding binding;
    private final double earthradius = 6371000;
    ResturantModel resturantModel;
    Bundle bundle;
    String currenySymbol , userId;
    TimeAdapter timeAdapter;
    ArrayList<TimeModel> timeModelArrayList = new ArrayList<>();
    double pickUpLat, pickUpLong;
    Context context;

    boolean clicked = true;
    private boolean full = false;
    private GoogleMap mGoogleMap;
    private String latitude, longitude;
    private double restlatitude, restlongitude;
    private LatLng mDefaultLocation;
    private LatLng dropLatlong;

    private AnimatedVectorDrawable emptyHeart;
    private AnimatedVectorDrawable fillHeart;
    FragmentCallBack fragmentCallBack;

    public RestaurantDetailsFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    public RestaurantDetailsFragment() {

    }

    boolean isClicked = false;
    FoodActivity foodActivity;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {

        binding = FragmentRestaurantDetailsBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        // Inflate the layout for this fragment
        foodActivity = (FoodActivity) this.getActivity();
        bundle = getArguments();
        context = getActivity();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");

        currenySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        if (bundle != null) {
            resturantModel = (ResturantModel) bundle.getSerializable("dataModel");
        }

        restlatitude = Double.parseDouble(resturantModel.getResturantLat());
        restlongitude = Double.parseDouble(resturantModel.getResturantLong());
        dropLatlong = (new LatLng(restlatitude, restlongitude));
        pickUpLat = Double.parseDouble(latitude);
        pickUpLong = Double.parseDouble(longitude);
        mDefaultLocation = new LatLng(pickUpLat, pickUpLong);

        binding.mapView.onCreate(savedInstanceState);
        setupMapIfNeeded();

        initLayouts();
        initializeListeners();
        setUpScreenData();

        binding.appBar.addOnOffsetChangedListener(new AppBarLayout.OnOffsetChangedListener() {
            @Override
            public void onOffsetChanged(AppBarLayout appBarLayout, int verticalOffset) {
                if (Math.abs(verticalOffset) == appBarLayout.getTotalScrollRange()) {
                    view.findViewById(R.id.tv_resturant_name_toolbar).setVisibility(View.VISIBLE);

                    binding.ivBack.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.transparent));
                    binding.favIv.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.transparent));

                } else if (verticalOffset == 0) {

                    view.findViewById(R.id.tv_resturant_name_toolbar).setVisibility(View.GONE);
                }
            }
        });

        return view;
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.mapView.onResume();
            binding.mapView.getMapAsync(this);
        }
    }

    private void methodSetMenuAdapter() {

        timeAdapter = new TimeAdapter(getActivity(), timeModelArrayList);
        binding.timerecyclerview.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.timerecyclerview.setAdapter(timeAdapter);
        timeAdapter.notifyDataSetChanged();

    }

    private void setUpScreenData() {

        Calendar calendar = Calendar.getInstance();

        int day = calendar.get(Calendar.DAY_OF_WEEK);

        timeModelArrayList = resturantModel.getTimeModelArrayList();
        if(resturantModel.getOpen().equals("1")) {
            binding.tvtime.setText(binding.getRoot().getContext().getString(R.string.open_until)+" " + DateOperations.changeDateFormat("HH:mm:ss", "hh:mm a", timeModelArrayList.get(day - 1).getClosing_time()));
        }else{
            binding.tvtime.setText(binding.getRoot().getContext().getString(R.string.open_at)+" " + DateOperations.changeDateFormat("HH:mm:ss", "hh:mm a", timeModelArrayList.get(day - 1).getOpening_time()));
        }

        methodSetMenuAdapter();

        binding.tvResturantName.setText(resturantModel.getResturantName());
        binding.tvResturantNameToolbar.setText(resturantModel.getResturantName());

        binding.tvDeliveryTime.setText(resturantModel.getDeliveryMinTime() + "-" + resturantModel.getDeliveryMinTime() + getActivity().getResources().getString(R.string.min));
        binding. ratingTxt.setText(resturantModel.getTotalRatings());
        binding.ratingCount.setText("(" + Functions.getSuffix(resturantModel.getTotalRatingCount()) + ")");
        binding. minOrderTxt.setText(getActivity().getResources().getString(R.string.min_order) + " " + currenySymbol + resturantModel.getMinOrderPrice());
        binding.tvAddress.setText(resturantModel.getLocation_string());

        String resturantImage = resturantModel.getResturantImage();
        if (resturantImage != null && !resturantImage.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + resturantImage);
            binding. restaurantImage.setImageURI(uri);
        }


        String favourite = resturantModel.getIsLiked();

        if (favourite.equals("") || favourite.equals("0")) {
            full = true;
            animate(binding.favIv);
        } else {
            full = false;
            animate(binding.favIv);
        }
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.favBtn.setOnClickListener(this);
        binding.upArrowImage.setOnClickListener(this);
        binding.timeLayout.setOnClickListener(this);

    }

    // This method help to animate our view.
    public void animate(ImageView view) {
        AnimatedVectorDrawable drawable
                = full
                ? emptyHeart
                : fillHeart;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            view.setImageDrawable(drawable);
        }
        drawable.start();
        full = !full;
    }

    private void initLayouts() {

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            emptyHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(getActivity(), R.drawable.avd_heart_empty_black);
            fillHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(getActivity(), R.drawable.avd_heart_fill_black);
        }

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.back_btn:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;
            case R.id.fav_btn:
                if (full) {
                    full = true;
                    animate(binding.favIv);
                } else {
                    full = false;
                    animate(binding.favIv);
                }
                likedAllRestaurants();

                break;

            case R.id.timeLayout:
                if (clicked) {
                    binding. upArrowImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_arrow_up_gray));
                    binding.timerecyclerview.setVisibility(View.VISIBLE);
                    clicked = false;
                } else {
                    binding.upArrowImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_arrow_down));
                    binding.timerecyclerview.setVisibility(View.GONE);
                    clicked = true;
                }
                break;

            default:
                break;
        }
    }


    private void likedAllRestaurants() {
        isClicked = true;
        String action = resturantModel.getIsLiked();
        if (action != null) {
            if (action.equals("1")) {
                action = "0";
            } else {
                action = "1";
            }
        }

        resturantModel.setIsLiked(action);

        DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, resturantModel.getId() , resturantModel , foodActivity);

    }

    @Override
    public void onDetach() {
        super.onDetach();
        if(fragmentCallBack != null && isClicked){
            Bundle args = new Bundle();
            args.putSerializable("dataModel" , resturantModel);
            fragmentCallBack.onItemClick(args);
        }
    }

    private final void sendScreenPosition() {
        if (getActivity() != null && mGoogleMap != null) {

            Projection projection = mGoogleMap.getProjection();
            Projection projection1 = mGoogleMap.getProjection();

            Point screenPosition = projection1.toScreenLocation(dropLatlong);


            binding.infoWindowDropOff.setX(screenPosition.x - Functions.convertDpToPx(getActivity(), 70));
            binding.infoWindowDropOff.setY(screenPosition.y - (binding.infoWindowDropOff.getHeight() - Functions.convertDpToPx(getActivity(), 142)));


            double km = Functions.calculateDistance(mDefaultLocation, dropLatlong) * 0.001;

            binding.infoDistance.setText(Functions.roundoffDecimal(km) + " km");

            binding.archView.setPoints(projection.toScreenLocation(mDefaultLocation), projection1.toScreenLocation(dropLatlong));

            new Handler().postDelayed(new Runnable() {
                @Override
                public void run() {
                    binding.infoWindowDropOff.setVisibility(View.VISIBLE);
                    binding.mapOverlay.setVisibility(View.GONE);
                }
            },800);
        }
    }


    private void showlatlngboundzoom(LatLng... marker) {
        LatLngBounds.Builder latlngBuilder = new LatLngBounds.Builder();
        for (LatLng mrk : marker) {
            latlngBuilder.include(mrk);
        }

        LatLngBounds bounds = latlngBuilder.build();

        LatLng center = bounds.getCenter();
        LatLng northEast = move(center, 709, 709);
        LatLng southWest = move(center, -709, -709);
        latlngBuilder.include(southWest);
        latlngBuilder.include(northEast);
        if (areBoundsTooSmall(bounds, 300)) {
            mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(bounds.getCenter(), Constants.maxZoomLevel));
        } else {
            int padding = (int) (getScreenWidth(context) * 0.25);
             mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngBounds(bounds, padding));
        }
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

    @Override
    public void onMapReady(@NonNull GoogleMap googleMap) {
        mGoogleMap = googleMap;
        if (mGoogleMap != null) {

            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    getActivity(), R.raw.gray_map));


            if (ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            }
            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setAllGesturesEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            mGoogleMap.getUiSettings().setCompassEnabled(false);
            mGoogleMap.setMyLocationEnabled(false);

            mGoogleMap.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
                @Override
                public void onMapLoaded() {
                    showlatlngboundzoom(mDefaultLocation, dropLatlong);
                }
            });

            mGoogleMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
                @Override
                public void onCameraIdle() {
                    sendScreenPosition();
                }
            });

        }
    }

}