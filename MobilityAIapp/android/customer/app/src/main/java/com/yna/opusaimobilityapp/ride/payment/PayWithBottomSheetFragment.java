package com.yna.opusaimobilityapp.ride.payment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentTransaction;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentPayWithBottomSheetBinding;


public class PayWithBottomSheetFragment extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentPayWithBottomSheetBinding binding;
    FragmentCallBack fragmentCallBack;
    Bundle bundle;
    int container;
    boolean aBoolean;
    String paymentType="Cash";
    public PayWithBottomSheetFragment(FragmentCallBack fragmentCallBack, int container, boolean aBoolean,String paymentType) {
        this.fragmentCallBack = fragmentCallBack;
        this.container = container;
        this.aBoolean = aBoolean;
        this.paymentType= paymentType;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentPayWithBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        initLayouts();
        return view;
    }


    private void initLayouts() {

        binding.paypalLayout.setOnClickListener(this);
        binding.creditCardLayout.setOnClickListener(this);
        binding.cashLayout.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);

        if(paymentType.equalsIgnoreCase("Cash")){
            binding.cashCheckImage.setVisibility(View.VISIBLE);
        }
        else if(paymentType.equalsIgnoreCase("Card")){
            binding.cardCheckImage.setVisibility(View.VISIBLE);
        }

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:
                dismiss();
                break;

            case R.id.cashLayout:
                if (fragmentCallBack != null) {
                    bundle = new Bundle();
                    bundle.putString("payment_type", "Cash");
                    bundle.putString("payment_method_id", "0");
                    bundle.putString("card_info", "");
                    fragmentCallBack.onItemClick(bundle);
                    dismiss();
                }
                break;


            case R.id.creditCardLayout:
            case R.id.paypalLayout:
                PaymentFragment fragment = new PaymentFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            fragmentCallBack.onItemClick(bundle);
                            dismiss();
                        }
                    }
                }, aBoolean);
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.replace(container, fragment).addToBackStack(null).commit();
                dismiss();
                break;

            default:
                break;
        }
    }
}