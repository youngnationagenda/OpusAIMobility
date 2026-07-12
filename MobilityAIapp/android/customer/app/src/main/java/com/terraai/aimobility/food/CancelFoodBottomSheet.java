package com.terraai.aimobility.food;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentCancelFoodBottomSheetBinding;


public class CancelFoodBottomSheet extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentCancelFoodBottomSheetBinding binding;
    Context context;
    TextView textView;
    FragmentCallBack fragmentCallBack;
    Bundle bundle;
    String resturantName, resturantNameOld;

    public CancelFoodBottomSheet(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentCancelFoodBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        bundle = getArguments();
        if (bundle != null) {
            resturantName = bundle.getString("resturantName");
            resturantNameOld = bundle.getString("resturantNameOld");
        }

        textView = view.findViewById(R.id.text_view);
        textView.setText(context.getString(R.string.your_basket_already_contains) + resturantNameOld + context.getString(R.string.would_you_like_to_clear) + resturantName + context.getString(R.string.instead));
        binding.goBackBtn.setOnClickListener(this);
        binding.startNewBtn.setOnClickListener(this);
        return view;
    }


    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.goBackBtn:
                dismiss();
                break;

            case R.id.startNewBtn:
                if (fragmentCallBack != null) {
                    fragmentCallBack.onItemClick(new Bundle());
                }
                dismiss();
                break;

            default:
                break;

        }
    }
}