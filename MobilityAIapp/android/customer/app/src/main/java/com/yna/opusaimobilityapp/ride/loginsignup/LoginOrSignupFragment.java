package com.yna.opusaimobilityapp.ride.loginsignup;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.Base64;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.facebook.AccessToken;
import com.facebook.CallbackManager;
import com.facebook.FacebookCallback;
import com.facebook.FacebookException;
import com.facebook.GraphRequest;
import com.facebook.Profile;
import com.facebook.login.LoginManager;
import com.facebook.login.LoginResult;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.AuthResult;
import com.google.firebase.auth.FacebookAuthProvider;
import com.google.firebase.auth.FirebaseAuth;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.activitiesandfragment.HomeActivity;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.model.UserInfoModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentLoginOrSignupBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;


public class LoginOrSignupFragment extends RootFragment implements View.OnClickListener {

    FragmentLoginOrSignupBinding binding;
    public static UserInfoModelClass userInfoModelClass;
    FirebaseAuth mAuth;
    GoogleSignInClient mGoogleSignInClient;

    private String countryIdEmail,
            countryId = Constants.defaultCountryId,
            countryCode = Constants.defaultCountryCode,
            countryIos = Constants.defaultCountryISOCode,
            countryName = Constants.defaultCountryName;

    ActivityResultLauncher<Intent> resultCallback = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback<ActivityResult>() {
                @Override
                public void onActivityResult(ActivityResult result) {
                    Functions.logDMsg(result.toString());
                    if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                        Intent data = result.getData();
                        Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
                        handleSignInResult(task);
                    } else {
                        binding.googleText.setVisibility(View.VISIBLE);
                        binding.progressGoogle.setVisibility(View.GONE);
                    }
                }
            });
    private CallbackManager mCallbackManager;


    public LoginOrSignupFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentLoginOrSignupBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        mAuth = FirebaseAuth.getInstance();
        userInfoModelClass = new UserInfoModelClass();
        initLayouts();
        initializeListeners();
        printKeyHash();
        callApiForCountryList();
        return view;
    }
    
    public void printKeyHash() {
        try {
            PackageInfo info = getActivity().getPackageManager().getPackageInfo(getActivity().getPackageName(), PackageManager.GET_SIGNATURES);
            for (Signature signature : info.signatures) {
                MessageDigest md = MessageDigest.getInstance("SHA");
                md.update(signature.toByteArray());
                Log.i("keyhash", Base64.encodeToString(md.digest(), Base64.DEFAULT));
            }
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        } catch (NoSuchAlgorithmException e) {
            e.printStackTrace();
        }
    }

    private void initializeListeners() {

        binding.googleLoginBtn.setOnClickListener(this);
        binding.facebookLoginBtn.setOnClickListener(this);
        binding.etPhoneNumber.setOnClickListener(this);
        binding.phoneNumberRlt.setOnClickListener(this);
        binding.continueWithEmail.setOnClickListener(this);
        binding.continueBtn.setOnClickListener(this);
        binding.etCountry.setOnClickListener(this);
        binding.etEmail.setOnClickListener(this);

        binding.continueBtn.setEnabled(false);
        binding.continueBtn.setClickable(false);

        binding.etPhoneNumber.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {

                    binding.phoneNumberLayout.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                    binding.greyLine.setVisibility(View.GONE);
                }
            }
        });


        binding.etEmail.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {

                if (hasFocus) {
                    binding.emailTextInput.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                } else {
                    binding.emailTextInput.setBackgroundColor(ContextCompat.getColor(getActivity(), R.color.transparent));
                }
            }
        });

        binding.etPhoneNumber.addTextChangedListener(new TextWatcher() {
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

        binding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (binding.etEmail.getText().length() > 0 && Functions.isValidEmail(binding.etEmail.getText().toString())) {
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

    private void initLayouts() {
        binding.ccp.setCountryForNameCode(countryIos);
        binding.ccp.registerPhoneNumberTextView(binding.etPhoneNumber);
        binding.ccp.enablePhoneAutoFormatter(false);
        binding.etCountry.setText(countryName + " (" + countryCode + ")");
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.etCountry:

                Functions.hideSoftKeyboard(getActivity());
                binding.etPhoneNumber.setError(null);
                openCountryScreen();

                break;

            case R.id.googleLoginBtn:
                binding.etPhoneNumber.clearFocus();
                binding.googleText.setVisibility(View.GONE);
                binding.progressGoogle.setVisibility(View.VISIBLE);
                signInWithGmail();
                break;

            case R.id.facebookLoginBtn:
                binding.etPhoneNumber.clearFocus();
                binding.facebookText.setVisibility(View.GONE);
                binding.progressFb.setVisibility(View.VISIBLE);
                loginwithFB();

                break;

            case R.id.continueBtn:

                Functions.hideSoftKeyboard(getActivity());

                if (binding.phoneFieldLayout.getVisibility() == View.VISIBLE) {
                    if (countryId.equals(""))
                        countryId = countryIdEmail;

                    String phoneNo = Functions.getValidPhoneNumber(countryCode,binding.etPhoneNumber.getText().toString());
                    methodCallapiVerifyphoneno(phoneNo);
                } else {
                    if (TextUtils.isEmpty(binding.etEmail.getText().toString())) {
                        binding.etEmail.setError(binding.getRoot().getContext().getString(R.string.enter_the_email_address));
                        binding.etEmail.requestFocus();
                        return;
                    } else if (!Functions.isValidEmail(binding.etEmail.getText().toString())) {
                        binding.etEmail.setError(binding.getRoot().getContext().getString(R.string.invalid_email));
                        binding.etEmail.requestFocus();
                        return;
                    }

                    else {

                        checkEmailIsExistOrNot();
                    }
                }

                break;

            case R.id.continueWithEmail:

                Functions.hideSoftKeyboard(getActivity());

                if (binding.tvEmail.getText().toString().contains("Continue with Email")) {

                    binding.etPhoneNumber.setError(null);
                    binding.emailFieldLayout.setVisibility(View.VISIBLE);
                    binding.phoneFieldLayout.setVisibility(View.GONE);

                    binding.tvWeWillCall.setVisibility(View.GONE);
                    binding.tvEmail.setText("Continue with Phone");
                    binding.phoneIcon.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_mobile));

                } else {

                    binding.etEmail.setError(null);
                    binding.emailFieldLayout.setVisibility(View.GONE);
                    binding.phoneFieldLayout.setVisibility(View.VISIBLE);

                    binding.tvWeWillCall.setVisibility(View.VISIBLE);
                    binding.tvEmail.setText("Continue with Email");
                    binding.phoneIcon.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_email));

                }

                break;

            default:
                break;
        }
    }

    private void checkEmailIsExistOrNot() {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("email", binding.etEmail.getText().toString());
            jsonObject.put("role","customer");

        } catch (JSONException e) {
            e.printStackTrace();
        }
        Functions.showLoader(binding.getRoot().getContext(),false,false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                jsonObject.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyEmail(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject jsonResponse = new JSONObject(resp);
                                    int code = Integer.parseInt(jsonResponse.optString("code"));
                                    if (code == 200) {
                                        openPasswordScreen();
                                    } else {
                                        openRegisterationScreenbyEmailCheck();
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

    private void openPasswordScreen() {
        LogInFragment logInFragment = new LogInFragment();
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle args = new Bundle();
        args.putString("email",binding.etEmail.getText().toString());
        args.putString("loginType", "email");
        args.putString("countryId",countryIdEmail);
        logInFragment.setArguments(args);
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.loginContainer_f, logInFragment).addToBackStack(null).commit();
    }

    private void openRegisterationScreenbyEmailCheck() {
        SignUpFragment signinFragment = new SignUpFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle args = new Bundle();
        args.putString("fromWhere", Constants.fromEmail);
        args.putString("email", binding.etEmail.getText().toString());
        args.putString("countryId", countryIdEmail);
        args.putString("loginType", "email");
        signinFragment.setArguments(args);
        transaction.addToBackStack("RegisterPhoneNo_A");
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.loginContainer_f, signinFragment, "SigninFragment").commit();
    }

    private void openRegistrationScreen(String fromWhere) {
        SignUpFragment signinFragment = new SignUpFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle args = new Bundle();
        args.putSerializable("UserData", userInfoModelClass);
        args.putString("fromWhere", fromWhere);
        args.putString("email", binding.etEmail.getText().toString());
        args.putString("countryId", countryIdEmail);
        if(fromWhere.equals(Constants.fromSocial)){
            args.putString("loginType", "socail");
        }
        else{
            args.putString("loginType", "email");
        }

        signinFragment.setArguments(args);
        transaction.addToBackStack("RegisterPhoneNo_A");
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.loginContainer_f, signinFragment, "SigninFragment").commit();
    }

    private void openCountryScreen() {
        CountryF countryF = new CountryF(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    countryId = bundle.getString("selected_country_id");
                    countryCode = bundle.getString("selected_country_code");
                    countryIos = bundle.getString("selected_country_ios");

                    if (countryCode.contains("+")) {
                        binding.etCountry.setText(bundle.getString("selected_country") + " (" + countryCode + ")");
                    } else {
                        binding.etCountry.setText(bundle.getString("selected_country") + " (+" + countryCode + ")");
                    }
                    Log.d(Constants.TAG,"countryIos: "+countryIos);
                    binding.ccp.setCountryForNameCode(countryIos);

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
            }
        });
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putString("countryId",countryId);
        countryF.setArguments(bundle);
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        transaction.replace(R.id.loginContainer_f, countryF).addToBackStack(null).commit();

    }

    public void signInWithGmail() {
        String serverClientId = binding.getRoot().getContext().getString(R.string.google_web_client_id);

        GoogleSignInOptions gso = new GoogleSignInOptions
                .Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestIdToken(serverClientId)
                .requestServerAuthCode(serverClientId, false)
                .build();

        mGoogleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

        if (mGoogleSignInClient != null) {
            mGoogleSignInClient.signOut();
        }

        Intent signInIntent = mGoogleSignInClient.getSignInIntent();
        resultCallback.launch(signInIntent);

    }

    //Relate to google login
    private void handleSignInResult(Task<GoogleSignInAccount> completedTask) {

        try {
            GoogleSignInAccount account = completedTask.getResult(ApiException.class);

            if (account != null) {
                String id = account.getId();
                String fname = "" + account.getGivenName();
                String lname = "" + account.getFamilyName();
                String authToken = account.getIdToken();
                String email = account.getEmail();

                LoginOrSignupFragment.userInfoModelClass.fname = fname;
                LoginOrSignupFragment.userInfoModelClass.email = email;
                LoginOrSignupFragment.userInfoModelClass.socailId = id;
                LoginOrSignupFragment.userInfoModelClass.authTokon = authToken;
                LoginOrSignupFragment.userInfoModelClass.socailType = "google";
                LoginOrSignupFragment.userInfoModelClass.isSocial = "yes";
                // if we do not get the picture of user then we will use default profile picture
                if (lname.contains(" ")) {
                    lname = lname.replace(" ", "");
                }
                LoginOrSignupFragment.userInfoModelClass.lname = lname;

                Functions.logDMsg("params at authTokon : " + authToken.toString());

                callApiForLoginSocail("" + id, "google", authToken);

            } else {
                binding.googleText.setVisibility(View.VISIBLE);
                binding.progressGoogle.setVisibility(View.GONE);
                Functions.logDMsg("empty at google login ");
            }
        } catch (ApiException e) {
            binding.googleText.setVisibility(View.VISIBLE);
            binding.progressGoogle.setVisibility(View.GONE);
            e.printStackTrace();
            Functions.logDMsg("exception at login : " + e.toString());
        }
    }

    //facebook implimentation
    public void loginwithFB() {

        LoginManager.getInstance()
                .logInWithReadPermissions(getActivity(),
                        Arrays.asList("public_profile", "email"));

        mCallbackManager = CallbackManager.Factory.create();
        LoginManager.getInstance().logOut();
        LoginManager.getInstance().registerCallback(mCallbackManager, new FacebookCallback<LoginResult>() {
            @Override
            public void onSuccess(LoginResult loginResult) {
                handleFacebookAccessToken(loginResult.getAccessToken());
            }

            @Override
            public void onCancel() {
                binding.facebookText.setVisibility(View.VISIBLE);
                binding.progressFb.setVisibility(View.GONE);
            }

            @Override
            public void onError(FacebookException error) {
                Log.d("resp", "" + error.toString());
                binding.facebookText.setVisibility(View.VISIBLE);
                binding.progressFb.setVisibility(View.GONE);
            }

        });

    }

    private void handleFacebookAccessToken(final AccessToken token) {
        // if user is login then this method will call and
        // facebook will return us a token which will user for get the info of user
        AuthCredential credential = FacebookAuthProvider.getCredential(token.getToken());
        mAuth.signInWithCredential(credential).addOnCompleteListener(new OnCompleteListener<AuthResult>() {
            @Override
            public void onComplete(@NonNull @NotNull Task<AuthResult> task) {
                if (task.isSuccessful()) {
                    final String socailId = Profile.getCurrentProfile().getId();
                    GraphRequest request = GraphRequest.newMeRequest(token, (user, graphResponse) -> {
                        //after get the info of user we will pass to function which will store the info in our server
                        String fname = "" + user.optString("first_name");
                        String lname = "" + user.optString("last_name");
                        String email = "" + user.optString("email");
                        String authToken = token.getToken();

                        LoginOrSignupFragment.userInfoModelClass.fname = fname;
                        LoginOrSignupFragment.userInfoModelClass.email = email;
                        LoginOrSignupFragment.userInfoModelClass.lname = lname;
                        LoginOrSignupFragment.userInfoModelClass.socailId = socailId;
                        LoginOrSignupFragment.userInfoModelClass.authTokon = authToken;
                        LoginOrSignupFragment.userInfoModelClass.socailType = "facebook";
                        LoginOrSignupFragment.userInfoModelClass.isSocial = "yes";
                        LoginOrSignupFragment.userInfoModelClass.countryId = countryIdEmail;
                        callApiForLoginSocail("" + socailId, "facebook", authToken);

                    });

                    // here is the request to facebook sdk for which type of info we have required
                    Bundle parameters = new Bundle();
                    parameters.putString("fields", "last_name,first_name,email");
                    request.setParameters(parameters);
                    request.executeAsync();
                } else {
                    binding.facebookText.setVisibility(View.VISIBLE);
                    binding.progressFb.setVisibility(View.GONE);
                }

            }
        });
    }


    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        // Pass the activity result back to the Facebook SDK
        if (mCallbackManager != null) {
            mCallbackManager.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void callApiForLoginSocail(String socailId, String socialType, String authToken) {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("social", socialType);
            jsonObject.put("social_id", socailId);
            jsonObject.put("auth_token", authToken);
            jsonObject.put("role","customer");

        } catch (JSONException e) {
            e.printStackTrace();
        }
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                jsonObject.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).registerUser(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.googleText.setVisibility(View.VISIBLE);
                        binding.progressGoogle.setVisibility(View.GONE);
                        binding.facebookText.setVisibility(View.VISIBLE);
                        binding.progressFb.setVisibility(View.GONE);
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject jsonResponse = new JSONObject(resp);
                                    int code = Integer.parseInt(jsonResponse.optString("code"));
                                    if (code == 200) {
                                        parseLoginResponce(jsonResponse);
                                    } else {
                                        openRegistrationScreen(Constants.fromSocial);
                                    }
                                } catch (Exception e) {
                                    binding.googleText.setVisibility(View.VISIBLE);
                                    binding.progressGoogle.setVisibility(View.GONE);
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

    private void parseLoginResponce(JSONObject result) {
        try {
            JSONObject userobj = result.getJSONObject("msg").getJSONObject("User");
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

            JSONObject countryobj = result.getJSONObject("msg").getJSONObject("Country");
            String countryId = "" + countryobj.optString("id");
            String countryName = "" + countryobj.optString("name");
            String countryIsoCode = "" + countryobj.optString("iso");
            String country_code = "" + countryobj.optString("country_code");

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

            editor.putString(MyPreferences.countryId, countryId);
            editor.putString(MyPreferences.countryName, countryName);
            editor.putString(MyPreferences.countryIsoCode, countryIsoCode);
            editor.putString(MyPreferences.country_code, country_code);
            editor.putBoolean(MyPreferences.isLogin, true);
            editor.putBoolean(MyPreferences.isloginwithSocail, true);
            editor.putString(MyPreferences.loginType, "socail");
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

    public void methodCallapiVerifyphoneno(String phoneNo) {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("verify", "0");
            sendobj.put("phone", phoneNo);
            sendobj.put("role","customer");
        } catch (Exception e) {
            e.printStackTrace();
        }

        binding.continueBtn.startLoading();
        binding.continueWithEmail.setEnabled(false);
        binding.googleLoginBtn.setEnabled(false);
        binding.facebookLoginBtn.setEnabled(false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyPhoneNo(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.continueBtn.stopLoading();
                        binding.continueWithEmail.setEnabled(true);
                        binding.googleLoginBtn.setEnabled(true);
                        binding.facebookLoginBtn.setEnabled(true);
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {

                                    ConfirmYourNumberFragment confirmYourNumberFragment = new ConfirmYourNumberFragment();
                                    FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                                    Bundle args = new Bundle();
                                    args.putString("phone_no", phoneNo);
                                    args.putString("countryId", countryId);
                                    args.putString("fromWhere", "login");
                                    args.putString("loginType", "phone");
                                    confirmYourNumberFragment.setArguments(args);
                                    transaction.addToBackStack("ConfirmYourNumberFragment");
                                    transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                                    transaction.replace(R.id.loginContainer_f, confirmYourNumberFragment, "Forgot_Authentication_F").commit();

                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                binding.continueBtn.stopLoading();
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }


    private void callApiForCountryList() {
        JSONObject params = new JSONObject();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showCountries(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    JSONArray msgarray = respobj.getJSONArray("msg");
                                    for (int i = 0; i < msgarray.length(); i++) {
                                        JSONObject countriesobj = msgarray.getJSONObject(i).getJSONObject("Country");
                                        if (countriesobj.optString("iso").equalsIgnoreCase(countryIos.toLowerCase())) {
                                            countryIdEmail = "" + countriesobj.optString("id");
                                            countryId = "" + countriesobj.optString("id");
                                        }
                                    }
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