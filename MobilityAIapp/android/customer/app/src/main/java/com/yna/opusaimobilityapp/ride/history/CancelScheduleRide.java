package com.yna.opusaimobilityapp.ride.history;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentCancelRideBottomSheetBinding;


public class CancelScheduleRide extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentCancelRideBottomSheetBinding binding;
    Context context;
    FragmentCallBack call;
    Bundle bundle;

    public CancelScheduleRide(FragmentCallBack fragmentCallBack) {
        this.call = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentCancelRideBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        binding.cancelRideBtn.setOnClickListener(this);
        binding.tvCancel.setOnClickListener(this);
        return view;
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.cancelRideBtn:

                bundle = new Bundle();
                bundle.putString("resp","cancel");
                call.onItemClick(bundle);
                CancelScheduleRide.this.dismiss();

                break;

            case R.id.tv_cancel:
                dismiss();
                break;


            default:
                break;

        }
    }
}