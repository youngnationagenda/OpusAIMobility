package com.yna.opusaimobilityapp.food;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;

import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.codeclasses.SpacesItemDecorationBottom;
import com.yna.opusaimobilityapp.foodadapter.YourOrdersAdapter;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.CalculationModel;
import com.yna.opusaimobilityapp.model.FoodListModel;
import com.yna.opusaimobilityapp.model.NearbyModelClass;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.model.YourOrdersModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentOrdersBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;

import io.paperdb.Paper;

public class OrdersFragment extends RootFragment implements View.OnClickListener, SwipeRefreshLayout.OnRefreshListener {

    FragmentOrdersBinding binding;
    ArrayList<YourOrdersModel> arrayList = new ArrayList<>();
    YourOrdersAdapter yourOrdersAdapter;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    LinearLayoutManager linearLayoutManager;
    boolean ispostFinsh;
    Context context;
    String currencySymbol;
    private String userId;
    private int startingPoint = 0;

    public OrdersFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentOrdersBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        currencySymbol = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        binding.swipeRefreshLayout.setOnRefreshListener(this);
        checkCart();
        initControl();
        methodSetYourOrderAdapter();
        getYourOrderData();

        return view;
    }

    private void initControl() {
        binding.noInternetLayout.tryAgainBtn.setOnClickListener(this);
        linearLayoutManager = new LinearLayoutManager(getActivity());
        binding.yourOrdersRecyclerView.setLayoutManager(linearLayoutManager);
        binding.yourOrdersRecyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            boolean userScrolled;
            int scrollOutitems;

            @Override
            public void onScrollStateChanged(RecyclerView recyclerView, int newState) {
                super.onScrollStateChanged(recyclerView, newState);
                if (newState == AbsListView.OnScrollListener.SCROLL_STATE_TOUCH_SCROLL) {
                    userScrolled = true;
                }
            }

            @Override
            public void onScrolled(RecyclerView recyclerView, int dx, int dy) {
                super.onScrolled(recyclerView, dx, dy);
                if (dy > 0) { //check for scroll down
                    scrollOutitems = linearLayoutManager.findLastVisibleItemPosition();
                    if (userScrolled && (scrollOutitems == arrayList.size() - 1)) {
                        userScrolled = false;
                        if (binding.loadMoreProgress.getVisibility() != View.VISIBLE && !ispostFinsh) {
                            binding.loadMoreProgress.setVisibility(View.VISIBLE);
                            startingPoint = startingPoint + 1;
                            getYourOrderData();
                        }
                    }
                }
            }
        });
    }

    public void checkCart() {
        try {
            carList = Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace();
        }
        if (carList.size() > 0) {
            binding.cartView.cartLayout.setVisibility(View.VISIBLE);
            binding.cartView.tvCart.setText(context.getString(R.string.view_bucket, String.valueOf(carList.size())));
            binding.cartView.tvCart.setOnClickListener(this);
        } else {
            binding.cartView.cartLayout.setVisibility(View.GONE);
        }

    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {
            case R.id.tv_cart:
                Bundle bundle = new Bundle();
                bundle.putSerializable("carList", carList);
                ViewBucketSheetFragment viewBucketSheetFragment = new ViewBucketSheetFragment(R.id.main_food_container);
                viewBucketSheetFragment.setArguments(bundle);
                viewBucketSheetFragment.show(getActivity().getSupportFragmentManager(), "viewBucketSheetFragment");
                break;

            case R.id.try_again_btn:
                getYourOrderData();
                break;

            default:
                break;

        }
    }


    private void getYourOrderData() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
            params.put("starting_point", startingPoint);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (arrayList.isEmpty() && binding.swipeRefreshLayout.isRefreshing()) {
            binding.shimmerView.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerView.shimmerViewContainer.startShimmer();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showFoodDeliveryOrders(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        binding.shimmerView.shimmerViewContainer.stopShimmer();
                        binding.shimmerView.shimmerViewContainer.setVisibility(View.GONE);
                        binding.swipeRefreshLayout.setRefreshing(false);
                        binding.noInternetLayout.noInternetView.setVisibility(View.GONE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msg = respobj.optJSONArray("msg");
                                        ArrayList<YourOrdersModel> tempList = new ArrayList<>();
                                        for (int i = 0; i < msg.length(); i++) {

                                            JSONObject data = msg.getJSONObject(i);
                                            JSONObject foodOrder = data.optJSONObject("FoodOrder");

                                            JSONObject restaurantObj = data.optJSONObject("Restaurant");
                                            JSONObject couponUsed = data.optJSONObject("CouponUsed");
                                            JSONObject paymentCard = data.optJSONObject("PaymentCard");
                                            JSONObject restaurantRating = data.optJSONObject("RestaurantRating");


                                            JSONArray jsonArray = data.optJSONArray("FoodOrderMenuItem");

                                            YourOrdersModel model = new YourOrdersModel();
                                            model.setOrderId(foodOrder.optString("id"));
                                            model.setHotelAccepted(foodOrder.optString("hotel_accepted"));
                                            model.setAcceptedReason(foodOrder.optString("accepted_reason"));
                                            model.setHotelAccepted(foodOrder.optString("hotel_accepted"));
                                            model.setAcceptedReason(foodOrder.optString("accepted_reason"));
                                            model.setQuantity(foodOrder.optString("quantity"));
                                            model.setPrice(foodOrder.optString("price"));
                                            model.setLastFour(paymentCard.optString("last_4"));
                                            model.setCardType(paymentCard.optString("brand"));

                                            model.setRatingId(restaurantRating.optString("id"));
                                            model.setStatus(foodOrder.optString("status"));
                                            String deliveryFee = foodOrder.optString("delivery_fee");
                                            model.setDeliveryFee(deliveryFee);
                                            model.setPaymentCardId(foodOrder.optString("payment_card_id"));
                                            model.setDelivery(foodOrder.optString("delivery"));
                                            model.setRiderTip(foodOrder.optString("rider_tip"));
                                            String tax = foodOrder.optString("tax");
                                            model.setTax(tax);
                                            String subtotal = foodOrder.optString("sub_total");
                                            model.setSubTotal(subtotal);
                                            model.setInstructions(restaurantRating.optString("id"));

                                            model.setRejectedReason(foodOrder.optString("rejected_reason"));
                                            model.setRestaurantDeliveryFee(foodOrder.optString("restaurant_delivery_fee"));
                                            model.setDeliveryFeePerKm(foodOrder.optString("delivery_fee_per_km"));

                                            model.setTracking(foodOrder.optString("tracking"));

                                            model.setDeliveryDateTime(foodOrder.optString("delivery_date_time"));
                                            model.setRiderInstruction(foodOrder.optString("rider_instruction"));
                                            model.setCreated(foodOrder.optString("created"));

                                            double total = Double.parseDouble(subtotal) + Double.parseDouble(tax);
                                            total = total + Double.parseDouble(deliveryFee);
                                            double discountDouble = Functions.roundoffDecimal((total * Double.parseDouble(foodOrder.optString("discount"))) / 100);
                                            double discountValue = Functions.roundoffDecimal(total - discountDouble);

                                            model.setDiscount("" + discountDouble);
                                            model.setTotalAmount(discountValue);

                                            ResturantModel resturantModel = new ResturantModel();
                                            resturantModel.setResturantImage(restaurantObj.optString("image"));
                                            resturantModel.setResturantName(restaurantObj.optString("name"));
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
                                            resturantModel.setBlock(restaurantObj.optString("block"));
                                            resturantModel.setOpen(restaurantObj.optString("open"));

                                            resturantModel.setCity(restaurantObj.optString("city"));
                                            resturantModel.setCountry(restaurantObj.optString("country"));
                                            resturantModel.setLocation_string(restaurantObj.optString("location_string"));
                                            resturantModel.setState(restaurantObj.optString("state"));

                                            resturantModel.setDeliveryMinTime(restaurantObj.optString("delivery_min_time"));
                                            resturantModel.setDeliveryMaxTime(restaurantObj.optString("delivery_max_time"));
                                            resturantModel.setDeliveryFee(restaurantObj.optString("delivery_fee"));

                                            model.setResturantModel(resturantModel);


                                            NearbyModelClass nearbyModelClass = new NearbyModelClass();
                                            JSONObject userPlace = data.optJSONObject("UserPlace");

                                            if (userPlace.optString("lat","0.0") != null && !userPlace.optString("lat","0.0").equals("null")) {
                                                nearbyModelClass.title = userPlace.optString("name");
                                                String lat = userPlace.optString("lat","0.0");
                                                String lng = userPlace.optString("long","0.0");
                                                nearbyModelClass.id = userPlace.optString("id");
                                                nearbyModelClass.address = userPlace.optString("location_string");

                                                nearbyModelClass.flat = userPlace.optString("flat");
                                                nearbyModelClass.buildingName = userPlace.optString("building_name");
                                                nearbyModelClass.addressLabel = userPlace.optString("address_label");
                                                nearbyModelClass.additonalAddressInformation = userPlace.optString("additonal_address_information");
                                                nearbyModelClass.addInstruction = userPlace.optString("instruction");

                                                nearbyModelClass.placeId = "";

                                                double latitude = Double.parseDouble(lat);
                                                double longitude = Double.parseDouble(lng);
                                                nearbyModelClass.lat = latitude;
                                                nearbyModelClass.lng = longitude;

                                                model.setNearbyModelClass(nearbyModelClass);
                                            }


                                            model.setCouponCodeid(couponUsed.optString("coupon_id"));
                                            model.setCouponId(couponUsed.optString("id"));

                                            ArrayList<FoodListModel> modelArrayList = new ArrayList<>();


                                            for (int x = 0; x < jsonArray.length(); x++) {
                                                JSONObject jsonObject = jsonArray.getJSONObject(x);
                                                FoodListModel foodListModel = new FoodListModel();
                                                foodListModel.setMenuId(jsonObject.optString("id"));
                                                foodListModel.setItemName(jsonObject.optString("name"));
                                                foodListModel.setTvQuantity(jsonObject.optString("quantity"));
                                                foodListModel.setAmount(jsonObject.optString("price"));
                                                foodListModel.setImage(jsonObject.optString("image"));

                                                JSONArray foodOrderMenuExtraItem = jsonObject.optJSONArray("FoodOrderMenuExtraItem");
                                                ArrayList<HashMap<String, String>> extraItem = new ArrayList<>();
                                                for (int a = 0; a < foodOrderMenuExtraItem.length(); a++) {
                                                    JSONObject object = foodOrderMenuExtraItem.getJSONObject(a);
                                                    HashMap<String, String> names = new HashMap<>();
                                                    names.put("menu_extra_item_id", object.optString("id"));
                                                    names.put("menu_extra_item_name", object.optString("name"));
                                                    names.put("menu_extra_item_price", object.optString("price"));
                                                    names.put("menu_extra_item_quantity", object.optString("quantity"));
                                                    extraItem.add(names);
                                                }

                                                foodListModel.setExtraItem(extraItem);
                                                modelArrayList.add(foodListModel);
                                            }
                                            model.setModelArrayList(modelArrayList);
                                            tempList.add(model);
                                        }

                                        if (tempList.isEmpty()) {
                                            ispostFinsh = true;
                                        }
                                        if (startingPoint == 0) {
                                            arrayList.clear();
                                        }

                                        arrayList.addAll(tempList);

                                        if (arrayList.isEmpty()) {
                                            binding.noDataLayout.orderLayout.setVisibility(View.VISIBLE);
                                        } else {
                                            binding.noDataLayout.orderLayout.setVisibility(View.GONE);
                                        }

                                        yourOrdersAdapter.notifyDataSetChanged();
                                    } else {
                                        if (startingPoint == 0 && arrayList.isEmpty()) {
                                            binding.noDataLayout.orderLayout.setVisibility(View.VISIBLE);
                                        }

                                        ispostFinsh = true;
                                    }
                                } catch (Exception e) {
                                    e.printStackTrace();
                                    Functions.logDMsg("exception at getYourOrderData : " + e.toString());
                                } finally {
                                    binding.loadMoreProgress.setVisibility(View.GONE);
                                }
                            }
                        }
                        else
                        {
                            if (resp.contains("No Internet Connection")) {
                                binding.noInternetLayout.noInternetView.setVisibility(View.VISIBLE);
                            }
                        }
                    }
                });

    }

    private void methodSetYourOrderAdapter() {

        yourOrdersAdapter = new YourOrdersAdapter(getActivity(), arrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                YourOrdersModel item = (YourOrdersModel) model;
                switch (view.getId()) {
                    case R.id.mainLayout:
                        OrderDetailsFragment orderDetailsFragment = new OrderDetailsFragment();
                        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                        Bundle arguments = new Bundle();
                        arguments.putSerializable("dataModel", item);
                        orderDetailsFragment.setArguments(arguments);
                        FragmentTransaction ft = fragmentManager.beginTransaction();
                        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        ft.replace(R.id.main_food_container, orderDetailsFragment).addToBackStack(null).commit();
                        break;

                    default:
                        break;
                }

            }
        });

        binding.yourOrdersRecyclerView.setAdapter(yourOrdersAdapter);
        yourOrdersAdapter.notifyDataSetChanged();
        if (carList.size() > 0) {
            int space = (int) getContext().getResources().getDimension(R.dimen._58sdp);
            binding.yourOrdersRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }

    }


    @Override
    public void onRefresh() {
        binding.swipeRefreshLayout.setRefreshing(true);
        startingPoint = 0;
        getYourOrderData();
    }

    @Override
    public void setMenuVisibility(boolean menuVisible) {
        super.setMenuVisibility(menuVisible);
        if (menuVisible) {
            startingPoint = 0;
            getYourOrderData();
        }
    }
}