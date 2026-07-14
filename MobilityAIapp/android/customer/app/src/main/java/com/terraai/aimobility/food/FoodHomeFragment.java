package com.terraai.aimobility.food;

import android.util.Log;

import static android.content.Context.MODE_PRIVATE;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.PagerSnapHelper;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.gms.maps.model.LatLng;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SpacesItemDecoration;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationBottom;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationHome;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.foodadapter.AllRestaurantsAdapter;
import com.terraai.aimobility.foodadapter.BannerAdapter;
import com.terraai.aimobility.foodadapter.CategoriesHomeAdapter;
import com.terraai.aimobility.foodadapter.FavrouiteHomeAdapter;
import com.terraai.aimobility.foodadapter.FilterAdapter;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.Interface.FirstPageFragmentListener;
import com.terraai.aimobility.model.BannerModel;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.CategoriesModel;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentFoodHomeBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;



public class FoodHomeFragment extends RootFragment implements View.OnClickListener, SwipeRefreshLayout.OnRefreshListener, FirstPageFragmentListener {

    static FirstPageFragmentListener firstPageListener;
    FragmentFoodHomeBinding binding;
    ArrayList<CategoriesModel> categoriesModelArrayList = new ArrayList<>();
    CategoriesHomeAdapter categoriesHomeAdapter;
    BannerAdapter bannerAdapter;
    ArrayList<BannerModel> bannerModelArrayList = new ArrayList<>();
    ArrayList<ResturantModel> favouriteList = new ArrayList<>();
    FavrouiteHomeAdapter favoriteAdapter;
    ArrayList<ResturantModel> nearbyList = new ArrayList<>();
    ArrayList<ResturantModel> filterList = new ArrayList<>();
    AllRestaurantsAdapter nearbyAdapter;
    FilterAdapter filterAdapter;
    NearbyModelClass nearbyModel;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    NearbyModelClass nearbyModelClass;
    private String longitude , currentAddress , latitude , userId ;
    private Fragment currentFragment;
    private LatLng mDefaultLocation;
    Context context;
    String sort = "clear" , maxPrice = "1000", minPrice = "0";
    public FoodHomeFragment() {
        // Required empty constructor
    }

    public FoodHomeFragment(FirstPageFragmentListener listener) {
        firstPageListener = listener;
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        // Inflate the layout for this fragment

        binding = FragmentFoodHomeBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        nearbyModel = new NearbyModelClass();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");

        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        mDefaultLocation = new LatLng(Double.parseDouble(latitude), Double.parseDouble(longitude));

        initializeListeners();

        methodSetAllRestaurantsAdapter();
        methodSetFavouriteAdapter();
        methodSetCategoriesAdapter();
        methodSetBannerAdapter();
        methodSetFilterAdapter();

        if(nearbyModel != null) {
            nearbyModel.id = "";
            nearbyModel.address = Functions.getAddressString(getActivity(), mDefaultLocation.latitude, mDefaultLocation.longitude);
            nearbyModel.lat = Double.parseDouble(latitude);
            nearbyModel.lat = Double.parseDouble(longitude);
            nearbyModel.placeId = "";
            nearbyModel.isLiked = "";
            nearbyModel.title = currentAddress;
        }

        getCategoriesData();
        getBannerData();
        getNearByData();
        getFavouriteData();

        Variables.deliveryType = "Deliver";

        return view;
    }

    private void methodSetFilterAdapter() {

        filterAdapter = new FilterAdapter(getActivity(), filterList, (position, model, view) -> {
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
                    ResturantModel item = filterList.get(position);
                    String action = item.getIsLiked();
                    if (action != null) {
                        if (action.equals("1")) {
                            action = "0";
                        } else {
                            action = "1";
                        }
                    }

                    filterList.remove(position);
                    item.setIsLiked(action);
                    filterList.add(position, item);

                    changeList(favouriteList, action, item.getId());
                    changeList(nearbyList, action, item.getId());

                    nearbyAdapter.notifyDataSetChanged();
                    favoriteAdapter.notifyDataSetChanged();

                    DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, item.getId());

                    filterAdapter.notifyDataSetChanged();

                    break;

                default:
                    break;
            }
        });

        binding.filterRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.filterRecyclerView.setAdapter(filterAdapter);
        filterAdapter.notifyDataSetChanged();

        if (carList.size() > 0) {
            int space = (int) context.getResources().getDimension(R.dimen._58sdp);
            binding.filterRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }

    }

    @SuppressLint("StringFormatMatches")
    public void setUpScreenData() {
        try {
            // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
            // Original: nearbyModelClass = /* AWS-MIGRATED: was Paper.book().read("nearModel" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""));
            // [AWS] Read result discarded
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (nearbyModelClass != null) {
            mDefaultLocation = nearbyModelClass.latLng;
            Functions.logDMsg("exceptuion  at  place mDefaultLocation 123  : "+mDefaultLocation);
            currentAddress = Functions.getAddressSubString(getActivity(), mDefaultLocation);
            binding.tvCurrentAddress.setText(nearbyModelClass.title);
        } else {
            Functions.logDMsg("exceptuion  at  place mDefaultLocation 123456  : "+mDefaultLocation);
            currentAddress = Functions.getAddressSubString(getActivity(), mDefaultLocation);
            binding.tvCurrentAddress.setText(currentAddress);
        }


        try {
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
        }catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

    }


    private void initializeListeners() {
        binding.filterBtn.setOnClickListener(this);
        binding.locationBtn.setOnClickListener(this);
        binding.etSearch.setOnClickListener(this);
        binding.deliveryTypeBtn.setOnClickListener(this);
        binding.swipeRefreshLayout.setOnRefreshListener(this);
        binding.noInternetLayout.tryAgainBtn.setOnClickListener(this);
    }


    private void getCategoriesData() {
        
        categoriesModelArrayList.clear();
        JSONObject params = new JSONObject();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showFoodCategory(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturantCategoriesParseData(respobj, arrayList -> {
                                            categoriesModelArrayList.addAll(arrayList);
                                            categoriesHomeAdapter.notifyDataSetChanged();
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

    private void methodSetCategoriesAdapter() {

        categoriesHomeAdapter = new CategoriesHomeAdapter(getActivity(), categoriesModelArrayList, (position, model, view) -> {
            CategoriesModel categoriesModel = (CategoriesModel) model;
            switch (view.getId()) {

                case R.id.mainLayout:

                    methodOpenCategories(categoriesModel);

                    break;

                default:
                    break;

            }
        });

        binding.categoriesRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.HORIZONTAL, false));
        binding.categoriesRecyclerView.setAdapter(categoriesHomeAdapter);
        categoriesHomeAdapter.notifyDataSetChanged();


    }


    private void getBannerData() {


        JSONObject jsonObject = new JSONObject();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                jsonObject.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showAppSliderImages(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject jsonResponse = new JSONObject(resp);
                                    int code = Integer.parseInt(jsonResponse.optString("code"));
                                    if (code == 200) {
                                        JSONArray msgArray = jsonResponse.getJSONArray("msg");
                                        bannerModelArrayList.clear();
                                        for (int i = 0; i < msgArray.length(); i++) {
                                            BannerModel bannerModel = new BannerModel();
                                            JSONObject dataobj = msgArray.getJSONObject(i);
                                            JSONObject imageObj = dataobj.getJSONObject("AppSlider");
                                            bannerModel.setBannerImage(imageObj.optString("image"));
                                            bannerModel.setId(imageObj.optString("id"));
                                            bannerModel.setUrl(imageObj.optString("url"));
                                            bannerModelArrayList.add(bannerModel);
                                        }
                                        binding.pageIndicator.attachToRecyclerView(binding.bannerRecyclerView);
                                        bannerAdapter.notifyDataSetChanged();
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

    private void methodSetBannerAdapter() {

        bannerAdapter = new BannerAdapter(getActivity(), bannerModelArrayList, (position, model, view) -> {
            BannerModel bannerModel = (BannerModel) model;

            Functions.hideSoftKeyboard(getActivity());
            WebViewFragment webviewF = new WebViewFragment();
            FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
            transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
            Bundle bundle = new Bundle();
            bundle.putString("url", bannerModel.getUrl());
            bundle.putString("title", bannerModel.getUrl());
            webviewF.setArguments(bundle);
            transaction.addToBackStack(null);
            transaction.replace(R.id.main_food_container, webviewF).commit();


        });

        binding.bannerRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.HORIZONTAL, false));
        binding.bannerRecyclerView.setAdapter(bannerAdapter);
        bannerAdapter.notifyDataSetChanged();
        binding.pageIndicator.attachToRecyclerView(binding.bannerRecyclerView);
        PagerSnapHelper snapHelper = new PagerSnapHelper();
        snapHelper.attachToRecyclerView(binding.bannerRecyclerView);


        int space = (int) context.getResources().getDimension(R.dimen._6sdp);
        int space1 = (int) context.getResources().getDimension(R.dimen._6sdp);
        binding.bannerRecyclerView.addItemDecoration(new SpacesItemDecoration(space,space1));

    }

    private void getNearByData() {
        JSONObject params = new JSONObject();
        try {
            params.put("lat", latitude);
            params.put("long", longitude);
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        binding.swipeRefreshLayout.setRefreshing(true);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRestaurants(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.swipeRefreshLayout.setRefreshing(false);
                        binding.noInternetLayout.noInternetView.setVisibility(View.GONE);
                        if (isSuccess)
                        {
                            if (resp != null) {

                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturentParseData(respobj, arrayList -> {
                                            nearbyList.clear();
                                            nearbyList.addAll(arrayList);
                                            nearbyAdapter.notifyDataSetChanged();
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
                            binding.swipeRefreshLayout.setRefreshing(false);
                            if(resp.contains("No Internet Connection")){
                                binding.noInternetLayout.noInternetView.setVisibility(View.VISIBLE);
                            }
                        }
                    }
                });

    }


    private void methodSetAllRestaurantsAdapter() {

        nearbyAdapter = new AllRestaurantsAdapter(getActivity(), nearbyList, (position, model, view) -> {
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

        binding.allRestaurantsRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.allRestaurantsRecyclerView.setAdapter(nearbyAdapter);
        nearbyAdapter.notifyDataSetChanged();

        if (carList.size() > 0) {
            int space = (int) context.getResources().getDimension(R.dimen._58sdp);
            binding.allRestaurantsRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }
    }


    private void getFavouriteData() {

        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showFavouriteRestaurants(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        binding.favouritelayout.setVisibility(View.VISIBLE);
                                        DataParse.favResponseParseData(respobj, arrayList -> {
                                            favouriteList.clear();
                                            favouriteList.addAll(arrayList);
                                            favoriteAdapter.notifyDataSetChanged();
                                        });

                                    } else {
                                        binding.favouritelayout.setVisibility(View.GONE);
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


    private void methodSetFavouriteAdapter() {
        favoriteAdapter = new FavrouiteHomeAdapter(getActivity(), favouriteList, (position, model, view) -> {

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
                    likedNearBy(position, resturantModel, favouriteList, false);
                    break;

                default:
                    break;
            }
        });

        binding.nearByRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.HORIZONTAL, false));
        binding.nearByRecyclerView.setAdapter(favoriteAdapter);
        favoriteAdapter.notifyDataSetChanged();

        int space = (int) context.getResources().getDimension(R.dimen._6sdp);
        binding.nearByRecyclerView.addItemDecoration(new SpacesItemDecorationHome(space));
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.filterBtn:

                FiltersFragment filtersFragment = new FiltersFragment(bundle -> {
                    if (bundle != null) {
                        sort = bundle.getString("sort");
                        minPrice = bundle.getString("min_price");
                        maxPrice = bundle.getString("max_price");
                        if (sort.equalsIgnoreCase("clear")) {
                            binding.swipeRefreshLayout.setVisibility(View.VISIBLE);
                            binding.filterRecyclerView.setVisibility(View.GONE);
                            binding.tvFilterCount.setText("");
                            binding.filterCount.setVisibility(View.GONE);
                        } else {
                            callApiForFilters(sort);
                        }

                    }
                });
                filtersFragment.show(getChildFragmentManager(), "");

                break;

            case R.id.delivery_type_btn:

                firstPageListener.onSwitchToNextFragment();

                break;

            case R.id.locationBtn:
                methodOpenDeliveryAddress();
                break;


            case R.id.etSearch:
                Functions.hideSoftKeyboard(getActivity());
                SearchFragmentResturant restaurantDetailsFragment = new SearchFragmentResturant(bundle -> {
                    if (bundle != null) {
                        getNearByData();
                        getFavouriteData();
                    }
                });
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


                case R.id.try_again_btn:

                    if(!sort.equals("clear")){
                        callApiForFilters(sort);
                    }else{
                        getCategoriesData();
                        getBannerData();
                        getNearByData();
                        getFavouriteData();
                    }
                break;

            default:
                break;

        }
    }

    private void callApiForFilters(String sort) {
        binding.swipeRefreshLayout.setVisibility(View.GONE);
        binding.filterRecyclerView.setVisibility(View.VISIBLE);
        binding.tvFilterCount.setText("1");
        binding.filterCount.setVisibility(View.VISIBLE);
        JSONObject params = new JSONObject();
        try {
            params.put("sort", sort);
            params.put("user_id", userId);
            params.put("min_price", minPrice);
            params.put("max_price", maxPrice);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        binding.progressBar.setVisibility(View.VISIBLE);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).filterRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.progressBar.setVisibility(View.GONE);
                        filterList.clear();

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturentParseData(respobj, arrayList -> {
                                            filterList.addAll(arrayList);
                                            filterAdapter.notifyDataSetChanged();
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
                            binding.swipeRefreshLayout.setRefreshing(false);
                            if(resp.contains("No Internet Connection")){
                                binding.noInternetLayout.noInternetView.setVisibility(View.VISIBLE);
                            }
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

        arrayList.remove(position);
        item.setIsLiked(action);
        arrayList.add(position, item);

        if (status) {
            changeList(favouriteList, action, item.getId());
        } else {
            changeList(nearbyList, action, item.getId());
        }
        nearbyAdapter.notifyDataSetChanged();
        favoriteAdapter.notifyDataSetChanged();

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
        DeliveryAddressFragment deliveryAddressFragment = new DeliveryAddressFragment(bundle -> {
            if (bundle != null) {
                nearbyModel = (NearbyModelClass) bundle.getSerializable("model");
                MyPreferences.mPrefs = getActivity().getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);
                android.content.SharedPreferences.Editor editor = MyPreferences.mPrefs.edit();
                editor.putString(MyPreferences.myCurrentFoodLat, Double.toString(nearbyModel.lat));
                editor.putString(MyPreferences.myCurrentFoodLng, Double.toString(nearbyModel.lng));
                editor.commit();
                if (nearbyModel.title.equals("")) {
                    binding.tvCurrentAddress.setText(nearbyModel.title);
                } else {
                    binding.tvCurrentAddress.setText(Functions.getAddressSubString(getContext(), nearbyModel.latLng));
                }
                // [AWS-MIGRATED] PaperDB write → SharedPreferences
                MyPreferences.getSharedPreference(getActivity()).edit()
                        .putString(MyPreferences.USER_ID + "_nearModel_lat", Double.toString(nearbyModel.lat))
                        .putString(MyPreferences.USER_ID + "_nearModel_lng", Double.toString(nearbyModel.lng))
                        .putString(MyPreferences.USER_ID + "_nearModel_title", nearbyModel.title)
                        .apply();
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

    private void methodOpenCategories(CategoriesModel categoriesModel) {
        Functions.hideSoftKeyboard(getActivity());
        ResturantAgainstCatFragment resturantAgainstCatFragment = new ResturantAgainstCatFragment();
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putSerializable("categoriesModel", categoriesModel);
        resturantAgainstCatFragment.setArguments(bundle);
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.main_food_container, resturantAgainstCatFragment).addToBackStack(null).commit();
    }


    @Override
    public void onRefresh() {
        getCategoriesData();
        getBannerData();
        getNearByData();
        getFavouriteData();
    }

    @Override
    public void onResume() {
        super.onResume();
        setUpScreenData();
    }

    @Override
    public void onSwitchToNextFragment() {
        firstPageListener.onSwitchToNextFragment();
    }
    
    public void getChangedList(ResturantModel recipeDataModel) {
        Functions.updatList(nearbyList, recipeDataModel);
        getFavouriteData();
        nearbyAdapter.notifyDataSetChanged();
    }
}
