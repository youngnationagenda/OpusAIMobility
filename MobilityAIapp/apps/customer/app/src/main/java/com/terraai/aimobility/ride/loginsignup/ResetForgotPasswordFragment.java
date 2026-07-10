package com.terraai.aimobility.ride.loginsignup;

import android.util.Log;

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

import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentResetforgotPasswordBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class ResetForgotPasswordFragment extends RootFragment implements View.OnClickListener {

    FragmentResetforgotPasswordBinding binding;
    Bundle bundle;
    String email;
    private Boolean check = true;
    private Boolean checkConfirm = true;

    public ResetForgotPasswordFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentResetforgotPasswordBinding.inflate(getLayoutInflater());
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

        binding.updatePasswordBtn.setEnabled(false);
        binding.updatePasswordBtn.setFocusable(false);

    }

    private void initializeListeners() {

        binding.newShowTxt.setOnClickListener(this);

        binding.confirmShowTxt.setOnClickListener(this);
        binding.updatePasswordBtn.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);


        binding.etNewPassword.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    binding.rltConfirmPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                }
            }
        });


        binding.etConfirmPassword.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (hasFocus) {
                    binding.rltPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.edittext_bg_stroke));
                    binding.rltConfirmPassword.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.black_bg_stroke));
                }
            }
        });


        binding.etNewPassword.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (checkInputValue()) {
                    binding.updatePasswordBtn.setEnabled(true);
                    binding.updatePasswordBtn.setFocusable(true);
                    binding.updatePasswordBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
                } else {
                    binding.updatePasswordBtn.setEnabled(false);
                    binding.updatePasswordBtn.setFocusable(false);
                    binding.updatePasswordBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method stub
            }
        });

        binding.etConfirmPassword.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method stub
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (checkInputValue()) {
                    binding.updatePasswordBtn.setEnabled(true);
                    binding.updatePasswordBtn.setFocusable(true);
                    binding.updatePasswordBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    binding.updatePasswordBtn.setEnabled(false);
                    binding.updatePasswordBtn.setFocusable(false);
                    binding.updatePasswordBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method stub
            }
        });


    }


    private boolean checkInputValue() {
        if (binding.etNewPassword.getText().length() == 0) {
            return false;
        }
        if (!Functions.isValidPassword(binding.etNewPassword.getText().toString())) {
            return false;
        }

        if (binding.etConfirmPassword.getText().length() == 0) {
            return false;
        }
        if (!binding.etNewPassword.getText().toString().equalsIgnoreCase(binding.etConfirmPassword.getText().toString())) {
            return false;
        }


        return true;
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
                callApiForChangePassword();
                break;

            case R.id.confirmShowTxt:

                Functions.hideSoftKeyboard(getActivity());
                if (!checkConfirm) {
                    checkConfirm = true;
                    String show = "<u>Show</u>";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        binding.confirmShowTxt.setText(Html.fromHtml(show, Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        binding.confirmShowTxt.setText(Html.fromHtml(show));
                    }
                    binding.etConfirmPassword.setTransformationMethod(new PasswordTransformationMethod());
                    binding.etConfirmPassword.setSelection(binding.etConfirmPassword.length());
                } else {
                    checkConfirm = false;
                    String hide = "<u>Hide</u>";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        binding.confirmShowTxt.setText(Html.fromHtml(hide, Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        binding.confirmShowTxt.setText(Html.fromHtml(hide));
                    }
                    binding.etConfirmPassword.setTransformationMethod(null);
                    binding.etConfirmPassword.setSelection(binding.etConfirmPassword.length());
                }

                break;

            case R.id.newShowTxt:
                Functions.hideSoftKeyboard(getActivity());
                if (!check) {
                    check = true;
                    String show = "<u>Show</u>";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        binding.newShowTxt.setText(Html.fromHtml(show, Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        binding.newShowTxt.setText(Html.fromHtml(show));
                    }
                    binding.etNewPassword.setTransformationMethod(new PasswordTransformationMethod());
                    binding.etNewPassword.setSelection(binding.etNewPassword.length());
                } else {
                    check = false;
                    String hide = "<u>Hide</u>";
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        binding.newShowTxt.setText(Html.fromHtml(hide, Html.FROM_HTML_MODE_LEGACY));
                    } else {
                        binding.newShowTxt.setText(Html.fromHtml(hide));
                    }
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
            params.put("email", email);
            params.put("password", binding.etNewPassword.getText().toString());
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        binding.updatePasswordBtn.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).changePasswordForgot(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.updatePasswordBtn.stopLoading();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    backPress();
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


    public void backPress() {
        FragmentManager manager = getActivity().getSupportFragmentManager();
        try {
            if (manager.getFragments() != null) {
                if (manager.getBackStackEntryCount() > 0) {
                    for (int i = 1 ; i < manager.getBackStackEntryCount(); i++)
                        manager.popBackStack();
                }
            }
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

    }

}