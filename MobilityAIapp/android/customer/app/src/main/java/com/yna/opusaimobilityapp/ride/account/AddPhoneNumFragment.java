package com.yna.opusaimobilityapp.ride.account;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.ride.loginsignup.ConfirmYourNumberFragment;
import com.yna.opusaimobilityapp.ride.loginsignup.CountryF;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentAddPhoneNumBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class AddPhoneNumFragment extends RootFragment implements View.OnClickListener {
    FragmentAddPhoneNumBinding binding;
    FragmentCallBack fragmentCallBack;
    String userId;
    private String  countryId = "", countryCode = "", countryIos = "", countryName;

    public AddPhoneNumFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentAddPhoneNumBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        initLayouts();
        initializeListeners();

        return view;
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.continueBtn.setOnClickListener(this);
        binding.etCountry.setOnClickListener(this);
    }

    private void initLayouts() {

        countryName = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.countryName, "");
        countryId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.countryId, "");
        countryIos = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.countryIsoCode, "");
        countryCode = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.country_code, "");
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");

        binding.ccp.registerPhoneNumberTextView(binding.etPhoneNumber);


        binding.ccp.setDefaultCountryUsingNameCode(countryIos);
        binding.ccp.resetToDefaultCountry();
        binding.ccp.registerPhoneNumberTextView(binding.etPhoneNumber);


        if (!countryCode.contains("+")) {
            countryCode = "+" + countryCode;
        }
        binding.etCountry.setText(countryName + " (" + countryCode + ")");


        binding.etPhoneNumber.setOnFocusChangeListener((v, hasFocus) -> {

            if (hasFocus) {

                binding.phoneNumberLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                binding.greyLine.setVisibility(View.GONE);
            }
        });


        binding. etPhoneNumber.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (binding.etPhoneNumber.getText().length() > 0 && binding.ccp.isValid()) {
                    binding.continueBtn.setEnabled(true);
                    binding.continueBtn.setClickable(true);
                    binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    binding.continueBtn.setEnabled(false);
                    binding.continueBtn.setClickable(false);
                    binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method stub
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

            case R.id.etCountry:

                openCountryScreen();
                break;

            case R.id.continueBtn:

                Functions.hideSoftKeyboard(getActivity());
                String phoneNo = binding.etPhoneNumber.getText().toString();
                if (phoneNo.charAt(0) == '0') {
                    phoneNo = phoneNo.substring(1);
                }
                phoneNo = phoneNo.replace("+", "");
                phoneNo = phoneNo.replace(countryCode, "");
                phoneNo = countryCode + phoneNo;
                phoneNo = phoneNo.replace(" ", "");
                phoneNo = phoneNo.replace("(", "");
                phoneNo = phoneNo.replace(")", "");
                phoneNo = phoneNo.replace("-", "");

                methodCallapiVerifyphoneno(phoneNo);

                break;

            default:
                break;

        }
    }

    private void openCountryScreen() {
        CountryF countryF = new CountryF(bundle -> {
            if (bundle != null) {
                countryId = bundle.getString("selected_country_id");
                countryCode = bundle.getString("selected_country_code");
                countryIos = bundle.getString("selected_country_ios");

                if (countryCode.contains("+")) {
                    binding.etCountry.setText(bundle.getString("selected_country") + " (" + countryCode + ")");
                } else {
                    binding.etCountry.setText(bundle.getString("selected_country") + " (+" + countryCode + ")");
                }

                binding.ccp.setDefaultCountryUsingNameCode(countryIos);
                binding.ccp.resetToDefaultCountry();
                binding.ccp.registerPhoneNumberTextView(binding.etPhoneNumber);

                if (!binding.ccp.isValid()) {
                    binding.continueBtn.setEnabled(false);
                    binding.continueBtn.setClickable(false);
                    binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                } else {
                    binding.continueBtn.setEnabled(true);
                    binding.continueBtn.setClickable(true);
                    binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                }

            }
        });
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putString("countryId", countryId);
        countryF.setArguments(bundle);
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.add_phone_container, countryF).addToBackStack(null).commit();

    }

    public void methodCallapiVerifyphoneno(String phoneNo) {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("user_id", userId);
            sendobj.put("phone", phoneNo);
        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.continueBtn.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).changePhoneNo(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.continueBtn.stopLoading();

                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {

                                    ConfirmYourNumberFragment confirmYourNumberFragment = new ConfirmYourNumberFragment(bundle -> {
                                        if (bundle != null) {
                                            String respp = bundle.getString("resp");
                                            if (respp.equals("failed")) {
                                                binding.etPhoneNumber.setText("");
                                            } else {
                                                if (fragmentCallBack != null) {
                                                    fragmentCallBack.onItemClick(new Bundle());
                                                }
                                            }
                                        }
                                    });
                                    FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                                    Bundle args = new Bundle();
                                    args.putString("phone_no", phoneNo);
                                    args.putString("countryId", countryId);
                                    args.putString("fromWhere", "edit");
                                    confirmYourNumberFragment.setArguments(args);
                                    transaction.addToBackStack("ConfirmYourNumberFragment");
                                    transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                                    transaction.replace(R.id.add_phone_container, confirmYourNumberFragment, "Forgot_Authentication_F").commit();

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

}