package com.yna.opusaimobilityapp.parcel.fragmentandactivities;

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

import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.DateOperations;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentHistoryParcelBinding;
import com.yna.opusaimobilityapp.parcel.adapter.ParcelHistoryAdapter;
import com.yna.opusaimobilityapp.parcel.model.ParcelHistoryModel;
import com.yna.opusaimobilityapp.parcel.model.RecipientModel;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

public class HistoryParcelFragment extends RootFragment implements SwipeRefreshLayout.OnRefreshListener, View.OnClickListener {
    FragmentHistoryParcelBinding binding;
    ArrayList<ParcelHistoryModel> historyModelArrayList = new ArrayList<>();
    ParcelHistoryAdapter historyAdapter;
    String userId;
    int pageCount = 0;
    LinearLayoutManager linearLayoutManager;

    boolean ispostFinsh;

    public HistoryParcelFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentHistoryParcelBinding.inflate(getLayoutInflater());
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
        binding.backBtn.setOnClickListener(this);
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
            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        }
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showParcelOrders(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.swiperefreshlayout.setRefreshing(false);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msg = respobj.optJSONArray("msg");
                                        binding.historyRc.setVisibility(View.VISIBLE);
                                        ArrayList<ParcelHistoryModel> tempList = new ArrayList<>();
                                        for (int i = 0; i < msg.length(); i++) {

                                            JSONObject data = msg.getJSONObject(i);
                                            JSONObject parcelOrderObj = data.optJSONObject("ParcelOrder");
                                            JSONArray orderMultipleArray = data.optJSONArray("ParcelOrderMultiStop");

                                            ParcelHistoryModel model = new ParcelHistoryModel();

                                            model.setOrderId(parcelOrderObj.optString("id"));
                                            model.setPackageSizeId(parcelOrderObj.optString("package_size_id"));
                                            model.setSchedule(parcelOrderObj.optString("schedule"));
                                            model.setPrice(parcelOrderObj.optString("price"));
                                            model.setDiscount(parcelOrderObj.optString("discount"));
                                            model.setDelivery_fee(parcelOrderObj.optString("delivery_fee"));
                                            model.setCouponId(parcelOrderObj.optString("coupon_id"));
                                            model.setTotal(parcelOrderObj.optString("total"));
                                            model.setPickupDatetime(parcelOrderObj.optString("pickup_datetime"));
                                            model.setSenderName(parcelOrderObj.optString("sender_name"));
                                            model.setSenderPhone(parcelOrderObj.optString("sender_phone"));
                                            model.setSenderLocationString(parcelOrderObj.optString("sender_location_string"));
                                            model.setSenderLocationLong(parcelOrderObj.optString("sender_location_long"));
                                            model.setSenderNoteDriver(parcelOrderObj.optString("sender_note_driver"));
                                            model.setSenderAddressDetail(parcelOrderObj.optString("sender_address_detail"));
                                            model.setStatus(parcelOrderObj.optString("status"));
                                            model.setMap(parcelOrderObj.optString("map"));
                                            model.setPaymentCardId(parcelOrderObj.optString("payment_card_id"));
                                            String dateTime = parcelOrderObj.optString("created");
                                            String finalDate = DateOperations.changeDate(dateTime);
                                            String time = DateOperations.showMessageTime(dateTime);
                                            model.setCreated(finalDate + ", " + time);

                                            for (int j=0;j<orderMultipleArray.length();j++){
                                                JSONObject object=orderMultipleArray.getJSONObject(j);
                                                JSONObject PackageSize=object.getJSONObject("PackageSize");
                                                RecipientModel recipientModel=new RecipientModel();
                                                recipientModel.setRecipientName(object.optString("receiver_name"));
                                                recipientModel.setRecipientNumber(object.optString("receiver_phone"));
                                                recipientModel.setRecipientAddress(object.optString("receiver_location_string"));
                                                recipientModel.setRecipientNote(object.optString("receiver_note_driver"));
                                                recipientModel.setDeliveryInstruction(object.optString("delivery_instruction"));
                                                recipientModel.setTypeOfItem(object.optString("item_title"));
                                                recipientModel.setTypeOfItemId(object.optString("good_type_id"));

                                                try {
                                                    recipientModel.setRecipientLat(Double.parseDouble(object.optString("receiver_location_lat")));
                                                    recipientModel.setRecipientLong(Double.parseDouble(object.optString("receiver_location_long")));
                                                }catch (Exception e){}

                                                recipientModel.setPackageSize(PackageSize.optString("title"));
                                                recipientModel.setPackageID(PackageSize.optString("id"));
                                                recipientModel.setPrice(PackageSize.optString("price"));

                                                model.recipientList.add(recipientModel);
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

        historyAdapter = new ParcelHistoryAdapter(getActivity(), historyModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                boolean isFromActive=true;
                ParcelHistoryModel parcelHistoryModel = (ParcelHistoryModel) model;
                if (parcelHistoryModel.getStatus().equals("2"))
                {
                    isFromActive=false;
                }
                else
                {
                    isFromActive=true;
                }


                HistoryParcelDetailFragment rideFare = new HistoryParcelDetailFragment();
                Bundle args = new Bundle();
                args.putSerializable("historyModel", parcelHistoryModel);
                args.putBoolean("isFromActive", isFromActive);
                rideFare.setArguments(args);
                FragmentTransaction tr = getActivity().getSupportFragmentManager().beginTransaction();
                tr.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                tr.add(R.id.fragment_main_container, rideFare).addToBackStack(null).commit();
            }
        }, false);

        binding.historyRc.setAdapter(historyAdapter);
        historyAdapter.notifyDataSetChanged();

    }

    @Override
    public void onRefresh() {
        binding.swiperefreshlayout.setRefreshing(true);
        pageCount = 0;
        getHistoryData();
    }


    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.backBtn:

                getActivity().onBackPressed();

                break;

            default:
                break;
        }
    }
}