package com.terraai.aimobility.ride.loginsignup;

import android.util.Log;

import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentTransaction;

import com.klinker.android.link_builder.Link;
import com.klinker.android.link_builder.LinkBuilder;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentConfirmEmailBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import retrofit2.Call;


public class ConfirmYourEmalFragment extends RootFragment implements View.OnClickListener {


    Bundle bundle;
    String email, fromWhere;
    FragmentCallBack fragmentCallBack;
    FragmentConfirmEmailBinding binding;

    public ConfirmYourEmalFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    public ConfirmYourEmalFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentConfirmEmailBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        bundle = getArguments();
        if (bundle != null) {
            fromWhere = bundle.getString("fromWhere");
            email = bundle.getString("email");
        }

        Functions.showKeyboard(getActivity());
        initLayouts();
        initializeListeners();

        Link link = new Link("Send again").setTextColor(Color.parseColor("#01B14F")).setUnderlined(false);
        LinkBuilder.on(binding.tvSendAgain).addLink(link).build();
        link.setUnderlined(true);

        return view;
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.tvSendAgain.setOnClickListener(this);
    }

    private void initLayouts() {

        binding.pinView.setAnimationEnable(true);
        binding.pinView.requestFocus();
        Functions.showKeyboard(getActivity());


        binding.pinView.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (binding.pinView.length() == 4) {
                    Functions.hideSoftKeyboard(getActivity());
                    callapiForVerify();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });

        setupScreenData();
    }

    private void setupScreenData() {
        binding.tvSubTitle.setText(getActivity().getResources().getString(R.string.we_sent_a_code) + " " + email + getActivity().getResources().getString(R.string.enter_code_message));
    }

    public void callapiForVerify() {
        JSONObject params = new JSONObject();
        try {

            if (fromWhere.equalsIgnoreCase("fromUpdate")) {
                params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
                params.put("new_email", email);
            } else {
                params.put("email", email);
            }

            params.put("code", binding.pinView.getText().toString());
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(getActivity(), false, false);

        Call<String> call=null;
        if (fromWhere.equalsIgnoreCase("fromUpdate")) {
            call=Singleton.getApiCall(binding.getRoot().getContext()).verifyChangeEmailCode(params.toString());
        } else {
            call=Singleton.getApiCall(binding.getRoot().getContext()).verifyforgotPasswordCode(params.toString());
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                new JSONObject().toString(),
                call, new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    if (fromWhere.equalsIgnoreCase("fromUpdate")) {
                                        if (fragmentCallBack != null) {
                                            MyPreferences.getSharedPreference(getActivity()).edit().putString(MyPreferences.email, email).commit();
                                            fragmentCallBack.onItemClick(new Bundle());
                                            getActivity().onBackPressed();
                                        }
                                    } else {
                                        openChangePasswordScreen();
                                    }

                                } else {
                                    Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception : " +e);
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });

    }


    private void openChangePasswordScreen() {
        ResetForgotPasswordFragment confirmYourNumberFragment = new ResetForgotPasswordFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle args = new Bundle();
        args.putString("email", email);
        confirmYourNumberFragment.setArguments(args);
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.otpContainer_F, confirmYourNumberFragment, "ResetForgotPasswordFragment").commit();
    }


    public void methodCallapiVerifyEmail() {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("verify", "0");
            sendobj.put("phone", email);
            sendobj.put("role","customer");
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        Functions.showLoader(getContext(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyPhoneNo(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.optString("code").equals("200")) {
                                    Functions.showToast(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.code_has_been_sent));
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.optString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });
            }


    @Override
    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;

            case R.id.tv_send_again:
                Functions.hideSoftKeyboard(getActivity());
                methodCallapiVerifyEmail();

                break;
            default:
                break;
        }
    }
}
