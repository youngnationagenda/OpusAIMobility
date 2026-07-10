package com.terraai.aimobility.ride;

import android.util.Log;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;

import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.terraai.aimobility.adapter.NotificationsAdapter;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.NotificationsModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentNotificationBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;


public class NotificationFragment extends RootFragment implements View.OnClickListener, SwipeRefreshLayout.OnRefreshListener {


    ArrayList<NotificationsModel> notificationsModelArrayList = new ArrayList<>();
    NotificationsAdapter notificationsAdapter;

    int startingPoint = 0;
    LinearLayoutManager linearLayoutManager;
    boolean ispostFinsh;

    FragmentNotificationBinding binding;
    public NotificationFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment'
        binding = FragmentNotificationBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        initializeListeners();
        methodSetNotificationsAdapter();


        binding.notificationRc.addOnScrollListener(new RecyclerView.OnScrollListener() {
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
                if (dy > 0) {
                    scrollOutitems = linearLayoutManager.findLastVisibleItemPosition();

                    if (userScrolled && (scrollOutitems == notificationsModelArrayList.size() - 1)) {
                        userScrolled = false;
                        if (binding.loadMoreProgress.getVisibility() != View.VISIBLE && !ispostFinsh) {
                            binding.loadMoreProgress.setVisibility(View.VISIBLE);
                            startingPoint = startingPoint + 1;
                            callApiForNotificaiton();

                        }
                    }
                }
            }
        });

        callApiForNotificaiton();
        return view;
    }


    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.goBackBtn.setOnClickListener(this);
        binding.swiperefreshlayout.setOnRefreshListener(this);
    }

    private void callApiForNotificaiton() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
            params.put("starting_point", startingPoint);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (!binding.swiperefreshlayout.isRefreshing()) {
            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showUserNotifications(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        binding.swiperefreshlayout.setRefreshing(false);
                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.swiperefreshlayout.setVisibility(View.VISIBLE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp showUserNotifications : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msgobj = respobj.getJSONArray("msg");
                                        ArrayList<NotificationsModel> tempList = new ArrayList<NotificationsModel>();
                                        for (int i = 0; i < msgobj.length(); i++) {
                                            JSONObject notificationObj = msgobj.getJSONObject(i).getJSONObject("Notification");
                                            NotificationsModel notificationsModel = new NotificationsModel();
                                            notificationsModel.setTitle(notificationObj.optString("title"));
                                            notificationsModel.setMessage(notificationObj.optString("description"));
                                            notificationsModel.setDate(notificationObj.optString("created"));

                                            tempList.add(notificationsModel);

                                        }
                                        if (tempList.isEmpty()) {
                                            ispostFinsh = true;
                                        }
                                        if (startingPoint == 0) {
                                            notificationsModelArrayList.clear();
                                        }

                                        notificationsModelArrayList.addAll(tempList);
                                        notificationsAdapter.notifyDataSetChanged();
                                    } else {
                                        if (startingPoint == 0)
                                            binding.nodataLayout.setVisibility(View.VISIBLE);
                                    }
                                } catch (JSONException e) {
                                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
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


    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:

                getActivity().onBackPressed();
                break;
            case R.id.go_back_btn:

                getActivity().onBackPressed();
                break;

            default:
                break;
        }
    }

    private void methodSetNotificationsAdapter() {

        notificationsAdapter = new NotificationsAdapter(getActivity(), notificationsModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

                switch (view.getId()) {

                }
            }
        });

        linearLayoutManager = new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false);
        binding.notificationRc.setLayoutManager(linearLayoutManager);
        binding.notificationRc.setAdapter(notificationsAdapter);
        notificationsAdapter.notifyDataSetChanged();

    }

    @Override
    public void onRefresh() {
        startingPoint = 0;
        callApiForNotificaiton();
    }
}