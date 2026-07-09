package com.terraai.aimobility.parcel.fragmentandactivities;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.R;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.databinding.FragmentHistoryParcelDetailBinding;
import com.terraai.aimobility.parcel.adapter.DropOffAdapter;
import com.terraai.aimobility.parcel.model.ParcelHistoryModel;
import com.terraai.aimobility.parcel.model.Rider;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

public class HistoryParcelDetailFragment extends RootFragment implements View.OnClickListener {

    FragmentHistoryParcelDetailBinding binding;
    String currencyUnit;
    ParcelHistoryModel model;
    Context context;
    String orderStatus;
    boolean isRefreshApi = false;
    Boolean isFromActive = true;
    private Uri uri;
    public BroadcastReceiver broadcastReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent.hasExtra("type")) {
                callApiShowRiderOrderDetails(false);
            }

        }
    };

    public HistoryParcelDetailFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentHistoryParcelDetailBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        methodInitViews();
        currencyUnit = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        return view;
    }




    public void callApiShowRiderOrderDetails(boolean isprogress) {
        JSONObject sendobj = new JSONObject();
        try {
            sendobj.put("parcel_order_id", "" + model.getOrderId());
        } catch (JSONException e) {
            e.printStackTrace();
        }

        if (isprogress)
            Functions.showLoader(context, false, false);


        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRiderOrderDetails(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.optString("code").equals("200")) {
                                        isRefreshApi = true;
                                        JSONObject respmsg = respobj.getJSONObject("msg");
                                        methodSetRiderDetails(respmsg);
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

    private void methodInitViews() {

        binding.backBtn.setOnClickListener(this);
        binding.btnTrackOrder.setOnClickListener(this);
    }

    public void methodSetRiderDetails(JSONObject respobj) {
//        try {
//
//            JSONObject parcelOrderObj = respobj.getJSONObject("ParcelOrder");
//            JSONObject riderObj = respobj.getJSONObject("Rider");
//
//            model.setMap(parcelOrderObj.optString("map"));
//
//            model.setSenderLocationLat(parcelOrderObj.optString("sender_location_lat"));
//            model.setSenderLocationLong(parcelOrderObj.optString("sender_location_long"));
//
//            model.setPaymentCardId(parcelOrderObj.optString("payment_card_id"));
//            if (!model.getPaymentCardId().equals("0")) {
//                JSONObject PaymentCard = parcelOrderObj.optJSONObject("PaymentCard");
//                model.setCardType(PaymentCard.optString("brand"));
//                model.setLastFour(PaymentCard.optString("last_4"));
//            }
//
//            model.setOrderId(parcelOrderObj.optString("id"));
//            model.setStatus(parcelOrderObj.optString("status"));
//
//            model.setSenderLocationString(parcelOrderObj.optString("sender_location_string"));
//            model.setTotal(parcelOrderObj.optString("total"));
//            model.setSenderName(parcelOrderObj.optString("sender_name"));
//            model.setSenderPhone(parcelOrderObj.optString("sender_phone"));
//
//            ObjectMapper om = new ObjectMapper();
//            try {
//                model.rider  = om.readValue(riderObj.toString(), Rider.class);
//            } catch (JsonProcessingException e) {
//                e.printStackTrace();
//            }
//
//        } catch (Exception e) {
//            Functions.logDMsg("Exception : " + e);
//        }

        model= DataParse.parseParcelOrderResponce(respobj,model);


        JSONObject riderOrder = respobj.optJSONObject("RiderOrder");
        if (!riderOrder.optString("delivered").equals("0000-00-00 00:00:00")) {
            orderStatus = "4";
        } else if (!riderOrder.optString("on_the_way_to_dropoff").equals("0000-00-00 00:00:00")) {
            orderStatus = "3";
        } else if (!riderOrder.optString("pickup_datetime").equals("0000-00-00 00:00:00")) {
            orderStatus = "2";
        } else if (!riderOrder.optString("on_the_way_to_pickup").equals("0000-00-00 00:00:00")) {
            orderStatus = "1";
        } else {
            orderStatus = "0";
        }

        Functions.logDMsg("Order status : " + orderStatus);

        if (orderStatus.equals("1")) {
            binding.tabTrackOrder.setVisibility(View.VISIBLE);
        } else if (orderStatus.equals("2")) {
            binding.tabTrackOrder.setVisibility(View.VISIBLE);
        } else if (orderStatus.equals("3")) {
            binding.tabTrackOrder.setVisibility(View.VISIBLE);
        } else if (orderStatus.equals("4")) {
            binding.tabTrackOrder.setVisibility(View.GONE);
        }else{
            if(model.getStatus().equals("1")){
                binding.tabTrackOrder.setVisibility(View.VISIBLE);
            }
        }


        updateScreenData();
    }


    DropOffAdapter adapter;
    private void setReceipentAdapter() {
        adapter = new DropOffAdapter(getActivity(), model.recipientList,model.orderMultiStops, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

            }
        });
        binding.recyclerview.setAdapter(adapter);
    }

    @Override
    public void onPause() {
        super.onPause();
        if (broadcastReceiver != null)
            getActivity().unregisterReceiver(broadcastReceiver);
    }

    @Override
    public void onStart() {
        super.onStart();
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Bundle bundle = getArguments();
                if (bundle != null) {
                    model = (ParcelHistoryModel) bundle.getSerializable("historyModel");
                    isFromActive = bundle.getBoolean("isFromActive");
                    updateScreenData();
                    callApiShowRiderOrderDetails(false);

                }
            }
        }, 200);
    }


    private void updateScreenData() {
        binding.tvTitle.setText(context.getString(R.string.order) + model.getOrderId());
        if (model.getMap() != null && !model.getMap().equalsIgnoreCase("")) {
            if (model.getMap().contains("http")) {
                uri = Uri.parse(model.getMap());
            } else {
                uri = Uri.parse(Constants.BASE_URL + model.getMap());
            }
            binding.ivMap.setImageURI(uri);
        }

        binding.tvSenderName.setText(model.getSenderName());
        binding.tvSenderPhone.setText(model.getSenderPhone());

        if (model.getSenderAddressDetail().equalsIgnoreCase("")) {
            binding.tvPickupLoc.setText(model.getSenderLocationString());
        } else {
            binding.tvPickupLoc.setText(model.getSenderLocationString() + " , " + model.getSenderAddressDetail());
        }

        binding.tvDropoffTime.setText(model.getCreated());
        binding.tvRideFare.setText(currencyUnit + " " + model.getTotal());
        if (model.rider!=null && TextUtils.isEmpty(model.rider.id) ) {
            binding.tabRating.setVisibility(View.GONE);
        }
        else if(model.rider!=null) {
            binding.tabRating.setVisibility(View.VISIBLE);
            if (model.rider != null && !model.rider.image.equalsIgnoreCase("")) {
                if (model.rider.image.contains("http")) {
                    uri = Uri.parse(model.rider.image);
                } else {
                    uri = Uri.parse(Constants.BASE_URL +model.rider.image);
                }
                binding.ivDriverPic.setImageURI(uri);
            }
            binding.tvDriverName.setText("" + model.rider.username);
        }


        setReceipentAdapter();

    }


    @Override
    public void onResume() {
        super.onResume();
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("request_responce");
        getActivity().registerReceiver(broadcastReceiver, intentFilter);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {
            case R.id.btn_track_order:
                Intent intent = new Intent(getActivity(), TrackParcelActivity.class);
                intent.putExtra("order_id", model.getOrderId());
                intent.putExtra("status", orderStatus);
                Bundle bundle1 = new Bundle();
                bundle1.putSerializable("dataModel", model);
                intent.putExtras(bundle1);
                startActivity(intent);
                getActivity().overridePendingTransition(R.anim.in_from_right, R.anim.out_to_left);
                break;

            case R.id.backBtn:
                getActivity().onBackPressed();
                break;
        }
    }
}