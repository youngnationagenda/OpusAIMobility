package com.terraai.aimobility.ride;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.adapter.ReportAdapter;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentReportPromblemBinding;

import java.util.ArrayList;


public class ReportProblemFragment extends RootFragment implements View.OnClickListener {

    FragmentReportPromblemBinding binding;
    public ReportProblemFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentReportPromblemBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        initializeListeners();
        setAdapter();

        return view;

    }


    private void setAdapter(){
        ArrayList<String> list=new ArrayList<>();
        list.add(getString(R.string.captain_caused_the_ride_charges_to_increase));
        list.add(getString(R.string.i_paid_captain_extra_but_the_amount_is_not_vis));
        list.add(getString(R.string.i_lost_an_item));
        list.add(getString(R.string.other));

        ReportAdapter adapter=new ReportAdapter(getContext(), list, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                openContactFragment((String) model);
            }
        });

        binding.recyclerView.setAdapter(adapter);


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


    private void openHelpFragment(){
        HelpFragment helpFragment = new HelpFragment();
        FragmentTransaction fragmentTransaction3 = getActivity().getSupportFragmentManager().beginTransaction();
        fragmentTransaction3.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        fragmentTransaction3.add(R.id.fragment_main_container, helpFragment).addToBackStack(null).commit();

    }

    private void openContactFragment(String s){
        ContactUsFragment contactUsFragment = new ContactUsFragment();

        Bundle bundle=new Bundle();
        bundle.putString("reason",s);
        contactUsFragment.setArguments(bundle);

        FragmentTransaction fragmentTransaction1 = getActivity().getSupportFragmentManager().beginTransaction();
        fragmentTransaction1.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        fragmentTransaction1.add(R.id.fragment_main_container, contactUsFragment).addToBackStack(null).commit();

    }

}