package com.terraai.aimobility.ride.history;

import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;

import com.google.android.gms.maps.model.LatLng;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.ride.activeride.RatingFragment;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.HistoryModel;
import com.terraai.aimobility.model.TripHistoryModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentRideFareBinding;

import java.util.ArrayList;


public class RideHistoryDetail extends Fragment implements View.OnClickListener {

    FragmentRideFareBinding binding;
    HistoryModel historyModel;
    String currencyUnit;
    Bundle bundle;
    Uri uri;
    ArrayList<TripHistoryModel> tripHistoryModelArrayList = new ArrayList<>();
    double totalD;
    boolean clicked = true;

    public RideHistoryDetail() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentRideFareBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        currencyUnit = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        bundle = getArguments();
        if (bundle != null) {
            historyModel = (HistoryModel) bundle.getSerializable("historyModel");
        }
        methodInitializeLayouts();
        setUpScreenData();


        return view;
    }

    private void methodInitializeLayouts() {
        binding.backBtn.setOnClickListener(this);
        binding.fareLayout.setOnClickListener(this);
        binding.tvReportProblem.setOnClickListener(this);
        binding.ratingLayout.setOnClickListener(this);
    }

    private void setUpScreenData() {
        binding.tripDate.setText(historyModel.getDayTime());
        if (historyModel.finalFare != null && !historyModel.finalFare.equalsIgnoreCase("")) {

            binding.tvTripFare.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.tripFare)));

            binding.tvIntialWaiting.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.initialWaitingTimePrice)));

            binding.tvAmount.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.finalFare)));

            binding.tvAmountCharged.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.finalFare)));

            binding.tvPaymentType.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.finalFare)));

            binding.tvSubtotal.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.finalFare)));

            if (historyModel.payCollectFromWallet != null && !historyModel.payCollectFromWallet.equalsIgnoreCase("")) {
                binding.tvWalletPay.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.payCollectFromWallet)));

            } else {
                binding.opusaimobilityPayLayout.setVisibility(View.GONE);

            }

            binding.tvPaidAmount.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.payCollectFromCash)));

            if (historyModel.debitCreditAmount != null && !historyModel.debitCreditAmount.equalsIgnoreCase("") && !historyModel.debitCreditAmount.equalsIgnoreCase("0"))
                binding.creditWalletLayout.setText(currencyUnit + Functions.roundoffDecimal(Double.valueOf(historyModel.debitCreditAmount)) + " " + binding.getRoot().getContext().getString(R.string._5_have_been_credited_to_your_wallet));
            else
                binding.creditWalletLayout.setVisibility(View.GONE);
        }

        if (historyModel.map != null && !historyModel.map.equalsIgnoreCase("")) {
            if (historyModel.map.contains("http")) {
                uri = Uri.parse(historyModel.map);
            } else {
                uri = Uri.parse(Constants.BASE_URL + historyModel.map);
            }
            binding.ivMap.setImageURI(uri);
        }


        if (historyModel.payType.equalsIgnoreCase("cash")) {
            binding.tvPaymentType.setText("Cash");
            binding.cashImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_cash));
        } else {
            binding.tvPaymentType.setText(binding.getRoot().getContext().getString(R.string.card));
            binding.cashImage.setImageDrawable(ContextCompat.getDrawable(getActivity(), R.drawable.ic_credit_debut_card));
        }

        ArrayList<LatLng> lngArrayList = new ArrayList<>();

        tripHistoryModelArrayList = historyModel.tripHistoryModelArrayList;
        if (tripHistoryModelArrayList != null) {
            for (int i = 0; i < tripHistoryModelArrayList.size(); i++) {
                LatLng lat_lng = new LatLng(tripHistoryModelArrayList.get(i).lat, tripHistoryModelArrayList.get(i).lon);
                lngArrayList.add(lat_lng);
            }

            double totalDistance = Functions.roundoffDecimal(calculateDistance(lngArrayList));

            String totalTripTime = DateOperations.calculateTime(historyModel.pickupDatetime, historyModel.destinationDatetime, true);

            if (totalTripTime != null && !totalTripTime.equalsIgnoreCase("") && totalDistance != 0) {
                binding.tvTotalDistace.setText(getString(R.string.you_travelled) + totalDistance + getString(R.string.km_in) + "" + totalTripTime);
            }
        } else {
            binding.tvTotalDistace.setVisibility(View.GONE);
        }


        binding.tvCar.setText(historyModel.vehicleType + " - " + historyModel.vehicleColor + " " + historyModel.vehicleMake + " " + historyModel.vehicleModel);
        binding.tvCarPlat.setText(historyModel.vehiclePlate);
        binding.tvDriverName.setText(historyModel.driverFirstName + " " + historyModel.driverLastName);
        if (historyModel.driverImage != null && !historyModel.driverImage.equalsIgnoreCase("")) {
            if (historyModel.driverImage.contains("http")) {
                uri = Uri.parse(historyModel.driverImage);
            } else {
                uri = Uri.parse(Constants.BASE_URL + historyModel.driverImage);
            }
            binding.ivDriverPic.setImageURI(uri);
        }


        binding.ratingBar.setEnabled(false);
        binding.ratingBar.setClickable(false);
        String driverRating = historyModel.tripRating;
        if (driverRating != null && !driverRating.equalsIgnoreCase("")) {
            binding.ratingBar.setRating(Float.parseFloat((historyModel.tripRating)));
            binding.tvTapRate.setVisibility(View.GONE);
            binding.ratingLayout.setClickable(false);
            binding.ratingLayout.setEnabled(false);

        } else {
            binding.ratingBar.setVisibility(View.VISIBLE);
        }


    }


    @Override
    public void onClick(View view) {

        switch (view.getId()) {

            case R.id.backBtn:
                getActivity().getSupportFragmentManager().popBackStack();
                break;


            case R.id.ratingLayout:
                RatingFragment ratingFragment = new RatingFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            String rating = bundle.getString("rating");
                            if (rating != null && !rating.equalsIgnoreCase("")) {
                                binding.ratingBar.setRating(Float.parseFloat(rating));
                                binding.tvTapRate.setVisibility(View.GONE);
                                binding.ratingLayout.setClickable(false);
                                binding.ratingLayout.setEnabled(false);
                            } else {
                                binding.ratingBar.setVisibility(View.VISIBLE);
                            }

                        }
                    }
                });

                Bundle bundle = new Bundle();
                bundle.putString("ridefare", "" + Functions.roundoffDecimal(Double.valueOf(historyModel.tripFare)));
                bundle.putString("drivePic", historyModel.driverImage);
                bundle.putString("driverNameText", binding.tvDriverName.getText().toString());
                bundle.putString("end_ride_datetime", historyModel.getDayTime());
                bundle.putString("paymentType", historyModel.payType);
                bundle.putString("requestId", historyModel.requestId);
                bundle.putString("driverId", historyModel.driverId);
                bundle.putString("wallet_add", historyModel.debitCreditAmount);
                bundle.putString("wallet_pay", historyModel.payCollectFromWallet);
                bundle.putString("amount_collected", historyModel.payCollectFromCash);
                bundle.putString("type", "history");
                ratingFragment.setArguments(bundle);
                ratingFragment.show(getActivity().getSupportFragmentManager(), "");
                break;

            case R.id.tv_report_problem:
                getActivity().getSupportFragmentManager().popBackStack();
                break;

            case R.id.fare_layout:
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

    private double calculateDistance(ArrayList<LatLng> points) {

        float tempTotalDistance = 0;

        for (int i = 0; i < points.size() - 1; i++) {
            LatLng pointA = points.get(i);
            LatLng pointB = points.get(i + 1);
            float[] results = new float[3];
            Location.distanceBetween(pointA.latitude, pointA.longitude, pointB.latitude, pointB.longitude, results);
            tempTotalDistance += results[0];
        }

        totalD = tempTotalDistance;

        return totalD / 1000;

    }

}