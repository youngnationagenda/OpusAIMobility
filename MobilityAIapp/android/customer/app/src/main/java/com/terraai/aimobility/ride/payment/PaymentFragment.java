package com.terraai.aimobility.ride.payment;

import android.util.Log;

import android.graphics.Color;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.klinker.android.link_builder.Link;
import com.klinker.android.link_builder.LinkBuilder;
import com.terraai.aimobility.adapter.PaymentMethodsAdapter;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.PaymentMethodsModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentPaymentBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;


public class PaymentFragment extends RootFragment implements View.OnClickListener, SwipeRefreshLayout.OnRefreshListener {

    FragmentPaymentBinding binding;
    String userId;
    PaymentMethodsAdapter paymentMethodsAdapter;
    ArrayList<PaymentMethodsModel> paymentMethodsModelArrayList = new ArrayList<>();
    boolean isViewCreated = false;
    FragmentCallBack fragmentCallBack;
    boolean aBoolean = false;

    public PaymentFragment(FragmentCallBack fragmentCallBack, boolean aBoolean) {
        this.fragmentCallBack = fragmentCallBack;
        this.aBoolean = aBoolean;
    }

    public PaymentFragment() {

    }


    private void methodOpenWebView() {
        Link link = new Link(getString(R.string.learn_more)).setTextColor(Color.parseColor("#00b14f")).setUnderlined(false);
        LinkBuilder.on(binding.setUpPaymentText).addLink(link).build();
        link.setOnClickListener(new Link.OnClickListener() {
            @Override
            public void onClick(@NotNull String s) {
                openWebView(getString(R.string.learn_more), Constants.HELP_URL);
            }
        });

    }


    private void openWebView(String urlTitle, String sliderUrl) {
        Functions.hideSoftKeyboard(getActivity());
        WebViewFragment webviewF = new WebViewFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        Bundle bundle = new Bundle();
        bundle.putString("url", sliderUrl);
        bundle.putString("title", urlTitle);
        webviewF.setArguments(bundle);
        transaction.addToBackStack(null);
        if(aBoolean){
            transaction.replace(R.id.checkout_container, webviewF).commit();

        }   else{
            transaction.replace(R.id.fragment_main_container, webviewF).commit();
        }
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentPaymentBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        isViewCreated = true;
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        methodInitView();
        methodInitClickListener();
        methodOpenWebView();
        methodSetPaymentMethodsAdapter();
        binding.editCard.setVisibility(View.VISIBLE);
        methodCallForPayment();
        return view;
    }

    private void methodInitView() {
        binding.addPaymentLayout.setVisibility(View.GONE);
        binding.paymentLayout.setVisibility(View.GONE);
    }

    private void methodSetPaymentMethodsAdapter() {
        Functions.logDMsg("paymentMethodsModelArrayList : " + paymentMethodsModelArrayList.size());
        paymentMethodsAdapter = new PaymentMethodsAdapter(getActivity(), paymentMethodsModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                PaymentMethodsModel paymentMethodsModel = (PaymentMethodsModel) model;
                switch (view.getId()) {
                    case R.id.rledit:
                        Bundle args1 = new Bundle();
                        args1.putString("id", paymentMethodsModel.getCardId());
                        DeleteFragmantDialog payWithBottomSheetFragment = new DeleteFragmantDialog(new FragmentCallBack() {
                            @Override
                            public void onItemClick(Bundle bundle) {
                                binding.swiperefreshlayout.setRefreshing(true);

                                methodCallForPayment();
                                paymentMethodsAdapter.enableEdit(true);
                            }
                        });
                        payWithBottomSheetFragment.setArguments(args1);
                        payWithBottomSheetFragment.show(getActivity().getSupportFragmentManager(), "payWithBottomSheetFragment");

                        break;

                    case R.id.mainLayout:
                        if (fragmentCallBack != null) {
                            Bundle args2 = new Bundle();
                            args2.putString("payment_type", "Card");
                            args2.putString("card_info", paymentMethodsModel.getCardFour());
                            args2.putString("card_type", paymentMethodsModel.getCardName());
                            args2.putString("payment_method_id", paymentMethodsModel.getCardId());
                            fragmentCallBack.onItemClick(args2);
                            getActivity().getSupportFragmentManager().popBackStackImmediate();
                        }
                        break;
                    default:
                        break;
                }

            }
        });


        binding.paymentMethodsRc.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.paymentMethodsRc.setAdapter(paymentMethodsAdapter);
        paymentMethodsAdapter.notifyDataSetChanged();

    }


    private void methodCallForPayment() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (paymentMethodsModelArrayList.isEmpty() && !binding.swiperefreshlayout.isRefreshing()) {
            binding.shimmerLayoutFrame.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerLayoutFrame.shimmerViewContainer.startShimmer();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showUserCards(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding. swiperefreshlayout.setRefreshing(false);
                        binding.shimmerLayoutFrame.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerLayoutFrame.shimmerViewContainer.stopShimmer();
                        if (isSuccess)
                        {
                            if (resp != null) {

                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {

                                        binding.addPaymentLayout.setVisibility(View.GONE);
                                        binding.paymentLayout.setVisibility(View.VISIBLE);
                                        JSONArray msgarray = respobj.getJSONArray("msg");

                                        paymentMethodsModelArrayList.clear();
                                        for (int i = 0; i < msgarray.length(); i++) {
                                            JSONObject obj = msgarray.getJSONObject(i);
                                            PaymentMethodsModel paymentMethodsModel = new PaymentMethodsModel();
                                            paymentMethodsModel.setCardId("" + obj.getJSONObject("PaymentCard").optString("id"));
                                            paymentMethodsModel.setCardName("" + obj.optString("brand"));
                                            paymentMethodsModel.setUserName("" + obj.optString("name"));
                                            paymentMethodsModel.setCardFour("" + obj.optString("last4"));
                                            String expiryDate = "" + obj.optString("exp_month");
                                            String expiryYear = "" + obj.optString("exp_year");
                                            String enteredYear = expiryYear.substring(2);
                                            paymentMethodsModel.setDate(expiryDate +"/"+ enteredYear);
                                            paymentMethodsModelArrayList.add(paymentMethodsModel);
                                        }
                                        paymentMethodsAdapter.notifyDataSetChanged();

                                    } else {
                                        paymentMethodsModelArrayList.clear();
                                        binding.editDone.setVisibility(View.GONE);
                                        binding.editCard.setVisibility(View.GONE);
                                        binding.addPaymentLayout.setVisibility(View.VISIBLE);
                                        binding.paymentLayout.setVisibility(View.GONE);
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
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

    /*Method InitLayouts*/
    private void methodInitClickListener() {
        binding.addPaymentMethodBtn.setOnClickListener(this);
        binding.addPaymentLayout.setOnClickListener(this);
        binding.addPaymentBtn.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.editCard.setOnClickListener(this);
        binding.editDone.setOnClickListener(this);
        binding.swiperefreshlayout.setOnRefreshListener(this);
    }

    @Override
    public void onClick(View view) {

        switch (view.getId()) {

            case R.id.addPaymentMethodBtn:
            case R.id.add_payment_btn:

                PayWithFragment payWithFragment = new PayWithFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        binding.addPaymentLayout.setVisibility(View.GONE);
                        binding.paymentLayout.setVisibility(View.GONE);
                        binding.editCard.setVisibility(View.VISIBLE);
                        paymentMethodsAdapter.enableEdit(false);
                        methodCallForPayment();
                    }
                });
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
               if(aBoolean){
                   fragmentTransaction.add(R.id.checkout_container, payWithFragment, "payWithFragment").addToBackStack("payWithFragment").commit();
               } else{
                   fragmentTransaction.add(R.id.fragment_main_container, payWithFragment, "payWithFragment").addToBackStack("payWithFragment").commit();
               }

                break;


            case R.id.editCard:
                binding.editDone.setVisibility(View.VISIBLE);
                binding.editCard.setVisibility(View.GONE);
                paymentMethodsAdapter.enableEdit(true);
                break;

            case R.id.editDone:
                binding.editDone.setVisibility(View.GONE);
                binding.editCard.setVisibility(View.VISIBLE);
                paymentMethodsAdapter.enableEdit(false);
                break;

            case R.id.backBtn:
                getActivity().onBackPressed();
                break;

            default:
                break;
        }
    }

    @Override
    public void onRefresh() {
        binding.editCard.setVisibility(View.VISIBLE);
        binding.editDone.setVisibility(View.GONE);
        paymentMethodsAdapter.enableEdit(false);
        methodCallForPayment();
    }
}