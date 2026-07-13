package com.terraai.aimobility.ride.loginsignup;

import android.util.Log;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentForgotPasswordBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class ForgotPasswordFragment extends RootFragment implements View.OnClickListener {

    Bundle bundle;
    String email;
    FragmentForgotPasswordBinding binding;


    public ForgotPasswordFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentForgotPasswordBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();


        bundle = getArguments();
        if (bundle != null) {
            email = bundle.getString("email");
        }
        initLayouts();
        initializeListeners();

        return view;
    }

    private void initLayouts() {

        binding.etEmail.setText(email);
        binding.etEmail.requestFocus();
        binding.etEmail.setSelection(binding.etEmail.getText().length());

    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.resetBtn.setOnClickListener(this);

        binding.etEmail.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {
                    binding.phoneNumberRlt.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                } else {
                    binding.phoneNumberRlt.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));
                }
            }
        });

        binding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (binding.etEmail.getText().length() > 0 && Functions.isValidEmail(binding.etEmail.getText().toString())) {
                    binding.resetBtn.setEnabled(true);
                    binding.resetBtn.setClickable(true);
                    binding.resetBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    binding.resetBtn.setEnabled(false);
                    binding.resetBtn.setClickable(false);
                    binding.resetBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
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

            case R.id.resetBtn:
                Functions.hideSoftKeyboard(getActivity());
                callApiforForgotPasswrod();

                break;
            default:
                break;
        }
    }

    private void callApiforForgotPasswrod() {
        JSONObject params = new JSONObject();

        try {
            params.put("email", binding.etEmail.getText().toString());
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        binding.resetBtn.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).forgotPassword(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.resetBtn.stopLoading();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    openOtpScreen();
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

    private void openOtpScreen() {

        ConfirmYourEmalFragment confirmYourNumberFragment = new ConfirmYourEmalFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle args = new Bundle();
        args.putString("email", binding.etEmail.getText().toString());
        args.putString("fromWhere", "fromFrogot");
        confirmYourNumberFragment.setArguments(args);
        transaction.addToBackStack("ResetForgotPasswordFragment");
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.resetPasswordContanier, confirmYourNumberFragment, "Forgot_Authentication_F").addToBackStack("confirmYourNumberFragment").commit();

    }

}