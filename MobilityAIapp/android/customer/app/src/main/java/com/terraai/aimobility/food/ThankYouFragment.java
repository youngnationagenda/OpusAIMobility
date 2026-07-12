package com.terraai.aimobility.food;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentThankyouBinding;


public class ThankYouFragment extends RootFragment implements View.OnClickListener {

    FragmentThankyouBinding binding;
    FragmentCallBack callbackResponse;

    public ThankYouFragment(FragmentCallBack fragmentCallback) {
        this.callbackResponse = fragmentCallback;
    }

    public ThankYouFragment() {
        //required empty constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentThankyouBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        initializeListeners();

        return view;
    }

    private void initializeListeners() {
        binding.backToHomeBtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.back_to_home_btn:
                getActivity().onBackPressed();
                if (callbackResponse != null)
                    callbackResponse.onItemClick(new Bundle());
                break;

            default:
                break;
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();

    }
}