package com.terraai.aimobility.ride.bookride;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.android.material.chip.Chip;
import com.terraai.aimobility.adapter.GrabCarAdapter;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.GrabCarModel;
import com.terraai.aimobility.model.RideTypeModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentBookGrabCarBottomSheetBinding;

import java.util.ArrayList;

public class BookGrabCarBottomSheet extends BottomSheetDialogFragment implements View.OnClickListener {

    public static GrabCarModel selectedItem;
    GrabCarAdapter plusGrabAdapter;
    ArrayList<GrabCarModel> vehicleList = new ArrayList<>();
    ArrayList<GrabCarModel> orginalvehicleList = new ArrayList<>();
    ArrayList<GrabCarModel> temp1 = new ArrayList<>();
    ArrayList<GrabCarModel> temp2 = new ArrayList<>();
    ArrayList<RideTypeModel> vehicleCategoriesList = new ArrayList<>();
    FragmentCallBack fragmentCallBack;
    Bundle bundle;
    String selectedGrab, rideType;
    LinearLayoutManager linearLayoutManager;

    FragmentBookGrabCarBottomSheetBinding binding;
    public BookGrabCarBottomSheet(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentBookGrabCarBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        bundle = getArguments();
        if (bundle != null) {
            vehicleList = (ArrayList<GrabCarModel>) bundle.getSerializable("vehicleList");
            vehicleCategoriesList = (ArrayList<RideTypeModel>) bundle.getSerializable("vehicleCategoriesList");
            selectedGrab = bundle.getString("selectedGrab");
            rideType = bundle.getString("rideType");
        }


        for (int i = 0; i < vehicleList.size(); i++) {
            Functions.logDMsg("vehicleList : " + vehicleList.get(i).vehicleName + " : " + vehicleList.get(i).rideType);
        }


        methodSetPlusGrabAdapter();
        methodCheckRideType();
        scrollToPositionList();
        for (int i = 0; i < vehicleCategoriesList.size(); i++) {
            Chip chip1 = (Chip) LayoutInflater.from(getActivity()).inflate(R.layout.item_chip_layout, null);
            chip1.setText(vehicleCategoriesList.get(i).rideType);
            binding.chipGroup.addView(chip1);
            chip1.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    scrollToPosition(chip1.getText().toString());
                }
            });
        }

        return view;

    }

    private void methodCheckRideType() {
        for (int i = 0; i < vehicleList.size(); i++) {
            if (vehicleList.get(i).rideType.equals(vehicleList.get(0).rideType)) {
                temp1.add(vehicleList.get(i));
            } else {
                temp2.add(vehicleList.get(i));
            }
        }

        orginalvehicleList.addAll(temp1);
        orginalvehicleList.addAll(temp2);
        plusGrabAdapter.notifyDataSetChanged();


    }

    private void scrollToPosition(String s) {
        for (int i = 0; i < orginalvehicleList.size(); i++) {
            if (orginalvehicleList.get(i).rideType.equalsIgnoreCase(s)) {
                linearLayoutManager.scrollToPositionWithOffset(i, 0);
                plusGrabAdapter.notifyDataSetChanged();
                break;
            }
        }
    }

    private void scrollToPositionList() {
        for (int i = 0; i < orginalvehicleList.size(); i++) {
            if (orginalvehicleList.get(i).id.equalsIgnoreCase(selectedGrab)) {
                linearLayoutManager.scrollToPositionWithOffset(i, 0);
                plusGrabAdapter.notifyDataSetChanged();
                break;
            }
        }
    }

    private void methodSetPlusGrabAdapter() {

        binding.bookGrabRecycler.setHasFixedSize(true);
        linearLayoutManager = new LinearLayoutManager(getActivity());
        binding.bookGrabRecycler.setLayoutManager(linearLayoutManager);
        plusGrabAdapter = new GrabCarAdapter(getActivity(), orginalvehicleList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

                GrabCarModel model1 = (GrabCarModel) model;

                switch (view.getId()) {
                    case R.id.mainLayout:
                        selectedItem = model1;
                        model1.isFirstTime = false;
                        model1.isSelected = true;

                        plusGrabAdapter.notifyDataSetChanged();

                        Bundle bundle = new Bundle();
                        bundle.putSerializable("dataModel", model1);
                        fragmentCallBack.onItemClick(bundle);
                        dismiss();
                        break;
                    default:
                        break;
                }


            }
        });

        binding.bookGrabRecycler.setAdapter(plusGrabAdapter);
    }

    @Override
    public void onClick(View v) {

    }
}