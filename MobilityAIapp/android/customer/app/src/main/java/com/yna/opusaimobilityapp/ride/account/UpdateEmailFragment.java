package com.yna.opusaimobilityapp.ride.account;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.ride.loginsignup.ConfirmYourEmalFragment;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentUpdateEmailBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class UpdateEmailFragment extends RootFragment implements View.OnClickListener {

    FragmentUpdateEmailBinding emailBinding;
    View view;
    FragmentCallBack callBack;
    String loginType;
    private Boolean check = true;

    public UpdateEmailFragment(FragmentCallBack fragmentCallBack) {
        this.callBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        emailBinding = FragmentUpdateEmailBinding.inflate(getLayoutInflater());
        View view = emailBinding.getRoot();
        loginType = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.loginType, "");

        initLayouts();
        initializeListeners();

        emailBinding.etEmail.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {
                    emailBinding.etEmailTextLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                } else {
                    emailBinding.etEmailTextLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                }
            }
        });

        emailBinding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (emailBinding.etEmail.getText().length() > 0 && Functions.isValidEmail(emailBinding.etEmail.getText().toString())) {
                    emailBinding.saveBtn.setEnabled(true);
                    emailBinding.saveBtn.setClickable(true);
                    emailBinding.saveBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    emailBinding.saveBtn.setEnabled(false);
                    emailBinding.saveBtn.setClickable(false);
                    emailBinding.saveBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method stub
            }
        });


        return view;
    }

    private void initializeListeners() {

        emailBinding.backBtn.setOnClickListener(this);
        emailBinding.saveBtn.setOnClickListener(this);
        emailBinding.changePassword.setOnClickListener(this);

    }

    private void initLayouts() {

        if (loginType.equals("phone")) {
            emailBinding.changePassword.setVisibility(View.GONE);
        }

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;


            case R.id.changePassword:
                Functions.hideSoftKeyboard(getActivity());
                ResetPasswordFragment resetPasswordFragment = new ResetPasswordFragment();
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.add_phone_container, resetPasswordFragment, "resetPasswordFragment").addToBackStack("resetPasswordFragment").commit();

                break;

            case R.id.saveBtn:
                callForChangeEmail();
                break;

            default:
                break;

        }
    }

    private void callForChangeEmail() {
        JSONObject params = new JSONObject();

        try {
            params.put("email", emailBinding.etEmail.getText().toString());
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
        } catch (Exception e) {
            e.printStackTrace();
        }

        emailBinding.saveBtn.startLoading();
        RetrofitRequest.JsonPostRequest(emailBinding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(emailBinding.getRoot().getContext()).changeEmailAddress(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        emailBinding.saveBtn.stopLoading();
                        if (isSuccess)
                        {
                            if (resp != null) {

                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        ConfirmYourEmalFragment confirmYourNumberFragment = new ConfirmYourEmalFragment(new FragmentCallBack() {
                                            @Override
                                            public void onItemClick(Bundle bundle) {
                                                if (callBack != null) {
                                                    callBack.onItemClick(new Bundle());
                                                    getActivity().onBackPressed();
                                                }
                                            }
                                        });
                                        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                                        Bundle args = new Bundle();
                                        args.putString("fromWhere", "fromUpdate");
                                        args.putString("email", emailBinding.etEmail.getText().toString());
                                        confirmYourNumberFragment.setArguments(args);
                                        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                                        transaction.replace(R.id.editAccount_container, confirmYourNumberFragment, "Forgot_Authentication_F").addToBackStack("Forgot_Authentication_F").commit();
                                    } else {
                                        Functions.dialouge(emailBinding.getRoot().getContext(),emailBinding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
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

}