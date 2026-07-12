package com.terraai.aimobility.ride.history;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.material.tabs.TabLayoutMediator;
import com.terraai.aimobility.adapter.PagerAdapter;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentYourRidesBinding;


public class YourRidesFragment extends RootFragment implements View.OnClickListener {

    FragmentYourRidesBinding binding;
    PagerAdapter pagerAdapter;
    Context context;

    public YourRidesFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment

        binding = FragmentYourRidesBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        initializeListeners();

        pagerAdapter = new PagerAdapter(this);
        binding.viewPager2.setAdapter(pagerAdapter);

        new TabLayoutMediator(binding.tabLayout, binding.viewPager2, (tab, position) -> {
            if(position == 0){
                tab.setText(context.getString(R.string.scheduled));
            }else if(position == 1){
                tab.setText(context.getString(R.string.history));
            }
        }).attach();


        return view;
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
    }




    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:

                getActivity().onBackPressed();

                break;

            default:
                break;
        }
    }
}