package com.terraai.aimobility.food;

import android.app.Dialog;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.bottomsheet.BottomSheetDialog;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.foodadapter.ViewBucketAdapter;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.MenuDetailsModel;
import com.terraai.aimobility.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.ViewBucketWithBottomSheetBinding;

import java.util.ArrayList;
import java.util.HashMap;



public class ViewBucketSheetFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    ViewBucketWithBottomSheetBinding binding;
    Bundle bundle;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    String currencySymbol;
    ResturantModel resturantModel;
    Double sum = 0.0;
    ViewBucketAdapter viewBucketAdapter;
    int fragmentContainer;


    public ViewBucketSheetFragment(int browserContainer) {
        this.fragmentContainer = browserContainer;
    }

    public ViewBucketSheetFragment() {
      //empty constructor required
    }

    @NonNull
    @Override public Dialog onCreateDialog(Bundle savedInstanceState) {
        BottomSheetDialog dialog = (BottomSheetDialog) super.onCreateDialog(savedInstanceState);
        binding = ViewBucketWithBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        dialog.setContentView(view);
        BottomSheetBehavior mBehavior = BottomSheetBehavior.from((View) view.getParent());
        return  dialog;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = ViewBucketWithBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        currencySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        // [AWS] Read result discarded

        bundle = getArguments();
        if (bundle != null) {
          //  carList = (ArrayList<CalculationModel>) bundle.getSerializable("carList");
            resturantModel = carList.get(0).getResturantModel();
        }
        initLayouts();
        initializeListeners();
        SetUpAdapter();
        return view;
    }



    private void SetUpAdapter() {
        viewBucketAdapter = new ViewBucketAdapter(getActivity(), carList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                dismiss();
                CalculationModel dataModel = (CalculationModel) model;
                MenuDetailsModel menuDetailsModel = dataModel.getRecipeMenuDetailsModel();
                ResturantModel resturantModel = dataModel.getResturantModel();
                AddToCartFragment addToCartFragment = new AddToCartFragment();
                ArrayList<HashMap<String, String>> extraItem = ((CalculationModel) model).getExtraItem();
                FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                Bundle bundle = new Bundle();
                bundle.putSerializable("recipeMenuDetailsModel", menuDetailsModel);
                bundle.putSerializable("resturantModel", resturantModel);
                bundle.putString("fromWhere", "viewBucket");
                bundle.putSerializable("extraItem", extraItem);
                bundle.putInt("position", postion);
                addToCartFragment.setArguments(bundle);
                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                ft.replace(fragmentContainer, addToCartFragment).addToBackStack(null).commit();

            }
        });


        binding.recyclerview.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.recyclerview.setAdapter(viewBucketAdapter);
        viewBucketAdapter.notifyDataSetChanged();

    }

    ArrayList<Double> grandTotal = new ArrayList<>();

    private void initLayouts() {
        binding.tvResturantName.setText(carList.get(0).getRest_name());
        grandTotal = new ArrayList<>();
        for (int i = 0; i < carList.size(); i++) {
            Double totalExtraItemPrice = 0.0;
            double price1 = 0.0;
            String price = carList.get(i).getmPrice();
            double dPrice = Double.parseDouble(price);
            double dQty = Double.parseDouble(carList.get(i).getmQuantity());
            ArrayList<HashMap<String, String>> extraItem = carList.get(i).getExtraItem();
            if (extraItem != null && extraItem.size() > 0) {
                for (int b = 0; b < extraItem.size(); b++) {
                    String extraPrice = extraItem.get(b).get("menu_extra_item_price");
                    double counter = Double.parseDouble(extraPrice);
                    totalExtraItemPrice = counter + totalExtraItemPrice;
                }

                price1 = (totalExtraItemPrice + dPrice) * dQty;
            } else {
                price1 = dPrice * dQty;
            }
            grandTotal.add(price1);
        }

        for (Double num : grandTotal) {
            sum = Functions.roundoffDecimal(sum + num);
        }

        binding.subTotalPriceTv.setText(currencySymbol + sum);
    }


    private void initializeListeners() {
        binding.checkoutBtn.setOnClickListener(this);
        binding.addItemBtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.checkout_btn:
                methodOpenPlaceOrderDetails();
                dismiss();
                break;

            case R.id.add_item_btn:
                dismiss();
                Functions.hideSoftKeyboard(getActivity());
                Fragment currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromOther");
                FragmentManager manager = getActivity().getSupportFragmentManager();
                FragmentTransaction transaction = manager.beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.replace(fragmentContainer, currentFragment).addToBackStack(null).commit();

                break;

            default:
                break;
        }
    }


    private void methodOpenPlaceOrderDetails() {
        Functions.hideSoftKeyboard(getActivity());
        PlaceOrdersFragment placeOrdersFragment = new PlaceOrdersFragment();
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putSerializable("carList",carList);
        bundle.putString("sum", String.valueOf(sum));
        bundle.putBoolean("boolean", false);
        placeOrdersFragment.setArguments(bundle);
        ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
        ft.add(fragmentContainer, placeOrdersFragment).addToBackStack(null).commit();
    }

}