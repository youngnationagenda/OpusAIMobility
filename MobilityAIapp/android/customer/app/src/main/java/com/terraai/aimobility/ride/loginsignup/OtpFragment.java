package com.terraai.aimobility.ride.loginsignup;

import android.util.Log;

import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.klinker.android.link_builder.Link;
import com.klinker.android.link_builder.LinkBuilder;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.activitiesandfragment.HomeActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.model.UserInfoModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentOtpBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;


public class OtpFragment extends RootFragment implements View.OnClickListener {

    FragmentOtpBinding binding;
    Bundle bundle;
    String fromWhere;
    UserInfoModelClass userInfoModelClass;
    Context context;
    public OtpFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentOtpBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        bundle = getArguments();
        if (bundle != null) {
            fromWhere = bundle.getString("fromWhere");
            userInfoModelClass = (UserInfoModelClass) bundle.getSerializable("UserData");
        }

        initLayouts();
        initializeListeners();
        setupScreenData();
        return view;
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


    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.tvSendAgain.setOnClickListener(this);
    }

    private void setupScreenData() {
        Link link = new Link("Send again").setTextColor(Color.parseColor("#01B14F")).setUnderlined(false);
        LinkBuilder.on(binding.tvSendAgain).addLink(link).build();
        link.setUnderlined(true);

        binding.tvSubTitle.setText("We sent a code to " + userInfoModelClass.number + ".Enter the code in that message.");
    }

    public void callapiForVerify() {
        JSONObject params = new JSONObject();

        try {
            params.put("verify", 1);
            params.put("phone", userInfoModelClass.number);
            params.put("code", binding.pinView.getText().toString());
            params.put("role","customer");
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(binding.getRoot().getContext(), false, false);

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
                                    callApiForRegistration();
                                } else if (respobj.getString("code").contains("202")) {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), "Phone number already taken");
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

    private void callApiForRegistration() {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("email", userInfoModelClass.email);
            jsonObject.put("dob", "" + userInfoModelClass.dateofBirth);
            jsonObject.put("role", "customer");
            jsonObject.put("username", userInfoModelClass.fname.toLowerCase()+"_"+userInfoModelClass.lname.toLowerCase());
            jsonObject.put("first_name", userInfoModelClass.fname);
            jsonObject.put("last_name", userInfoModelClass.lname);
            jsonObject.put("country_id", userInfoModelClass.countryId);
            jsonObject.put("phone", userInfoModelClass.number);
            jsonObject.put("password", "" + userInfoModelClass.password);
            if (fromWhere.equals(Constants.fromSocial)) {
                jsonObject.put("social_id", userInfoModelClass.socailId);
                jsonObject.put("social", userInfoModelClass.socailType);
                jsonObject.put("auth_token", userInfoModelClass.authTokon);
            }

        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }


        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                jsonObject.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).registerUser(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);

                                    if (respobj.getString("code").equals("200")) {
                                        JSONObject userobj = respobj.getJSONObject("msg").getJSONObject("User");

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

                                        JSONObject countryobj = respobj.getJSONObject("msg").getJSONObject("Country");

                                        String countryId = "" + countryobj.optString("created");
                                        String countryName = "" + countryobj.optString("name");
                                        String countryShortName = "" + countryobj.optString("short_name");
                                        String countryPhonecode = "" + countryobj.optString("phonecode");

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
                                        editor.putString(MyPreferences.loginType,userInfoModelClass.loginType);

                                        editor.putString(MyPreferences.countryId, countryId);
                                        editor.putString(MyPreferences.countryName, countryName);
                                        editor.putString(MyPreferences.countryIsoCode, countryShortName);
                                        editor.putString(MyPreferences.country_code, countryPhonecode);


                                        editor.putBoolean(MyPreferences.isLogin, true);

                                        if (fromWhere.equals("fromSocial")) {
                                            editor.putBoolean(MyPreferences.isloginwithSocail, true);
                                        } else if (fromWhere.equals(Constants.fromPhone)) {
                                            editor.putBoolean(MyPreferences.isloginwithSocail, true);
                                        } else {
                                            editor.putBoolean(MyPreferences.isloginwithSocail, false);
                                        }

                                        editor.putString(MyPreferences.setlocale, "en");
                                        editor.commit();


                                        Intent activity = new Intent(getActivity(), HomeActivity.class);
                                        startActivity(activity);
                                        getActivity().overridePendingTransition(R.anim.in_from_right, R.anim.out_to_left);
                                        getActivity().finish();
                                    } else {
                                        if (respobj.getString("code").equals("201") &&
                                                respobj.getString("msg").contains("email already exist")) {
                                            Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
                                        } else {
                                            Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
                                        }
                                    }

                                } catch (JSONException e) {
                                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }


    public void methodCallapiVerifyphoneno() {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("verify", "0");
            sendobj.put("phone", fromWhere);
            sendobj.put("role","user");
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
                                if (respobj.getString("code").equals("200")) {
                                    Functions.showToast(getActivity(), context.getString(R.string.code_has_been_sent_to_your_number));
                                } else {
                                    Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));

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
                methodCallapiVerifyphoneno();

                break;
            default:
                break;
        }
    }
}