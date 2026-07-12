package com.terraai.aimobility.ride.payment;

import android.util.Log;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.CreditCardBrand;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.CreditCardNumberListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentAddCreditCardBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.jetbrains.annotations.NotNull;
import org.json.JSONObject;

import java.util.Calendar;

import io.card.payment.CardIOActivity;
import io.card.payment.CreditCard;


public class AddCreditCard extends Fragment implements View.OnClickListener {

    FragmentAddCreditCardBinding binding;
    String userId, userName;
    FragmentCallBack callback;
    boolean isValid = true;
    int previousLength;

    public AddCreditCard(FragmentCallBack fragmentCallBack) {
        callback = fragmentCallBack;
    }

    public AddCreditCard() {
        //required empty constructor
    }

    ActivityResultLauncher<Intent> activityResultLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            new ActivityResultCallback<ActivityResult>() {
                @Override
                public void onActivityResult(ActivityResult result) {
                    Functions.logDMsg("result : "+result);
                    Functions.logDMsg("getResultCode : "+result.getResultCode());


                        // There are no request codes
                        Intent data = result.getData();

                            if (data != null && data.hasExtra(CardIOActivity.EXTRA_SCAN_RESULT)) {
                                CreditCard scanResult = data.getParcelableExtra(CardIOActivity.EXTRA_SCAN_RESULT);

                                binding.cardNumberEdit.setText(scanResult.getFormattedCardNumber());

                                if (scanResult.isExpiryValid()) {
                                    String expiryYr = String.valueOf(scanResult.expiryYear);
                                    String enteredYear = expiryYr.substring(2);
                                    binding.expirationEdit.setText(scanResult.expiryMonth + "/" + enteredYear);
                                }

                                if (scanResult.cvv != null) {
                                    binding.cvvEdit.setText("" + scanResult.cvv);
                                }

                                if (scanResult.postalCode != null) {
                                    binding.zipCodeEdit.setText(scanResult.postalCode);
                                }
                            } else {
                                Toast.makeText(getActivity(), "Scan Cancelled", Toast.LENGTH_SHORT).show();
                            }

                }
            });


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAddCreditCardBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        userName = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.fname, "")
                + " " + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.lname, "");
        methodInitLayout();
        initializeListeners();

        return view;

    }

    /*MMethod InitLayouts*/
    private void methodInitLayout() {

        binding.buttonNext.setEnabled(false);
        binding.buttonNext.setClickable(false);
        binding.cardNumberEdit.addNumberListener(new CreditCardNumberListener() {
            @Override
            public void onChanged(@NonNull @NotNull String number, @NonNull @NotNull CreditCardBrand brand) {
                if (methodValidate()) {
                    binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
                    binding.buttonNext.setClickable(true);
                    binding.buttonNext.setEnabled(true);

                } else {
                    binding.buttonNext.setClickable(false);
                    binding.buttonNext.setEnabled(false);
                    binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));

                }
            }
        });

        binding.expirationEdit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                previousLength = binding.expirationEdit.getText().toString().length();
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int before, int i2) {
                int length = binding.expirationEdit.getText().toString().trim().length();
                String working = charSequence.toString();
                if (previousLength <= length && length < 3) {
                    int month = Integer.parseInt(binding.expirationEdit.getText().toString());

                    Functions.logDMsg("month : "+month);
                    if (length == 1 && month >= 2) {
                        String autoFixStr = "0" + month + "/";
                        binding.expirationEdit.setText(autoFixStr);
                        binding.expirationEdit.setSelection(3);
                    } else if (length == 2 && month <= 12) {
                        String autoFixStr = binding.expirationEdit.getText().toString() + "/";
                        binding.expirationEdit.setText(autoFixStr);
                        binding.expirationEdit.setSelection(3);
                    } else if (length == 2 && month > 12) {
                        binding.expirationEdit.setText("1");
                        binding.expirationEdit.setSelection(1);
                    }
                } else if (working.length() == 5 && before == 0) {
                    String enteredYear = working.substring(3);
                    String enterYear = "20" + enteredYear;
                    Functions.logDMsg("enterYear : "+enterYear);

                    int currentYear = Calendar.getInstance().get(Calendar.YEAR);
                    if (Integer.parseInt(enterYear) < currentYear) {
                        isValid = false;
                    } else {
                        isValid = true;
                    }
                }

                if (working.length() != 5) {
                    isValid = false;
                }

                if (!isValid) {
                    binding.buttonNext.setClickable(false);
                    binding.buttonNext.setEnabled(false);
                    binding. buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                } else if (isValid) {
                    if (methodValidate()) {
                        binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
                        binding.buttonNext.setClickable(true);
                        binding.buttonNext.setEnabled(true);
                    } else {
                        binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                    }
                }


            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });


        binding.cvvEdit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (methodValidate()) {

                    binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
                    binding.buttonNext.setClickable(true);
                    binding.buttonNext.setEnabled(true);

                } else {
                    binding.buttonNext.setClickable(false);
                    binding.buttonNext.setEnabled(false);
                    binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));

                }
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });

        binding.zipCodeEdit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (methodValidate()) {

                    binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
                    binding.buttonNext.setClickable(true);
                    binding.buttonNext.setEnabled(true);

                } else {
                    binding.buttonNext.setClickable(false);
                    binding.buttonNext.setEnabled(false);
                    binding.buttonNext.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));

                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });

    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.cameraIcon.setOnClickListener(this);
        binding.buttonNext.setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().getSupportFragmentManager().popBackStack();
                break;

            case R.id.nextBtn:
                Functions.hideSoftKeyboard(getActivity());
                callApiForCard();
                break;

            case R.id.button_next:
                Functions.hideSoftKeyboard(getActivity());
                callApiForCard();
                break;

            case R.id.cameraIcon:

                Intent scanIntent = new Intent(getActivity(), CardIOActivity.class);
                scanIntent.putExtra(CardIOActivity.EXTRA_REQUIRE_EXPIRY, true); // default: false
                scanIntent.putExtra(CardIOActivity.EXTRA_REQUIRE_CVV, true); // default: false
                scanIntent.putExtra(CardIOActivity.EXTRA_REQUIRE_POSTAL_CODE, false); // default: false
                scanIntent.putExtra(CardIOActivity.EXTRA_REQUIRE_CARDHOLDER_NAME, true);
                activityResultLauncher.launch(scanIntent);
                break;

            default:
                break;
        }
    }


    private void callApiForCard() {
        JSONObject params = new JSONObject();
        String[] date = binding.expirationEdit.getText().toString().split("/");
        String month = date[0];
        String year = date[1];
        try {
            params.put("user_id", userId);
            params.put("default", "0");
            params.put("name", "" + userName);
            params.put("card", binding.cardNumberEdit.getText().toString().replace(" ", ""));
            params.put("cvc", binding.cvvEdit.getText().toString().trim());
            params.put("exp_month", month);
            params.put("exp_year", year);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.logDMsg("sendobj at callApiForCard:" + params.toString());


        binding.buttonNext.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).addPaymentCard(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.buttonNext.stopLoading();

                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    if (callback != null) {
                                        callback.onItemClick(new Bundle());
                                    }
                                    getActivity().onBackPressed();
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });

    }

    private boolean methodValidate() {
        if (binding.cvvEdit.getText().length() < 3) {
            return false;
        }

        if (TextUtils.isEmpty(binding.cardNumberEdit.getText().toString())) {
            return false;
        }

        if (TextUtils.isEmpty(binding.zipCodeEdit.getText().toString())) {
            return false;
        }


        if (TextUtils.isEmpty(binding.expirationEdit.getText().toString())) {
            return false;
        }

        if(!isValid){
            return false;
        }
        return true;
    }

}