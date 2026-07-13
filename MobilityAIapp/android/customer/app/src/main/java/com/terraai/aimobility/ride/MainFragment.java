package com.terraai.aimobility.ride;

import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.google.android.material.tabs.TabLayout;
import com.terraai.aimobility.adapter.ViewPagerAdapter;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.CustomViewPager;
import com.yna.opusaimobilityapp.R;


public class MainFragment extends RootFragment {

    View view;
    TabLayout tabLayout;
    CustomViewPager viewPager;


    public MainFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        view = inflater.inflate(R.layout.fragment_main, container, false);


        methodSetViewPagerAdapter();
        methodSetCustomTabs();
        return view;

    }

    /*Method Set Custom Tabs*/
    private void methodSetCustomTabs() {

        View homeTab = LayoutInflater.from(getContext()).inflate(R.layout.custom_tablayout, null);


        LinearLayout homeTabLayout = homeTab.findViewById(R.id.custom_tab_linear_layout);
        ImageView homeTabImage = homeTabLayout.findViewById(R.id.customTabImage);
        TextView homeTabText = homeTabLayout.findViewById(R.id.customTabText);
        homeTabImage.setColorFilter(ContextCompat.getColor(getActivity(), R.color.app_color), android.graphics.PorterDuff.Mode.SRC_IN);
        homeTabText.setTextColor(ContextCompat.getColor(getActivity(), R.color.app_color));
        LinearLayout.LayoutParams params1 = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params1.weight = 1.0f;
        params1.gravity = Gravity.START;
        homeTabLayout.setLayoutParams(params1);
        tabLayout.getTabAt(0).setCustomView(homeTab);


        View paymentTab = LayoutInflater.from(getContext()).inflate(R.layout.custom_tablayout, null);
        ImageView paymentTabImage = paymentTab.findViewById(R.id.customTabImage);
        paymentTabImage.setImageResource(R.drawable.ic_payment_tab);
        TextView paymentTabText = paymentTab.findViewById(R.id.customTabText);
        paymentTabText.setText(R.string.payment);
        tabLayout.getTabAt(1).setCustomView(paymentTab);


        View accountTab = LayoutInflater.from(getContext()).inflate(R.layout.custom_tablayout, null);
        LinearLayout accountTabLayout = accountTab.findViewById(R.id.custom_tab_linear_layout);
        LinearLayout.LayoutParams params3 = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        params3.weight = 1.0f;
        params3.gravity = Gravity.END;
        accountTabLayout.setLayoutParams(params3);
        ImageView accountTabImage = accountTab.findViewById(R.id.customTabImage);
        accountTabImage.setImageResource(R.drawable.ic_account_tab);
        TextView accountTabText = accountTab.findViewById(R.id.customTabText);
        accountTabText.setText(R.string.account);
        tabLayout.getTabAt(2).setCustomView(accountTab);


        tabLayout.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {

                View view = tab.getCustomView();
                ImageView selectedTab = view.findViewById(R.id.customTabImage);
                TextView selectedText = view.findViewById(R.id.customTabText);

                selectedTab.setColorFilter(ContextCompat.getColor(getActivity(), R.color.app_color), android.graphics.PorterDuff.Mode.SRC_IN);
                selectedText.setTextColor(ContextCompat.getColor(getActivity(), R.color.app_color));


            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {

                View view = tab.getCustomView();
                ImageView selectedTab = view.findViewById(R.id.customTabImage);
                TextView selectedText = view.findViewById(R.id.customTabText);

                selectedTab.setColorFilter(ContextCompat.getColor(getActivity(), R.color.black), android.graphics.PorterDuff.Mode.SRC_IN);
                selectedText.setTextColor(ContextCompat.getColor(getActivity(), R.color.black));

            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                //TODO IMPLEMENTATION
            }
        });
    }

    /*Method SetViewPagerAdapter*/
    private void methodSetViewPagerAdapter() {

        viewPager = view.findViewById(R.id.viewPager);
        tabLayout = view.findViewById(R.id.tabLayout);
        viewPager.setPagingEnabled(false);
        viewPager.setAdapter(new ViewPagerAdapter(getActivity().getSupportFragmentManager()));
        tabLayout.setupWithViewPager(viewPager);

    }
}