package com.terraai.aimobility.food;

import android.util.Log;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RatingBar;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentRatingResturantBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;


public class RatingFragment extends RootFragment implements View.OnClickListener {

    FragmentRatingResturantBinding binding;
    float rating = 0;
    Context context;
    private Bundle bundle;
    private String resId, orderId, userId;
    private FragmentCallBack callbackResponse;

    public RatingFragment(FragmentCallBack callbackResponse) {
        this.callbackResponse = callbackResponse;
    }

    public RatingFragment() {
        //required empty constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {

        // Inflate the layout for this fragment
        binding = FragmentRatingResturantBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        initLayouts();
        initializeListeners();
        bundle = getArguments();
        if (bundle != null) {
            resId = bundle.getString("id");
            orderId = bundle.getString("order_id");
        }


        binding.ratingBar.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float ratingSize, boolean b) {
                rating = ratingSize;
                Functions.logDMsg("methodInputvalidation : "+methodInputvalidation());
                if (methodInputvalidation()) {
                    enableButton();
                } else {
                    disableButton();
                }
            }
        });

        binding.etComment.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (methodInputvalidation()) {
                    enableButton();
                } else {
                    disableButton();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });


        return view;
    }

    private void disableButton() {
        binding.submitBtn.setClickable(false);
        binding.submitBtn.setEnabled(false);
        binding.submitBtn.setBackground(ContextCompat.getDrawable(context, R.drawable.un_selected_btn_grey));

    }

    private void enableButton() {
        binding.submitBtn.setClickable(true);
        binding.submitBtn.setEnabled(true);
        binding.submitBtn.setBackground(ContextCompat.getDrawable(context, R.drawable.app_color_bg_btn));

    }

    private void initializeListeners() {

        binding.cancelBtn.setOnClickListener(this);
        binding.submitBtn.setOnClickListener(this);

    }

    private void initLayouts() {
        binding.etComment.requestFocus();
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Functions.showKeyboard(getActivity());
            }
        },300);

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.cancel_btn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;

            case R.id.submit_btn:
                Functions.hideSoftKeyboard(getActivity());
                methodCallApiComment();

                break;

            default:
                break;
        }
    }

    private boolean methodInputvalidation() {

        if (TextUtils.isEmpty(binding.etComment.getText().toString())) {
            return false;
        }

        if (rating == 0) {
            return false;
        }

        return true;
    }

    private void methodCallApiComment() {
        JSONObject params = new JSONObject();
        try {
            params.put("comment", binding.etComment.getText().toString());
            params.put("user_id", userId);
            params.put("restaurant_id", resId);
            params.put("order_id", orderId);
            params.put("star", Float.toString(rating));
        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).giveRatingsToRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject responseObj = new JSONObject(resp);
                                    int code = responseObj.optInt("code");
                                    if (code == 200) {
                                        methodOpenThankyouScreen();
                                    } else {
                                        Functions.dialouge(getActivity(), "" + getActivity().getString(R.string.review_capital), "" + responseObj.getString("msg"));
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

    private void methodOpenThankyouScreen() {
        Functions.hideSoftKeyboard(getActivity());
        ThankYouFragment thankyouFragment = new ThankYouFragment(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if(bundle != null) {
                    getActivity().getSupportFragmentManager().popBackStackImmediate();
                    if (callbackResponse != null) {
                        callbackResponse.onItemClick(new Bundle());
                    }
                }
            }
        });
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top);
        ft.replace(R.id.comment_container, thankyouFragment, "thank_you").addToBackStack("thank_you").commit();
    }
}