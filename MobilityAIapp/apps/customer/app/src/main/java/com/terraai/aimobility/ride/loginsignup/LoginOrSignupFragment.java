package com.terraai.aimobility.ride.loginsignup;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.Log;
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
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.UserInfoModelClass;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentLoginOrSignupBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * LoginOrSignupFragment — AWS Cognito / aimobility API authentication.
 *
 * MIGRATION from Firebase/Google/Facebook:
 *  - FirebaseAuth       → AWSManager.emailLogin() / Cognito
 *  - GoogleSignIn       → Removed (use email/phone login instead)
 *  - Facebook SDK login → Removed (use email/phone login instead)
 *
 * Social login (Google/Apple) can be re-added via AWS Cognito Federated Identities
 * using the standard Android Google Sign-In SDK pointing to a Cognito Identity Pool
 * — no Firebase dependency required.
 */
public class LoginOrSignupFragment extends RootFragment implements View.OnClickListener {

    private static final String TAG = Constants.TAG + "LoginOrSignup";

    FragmentLoginOrSignupBinding binding;
    public static UserInfoModelClass userInfoModelClass;

    private String countryIdEmail,
            countryId   = Constants.defaultCountryId,
            countryCode = Constants.defaultCountryCode,
            countryIos  = Constants.defaultCountryISOCode,
            countryName = Constants.defaultCountryName;

    public LoginOrSignupFragment() {}

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentLoginOrSignupBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userInfoModelClass = new UserInfoModelClass();
        initLayouts();
        initializeListeners();
        callApiForCountryList();
        return view;
    }

    private void initializeListeners() {

        // Google and Facebook buttons hidden — AWS Cognito used instead
        if (binding.googleLoginBtn != null)   binding.googleLoginBtn.setVisibility(View.GONE);
        if (binding.facebookLoginBtn != null) binding.facebookLoginBtn.setVisibility(View.GONE);

        binding.continueBtn.setOnClickListener(this);
        binding.continueWithEmail.setOnClickListener(this);
        binding.etCountry.setOnClickListener(this);
        binding.continueBtn.setEnabled(false);
        binding.continueBtn.setClickable(false);

        binding.etPhoneNumber.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                binding.phoneNumberLayout.setBackground(
                        ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                binding.greyLine.setVisibility(View.GONE);
            }
        });

        binding.etEmail.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus) {
                binding.emailTextInput.setBackground(
                        ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
            } else {
                binding.emailTextInput.setBackgroundColor(
                        ContextCompat.getColor(getActivity(), R.color.transparent));
            }
        });

        binding.etPhoneNumber.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int st, int c, int a) {}
            @Override public void afterTextChanged(Editable s) {}
            @Override
            public void onTextChanged(CharSequence s, int st, int b, int c) {
                boolean valid = binding.etPhoneNumber.getText().length() > 0
                        && binding.ccp.isValid();
                setButtonEnabled(valid);
            }
        });

        binding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int st, int c, int a) {}
            @Override public void afterTextChanged(Editable s) {}
            @Override
            public void onTextChanged(CharSequence s, int st, int b, int c) {
                boolean valid = binding.etEmail.getText().length() > 0
                        && Functions.isValidEmail(binding.etEmail.getText().toString());
                setButtonEnabled(valid);
            }
        });
    }

    private void setButtonEnabled(boolean enabled) {
        binding.continueBtn.setEnabled(enabled);
        binding.continueBtn.setClickable(enabled);
        binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(),
                enabled ? R.drawable.app_color_bg_btn : R.drawable.un_selected_btn_grey));
    }

    private void initLayouts() {
        binding.ccp.setCountryForNameCode(countryIos);
        binding.ccp.registerPhoneNumberTextView(binding.etPhoneNumber);
        binding.ccp.enablePhoneAutoFormatter(false);
        binding.etCountry.setText(countryName + " (" + countryCode + ")");
    }

    @Override
    public void onClick(View v) {
        int id = v.getId();

        if (id == R.id.etCountry) {
            Functions.hideSoftKeyboard(getActivity());
            binding.etPhoneNumber.setError(null);
            openCountryScreen();

        } else if (id == R.id.continueBtn) {
            Functions.hideSoftKeyboard(getActivity());
            if (binding.phoneFieldLayout.getVisibility() == View.VISIBLE) {
                if (countryId.equals("")) countryId = countryIdEmail;
                String phoneNo = Functions.getValidPhoneNumber(
                        countryCode, binding.etPhoneNumber.getText().toString());
                methodCallapiVerifyphoneno(phoneNo);
            } else {
                String emailVal = binding.etEmail.getText().toString();
                if (TextUtils.isEmpty(emailVal)) {
                    binding.etEmail.setError(getString(R.string.enter_the_email_address));
                    binding.etEmail.requestFocus();
                } else if (!Functions.isValidEmail(emailVal)) {
                    binding.etEmail.setError(getString(R.string.invalid_email));
                    binding.etEmail.requestFocus();
                } else {
                    checkEmailIsExistOrNot();
                }
            }

        } else if (id == R.id.continueWithEmail) {
            Functions.hideSoftKeyboard(getActivity());
            if (binding.tvEmail.getText().toString().contains("Continue with Email")) {
                binding.emailFieldLayout.setVisibility(View.VISIBLE);
                binding.phoneFieldLayout.setVisibility(View.GONE);
                binding.tvWeWillCall.setVisibility(View.GONE);
                binding.tvEmail.setText("Continue with Phone");
                binding.phoneIcon.setImageDrawable(
                        ContextCompat.getDrawable(getActivity(), R.drawable.ic_mobile));
            } else {
                binding.emailFieldLayout.setVisibility(View.GONE);
                binding.phoneFieldLayout.setVisibility(View.VISIBLE);
                binding.tvWeWillCall.setVisibility(View.VISIBLE);
                binding.tvEmail.setText("Continue with Email");
                binding.phoneIcon.setImageDrawable(
                        ContextCompat.getDrawable(getActivity(), R.drawable.ic_email));
            }
        }
    }

    // ── Email check (does user exist in Cognito/DB?) ─────────────────────────
    private void checkEmailIsExistOrNot() {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("email", binding.etEmail.getText().toString());
            jsonObject.put("role", "customer");
        } catch (JSONException e) { e.printStackTrace(); }

        Functions.showLoader(binding.getRoot().getContext(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                jsonObject.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyEmail(jsonObject.toString()),
                new ApiCallback() {
                    @Override
                    public void onResponce(String resp, boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess && resp != null) {
                            try {
                                JSONObject json = new JSONObject(resp);
                                if (json.optString("code").equals("200")) openPasswordScreen();
                                else openRegisterationScreenbyEmailCheck();
                            } catch (Exception e) {
                                Log.e(TAG, "checkEmail: " + e);
                            }
                        }
                    }
                });
    }

    private void openPasswordScreen() {
        LogInFragment logInFragment = new LogInFragment();
        Bundle args = new Bundle();
        args.putString("email", binding.etEmail.getText().toString());
        args.putString("loginType", "email");
        args.putString("countryId", countryIdEmail);
        logInFragment.setArguments(args);
        FragmentTransaction ft = getActivity().getSupportFragmentManager().beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.loginContainer_f, logInFragment).addToBackStack(null).commit();
    }

    private void openRegisterationScreenbyEmailCheck() {
        SignUpFragment signUpFragment = new SignUpFragment();
        Bundle args = new Bundle();
        args.putString("fromWhere", Constants.fromEmail);
        args.putString("email", binding.etEmail.getText().toString());
        args.putString("countryId", countryIdEmail);
        args.putString("loginType", "email");
        signUpFragment.setArguments(args);
        FragmentTransaction ft = getActivity().getSupportFragmentManager().beginTransaction();
        ft.addToBackStack("RegisterPhoneNo_A");
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.loginContainer_f, signUpFragment, "SigninFragment").commit();
    }

    private void openRegistrationScreen(String fromWhere) {
        SignUpFragment signUpFragment = new SignUpFragment();
        Bundle args = new Bundle();
        args.putSerializable("UserData", userInfoModelClass);
        args.putString("fromWhere", fromWhere);
        args.putString("email", binding.etEmail.getText().toString());
        args.putString("countryId", countryIdEmail);
        args.putString("loginType", fromWhere.equals(Constants.fromSocial) ? "social" : "email");
        signUpFragment.setArguments(args);
        FragmentTransaction ft = getActivity().getSupportFragmentManager().beginTransaction();
        ft.addToBackStack("RegisterPhoneNo_A");
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.loginContainer_f, signUpFragment, "SigninFragment").commit();
    }

    private void openCountryScreen() {
        CountryF countryF = new CountryF(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    countryId   = bundle.getString("selected_country_id");
                    countryCode = bundle.getString("selected_country_code");
                    countryIos  = bundle.getString("selected_country_ios");
                    String label = bundle.getString("selected_country")
                            + (countryCode.contains("+") ? " (" + countryCode + ")"
                            : " (+" + countryCode + ")");
                    binding.etCountry.setText(label);
                    binding.ccp.setCountryForNameCode(countryIos);
                    setButtonEnabled(binding.ccp.isValid());
                }
            }
        });
        Bundle bundle = new Bundle();
        bundle.putString("countryId", countryId);
        countryF.setArguments(bundle);
        FragmentTransaction ft = getActivity().getSupportFragmentManager().beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.loginContainer_f, countryF).addToBackStack(null).commit();
    }

    // ── Phone verification ───────────────────────────────────────────────────
    public void methodCallapiVerifyphoneno(String phoneNo) {
        JSONObject sendobj = new JSONObject();
        try {
            sendobj.put("verify", "0");
            sendobj.put("phone", phoneNo);
            sendobj.put("role", "customer");
        } catch (Exception e) { e.printStackTrace(); }

        binding.continueBtn.startLoading();
        binding.continueWithEmail.setEnabled(false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyPhoneNo(sendobj.toString()),
                new ApiCallback() {
                    @Override
                    public void onResponce(String resp, boolean isSuccess) {
                        binding.continueBtn.stopLoading();
                        binding.continueWithEmail.setEnabled(true);
                        if (isSuccess && resp != null) {
                            try {
                                JSONObject r = new JSONObject(resp);
                                if (r.getString("code").equals("200")) {
                                    ConfirmYourNumberFragment confirmFrag = new ConfirmYourNumberFragment();
                                    Bundle args = new Bundle();
                                    args.putString("phone_no", phoneNo);
                                    args.putString("countryId", countryId);
                                    args.putString("fromWhere", "login");
                                    args.putString("loginType", "phone");
                                    confirmFrag.setArguments(args);
                                    FragmentTransaction ft = getActivity()
                                            .getSupportFragmentManager().beginTransaction();
                                    ft.addToBackStack("ConfirmYourNumberFragment");
                                    ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left,
                                            R.anim.in_from_left, R.anim.out_to_right);
                                    ft.replace(R.id.loginContainer_f, confirmFrag,
                                            "Forgot_Authentication_F").commit();
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(),
                                            getString(R.string.alert), r.getString("msg"));
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "verifyPhone: " + e);
                            }
                        }
                    }
                });
    }

    // ── Country list from API ────────────────────────────────────────────────
    private void callApiForCountryList() {
        JSONObject params = new JSONObject();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showCountries(params.toString()),
                new ApiCallback() {
                    @Override
                    public void onResponce(String resp, boolean isSuccess) {
                        if (isSuccess && resp != null) {
                            try {
                                JSONObject r = new JSONObject(resp);
                                if (r.getString("code").equals("200")) {
                                    JSONArray arr = r.getJSONArray("msg");
                                    for (int i = 0; i < arr.length(); i++) {
                                        JSONObject c = arr.getJSONObject(i).getJSONObject("Country");
                                        if (c.optString("iso").equalsIgnoreCase(countryIos)) {
                                            countryIdEmail = c.optString("id");
                                            countryId = c.optString("id");
                                        }
                                    }
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "countryList: " + e);
                            }
                        }
                    }
                });
    }
}
