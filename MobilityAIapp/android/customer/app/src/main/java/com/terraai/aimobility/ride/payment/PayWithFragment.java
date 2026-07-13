package com.terraai.aimobility.ride.payment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentPayWithBinding;

public class PayWithFragment extends RootFragment implements View.OnClickListener {

    FragmentCallBack callback;
    FragmentPayWithBinding binding;
    public PayWithFragment(FragmentCallBack fragmentCallBack) {
        callback = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentPayWithBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        binding.backBtn.setOnClickListener(this);
        binding.creditOrDebitCardLayout.setOnClickListener(this);

        return view;
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.backBtn:
                getActivity().getSupportFragmentManager().popBackStack();
                break;

            case R.id.creditOrDebitCardLayout:

                AddCreditCard addCreditCard = new AddCreditCard(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if(callback != null){
                            callback.onItemClick(new Bundle());
                            getActivity().onBackPressed();
                        }
                    }
                });
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.payWith_Container, addCreditCard,"addCreditCard").addToBackStack("addCreditCard").commit();

                break;

            default:
                break;
        }
    }

}