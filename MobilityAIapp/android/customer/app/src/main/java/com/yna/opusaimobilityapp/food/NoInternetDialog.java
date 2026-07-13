package com.yna.opusaimobilityapp.food;

import android.app.Dialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;

import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.foodadapter.ViewBucketAdapter;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.model.CalculationModel;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.DialogNoInternetBinding;

import java.util.ArrayList;


public class NoInternetDialog extends BottomSheetDialogFragment implements View.OnClickListener {

    DialogNoInternetBinding binding;
    FragmentCallBack fragmentCallBack;
    Bundle bundle;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    ResturantModel resturantModel;
    Double sum = 0.0;
    ViewBucketAdapter viewBucketAdapter;

    int browserContainer;
    private BottomSheetBehavior mBehavior;

    public NoInternetDialog(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }


    @NonNull
    @Override public Dialog onCreateDialog(Bundle savedInstanceState) {
        BottomSheetDialog dialog = (BottomSheetDialog) super.onCreateDialog(savedInstanceState);
        dialog.setCanceledOnTouchOutside(false);
        binding = DialogNoInternetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        dialog.setContentView(view);
        mBehavior = BottomSheetBehavior.from((View) view.getParent());
        mBehavior.setHideable(false);
        return  dialog;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = DialogNoInternetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        initializeListeners();
        return view;
    }


    private void initializeListeners() {
        binding.tryAgain.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.try_again:
                if (Functions.isConnectedToInternet(getActivity())) {
                    if(fragmentCallBack != null) {
                        fragmentCallBack.onItemClick(new Bundle());
                        dismiss();
                    }
                }
                break;

            default:
                break;
        }
    }
}