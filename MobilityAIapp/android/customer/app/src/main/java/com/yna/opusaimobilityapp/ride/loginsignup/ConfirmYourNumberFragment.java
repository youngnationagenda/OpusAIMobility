package com.yna.opusaimobilityapp.ride.loginsignup;

import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.klinker.android.link_builder.Link;
import com.klinker.android.link_builder.LinkBuilder;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.activitiesandfragment.HomeActivity;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.CallbackResponse;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentConfirmNumberBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;


public class ConfirmYourNumberFragment extends RootFragment implements View.OnClickListener {

    Bundle bundle;
    String phoneNumber, countryId, fromWhere;
    FragmentCallBack fragmentCallBack;
    String userId, loginType;
    FragmentConfirmNumberBinding binding;

    public ConfirmYourNumberFragment() {
        //required empty constructor
    }

    public ConfirmYourNumberFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentConfirmNumberBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        bundle = getArguments();
        if (bundle != null) {
            phoneNumber = bundle.getString("phone_no");
            countryId = bundle.getString("countryId");
            fromWhere = bundle.getString("fromWhere");
            loginType = bundle.getString("loginType");
        }
        initLayouts();
        initializeListeners();
        setupScreenData();

        return view;
    }

    private void initLayouts() {

        binding.pinView.setAnimationEnable(true);

        binding.pinView.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    binding.pinView.setSelection(binding.pinView.getText().length());
                }
            }
        });

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


    }

    private void callApiForEdit() {

        JSONObject params = new JSONObject();
        try {
            params.put("country_id", "" + countryId);
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
            params.put("phone", phoneNumber);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).editProfile(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at editProfile : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {

                                        JSONObject countryData = respobj.getJSONObject("msg").getJSONObject("Country");
                                        JSONObject userobj = respobj.getJSONObject("msg").getJSONObject("User");

                                        SharedPreferences.Editor editor = MyPreferences.getSharedPreference(getActivity()).edit();
                                        editor.putString(MyPreferences.countryId, countryData.optString("id"));
                                        editor.putString(MyPreferences.countryName, countryData.optString("name"));
                                        editor.putString(MyPreferences.country_code, countryData.optString("country_code"));
                                        editor.putString(MyPreferences.countryIsoCode, countryData.optString("iso"));

                                        editor.putString(MyPreferences.phoneNo, userobj.optString("phone"));
                                        editor.commit();

                                        if (fragmentCallBack != null) {
                                            MyPreferences.getSharedPreference(getActivity()).edit().putString(MyPreferences.phoneNo, phoneNumber).commit();
                                            Bundle bundle = new Bundle();
                                            bundle.putString("resp", "success");
                                            fragmentCallBack.onItemClick(bundle);
                                            FragmentManager manager = getActivity().getSupportFragmentManager();
                                            try {
                                                if (manager.getFragments() != null) {
                                                    if (manager.getBackStackEntryCount() > 0) {
                                                        for (int i = 1; i < manager.getBackStackEntryCount(); i++)
                                                            manager.popBackStack();
                                                    }
                                                }
                                            } catch (Exception e) {
                                                e.printStackTrace();
                                            }
                                        }
                                    } else {
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (JSONException e) {
                                    e.printStackTrace();
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }


    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.tvSendAgain.setOnClickListener(this);
    }

    private void setupScreenData() {

        binding.pinView.requestFocus();
        Functions.showKeyboard(getActivity());
        Link link = new Link("Send again").setTextColor(Color.parseColor("#01B14F")).setUnderlined(false);
        LinkBuilder.on(binding.tvSendAgain).addLink(link).build();
        link.setUnderlined(true);

        binding.tvSubTitle.setText(getString(R.string.we_sent_a_code) + phoneNumber + getString(R.string.enter_code_message));
    }

    public void callapiForVerify() {
        JSONObject params = new JSONObject();

        try {
            params.put("verify", "1");
            params.put("phone", phoneNumber);
            params.put("code", binding.pinView.getText().toString());
            params.put("role","customer");
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.logDMsg("params verifyPhoneNo :" + params.toString());

        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyPhoneNo(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    if (fromWhere.equalsIgnoreCase("login")) {

                                        callApiForRegistration();
                                    } else {
                                        callApiForEdit();
                                    }
                                }

                                else if (respobj.getString("code").contains("202")) {
                                    Functions.dialougeNotCanclled(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), binding.getRoot().getContext().getString(R.string.already_found), new CallbackResponse() {
                                        @Override
                                        public void responce(String resp) {
                                            if (resp != null && resp.equalsIgnoreCase("yes")) {
                                                Bundle bundle = new Bundle();
                                                bundle.putString("resp", "failed");

                                                if (fragmentCallBack != null) {
                                                    fragmentCallBack.onItemClick(bundle);
                                                }
                                                getActivity().onBackPressed();
                                            }
                                        }
                                    });

                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception : " + e);
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }


    private void callApiForRegistration() {
        JSONObject parameters = new JSONObject();
        try {

            parameters.put("phone", phoneNumber);
            parameters.put("role","customer");
        } catch (
                Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(binding.getRoot().getContext(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                parameters.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).registerUser(parameters.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    parseLoginResponce(respobj);
                                }
                                else  {
                                    SignUpFragment finishSigningUpFragment = new SignUpFragment();
                                    FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                                    FragmentTransaction ft = fragmentManager.beginTransaction();
                                    Bundle args = new Bundle();
                                    args.putString("phone", phoneNumber);
                                    args.putString("countryId", countryId);
                                    args.putString("fromWhere", Constants.fromPhone);
                                    args.putString("loginType", loginType);
                                    finishSigningUpFragment.setArguments(args);
                                    ft.replace(R.id.otpContainer_F, finishSigningUpFragment).commit();

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


    private void parseLoginResponce(JSONObject result) {
        try {
            JSONObject userobj = result.getJSONObject("msg").getJSONObject("User");
            JSONObject countryobj = result.getJSONObject("msg").getJSONObject("Country");

            String firstName = "" + userobj.optString("first_name");
            String lastName = "" + userobj.optString("last_name");
            String id = "" + userobj.optString("id");
            String email = "" + userobj.optString("email");
            String image = "" + userobj.optString("image");
            String password = "" + userobj.optString("password");
            String phone = "" + userobj.optString("phone");
            String gender = "" + userobj.optString("gender");
            String dob = "" + userobj.optString("dob");
            String deviceToken = "" + userobj.optString("device_token");
            String role = "" + userobj.optString("role");
            String username = "" + userobj.optString("username");
            String wallet = "" + userobj.optString("wallet");
            String created = "" + userobj.optString("created");


            String countryId = "" + countryobj.optString("id");
            String countryName = "" + countryobj.optString("name");
            String countryShortName = "" + countryobj.optString("iso");
            String countryPhonecode = "" + countryobj.optString("country_code");

            android.content.SharedPreferences.Editor editor = MyPreferences.getSharedPreference(getActivity()).edit();

            editor.putString(MyPreferences.fname, firstName);
            editor.putString(MyPreferences.lname, lastName);
            editor.putString(MyPreferences.USER_ID, id);
            editor.putString(MyPreferences.email, email);
            editor.putString(MyPreferences.image, image);
            editor.putString(MyPreferences.deviceTokon, deviceToken);
            editor.putString(MyPreferences.password, password);
            editor.putString(MyPreferences.phoneNo, phone);
            editor.putString(MyPreferences.gender, gender);
            editor.putString(MyPreferences.dob, dob);
            editor.putString(MyPreferences.role, role);
            editor.putString(MyPreferences.userName, username);
            editor.putString(MyPreferences.created, created);
            editor.putString(MyPreferences.wallet, wallet);
            editor.putString(MyPreferences.loginType, loginType);
            editor.putString(MyPreferences.countryId, countryId);
            editor.putString(MyPreferences.countryName, countryName);
            editor.putString(MyPreferences.countryIsoCode, countryShortName);
            editor.putString(MyPreferences.country_code, countryPhonecode);

            editor.putBoolean(MyPreferences.isLogin, true);
            editor.putBoolean(MyPreferences.isloginwithSocail, false);
            editor.putString(MyPreferences.setlocale, "en");
            editor.commit();

            Intent activity = new Intent(getActivity(), HomeActivity.class);
            startActivity(activity);
            getActivity().overridePendingTransition(R.anim.in_from_right, R.anim.out_to_left);
            getActivity().finish();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public void methodCallapiVerifyphoneno() {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("verify", "0");
            sendobj.put("phone", phoneNumber);
            sendobj.put("role","customer");
        } catch (Exception e) {
            e.printStackTrace();
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
                                if (respobj.getString("code").equals("200")) {
                                    Functions.showToast(binding.getRoot().getContext(), "" + respobj.getString("msg"));
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));

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


    public void methodResendChange() {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("user_id", userId);
            sendobj.put("phone", phoneNumber);
        } catch (Exception e) {
            e.printStackTrace();
        }
        Functions.showLoader(getContext(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).changePhoneNo(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    Functions.showToast(binding.getRoot().getContext(), "" + respobj.getString("msg"));
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
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
                if (fromWhere.equalsIgnoreCase("login")) {
                    methodCallapiVerifyphoneno();
                } else {
                    methodResendChange();
                }
                break;

            default:
                break;
        }
    }
}
