package com.terraai.aimobility.food;

import static android.content.Context.MODE_PRIVATE;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.PagerSnapHelper;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationBottom;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationHome;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.foodadapter.AllRestaurantsAdapter;
import com.terraai.aimobility.foodadapter.MapRestaurantAdapter;
import com.terraai.aimobility.Interface.APICallBackList;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FirstPageFragmentListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.model.ResturantModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentHome2Binding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;



public class FoodHomeTwo extends RootFragment implements View.OnClickListener, OnMapReadyCallback,
        GoogleMap.OnCameraMoveListener, FirstPageFragmentListener, GoogleMap.OnMarkerClickListener {

    static FirstPageFragmentListener firstPageListener;
    FragmentHome2Binding binding;
    BottomSheetBehavior bottomSheetBehavior;
    ArrayList<ResturantModel> nearbyList = new ArrayList<>();
    AllRestaurantsAdapter nearbyAdapter;
    String currentAddress;
    NearbyModelClass nearbyModel;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    MapWorker mapWorker;
    Context context;
    MapRestaurantAdapter mapRestaurantAdapter;
    FoodActivity foodActivity;
    NearbyModelClass nearbyModelClass;
    private String longitude;
    private String latitude;
    private String userId;
    private Fragment currentFragment;
    private LatLng mDefaultLocation;
    private GoogleMap mGoogleMap;
    private HashMap<String, Marker> hashMapMarker;
    private ArrayList<String> markersListIds = new ArrayList<>();

    public FoodHomeTwo() {
        // Required empty public constructor
    }

    public FoodHomeTwo(FirstPageFragmentListener listener) {
        firstPageListener = listener;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        // Inflate the layout for this fragment
        binding = FragmentHome2Binding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        foodActivity = (FoodActivity) this.getActivity();
        nearbyModel = new NearbyModelClass();
        //  getActivity().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN);
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentFoodLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentFoodLng, "0.0");

        if (latitude.equals("0.0") && longitude.equals("0.0")) {
            latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
            longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
        }

        mDefaultLocation = new LatLng(Double.parseDouble(latitude), Double.parseDouble(longitude));


        binding.mMapView.onCreate(savedInstanceState);

        setupMapIfNeeded();

        setUpScreenData();

        initializeListeners();

        methodSetAllRestaurantsAdapter();

        methodSavedMapAdapter();


        bottomSheetBehavior = BottomSheetBehavior.from(binding.linearBottomSheet);
        bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HALF_EXPANDED);
        bottomSheetBehavior.setHideable(false);

        nearbyModel.id = "";
        nearbyModel.address = Functions.getAddressString(getActivity(), mDefaultLocation.latitude, mDefaultLocation.longitude);
        nearbyModel.lat = Double.parseDouble(latitude);
        nearbyModel.lat = Double.parseDouble(longitude);
        nearbyModel.placeId = "";
        nearbyModel.isLiked = "";
        nearbyModel.title = currentAddress;

        getNearByData();

        Variables.deliveryType = "PickUp";

        return view;
    }

    public void setUpScreenData() {
        try {
            // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
            // Original: nearbyModelClass = /* AWS-MIGRATED: was /* [AWS] was Paper.book().read("nearModel") — implement via SharedPreferences */ null */ null;
            // [AWS] Read result discarded
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (nearbyModelClass != null) {
            mDefaultLocation = nearbyModelClass.latLng;
            currentAddress = Functions.getAddressSubString(getActivity(), mDefaultLocation);
            binding.tvCurrentAddress.setText(nearbyModelClass.title);
        } else {
            currentAddress = Functions.getAddressSubString(getActivity(), mDefaultLocation);
            binding.tvCurrentAddress.setText(currentAddress);
        }

        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        // [AWS] Read result discarded

        if (carList.size() > 0) {
            binding.cartView.cartLayout.setVisibility(View.VISIBLE);
            binding.cartView.tvCart.setText(context.getString(R.string.view_bucket, String.valueOf(carList.size())));
            binding.cartView.tvCart.setOnClickListener(this);
        } else {
            binding.cartView.cartLayout.setVisibility(View.GONE);
        }

    }

    private void initializeListeners() {
        binding.filterBtn.setOnClickListener(this);
        binding.locationBtn.setOnClickListener(this);
        binding.etSearch.setOnClickListener(this);
        binding.deliveryTypeBtn.setOnClickListener(this);
        binding.listButton.setOnClickListener(this);

    }

    private void getNearByData() {
        JSONObject params = new JSONObject();
        try {
            params.put("lat", latitude);
            params.put("long", longitude);
            params.put("user_id", userId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.allRestaurantsRecyclerView.setVisibility(View.GONE);
        binding.progressBar.setVisibility(View.VISIBLE);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRestaurants(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.allRestaurantsRecyclerView.setVisibility(View.VISIBLE);
                        binding.progressBar.setVisibility(View.GONE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturentParseData(respobj, new APICallBackList() {
                                            @Override
                                            public void onParseData(ArrayList arrayList) {
                                                nearbyList.addAll(arrayList);
                                                nearbyAdapter.notifyDataSetChanged();
                                                mapRestaurantAdapter.notifyDataSetChanged();
                                                addMarker();
                                            }
                                        });
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


    public void addMarker() {
        hashMapMarker = mapWorker.addSavedPlacesMarker(nearbyList, "");
    }

    private void methodSetAllRestaurantsAdapter() {

        nearbyAdapter = new AllRestaurantsAdapter(getActivity(), nearbyList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                ResturantModel resturantModel = (ResturantModel) model;
                switch (view.getId()) {

                    case R.id.ratingLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        ReviewsFragment reviewsFragment = new ReviewsFragment();
                        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                        FragmentTransaction ft = fragmentManager.beginTransaction();
                        Bundle bundle = new Bundle();
                        bundle.putSerializable("dataModel", resturantModel);
                        reviewsFragment.setArguments(bundle);
                        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        ft.replace(R.id.main_food_container, reviewsFragment).addToBackStack(null).commit();
                        break;

                    case R.id.mainLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromOther");
                        FragmentManager manager = getActivity().getSupportFragmentManager();
                        FragmentTransaction transaction = manager.beginTransaction();
                        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        transaction.replace(R.id.main_food_container, currentFragment).addToBackStack(null).commit();
                        break;

                    case R.id.favLayout:

                        ResturantModel item = nearbyList.get(position);
                        likedNearBy(position, item, nearbyList, true);
                        break;

                    default:
                        break;
                }
            }
        });

        binding.allRestaurantsRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.allRestaurantsRecyclerView.setAdapter(nearbyAdapter);
        nearbyAdapter.notifyDataSetChanged();

        if (carList.size() > 0) {
            int space = (int) binding.getRoot().getContext().getResources().getDimension(R.dimen._58sdp);
            binding.allRestaurantsRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.filterBtn:

                FiltersFragment filtersFragment = new FiltersFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            String sort = bundle.getString("sort");
                            String minPrice = bundle.getString("min_price");
                            String maxPrice = bundle.getString("max_price");
                            nearbyList.clear();
                            if (binding.mapRecycler.getVisibility() == View.VISIBLE) {
                                binding.mapRecycler.setVisibility(View.GONE);
                                binding.listButton.setVisibility(View.GONE);
                                bottomSheetBehavior.setHideable(false);
                                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HALF_EXPANDED);
                            }

                            if (sort.equalsIgnoreCase("clear")) {
                                binding.tvFilterCount.setText("");
                                binding.filterCount.setVisibility(View.GONE);
                                getNearByData();
                            } else {
                                callApiForFilters(sort ,minPrice , maxPrice );
                            }

                        }
                    }
                });
                filtersFragment.show(getChildFragmentManager(), "");

                break;

            case R.id.list_button:

                binding.mapRecycler.setVisibility(View.GONE);
                binding.listButton.setVisibility(View.GONE);
                bottomSheetBehavior.setHideable(false);
                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HALF_EXPANDED);

                break;

            case R.id.delivery_type_btn:

                firstPageListener.onSwitchToNextFragment();

                break;

            case R.id.locationBtn:
                methodOpenDeliveryAddress();
                break;


            case R.id.etSearch:
                Functions.hideSoftKeyboard(getActivity());
                SearchFragmentResturant restaurantDetailsFragment = new SearchFragmentResturant();
                FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                ft.replace(R.id.main_food_container, restaurantDetailsFragment).addToBackStack(null).commit();

                break;


            case R.id.tv_cart:
                Bundle bundle = new Bundle();
                bundle.putSerializable("carList", carList);
                ViewBucketSheetFragment viewBucketSheetFragment = new ViewBucketSheetFragment(R.id.main_food_container);
                viewBucketSheetFragment.setArguments(bundle);
                viewBucketSheetFragment.show(getActivity().getSupportFragmentManager(), "viewBucketSheetFragment");
                break;

            default:
                break;

        }
    }

    private void callApiForFilters(String sort, String minPrice, String maxPrice) {
        binding.tvFilterCount.setText("1");
        binding.filterCount.setVisibility(View.VISIBLE);
        nearbyList.clear();
        JSONObject params = new JSONObject();
        try {
            params.put("sort", sort);
            params.put("user_id", userId);
            params.put("min_price", minPrice);
            params.put("max_price", maxPrice);
        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.allRestaurantsRecyclerView.setVisibility(View.GONE);
        binding.progressBar.setVisibility(View.VISIBLE);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).filterRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.progressBar.setVisibility(View.GONE);
                        binding.allRestaurantsRecyclerView.setVisibility(View.VISIBLE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturentParseData(respobj, new APICallBackList() {
                                            @Override
                                            public void onParseData(ArrayList arrayList) {
                                                nearbyList.addAll(arrayList);
                                                nearbyAdapter.notifyDataSetChanged();
                                            }
                                        });
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


    private void likedNearBy(int position, ResturantModel item, ArrayList<ResturantModel> arrayList, boolean status) {

        String action = item.getIsLiked();
        if (action != null) {
            if (action.equals("1")) {
                action = "0";
            } else {
                action = "1";
            }
        }

        changeList(nearbyList, action, item.getId());

        arrayList.remove(position);
        item.setIsLiked(action);
        arrayList.add(position, item);
        nearbyAdapter.notifyDataSetChanged();
        mapRestaurantAdapter.notifyItemChanged(position);

        DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, item.getId());
    }

    private void changeList(ArrayList<ResturantModel> arrayList, String action, String id) {
        for (int i = 0; i < arrayList.size(); i++) {
            if (id.equals(arrayList.get(i).getId())) {
                ResturantModel resturantModel = arrayList.get(i);
                arrayList.remove(i);
                resturantModel.setIsLiked(action);
                arrayList.add(i, resturantModel);
                break;
            }
        }
    }

    private void methodOpenDeliveryAddress() {
        Functions.hideSoftKeyboard(getActivity());
        DeliveryAddressFragment deliveryAddressFragment = new DeliveryAddressFragment(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    nearbyModel = (NearbyModelClass) bundle.getSerializable("model");
                    MyPreferences.mPrefs = getActivity().getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);
                    android.content.SharedPreferences.Editor editor = MyPreferences.mPrefs.edit();
                    editor.putString(MyPreferences.myCurrentFoodLat, Double.toString(nearbyModel.lat));
                    editor.putString(MyPreferences.myCurrentFoodLng, Double.toString(nearbyModel.lng));
                    editor.commit();
                    Functions.logDMsg("nearbyModel.title.equals : " + nearbyModel.title.equals(""));
                    if (nearbyModel.title.equals("")) {
                        binding.tvCurrentAddress.setText(nearbyModel.title);
                    } else {
                        binding.tvCurrentAddress.setText(Functions.getAddressSubString(getContext(), nearbyModel.latLng));
                    }
                    // [AWS-MIGRATED] PaperDB write → SharedPreferences
                    // Original: Paper.book().write("nearModel"+ MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), nearbyModel);
                    android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext())
                        // .edit().putString("nearModel"+ MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID.replace("/","_"), new com.google.gson.Gson().toJson("nearModel"+ MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID)).apply(); // TODO: replace key+value correctly
                }
            }
        });
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putSerializable("nearModel", nearbyModel);
        deliveryAddressFragment.setArguments(bundle);
        ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
        ft.replace(R.id.main_food_container, deliveryAddressFragment).addToBackStack(null).commit();
    }


    @Override
    public void onResume() {
        super.onResume();
        setUpScreenData();
        if (binding.mapRecycler.getVisibility() == View.VISIBLE) {
            binding.mapRecycler.setVisibility(View.VISIBLE);
            binding.listButton.setVisibility(View.VISIBLE);
            bottomSheetBehavior.setHideable(true);
            bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
        }
    }

    /*Get Current Location methods*/
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mGoogleMap = googleMap;
        binding.mMapView.onResume();
        mapWorker = new MapWorker(context, this.mGoogleMap);
        if (mGoogleMap != null) {

            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(
                    getActivity(), R.raw.gray_map));

            if (ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            } else {
                mGoogleMap.setOnMarkerClickListener(this);
                zoomToCurrentLocation();
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


    private void methodSavedMapAdapter() {
        binding.mapRecycler.setHasFixedSize(true);
        new PagerSnapHelper().attachToRecyclerView(binding.mapRecycler);
        LinearLayoutManager linearLayout = new LinearLayoutManager(getActivity(), LinearLayoutManager.HORIZONTAL, false);
        binding.mapRecycler.setLayoutManager(linearLayout);

        mapRestaurantAdapter = new MapRestaurantAdapter(getContext(), nearbyList, (position, model, view) -> {
            ResturantModel resturantModel = (ResturantModel) model;
            switch (view.getId()) {

                case R.id.ratingLayout:
                    Functions.hideSoftKeyboard(getActivity());
                    ReviewsFragment reviewsFragment = new ReviewsFragment();
                    FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                    FragmentTransaction ft = fragmentManager.beginTransaction();
                    Bundle bundle = new Bundle();
                    bundle.putSerializable("dataModel", resturantModel);
                    reviewsFragment.setArguments(bundle);
                    ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    ft.replace(R.id.main_food_container, reviewsFragment).addToBackStack(null).commit();
                    break;

                case R.id.mainLayout:
                    Functions.hideSoftKeyboard(getActivity());
                    currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromOther");
                    FragmentManager manager = getActivity().getSupportFragmentManager();
                    FragmentTransaction transaction = manager.beginTransaction();
                    transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    transaction.replace(R.id.main_food_container, currentFragment).addToBackStack(null).commit();
                    break;

                case R.id.favLayout:

                    ResturantModel item = nearbyList.get(position);
                    likedNearBy(position, item, nearbyList, true);
                    break;


                default:
                    break;
            }
        });


        binding.mapRecycler.setAdapter(mapRestaurantAdapter);

        int space = (int) getContext().getResources().getDimension(R.dimen._6sdp);
        binding.mapRecycler.addItemDecoration(new SpacesItemDecorationHome(space));

        binding.mapRecycler.addOnScrollListener(new RecyclerView.OnScrollListener() {
            public void onScrollStateChanged(RecyclerView recyclerView, int newState) {
                super.onScrollStateChanged(recyclerView, newState);
            }

            public void onScrolled(RecyclerView recyclerView, int dx, int dy) {
                super.onScrolled(recyclerView, dx, dy);

                int lastScrollPosition = linearLayout.findLastCompletelyVisibleItemPosition();

                if (lastScrollPosition != -1) {
                    if (hashMapMarker != null) {
                        ResturantModel item = nearbyList.get(lastScrollPosition);
                        Marker marker = hashMapMarker.get(item.getId());
                        if (mapWorker != null) {
                            mapWorker.animateCameraTo(mGoogleMap, marker.getPosition().latitude, marker.getPosition().longitude, Constants.maxZoomLevel);
                            hashMapMarker = mapWorker.addSavedPlacesMarker(nearbyList, item.getId());
                        }
                    }
                }
            }
        });

    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.mMapView.onResume();
            binding.mMapView.getMapAsync(FoodHomeTwo.this);
        }
    }


    @Override
    public void onSwitchToNextFragment() {
        firstPageListener.onSwitchToNextFragment();
    }


    @Override
    public void onCameraMove() {

    }

    @Override
    public boolean onMarkerClick(@NonNull Marker marker) {
        //hashMapMarker.clear();

        scrollToPosition(marker.getTitle());
        binding.mapRecycler.setVisibility(View.VISIBLE);
        binding.listButton.setVisibility(View.VISIBLE);
        bottomSheetBehavior.setHideable(true);
        bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
        mapWorker.animateCameraTo(mGoogleMap, marker.getPosition().latitude, marker.getPosition().longitude, Constants.maxZoomLevel);
        return true;
    }


    private void scrollToPosition(String title) {
        if (!nearbyList.isEmpty()) {
            for (int i = 0; i < nearbyList.size(); i++) {
                if (title.equals(nearbyList.get(i).getId())) {
                    binding.mapRecycler.scrollToPosition(i);
                    hashMapMarker = mapWorker.addSavedPlacesMarker(nearbyList, nearbyList.get(i).getId());
                    break;
                }
            }
        }
    }

    public void getChangedList(ResturantModel recipeDataModel) {
        Functions.updatList(nearbyList, recipeDataModel);
        nearbyAdapter.notifyDataSetChanged();
    }


}