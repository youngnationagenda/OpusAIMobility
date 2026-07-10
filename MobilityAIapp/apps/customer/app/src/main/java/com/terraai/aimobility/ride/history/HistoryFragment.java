package com.terraai.aimobility.ride.history;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;

import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.terraai.aimobility.adapter.HistoryAdapter;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.HistoryModel;
import com.terraai.aimobility.model.TripHistoryModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentHistoryBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;


public class HistoryFragment extends RootFragment implements SwipeRefreshLayout.OnRefreshListener {

    FragmentHistoryBinding binding;
    ArrayList<HistoryModel> historyModelArrayList = new ArrayList<>();
    HistoryAdapter historyAdapter;
    String userId;
    int pageCount = 0;
    LinearLayoutManager linearLayoutManager;

    boolean ispostFinsh;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentHistoryBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        initLayouts();
        initializeListeners();
        getHistoryData();
        methodSetHistoryAdapter();
        return view;
    }

    private void initializeListeners() {
        binding.swiperefreshlayout.setOnRefreshListener(this);
        binding.backBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                getActivity().onBackPressed();
            }
        });
    }

    private void initLayouts() {

        linearLayoutManager = new LinearLayoutManager(getActivity());
        binding.historyRc.setLayoutManager(linearLayoutManager);
        binding.historyRc.addOnScrollListener(new RecyclerView.OnScrollListener() {
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
                    Log.d("resp", "" + scrollOutitems);
                    if (userScrolled && (scrollOutitems == historyModelArrayList.size() - 1)) {
                        userScrolled = false;

                        if (binding.loadMoreProgress.getVisibility() != View.VISIBLE && !ispostFinsh) {
                            binding.loadMoreProgress.setVisibility(View.VISIBLE);
                            pageCount = pageCount + 1;
                            getHistoryData();
                        }
                    }
                }
            }
        });
    }

    private void getHistoryData() {

        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
            params.put("starting_point", pageCount);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (historyModelArrayList.isEmpty() && !binding.swiperefreshlayout.isRefreshing()) {
            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        }
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showTripsHistory(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.swiperefreshlayout.setRefreshing(false);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at getHistoryData : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msg = respobj.optJSONArray("msg");
                                        binding.historyRc.setVisibility(View.VISIBLE);
                                        ArrayList<HistoryModel> tempList = new ArrayList<>();
                                        for (int i = 0; i < msg.length(); i++) {

                                            JSONObject data = msg.getJSONObject(i);
                                            JSONObject tripObject = data.optJSONObject("Trip");
                                            JSONObject driverObject = data.optJSONObject("Driver");
                                            JSONObject vehicleObject = data.optJSONObject("Vehicle");
                                            JSONArray ratingArray = data.optJSONArray("DriverRating");
                                            JSONArray tripHistory = data.optJSONArray("TripHistory");


                                            HistoryModel model = new HistoryModel();

                                            model.id = "" + tripObject.optString("id");
                                            model.driverId = "" + tripObject.optString("driver_id");
                                            model.vehicleId = "" + tripObject.optString("vehicle_id");
                                            model.requestId = "" + tripObject.optString("request_id");
                                            model.pickupLocation = "" + tripObject.optString("pickup_location");
                                            model.destinationLocation = "" + tripObject.optString("dropoff_location");
                                            model.pickupLat = "" + tripObject.optString("pickup_lat");
                                            model.pickupLong = "" + tripObject.optString("pickup_long");
                                            model.destinationLat = "" + tripObject.optString("dropoff_lat");
                                            model.destinationLong = "" + tripObject.optString("dropoff_long");
                                            model.pickupDatetime = tripObject.optString("pickup_datetime");
                                            model.destinationDatetime = tripObject.optString("dropoff_datetime");
                                            model.acceptedByRider = "" + tripObject.optString("accepted_by_rider");
                                            model.cancelledByRider = "" + tripObject.optString("cancelled_by_rider");
                                            model.cancelledByUser = "" + tripObject.optString("cancelled_by_user");
                                            model.map = "" + tripObject.optString("map");
                                            model.completed = "" + tripObject.optString("completed");
                                            model.finalFare = "" + tripObject.optString("ride_fare");
                                            model.tripFare = "" + tripObject.optString("trip_fare");
                                            model.initialWaitingTimePrice = "" + tripObject.optString("initial_waiting_time_price");

                                            String finalDate = DateOperations.changeDate(model.destinationDatetime);
                                            String time = DateOperations.showMessageTime(model.destinationDatetime);

                                            model.setDayTime(finalDate + ", " + time);

                                            if (data.optJSONObject("TripPayment") != null) {
                                                model.payType = "" + data.optJSONObject("TripPayment").optString("payment_type");
                                                model.payFromWallet = "" + data.optJSONObject("TripPayment").optString("payment_from_wallet");
                                                model.payCollectFromWallet = "" + data.optJSONObject("TripPayment").optString("payment_collect_from_wallet");
                                                model.payCollectFromCard = "" + data.optJSONObject("TripPayment").optString("payment_collect_from_card");
                                                model.payCollectFromCash = "" + data.optJSONObject("TripPayment").optString("payment_collect_from_cash");
                                                model.debitCreditAmount = "" + data.optJSONObject("TripPayment").optString("debit_credit_amount");
                                            }

                                            model.driverEmail = "" + driverObject.optString("email");
                                            model.driverFirstName = "" + driverObject.optString("first_name");
                                            model.driverLastName = "" + driverObject.optString("last_name");
                                            model.driverPhoneNo = "" + driverObject.optString("phone_no");
                                            model.driverImage = "" + driverObject.optString("image");
                                            model.driverLat = "" + driverObject.optString("lat","0.0");
                                            model.driverLng = "" + driverObject.optString("long","0.0");
                                            model.username = "" + driverObject.optString("username");


                                            model.vehicleMake = "" + vehicleObject.optString("make");
                                            model.vehicleColor = "" + vehicleObject.optString("color");
                                            model.vehicleModel = "" + vehicleObject.optString("model");
                                            model.vehiclePlate = "" + vehicleObject.optString("license_plate");
                                            JSONObject vehicleTypeObj = vehicleObject.optJSONObject("RideType");
                                            model.vehicleType = "" + vehicleTypeObj.optString("name");


                                            if (ratingArray.length() > 0) {
                                                for (int x = 0; x < ratingArray.length(); x++) {
                                                    JSONObject ratingObj = ratingArray.getJSONObject(x);
                                                    model.tripRating = ratingObj.optString("star");
                                                }
                                            }

                                            ArrayList<TripHistoryModel> tempListLat = new ArrayList<>();
                                            if (tripHistory.length() > 0) {
                                                for (int x = 0; x < tripHistory.length(); x++) {
                                                    TripHistoryModel tripHistoryModel = new TripHistoryModel();
                                                    JSONObject ratingObj = tripHistory.getJSONObject(x);
                                                    tripHistoryModel.lat = Double.parseDouble(ratingObj.optString("lat","0.0"));
                                                    tripHistoryModel.lon = Double.parseDouble(ratingObj.optString("long","0.0"));
                                                    tempListLat.add(tripHistoryModel);
                                                }
                                                model.tripHistoryModelArrayList = tempListLat;
                                            }

                                            tempList.add(model);
                                        }
                                        if (tempList.isEmpty()) {
                                            ispostFinsh = true;
                                        }
                                        if (pageCount == 0) {
                                            historyModelArrayList.clear();
                                        }
                                        historyModelArrayList.addAll(tempList);
                                        if (historyModelArrayList.isEmpty()) {
                                            binding.noDataView.noDataLayout.setVisibility(View.VISIBLE);
                                        } else {
                                            binding.noDataView.noDataLayout.setVisibility(View.GONE);
                                        }
                                        historyAdapter.notifyDataSetChanged();
                                    } else {
                                        if (pageCount == 0) {
                                            binding.noDataView.noDataLayout.setVisibility(View.VISIBLE);
                                        } else {
                                            ispostFinsh = true;
                                        }
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                } finally {
                                    binding.loadMoreProgress.setVisibility(View.GONE);
                                }
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });
    }



    private void methodSetHistoryAdapter() {

        historyAdapter = new HistoryAdapter(getActivity(), historyModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                HistoryModel historyModel = (HistoryModel) model;
                RideHistoryDetail rideFare = new RideHistoryDetail();
                Bundle args = new Bundle();
                args.putSerializable("historyModel", historyModel);
                rideFare.setArguments(args);
                FragmentTransaction tr = getActivity().getSupportFragmentManager().beginTransaction();
                tr.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                tr.add(R.id.fragment_main_container, rideFare).addToBackStack(null).commit();
            }
        },false);

        binding.historyRc.setAdapter(historyAdapter);
        historyAdapter.notifyDataSetChanged();

    }

    @Override
    public void onRefresh() {
        binding.swiperefreshlayout.setRefreshing(true);
        pageCount = 0;
        getHistoryData();
    }
}