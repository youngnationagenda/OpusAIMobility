package com.terraai.aimobility.food;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RadioButton;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.android.material.slider.RangeSlider;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.databinding.FragmentFiltersBinding;

import java.util.List;

public class FiltersFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentFiltersBinding binding;
    String optionSelected = "", currencySymbol;
    FragmentCallBack fragmentCallBack;
    String minPrice = "0", maxPrice = "1000";

    public FiltersFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        binding = FragmentFiltersBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        currencySymbol = MyPreferences.getSharedPreference(getActivity())
                .getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        initializeListeners();

        // Set initial display labels
        binding.tvPriceRange.setText(currencySymbol + minPrice);
        binding.tvFinalRange.setText(currencySymbol + maxPrice);

        // RangeSlider replaces the abandoned appyvet MaterialRangeBar
        // Configure range programmatically (Material 1.4 doesn't support XML attrs)
        binding.rangeBar.setValueFrom(0f);
        binding.rangeBar.setValueTo(1000f);
        binding.rangeBar.setValues(0f, 1000f);
        binding.rangeBar.addOnChangeListener((slider, value, fromUser) -> {
            List<Float> values = slider.getValues();
            minPrice = String.valueOf(values.get(0).intValue());
            maxPrice = String.valueOf(values.get(1).intValue());
            binding.tvPriceRange.setText(currencySymbol + minPrice);
            binding.tvFinalRange.setText(currencySymbol + maxPrice);
        });

        return view;
    }

    private void initializeListeners() {
        binding.applyBtn.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.clearFilterBtn.setOnClickListener(this);
        binding.mostPopularBtn.setOnClickListener(this);
        binding.ratingBtn.setOnClickListener(this);
        binding.deliverTimeBtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.applyBtn:
                if (!optionSelected.equals("")) {
                    Bundle bundle = new Bundle();
                    bundle.putString("sort", optionSelected);
                    bundle.putString("min_price", minPrice);
                    bundle.putString("max_price", maxPrice);
                    fragmentCallBack.onItemClick(bundle);
                } else {
                    Functions.showToast(getActivity(), "Please select sort filter");
                }
                dismiss();
                break;

            case R.id.backBtn:
                dismiss();
                break;

            case R.id.clear_filter_btn:
                Bundle bundle = new Bundle();
                bundle.putString("sort", "clear");
                bundle.putString("min_price", minPrice);
                bundle.putString("max_price", maxPrice);
                fragmentCallBack.onItemClick(bundle);
                dismiss();
                break;

            case R.id.most_popular_btn:
                optionSelected = "popular";
                selectOption(binding.mostPopularCheck, binding.deliveryCheck, binding.ratingCheck);
                break;

            case R.id.rating_btn:
                optionSelected = "rating";
                selectOption(binding.ratingCheck, binding.deliveryCheck, binding.mostPopularCheck);
                break;

            case R.id.deliver_time_btn:
                optionSelected = "delivery_time";
                selectOption(binding.deliveryCheck, binding.mostPopularCheck, binding.ratingCheck);
                break;

            default:
                break;
        }
    }

    private void selectOption(RadioButton check, RadioButton check1, RadioButton check2) {
        check.setChecked(true);
        check1.setChecked(false);
        check2.setChecked(false);
    }
}
