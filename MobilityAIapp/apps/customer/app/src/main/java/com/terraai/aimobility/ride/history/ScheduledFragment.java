package com.terraai.aimobility.ride.history;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;

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
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.HistoryModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentScheduledBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.util.ArrayList;


public class ScheduledFragment extends RootFragment implements SwipeRefreshLayout.OnRefreshListener {

    ArrayList<HistoryModel> historyModelArrayList = new ArrayList<>();
    HistoryAdapter historyAdapter;
    String userId;
    int pageCount = 0;
    LinearLayoutManager linearLayoutManager;
    boolean ispostFinsh;
    FragmentScheduledBinding binding;

    public ScheduledFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentScheduledBinding.inflate(getLayoutInflater());
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
            e.printStackTrace();
        }


        if (historyModelArrayList.isEmpty() && !binding.swiperefreshlayout.isRefreshing()) {
            binding.shimmerViewFrame.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerViewFrame.shimmerViewContainer.startShimmer();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showScheduleTrips(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.shimmerViewFrame.shimmerViewContainer.stopShimmer();
                        binding.shimmerViewFrame.shimmerViewContainer.setVisibility(View.GONE);
                        binding.swiperefreshlayout.setRefreshing(false);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        binding.historyRc.setVisibility(View.VISIBLE);

                                        JSONObject msgobj = respobj.getJSONObject("msg");
                                        JSONObject requestObj = msgobj.getJSONObject("Request");

                                        HistoryModel model = new HistoryModel();

                                        model.id = "" + requestObj.optString("id");
                                        model.driverId = "" + requestObj.optString("driver_id");
                                        model.vehicleId = "" + requestObj.optString("vehicle_id");
                                        model.requestId = "" + requestObj.optString("request_id");
                                        model.pickupLocation = "" + requestObj.optString("pickup_location");
                                        model.destinationLocation = "" + requestObj.optString("dropoff_location");
                                        model.pickupLat = "" + requestObj.optString("pickup_lat");
                                        model.pickupLong = "" + requestObj.optString("pickup_long");
                                        model.destinationLat = "" + requestObj.optString("dropoff_lat");
                                        model.destinationLong = "" + requestObj.optString("dropoff_long");
                                        model.pickupDatetime = requestObj.optString("pickup_datetime");
                                        model.destinationDatetime = requestObj.optString("schedule_datetime");
                                        model.acceptedByRider = "" + requestObj.optString("accepted_by_rider");
                                        model.cancelledByRider = "" + requestObj.optString("cancelled_by_rider");
                                        model.cancelledByUser = "" + requestObj.optString("cancelled_by_user");
                                        model.map = "" + requestObj.optString("map");
                                        model.completed = "" + requestObj.optString("completed");
                                        model.finalFare = "" + requestObj.optString("estimated_fare");
                                        model.tripFare = "" + requestObj.optString("trip_fare");

                                        String finalDate = DateOperations.changeDate(model.destinationDatetime);
                                        String time = DateOperations.showMessageTime(model.destinationDatetime);

                                        model.setDayTime(finalDate + ", " + time);

                                        historyModelArrayList.clear();
                                        historyModelArrayList.add(model);
                                        historyAdapter.notifyDataSetChanged();
                                    } else {
                                        historyModelArrayList.clear();
                                        binding.historyRc.setVisibility(View.GONE);
                                        if (pageCount == 0) {
                                            binding.noDataTxt.noDataLayout.setVisibility(View.VISIBLE);
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
                switch (view.getId()) {
                    case R.id.tv_cancel:
                        new CancelScheduleRide(new FragmentCallBack() {
                            @Override
                            public void onItemClick(Bundle bundle) {
                                if (bundle != null) {
                                    callApiForcancel(historyModel);
                                }
                            }
                        }).show(getActivity().getSupportFragmentManager(), "");

                        break;

                    default:
                        break;
                }
            }
        }, true);

        binding.historyRc.setAdapter(historyAdapter);
        historyAdapter.notifyDataSetChanged();

    }

    private void callApiForcancel(HistoryModel historyModel) {
        JSONObject params = new JSONObject();

        try {
            params.put("reason", "Schedule ride cancelled by the user");
            params.put("user_id", "" + userId);
            params.put("request_id", historyModel.id);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).rideCancelled(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at callApiForcancel : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        binding.swiperefreshlayout.setRefreshing(true);
                                        pageCount = 0;
                                        getHistoryData();
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


    @Override
    public void onRefresh() {
        binding.swiperefreshlayout.setRefreshing(true);
        pageCount = 0;
        getHistoryData();
    }

}