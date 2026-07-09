package com.terraai.aimobility.ride.loginsignup;

import static com.terraai.aimobility.codeclasses.MyPreferences.mPrefs;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.text.Editable;
import android.text.Html;
import android.text.InputType;
import android.text.TextWatcher;
import android.text.method.PasswordTransformationMethod;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.aws.AWSManager;
import com.klinker.android.link_builder.Link;
import com.klinker.android.link_builder.LinkBuilder;
import com.terraai.aimobility.activitiesandfragment.HomeActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.model.UserInfoModelClass;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentFinishSigningUpBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.jetbrains.annotations.NotNull;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;


public class SignUpFragment extends RootFragment implements View.OnClickListener {

    FragmentFinishSigningUpBinding binding;
    Bundle bundle;
    String devicetoken, countryId,loginType, dateOfBirth;
    Date date;
    String formattedDateToday;
    String fromWhere, email, phoneNumber;
    UserInfoModelClass infoModelClass;

    private Boolean check = true;

    public SignUpFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentFinishSigningUpBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        bundle = getArguments();
        if (bundle != null) {
            fromWhere = getArguments().getString("fromWhere");
            countryId = getArguments().getString("countryId");
            loginType = getArguments().getString("loginType");
            Functions.logDMsg("fromWhere at register : " + fromWhere);
            Functions.logDMsg("countryId at register : " + countryId);
            Functions.logDMsg("loginType at register : " + loginType);

            if (fromWhere.equals(Constants.fromSocial)) {
                infoModelClass = (UserInfoModelClass) getArguments().getSerializable("UserData");
            }

            else if (fromWhere.equals(Constants.fromPhone)) {
                phoneNumber = getArguments().getString("phone");
                Functions.logDMsg("phoneNumber at register : " + phoneNumber);
            }

            else {
                email = getArguments().getString("email");
            }

        }
        date = Calendar.getInstance().getTime();
        SimpleDateFormat df = new SimpleDateFormat("dd/MMM/yyyy", Locale.getDefault());
        formattedDateToday = df.format(date);
        devicetoken = AWSManager.getStoredDeviceToken(requireContext());

        initLayouts();
        initializeListeners();
        setUpScreenData();
        initTextWatcher();

        Link link = new Link("Terms of Service, Payments Terms of Service, Privacy Policy").setTextColor(Color.parseColor("#1853b7"));
        LinkBuilder.on(binding.tvPrivacyPolicy).addLink(link).build();
        link.setUnderlined(true);
        link.setOnClickListener(new Link.OnClickListener() {
            @Override
            public void onClick(@NotNull String s) {
                openWebView("Terms of Use", Constants.TERMS_CONDITIONS);
            }
        });

        Link link1 = new Link("Nondiscrimination Policy.").setTextColor(Color.parseColor("#1853b7")).setUnderlined(false);
        LinkBuilder.on(binding.tvPrivacyPolicy).addLink(link1).build();
        link1.setUnderlined(true);
        link1.setOnClickListener(new Link.OnClickListener() {
            @Override
            public void onClick(@NotNull String s) {
                openWebView("Privacy Policy", Constants.PRIVACY_POLICY);
            }
        });


        return view;
    }

    private void initLayouts() {
        binding.etFirstName.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        binding.etLastName.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        binding.continueBtn.setEnabled(false);
        binding.continueBtn.setFocusable(false);
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.continueBtn.setOnClickListener(this);
        binding.tvShow.setOnClickListener(this);
        binding.birthDayLayout.setOnClickListener(this);
        binding.etBirthDay.setOnClickListener(this);

    }

    private void setUpScreenData() {
        if (fromWhere.equals(Constants.fromSocial)) {
            binding.etFirstName.setText(infoModelClass.fname);
            binding.etLastName.setText(infoModelClass.lname);
            binding.etEmail.setText(infoModelClass.email);
            binding.rltPassword.setVisibility(View.GONE);
            binding.passwordText.setVisibility(View.GONE);
            binding.etEmail.setClickable(false);
            binding.etEmail.setKeyListener(null);
            binding.etEmail.setFocusable(false);
        }
        else if (fromWhere.equals(Constants.fromPhone)) {
            binding.rltPassword.setVisibility(View.GONE);
            binding.passwordText.setVisibility(View.GONE);
            binding.emailLayout.setVisibility(View.GONE);
        }

        else {
            binding.rltPassword.setVisibility(View.VISIBLE);
            binding.passwordText.setVisibility(View.VISIBLE);
            binding.etEmail.setText(email);
            binding.etEmail.setClickable(false);
            binding.etEmail.setKeyListener(null);
            binding.etEmail.setFocusable(false);
        }
    }

    private void initTextWatcher() {

        binding.etFirstName.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    binding.firstNameTextLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                    binding.lastNameLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.emailLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));

                    binding.greyLine.setVisibility(View.GONE);
                }
            }
        });

        binding.etLastName.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {

                    binding.lastNameLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                    binding.firstNameTextLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.emailLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));

                    binding.greyLine.setVisibility(View.GONE);
                }
            }
        });

        binding.etEmail.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {
                    binding.greyLine.setVisibility(View.VISIBLE);
                    binding.emailLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                    binding.firstNameTextLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.lastNameLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));


                }
            }
        });

        binding.etPassword.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {
                    binding.greyLine.setVisibility(View.VISIBLE);
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                    binding.firstNameTextLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.lastNameLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                    binding.emailLayout.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                }
            }
        });


        binding.etFirstName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
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
                //auto generated method stub
            }
        });

        binding.etBirthDay.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
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
                //auto generated method stub
            }
        });


        binding.etLastName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
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
                //auto generated method stub
            }
        });

        binding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
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
                //auto generated method stub
            }
        });

        binding.etPassword.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
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

            case R.id.birthDayLayout:
                Functions.hideSoftKeyboard(getActivity());
                Functions.methodOpenDateTimePicker(binding.etBirthDay.getText().toString(), getActivity().getSupportFragmentManager(), new com.terraai.aimobility.Interface.Callback() {
                    @Override
                    public void onResponce(String resp) {
                        binding.etBirthDay.setText(resp);
                    }
                });
                break;

            case R.id.etBirthDay:
                Functions.hideSoftKeyboard(getActivity());
                Functions.methodOpenDateTimePicker(binding.etBirthDay.getText().toString(), getActivity().getSupportFragmentManager(), new com.terraai.aimobility.Interface.Callback() {
                    @Override
                    public void onResponce(String resp) {
                        binding.etBirthDay.setText(resp);
                    }
                });
                break;

            case R.id.continueBtn:
                Functions.hideSoftKeyboard(getActivity());
                callApiForRegistration();
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
                } else {
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

            default:
                break;
        }
    }

    private void callApiForRegistration() {
        JSONObject jsonObject = new JSONObject();
        try {
            dateOfBirth = DateOperations.changeDateFormat("MM/dd/yyyy", "yyyy-MM-dd", "" + binding.etBirthDay.getText().toString());
            jsonObject.put("dob", "" + dateOfBirth);
            jsonObject.put("role", "customer");
            jsonObject.put("username", binding.etFirstName.getText().toString().toLowerCase()+"_"+binding.etLastName.getText().toString().toLowerCase());
            jsonObject.put("first_name", binding.etFirstName.getText().toString());
            jsonObject.put("last_name", binding.etLastName.getText().toString());
            jsonObject.put("country_id", countryId);

            if (fromWhere.equals(Constants.fromSocial)) {
                jsonObject.put("email", binding.etEmail.getText().toString());
                jsonObject.put("social_id", infoModelClass.socailId);
                jsonObject.put("social", infoModelClass.socailType);
                jsonObject.put("auth_token", infoModelClass.authTokon);
            }


            else if (fromWhere.equals(Constants.fromPhone)) {
                jsonObject.put("phone", phoneNumber);
            }

            else if (fromWhere.equals(Constants.fromEmail)) {
                jsonObject.put("email", binding.etEmail.getText().toString());
                jsonObject.put("password", binding.etPassword.getText().toString());
            }


        } catch (JSONException e) {
            e.printStackTrace();
        }
        binding.continueBtn.startLoading();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                jsonObject.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).registerUser(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.continueBtn.stopLoading();
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

                                        android.content.SharedPreferences.Editor editor = mPrefs.edit();

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
                                        editor.putBoolean(MyPreferences.isLogin, true);

                                        if (fromWhere.equals(Constants.fromSocial)) {
                                            editor.putBoolean(MyPreferences.isloginwithSocail, true);
                                        } else if (fromWhere.equals(Constants.fromPhone)) {

                                            editor.putBoolean(MyPreferences.isloginwithSocail, false);
                                        } else {
                                            editor.putBoolean(MyPreferences.isloginwithSocail, false);
                                        }
                                        editor.putString(MyPreferences.loginType,loginType);
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


    private boolean checkInputValue() {

        if (binding.etBirthDay.getText().length() == 0) {
            return false;
        }

        if (binding.etLastName.getText().length() == 0) {
            return false;
        }

        if (binding.etFirstName.getText().length() == 0) {
            return false;
        }

        if (!fromWhere.equals(Constants.fromPhone)) {
            if (!Functions.isValidEmail(binding.etEmail.getText().toString())) {
                return false;
            }
        }

        if (fromWhere.equals(Constants.fromEmail)) {
            if (binding.etPassword.getText().length() == 0) {
                return false;
            }
            if (!Functions.isValidPassword(binding.etPassword.getText().toString())) {
                return false;
            }
        }

        return true;
    }


    public void openWebView(String urlTitle, String sliderUrl) {
        Functions.hideSoftKeyboard(getActivity());
        WebViewFragment webviewF = new WebViewFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        Bundle bundle = new Bundle();
        bundle.putString("url", sliderUrl);
        bundle.putString("title", urlTitle);
        webviewF.setArguments(bundle);
        transaction.addToBackStack(null);
        transaction.replace(R.id.finishSigning_F, webviewF).commit();
    }

}