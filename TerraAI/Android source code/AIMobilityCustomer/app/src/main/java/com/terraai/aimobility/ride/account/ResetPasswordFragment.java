package com.terraai.aimobility.ride.account;

import android.os.Bundle;
import android.text.TextUtils;
import android.text.method.PasswordTransformationMethod;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentResetPasswordBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class ResetPasswordFragment extends RootFragment implements View.OnClickListener {

    FragmentResetPasswordBinding binding;
    private Boolean check = true;
    private Boolean checkConfirm = true;
    private Boolean checkNew = true;

    public ResetPasswordFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentResetPasswordBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        initializeListeners();

        return view;
    }


    private void initializeListeners() {

        binding.showNewRlt.setOnClickListener(this);
        binding.showOldRlt.setOnClickListener(this);
        binding.showConfirmRlt.setOnClickListener(this);
        binding.updatePasswordBtn.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
    }


    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;
            case R.id.updatePasswordBtn:
                Functions.hideSoftKeyboard(getActivity());
                if (TextUtils.isEmpty(binding.etOldPassword.getText().toString())) {
                    binding.etOldPassword.setFocusable(true);
                    binding.etOldPassword.setError(binding.getRoot().getContext().getString(R.string.new_cant_empty));
                    binding.etOldPassword.requestFocus();
                    return;
                } else {
                    binding.etOldPassword.setError(null);
                }

                if (TextUtils.isEmpty(binding.etNewPassword.getText().toString())) {
                    binding.etNewPassword.setFocusable(true);
                    binding.etNewPassword.setError(getResources().getString(R.string.new_cant_empty));
                    binding.etNewPassword.requestFocus();
                    return;
                } else {
                    binding.etNewPassword.setError(null);
                }

                if (!Functions.isValidPassword(binding.etNewPassword.getText().toString())) {
                    binding.etNewPassword.setFocusable(true);
                    binding.etNewPassword.setError(getResources().getString(R.string.must_include_at_least));
                    binding.etNewPassword.requestFocus();
                    return;
                } else {
                    binding.etNewPassword.setError(null);
                }

                if (TextUtils.isEmpty(binding.etConfirmPassword.getText().toString())) {
                    binding.etConfirmPassword.setFocusable(true);
                    binding.etConfirmPassword.setError(getResources().getString(R.string.confirm_cant_empty));
                    binding.etConfirmPassword.requestFocus();
                    return;
                } else {
                    binding.etConfirmPassword.setError(null);
                }
                if (!(binding.etNewPassword.getText().toString().equalsIgnoreCase(binding.etConfirmPassword.getText().toString()))) {
                    binding.etConfirmPassword.setFocusable(true);
                    binding.etConfirmPassword.setError(getResources().getString(R.string.password_must_match));
                    binding.etConfirmPassword.requestFocus();
                    return;
                } else {
                    binding.etConfirmPassword.setError(null);
                    callApiForChangePassword();
                }

                break;

            case R.id.showOldRlt:

                Functions.hideSoftKeyboard(getActivity());
                if (!check) {
                    check = true;
                    binding.etOldPassword.setTransformationMethod(new PasswordTransformationMethod());
                    binding.etOldPassword.setSelection(binding.etOldPassword.length());
                    binding.oldShowTxt.setText("Show");
                } else {
                    check = false;
                    binding.oldShowTxt.setText("Hide");
                    binding.etOldPassword.setTransformationMethod(null);
                    binding.etOldPassword.setSelection(binding.etOldPassword.length());
                }

                break;

            case R.id.showConfirmRlt:

                Functions.hideSoftKeyboard(getActivity());
                if (!checkConfirm) {
                    checkConfirm = true;
                    binding.confirmShowTxt.setText("Show");
                    binding.etConfirmPassword.setTransformationMethod(new PasswordTransformationMethod());
                    binding.etConfirmPassword.setSelection(binding.etConfirmPassword.length());
                } else {
                    checkConfirm = false;
                    binding.confirmShowTxt.setText("Hide");
                    binding.etConfirmPassword.setTransformationMethod(null);
                    binding.etConfirmPassword.setSelection(binding.etConfirmPassword.length());
                }

                break;
            case R.id.showNewRlt:
                Functions.hideSoftKeyboard(getActivity());
                if (!checkNew) {
                    checkNew = true;
                    binding.newShowTxt.setText("Show");
                    binding.etNewPassword.setTransformationMethod(new PasswordTransformationMethod());
                    binding.etNewPassword.setSelection(binding.etNewPassword.length());
                } else {
                    checkNew = false;
                    binding.newShowTxt.setText("Hide");
                    binding.etNewPassword.setTransformationMethod(null);
                    binding.etNewPassword.setSelection(binding.etNewPassword.length());
                }
                break;
            default:
                break;
        }
    }

    private void callApiForChangePassword() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", MyPreferences.mPrefs.getString(MyPreferences.USER_ID, ""));
            params.put("old_password", binding.etOldPassword.getText().toString());
            params.put("new_password", binding.etNewPassword.getText().toString());
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).changePassword(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    getActivity().onBackPressed();
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