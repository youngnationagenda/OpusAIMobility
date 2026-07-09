package com.terraai.aimobility.food;

import android.os.Bundle;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RadioButton;

import com.appyvet.materialrangebar.RangeBar;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.databinding.FragmentFiltersBinding;

public class FiltersFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentFiltersBinding binding;
    String optionSelected ="" , currencySymbol;
    FragmentCallBack fragmentCallBack ;
    String minPrice = "0"  , maxPrice = "1000";
    public FiltersFragment(FragmentCallBack fragmentCallBack) {
            this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment]
        binding = FragmentFiltersBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        currencySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        initializeListeners();

        binding.rangeBar.setTickEnd(Float.parseFloat(maxPrice));
        binding.rangeBar.setRangePinsByValue(Float.parseFloat(minPrice), Float.parseFloat(maxPrice));


        // Sets the display values of the indices
        binding.rangeBar.setOnRangeBarChangeListener(new RangeBar.OnRangeBarChangeListener() {
            @Override
            public void onRangeChangeListener(RangeBar rangeBar, int leftPinIndex,
                                              int rightPinIndex, String leftPinValue, String rightPinValue) {
                minPrice = leftPinValue;
                maxPrice = rightPinValue;
                binding.tvPriceRange.setText(currencySymbol + minPrice);
                binding.tvFinalRange.setText(currencySymbol + maxPrice);
            }

            @Override
            public void onTouchEnded(RangeBar rangeBar) {
                Log.d("RangeBar", "Touch ended");
            }

            @Override
            public void onTouchStarted(RangeBar rangeBar) {
                Log.d("RangeBar", "Touch started");
            }
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
                    if(!optionSelected.equals("")) {
                        Bundle bundle = new Bundle();
                        bundle.putString("sort", optionSelected);
                        bundle.putString("min_price", minPrice);
                        bundle.putString("max_price", maxPrice);
                        fragmentCallBack.onItemClick(bundle);
                    }else{
                        Functions.showToast(getActivity() , "Please select sort filter");
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
                   selectOption(binding.mostPopularCheck ,  binding.deliveryCheck , binding.ratingCheck);
                break;

            case R.id.rating_btn:
                optionSelected = "rating";
                selectOption(binding.ratingCheck ,  binding.deliveryCheck , binding.mostPopularCheck);
                break;

            case R.id.deliver_time_btn:
                optionSelected = "delivery_time";
                selectOption(binding.deliveryCheck ,  binding.mostPopularCheck , binding.ratingCheck);
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