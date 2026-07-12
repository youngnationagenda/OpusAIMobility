package com.terraai.aimobility.food;

import android.util.Log;

import android.annotation.SuppressLint;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationBottom;
import com.terraai.aimobility.foodadapter.AllRestaurantsAdapter;
import com.terraai.aimobility.Interface.APICallBackList;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.CategoriesModel;
import com.terraai.aimobility.model.RestaurantRatingModel;
import com.terraai.aimobility.model.ResturantModel;
import com.terraai.aimobility.model.TimeModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentResturantAgainstBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;


public class ResturantAgainstCatFragment extends RootFragment implements View.OnClickListener, SwipeRefreshLayout.OnRefreshListener {

    FragmentResturantAgainstBinding binding;
    ArrayList<ResturantModel> allRestaurantsModelArrayList = new ArrayList<>();
    AllRestaurantsAdapter allRestaurantsAdapter;
    Bundle bundle;
    CategoriesModel categoriesModel;
    String userId;
    FoodActivity foodActivity;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    private Fragment currentFragment;
    String searchQuery;
    Handler handler;
    Runnable runable;
    Context context;
    public ResturantAgainstCatFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentResturantAgainstBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        bundle = getArguments();
        foodActivity = (FoodActivity) this.getActivity();
        if (bundle != null) {
            categoriesModel = (CategoriesModel) bundle.getSerializable("categoriesModel");
        }
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        checkCart();
        initLayouts();
        initializeListeners();
        methodSetAllRestaurantsAdapter();
        getAllRestaurantsData();
        addTextWatcher();
        return view;

    }

    private void addTextWatcher() {
        binding.etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
                searchQuery = charSequence.toString();
                timerCallApi();
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });
    }

    public void timerCallApi() {

        if (handler != null && runable != null) {
            handler.removeCallbacks(runable);
        }

        if (handler == null)
            handler = new Handler();

        if (runable == null) {
            runable = () -> getRestaurantsSearch();
        }

        handler.postDelayed(runable, 1000);
    }

    private void getRestaurantsSearch() {

        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
            params.put("keyword", searchQuery);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
        binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).searchRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.mainLayout.setVisibility(View.VISIBLE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturentParseData(respobj, new APICallBackList() {
                                            @Override
                                            public void onParseData(ArrayList arrayList) {
                                                binding.categoryName.setVisibility(View.VISIBLE);
                                                Functions.logDMsg("arrayList.size() : "+arrayList.size());
                                                binding.categoryName.setText(arrayList.size() + getContext().getString(R.string.result_of) + " " + searchQuery);
                                                allRestaurantsModelArrayList.clear();
                                                allRestaurantsModelArrayList.addAll(arrayList);
                                                allRestaurantsAdapter.notifyDataSetChanged();
                                            }
                                        });
                                    } else {
                                        binding.noDataLayout.noDataView.setVisibility(View.VISIBLE);
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

    @SuppressLint("StringFormatMatches")
    public void checkCart() {
        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        // [AWS] Read result discarded
        if (carList.size() > 0) {
            binding.cartFrameLayout.tvCart.setText(context.getString(R.string.view_bucket, String.valueOf(carList.size())));
            binding.cartFrameLayout.tvCart.setOnClickListener(this);
        } else {
            binding.cartFrameLayout.cartLayout.setVisibility(View.GONE);
        }

    }


    private void initializeListeners() {
        binding.swipeRefreshLayout.setOnRefreshListener(this);
        binding.backBtn.setOnClickListener(this);
    }

    private void initLayouts() {
        binding.etSearch.setHint(categoriesModel.getCategoryName());
    }

    private void getAllRestaurantsData() {

        JSONObject params = new JSONObject();
        try {
            params.put("food_category_id", categoriesModel.getId());
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (!binding.swipeRefreshLayout.isRefreshing()) {
            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRestaurantsAgainstCategory(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.mainLayout.setVisibility(View.VISIBLE);
                        binding.swipeRefreshLayout.setRefreshing(false);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        ArrayList<ResturantModel> tempList = new ArrayList<>();
                                        try {
                                            JSONArray msgarray = respobj.getJSONArray("msg");
                                            binding.categoryName.setText(msgarray.length() + getContext().getString(R.string.result_of) + " " + categoriesModel.getCategoryName());
                                            for (int i = 0; i < msgarray.length(); i++) {
                                                JSONObject mainObj = msgarray.getJSONObject(i);
                                                ResturantModel resturantModel = new ResturantModel();

                                                JSONObject restaurantObj = mainObj.optJSONObject("Restaurant");

                                                resturantModel.setResturantImage(restaurantObj.optString("image"));
                                                resturantModel.setResturantName(restaurantObj.optString("name"));
                                                resturantModel.setDeliveryAmount(restaurantObj.optString(""));
                                                resturantModel.setTvTime(restaurantObj.optString("preparation_time"));
                                                resturantModel.setId(restaurantObj.optString("id"));
                                                resturantModel.setAbout(restaurantObj.optString("about"));
                                                resturantModel.setCoverImage(restaurantObj.optString("cover_image"));
                                                resturantModel.setDeliveryFreeRange(restaurantObj.optString("delivery_free_range"));
                                                resturantModel.setMinOrderPrice(restaurantObj.optString("min_order_price"));
                                                resturantModel.setPhone(restaurantObj.optString("phone"));
                                                resturantModel.setPreparation_time(restaurantObj.optString("preparation_time"));
                                                resturantModel.setResturantLat(restaurantObj.optString("lat","0.0"));
                                                resturantModel.setResturantLong(restaurantObj.optString("long","0.0"));
                                                resturantModel.setSpeciality(restaurantObj.optString("speciality"));
                                                resturantModel.setSlogan(restaurantObj.optString("slogan"));
                                                resturantModel.setIsLiked(restaurantObj.optString("favourite"));
                                                resturantModel.setOpen(restaurantObj.optString("open"));
                                                resturantModel.setBlock(restaurantObj.optString("block"));

                                                resturantModel.setCity(restaurantObj.optString("city"));
                                                resturantModel.setCountry(restaurantObj.optString("country"));
                                                resturantModel.setLocation_string(restaurantObj.optString("location_string"));
                                                resturantModel.setState(restaurantObj.optString("state"));

                                                resturantModel.setDeliveryMinTime(restaurantObj.optString("delivery_min_time"));
                                                resturantModel.setDeliveryMaxTime(restaurantObj.optString("delivery_max_time"));
                                                resturantModel.setDeliveryFee(restaurantObj.optString("delivery_fee"));

                                                JSONObject totalRatingsObj = restaurantObj.optJSONObject("TotalRatings");
                                                resturantModel.setTotalRatings(String.format("%.03s", totalRatingsObj.optString("avg")));
                                                resturantModel.setTotalRatingCount(totalRatingsObj.optString("totalRatings"));

                                                ArrayList<TimeModel> timeModelArrayList = new ArrayList<>();
                                                JSONArray timingArray = restaurantObj.optJSONArray("RestaurantTiming");
                                                for (int x = 0; x < timingArray.length(); x++) {
                                                    JSONObject timingObj = timingArray.getJSONObject(x);
                                                    TimeModel timeModel = new TimeModel();
                                                    timeModel.setId(timingObj.optString("id"));
                                                    timeModel.setDay(timingObj.optString("day"));
                                                    timeModel.setOpening_time(timingObj.optString("opening_time"));
                                                    timeModel.setClosing_time(timingObj.optString("closing_time"));
                                                    timeModelArrayList.add(timeModel);
                                                }

                                                resturantModel.setTimeModelArrayList(timeModelArrayList);

                                                ArrayList<RestaurantRatingModel> restaurantRatingModelArrayList = new ArrayList<>();
                                                JSONArray ratingArray = restaurantObj.optJSONArray("RestaurantRating");
                                                for (int x = 0; x < ratingArray.length(); x++) {
                                                    JSONObject ratingObj = ratingArray.getJSONObject(x);
                                                    JSONObject userObj = ratingObj.getJSONObject("User");
                                                    RestaurantRatingModel restaurantRatingModel = new RestaurantRatingModel();
                                                    restaurantRatingModel.setId(ratingObj.optString("id"));
                                                    restaurantRatingModel.setStar(ratingObj.optString("star"));
                                                    restaurantRatingModel.setComment(ratingObj.optString("comment"));
                                                    restaurantRatingModel.setCreated(ratingObj.optString("created"));
                                                    restaurantRatingModel.setName(userObj.optString("first_name") + " " + userObj.optString("last_name"));
                                                    restaurantRatingModel.setImage(userObj.optString("image"));
                                                    restaurantRatingModelArrayList.add(restaurantRatingModel);
                                                }
                                                resturantModel.setRestaurantRatingModelArrayList(restaurantRatingModelArrayList);
                                                tempList.add(resturantModel);
                                            }
                                        } catch (Exception e) {
                                            Functions.logDMsg("Exception : " + e.toString());
                                        }
                                        allRestaurantsModelArrayList.clear();
                                        allRestaurantsModelArrayList.addAll(tempList);
                                        allRestaurantsAdapter.notifyDataSetChanged();

                                    } else {
                                        allRestaurantsModelArrayList.clear();
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception : " + e.toString());
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }


    private void methodSetAllRestaurantsAdapter() {

        allRestaurantsAdapter = new AllRestaurantsAdapter(getActivity(), allRestaurantsModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                ResturantModel resturantModel = (ResturantModel) model;
                switch (view.getId()) {

                    case R.id.mainLayout:

                        Functions.hideSoftKeyboard(getActivity());
                        currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromOther");
                        FragmentManager manager = getActivity().getSupportFragmentManager();
                        FragmentTransaction transaction = manager.beginTransaction();
                        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        transaction.replace(R.id.categories_container, currentFragment).addToBackStack(null).commit();

                        break;

                    case R.id.favLayout:

                        ResturantModel item = allRestaurantsModelArrayList.get(position);
                        likedAllRestaurants(position, item);

                        break;


                    default:
                        break;
                }
            }
        });

        binding.allRestaurantsRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.allRestaurantsRecyclerView.setAdapter(allRestaurantsAdapter);
        allRestaurantsAdapter.notifyDataSetChanged();

        if (carList.size() > 0) {
            int space = (int) binding.getRoot().getContext().getResources().getDimension(R.dimen._58sdp);
            binding.allRestaurantsRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }
    }


    private void likedAllRestaurants(int position, ResturantModel item) {

        String action = item.getIsLiked();
        if (action != null) {
            if (action.equals("1")) {
                action = "0";
            } else {
                action = "1";
            }
        }

        allRestaurantsModelArrayList.remove(position);
        item.setIsLiked(action);
        allRestaurantsModelArrayList.add(position, item);
        allRestaurantsAdapter.notifyItemChanged(position);

        DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, item.getId(), item, foodActivity);

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

                break;

            case R.id.tv_cart:
                Bundle bundle = new Bundle();
                bundle.putSerializable("carList", carList);
                ViewBucketSheetFragment viewBucketSheetFragment = new ViewBucketSheetFragment(R.id.categories_container);
                viewBucketSheetFragment.setArguments(bundle);
                viewBucketSheetFragment.show(getActivity().getSupportFragmentManager(), "viewBucketSheetFragment");
                break;


            default:
                break;
        }

    }

    @Override
    public void onRefresh() {
        binding.swipeRefreshLayout.setRefreshing(true);
        getAllRestaurantsData();
    }


}