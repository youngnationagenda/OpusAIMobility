package com.terraai.aimobility.ride.bookride;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentPromoCodeBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class PromoCodeFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentPromoCodeBinding binding;
    FragmentCallBack fragmentCallBack;

    public PromoCodeFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        // Inflate the layout for this fragment
        binding = FragmentPromoCodeBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        initializeListeners();

        return view;
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.activateCodeBtn.setOnClickListener(this);
        binding. activateCodeBtn.setEnabled(false);
        binding.activateCodeBtn.setClickable(false);
        binding.etPromoCode.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (binding.etPromoCode.getText().length() > 0) {
                    binding.activateCodeBtn.setEnabled(true);
                    binding.activateCodeBtn.setClickable(true);
                    binding.activateCodeBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    binding.activateCodeBtn.setEnabled(false);
                    binding.activateCodeBtn.setClickable(false);
                    binding.activateCodeBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
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
                dismiss();

                break;

            case R.id.activateCodeBtn:

                Functions.hideSoftKeyboard(getActivity());

                callApiForAddCoupon();


                break;

            default:
                break;
        }
    }

    private void callApiForAddCoupon() {
        JSONObject params = new JSONObject();

        try {
            params.put("coupon_code", binding.etPromoCode.getText().toString());
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.activateCodeBtn.startLoading();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).verifyCoupon(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.activateCodeBtn.stopLoading();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    JSONObject couponObj = respobj.getJSONObject("msg").getJSONObject("Coupon");
                                    String code = couponObj.optString("coupon_code");
                                    String couponId = couponObj.optString("id");
                                    String discount = couponObj.optString("discount");
                                    Bundle bundle = new Bundle();
                                    bundle.putString("coupon_code", code);
                                    bundle.putString("coupon_id", couponId);
                                    bundle.putString("discount", discount);
                                    fragmentCallBack.onItemClick(bundle);
                                    dismiss();
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

}