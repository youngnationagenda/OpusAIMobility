package com.terraai.aimobility.ride.loginsignup;

import android.util.Log;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.Html;
import android.text.TextWatcher;
import android.text.method.PasswordTransformationMethod;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.activitiesandfragment.HomeActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.aws.AWSManager;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentLogInBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

/**
 * LogInFragment — email/password login via aimobility Lambda API + AWS Cognito.
 *
 * MIGRATION: FirebaseMessaging.getToken() replaced with
 *            AWSManager.getStoredDeviceToken() — device token is set by
 *            AWSPushService when the app first registers with SNS.
 */
public class LogInFragment extends RootFragment implements View.OnClickListener {

    private String deviceToken, email, loginType;
    private Bundle bundle;
    private Boolean check = true;
    private FragmentLogInBinding binding;
    private String countryIdEmail;

    public LogInFragment() {}

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentLogInBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        bundle = getArguments();
        if (bundle != null) {
            email          = getArguments().getString("email");
            loginType      = getArguments().getString("loginType");
            countryIdEmail = getArguments().getString("countryId");
        }

        // ── Get device token from AWS SNS (no Firebase SDK) ──────────────────
        deviceToken = AWSManager.getStoredDeviceToken(requireContext());
        Functions.logDMsg("AWS device token: " + deviceToken);

        initLayouts();
        initializeListeners();
        return view;
    }

    private void initLayouts() {
        binding.continueBtn.setEnabled(false);
        binding.continueBtn.setFocusable(false);
    }

    private void initializeListeners() {
        binding.backBtn.setOnClickListener(this);
        binding.continueBtn.setOnClickListener(this);
        binding.tvForgotPassword.setOnClickListener(this);
        binding.tvShow.setOnClickListener(this);

        binding.etPassword.setOnFocusChangeListener((v, hasFocus) -> {
            binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(),
                    hasFocus ? R.drawable.black_bg_stroke : R.drawable.edittext_bg_stroke));
        });

        binding.etPassword.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int st, int c, int a) {}
            @Override public void afterTextChanged(Editable s) {}
            @Override
            public void onTextChanged(CharSequence s, int st, int b, int c) {
                boolean valid = checkInputValue();
                binding.continueBtn.setEnabled(valid);
                binding.continueBtn.setFocusable(valid);
                binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(),
                        valid ? R.drawable.app_color_bg_btn : R.drawable.un_selected_btn_grey));
            }
        });
    }

    @Override
    public void onClick(View v) {
        int id = v.getId();
        if (id == R.id.backBtn) {
            Functions.hideSoftKeyboard(getActivity());
            getActivity().onBackPressed();
        } else if (id == R.id.tvShow) {
            togglePasswordVisibility();
        } else if (id == R.id.tvForgotPassword) {
            Functions.hideSoftKeyboard(getActivity());
            openForgotPassword();
        } else if (id == R.id.continueBtn) {
            Functions.hideSoftKeyboard(getActivity());
            callApiForLogin();
        }
    }

    private void togglePasswordVisibility() {
        check = !check;
        String label = check ? "<u>Show</u>" : "<u>Hide</u>";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N)
            binding.tvShow.setText(Html.fromHtml(label, Html.FROM_HTML_MODE_LEGACY));
        else
            binding.tvShow.setText(Html.fromHtml(label));
        binding.etPassword.setTransformationMethod(check ? new PasswordTransformationMethod() : null);
        binding.etPassword.setSelection(binding.etPassword.length());
    }

    private void callApiForLogin() {
        JSONObject params = new JSONObject();
        try {
            params.put("email", email);
            params.put("password", binding.etPassword.getText().toString());
            params.put("device_token", deviceToken);
            params.put("role", "customer");
        } catch (Exception e) { Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e); }

        binding.continueBtn.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).login(params.toString()),
                new ApiCallback() {
                    @Override
                    public void onResponce(String resp, boolean isSuccess) {
                        binding.continueBtn.stopLoading();
                        if (isSuccess && resp != null) {
                            try {
                                JSONObject r = new JSONObject(resp);
                                if (r.getString("code").equals("200")) {
                                    saveUserAndNavigate(r);
                                } else {
                                    openRegistrationScreen();
                                    Functions.dialouge(binding.getRoot().getContext(),
                                            getString(R.string.alert), r.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Login error: " + e);
                            }
                        }
                    }
                });
    }

    private void saveUserAndNavigate(JSONObject r) throws Exception {
        JSONObject userObj    = r.getJSONObject("msg").getJSONObject("User");
        JSONObject countryObj = r.getJSONObject("msg").getJSONObject("Country");

        android.content.SharedPreferences.Editor ed =
                MyPreferences.getSharedPreference(getActivity()).edit();
        ed.putString(MyPreferences.fname,       userObj.optString("first_name"));
        ed.putString(MyPreferences.lname,       userObj.optString("last_name"));
        ed.putString(MyPreferences.USER_ID,     userObj.optString("id"));
        ed.putString(MyPreferences.email,       userObj.optString("email"));
        ed.putString(MyPreferences.image,       userObj.optString("image"));
        ed.putString(MyPreferences.deviceTokon, userObj.optString("device_token"));
        ed.putString(MyPreferences.password,    userObj.optString("password"));
        ed.putString(MyPreferences.phoneNo,     userObj.optString("phone"));
        ed.putString(MyPreferences.gender,      userObj.optString("gender"));
        ed.putString(MyPreferences.dob,         userObj.optString("dob"));
        ed.putString(MyPreferences.role,        userObj.optString("role"));
        ed.putString(MyPreferences.userName,    userObj.optString("username"));
        ed.putString(MyPreferences.created,     userObj.optString("created"));
        ed.putString(MyPreferences.wallet,      userObj.optString("wallet"));
        ed.putString(MyPreferences.loginType,   loginType);
        ed.putString(MyPreferences.countryId,       countryObj.optString("id"));
        ed.putString(MyPreferences.countryName,     countryObj.optString("name"));
        ed.putString(MyPreferences.countryIsoCode,  countryObj.optString("short_name"));
        ed.putString(MyPreferences.country_code,    countryObj.optString("phonecode"));
        ed.putBoolean(MyPreferences.isLogin, true);
        ed.putBoolean(MyPreferences.isloginwithSocail, false);
        ed.putString(MyPreferences.setlocale, "en");
        ed.commit();

        startActivity(new Intent(getActivity(), HomeActivity.class));
        getActivity().overridePendingTransition(R.anim.in_from_right, R.anim.out_to_left);
        getActivity().finish();
    }

    private void openForgotPassword() {
        binding.etPassword.setText("");
        ForgotPasswordFragment frag = new ForgotPasswordFragment();
        Bundle b = new Bundle();
        b.putString("email", email);
        frag.setArguments(b);
        FragmentManager fm = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fm.beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.log_inContainer_f, frag).addToBackStack("forgotPasswordFragment").commit();
    }

    private void openRegistrationScreen() {
        SignUpFragment frag = new SignUpFragment();
        Bundle args = new Bundle();
        args.putString("fromWhere", Constants.fromEmail);
        args.putString("email", email);
        args.putString("countryId", countryIdEmail);
        args.putString("loginType", "email");
        frag.setArguments(args);
        FragmentTransaction ft = getActivity().getSupportFragmentManager().beginTransaction();
        ft.addToBackStack("RegisterPhoneNo_A");
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.loginContainer_f, frag, "SigninFragment").commit();
    }

    private boolean checkInputValue() {
        return binding.etPassword.getText().length() > 0
                && Functions.isValidPassword(binding.etPassword.getText().toString());
    }
}
