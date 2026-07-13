package com.yna.opusaimobilityapp.ride.loginsignup;

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

import com.google.firebase.messaging.FirebaseMessaging;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.activitiesandfragment.HomeActivity;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentLogInBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class LogInFragment extends RootFragment implements View.OnClickListener {

    String deviceToken, email ,loginType;
    Bundle bundle;
    private Boolean check = true;
    FragmentLogInBinding binding;
    String countryIdEmail;
    public LogInFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentLogInBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        bundle = getArguments();
        if (bundle != null) {
            email = getArguments().getString("email");
            loginType = getArguments().getString("loginType");
            countryIdEmail = getArguments().getString("countryId");

        }
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        return;
                    }
                    Functions.logDMsg("firebase token : " + task.getResult());
                    deviceToken = task.getResult();
                });

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

        binding.etPassword.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                } else {
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));
                }
            }
        });

        binding.etPassword.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                    //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (checkInputValue()) {
                    binding.continueBtn.setEnabled(true);
                    binding.continueBtn.setFocusable(true);
                    binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    binding.continueBtn.setEnabled(false);
                    binding.continueBtn.setFocusable(false);
                    binding.continueBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
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
            case R.id.tvShow:

                Functions.hideSoftKeyboard(getActivity());
                if (!check) {
                    check = true;
                    String show = "<u>Show</u>";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        binding.tvShow.setText(Html.fromHtml(show, Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        binding.tvShow.setText(Html.fromHtml(show));
                    }
                    binding.etPassword.setTransformationMethod(new PasswordTransformationMethod());
                    binding.etPassword.setSelection(binding.etPassword.length());
                }
                else {
                    check = false;
                    String hide = "<u>Hide</u>";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        binding.tvShow.setText(Html.fromHtml(hide, Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        binding.tvShow.setText(Html.fromHtml(hide));
                    }
                    binding.etPassword.setTransformationMethod(null);
                    binding.etPassword.setSelection(binding.etPassword.length());
                }

                break;

            case R.id.tvForgotPassword:
                Functions.hideSoftKeyboard(getActivity());
                openForgotPassword();

                break;

            case R.id.continueBtn:

                Functions.hideSoftKeyboard(getActivity());
                callApiForLogin();

                break;

            default:
                break;
        }
    }

    private void callApiForLogin() {
        JSONObject params = new JSONObject();

        try {
            params.put("email", email);
            params.put("password", "" + binding.etPassword.getText().toString());
            params.put("device_token", deviceToken);
            params.put("role","customer");

        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.continueBtn.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).login(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.continueBtn.stopLoading();
                        if (isSuccess)
                        {
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

                                }

                                else {
                                    openRegistrationScreen();
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

    private void openForgotPassword() {
        Functions.hideSoftKeyboard(getActivity());
        binding.etPassword.setText("");
        ForgotPasswordFragment forgotPasswordFragment = new ForgotPasswordFragment();
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        Bundle bundle = new Bundle();
        bundle.putString("email",email);
        forgotPasswordFragment.setArguments(bundle);
        FragmentTransaction ft = fragmentManager.beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.log_inContainer_f, forgotPasswordFragment).addToBackStack("forgotPasswordFragment").commit();
    }


    private boolean checkInputValue() {
        if (binding.etPassword.getText().length() == 0) {
            return false;
        }
        if (!Functions.isValidPassword(binding.etPassword.getText().toString())) {
            return false;
        }


        return true;
    }




    private void openRegistrationScreen() {
        SignUpFragment signinFragment = new SignUpFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle args = new Bundle();
        args.putString("fromWhere", Constants.fromEmail);
        args.putString("email", email);
        args.putString("countryId", countryIdEmail);
        args.putString("loginType", "email");
        signinFragment.setArguments(args);
        transaction.addToBackStack("RegisterPhoneNo_A");
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.loginContainer_f, signinFragment, "SigninFragment").commit();
    }

}