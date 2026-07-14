package com.yna.opusaimobilityapp.ride.payment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentDeleteFragmantDialogBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

public class DeleteFragmantDialog extends BottomSheetDialogFragment implements View.OnClickListener {

    FragmentDeleteFragmantDialogBinding binding;
    FragmentCallBack fragmentCallBack;
    Bundle bundle;
    String id, userId;

    public DeleteFragmantDialog(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentDeleteFragmantDialogBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        bundle = getArguments();
        if (bundle != null) {
            id = bundle.getString("id");
        }
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        initViews();
        return view;
    }

    private void initViews() {
        binding.deletePaymentBtn.setOnClickListener(this);
        binding.keepCard.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.delete_payment_btn:
                callApiForDelete();
                break;
            case R.id.keep_card:
                dismiss();
                break;
            case R.id.backBtn:
                dismiss();
                break;

            default:
                break;


        }

    }

    private void callApiForDelete() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
            params.put("id", id);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).deletePaymentCard(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at callApiForDelete : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        if (fragmentCallBack != null) {
                                            fragmentCallBack.onItemClick(new Bundle());
                                            dismiss();
                                        }
                                    } else {
                                        if (fragmentCallBack != null) {
                                            fragmentCallBack.onItemClick(new Bundle());
                                            dismiss();
                                        }
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }
}