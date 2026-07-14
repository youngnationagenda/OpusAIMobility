package com.yna.opusaimobilityapp.ride.activeride;

import android.app.Dialog;
import android.app.NotificationManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.RatingBar;

import androidx.core.content.ContextCompat;

import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.activitiesandfragment.HomeActivity;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.DateOperations;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.RideReviewLayoutBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;


public class RatingFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    Bundle bundle;
    FragmentCallBack fragmentCallBack;
    String driverImage, driverId, requestId, driverName, end_ride_datetime, totalFare, paymenttpe, currencySymbol;
    float rating;
    boolean clicked = true;
    String walletAdd;
    String payCollectFromWallet;
    String payCollectFromCash;
    String type;
    RideReviewLayoutBinding binding;

    public RatingFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    public RatingFragment() {
        //epmty constructor required
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = RideReviewLayoutBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        currencySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        bundle = getArguments();
        if (bundle != null) {
            driverImage = bundle.getString("drivePic");
            driverName = bundle.getString("driverNameText");
            totalFare = bundle.getString("ridefare");
            walletAdd = bundle.getString("wallet_add");
            payCollectFromWallet = bundle.getString("wallet_pay");
            payCollectFromCash = bundle.getString("amount_collected");
            end_ride_datetime = bundle.getString("end_ride_datetime");
            paymenttpe = bundle.getString("paymentType");
            requestId = bundle.getString("requestId");
            driverId = bundle.getString("driverId");
            type = bundle.getString("type");
        }
        initializeListeners();

        setUpScreenData();
        methodRatingClick();
        return view;
    }

    private void setUpScreenData() {


        binding.timeTxt.setText(DateOperations.changeDateFormat("yyyy-MM-dd HH:mm:ss", "EEE MMM dd HH:mm a", "" + end_ride_datetime));
        binding.earnedPointsText.setText(getActivity().getResources().getString(R.string.you_ve_earned_103_points) + " " + driverName + " " + getActivity().getResources().getString(R.string.points));
        binding.askingExperienceText.setText(getActivity().getResources().getString(R.string.how_was_your_experience_with_john) + " " + driverName + " ?");
        binding.tvTotalFare.setText(currencySymbol + " " + totalFare);

        if (paymenttpe.equalsIgnoreCase("cash")) {
            binding.paymentType.setText(getActivity().getResources().getString(R.string.cash));
            binding.cashImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_cash));
        } else {
            binding.paymentType.setText(getResources().getString(R.string.card));
            binding.cashImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_credit_debut_card));
        }

        if (payCollectFromCash != null && !payCollectFromCash.equalsIgnoreCase("") && !payCollectFromCash.equalsIgnoreCase("0")) {
            binding.tvCashPaid.setText(currencySymbol + " " + payCollectFromCash);
        } else {
            binding.cashLayout.setVisibility(View.GONE);
        }

        if (payCollectFromWallet != null && !payCollectFromWallet.equalsIgnoreCase("") && !payCollectFromWallet.equalsIgnoreCase("0")) {
            binding.tvWalletPay.setText(currencySymbol + " " + payCollectFromWallet);
        } else {
            binding.opusaimobilityPayLayout.setVisibility(View.GONE);
        }

        if (walletAdd != null && !walletAdd.equalsIgnoreCase("")) {
            binding.walletPayment.setText(currencySymbol + " " + walletAdd);
        } else {
            binding.cashBackLayout.setVisibility(View.GONE);
        }

    }

    @Override
    public Dialog onCreateDialog(Bundle savedInstanceState) {
        final BottomSheetDialog bottomSheetDialog =
                (BottomSheetDialog) super.onCreateDialog(savedInstanceState);
        bottomSheetDialog.setCancelable(false);
        bottomSheetDialog.setOnShowListener(new DialogInterface.OnShowListener() {
            @Override
            public void onShow(DialogInterface dialog) {
                FrameLayout bottomSheet =
                        bottomSheetDialog.findViewById(R.id.design_bottom_sheet);

                if (null != bottomSheet) {
                    BottomSheetBehavior behavior = BottomSheetBehavior.from(bottomSheet);
                    behavior.setHideable(false);
                }
            }
        });
        return bottomSheetDialog;
    }

    /*Method Rating Click*/
    private void methodRatingClick() {

        binding.ratingBar.setOnRatingBarChangeListener(new RatingBar.OnRatingBarChangeListener() {
            @Override
            public void onRatingChanged(RatingBar ratingBar, float ratingSize, boolean b) {

                if (ratingSize >= 0.5) {
                    binding.doneReviewBtn.setVisibility(View.VISIBLE);
                    binding.earningPointsLayout.setVisibility(View.INVISIBLE);
                    rating = ratingSize;
                } else {
                    rating = 0;
                    binding.doneReviewBtn.setVisibility(View.GONE);
                    binding.earningPointsLayout.setVisibility(View.VISIBLE);
                }

            }
        });
    }

    private void initializeListeners() {

        binding.doneReviewBtn.setOnClickListener(this);
        binding.fareDetailbtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.doneReviewBtn:

                callApiForRating();

                break;

            case R.id.fareDetailbtn:

                if (clicked) {
                    binding.upArrowImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_arrow_up_gray));
                    binding.fareDetailLayout.setVisibility(View.VISIBLE);
                    clicked = false;
                } else {
                    binding.upArrowImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_arrow_down));
                    binding.fareDetailLayout.setVisibility(View.GONE);
                    clicked = true;
                }

                break;

            default:
                break;
        }
    }

    private void callApiForRating() {
        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("request_id", requestId);
            sendobj.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
            sendobj.put("driver_id", driverId);
            sendobj.put("star", Float.toString(rating));
            sendobj.put("comment", "");
            sendobj.put("tip", "");

        } catch (JSONException e) {
            e.printStackTrace();
        }
        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).giveRatingsToDriver(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        NotificationManager nMgr = (NotificationManager) getActivity().getSystemService(Context.NOTIFICATION_SERVICE);
                                        nMgr.cancelAll();
                                        if (type.equals("history")) {
                                            Bundle bundle = new Bundle();
                                            bundle.putString("rating", Float.toString(rating));
                                            fragmentCallBack.onItemClick(bundle);
                                            dismiss();
                                        } else {
                                            closeActivity();
                                        }

                                    } else {
                                        Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
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

    public void closeActivity() {
        Intent intent1 = new Intent(getActivity(), HomeActivity.class);
        startActivity(intent1);
        intent1.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getActivity().finish();
        getActivity().overridePendingTransition(R.anim.in_from_left, R.anim.out_to_right);
    }

}