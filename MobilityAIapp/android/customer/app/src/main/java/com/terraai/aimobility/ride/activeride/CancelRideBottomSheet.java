package com.terraai.aimobility.ride.activeride;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.RadioButton;
import android.widget.RadioGroup;

import androidx.core.content.ContextCompat;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.CancelRideDialogueBinding;
import com.yna.opusaimobilityapp.databinding.FragmentCancelRideBottomSheetBinding;
import com.yna.opusaimobilityapp.databinding.GiveReasonDialogueBinding;


public class CancelRideBottomSheet extends BottomSheetDialogFragment implements View.OnClickListener {
    FragmentCancelRideBottomSheetBinding binding;

    Dialog dialog;
    Context context;
    Dialog reasonDialog;
    int selectedBtn;
    FragmentCallBack call;
    Bundle bundle;

    public CancelRideBottomSheet(FragmentCallBack fragmentCallBack) {
        this.call = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentCancelRideBottomSheetBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();

        binding.cancelRideBtn.setOnClickListener(this);
        binding.tvCancel.setOnClickListener(this);
        return view;
    }

    /*Give Reason Dialogue*/
    private void methodGiveReasonDialogue() {

        reasonDialog = new Dialog(getActivity());
        GiveReasonDialogueBinding giveReasonDialogueBinding = GiveReasonDialogueBinding.inflate(getActivity().getLayoutInflater().from(getActivity()));
        reasonDialog.setContentView(giveReasonDialogueBinding.getRoot());



        Functions.clearBackgrounds(giveReasonDialogueBinding.getRoot());
        Window window = reasonDialog.getWindow();
        window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);
        WindowManager.LayoutParams wlp = window.getAttributes();
        wlp.gravity = Gravity.BOTTOM;
        window.setAttributes(wlp);

        giveReasonDialogueBinding.submitReasonText.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (TextUtils.isEmpty( giveReasonDialogueBinding.etAddReson.getText().toString())) {
                    giveReasonDialogueBinding.etAddReson.setError("Field cant be empty");
                } else {
                    bundle = new Bundle();
                    bundle.putString("reason",giveReasonDialogueBinding.etAddReson.getText().toString());
                    call.onItemClick(bundle);
                }
            }
        });
        giveReasonDialogueBinding.notSubmitReasonText.setOnClickListener(this);

        reasonDialog.show();

    }


    RadioButton radioButton;
    private void cancelRideDialogue() {

        dialog = new Dialog(context);

        CancelRideDialogueBinding dialogueBinding = CancelRideDialogueBinding.inflate(LayoutInflater.from(getContext()));
        dialog.setContentView(dialogueBinding.getRoot());

        Functions.clearBackgrounds(dialogueBinding.getRoot());
        Window window = dialog.getWindow();
        window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);
        WindowManager.LayoutParams wlp = window.getAttributes();
        wlp.gravity = Gravity.BOTTOM;
        window.setAttributes(wlp);

        dialogueBinding.submitReasonBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                CancelRideBottomSheet.this.dismiss();

                bundle = new Bundle();
                bundle.putString("reason", radioButton.getText().toString());
                call.onItemClick(bundle);
                dialog.dismiss();
            }
        });


        dialogueBinding.cancelRideRadioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(RadioGroup radioGroup, int i) {

                dialogueBinding.submitReasonBtn.setEnabled(true);
                dialogueBinding.submitReasonBtn.setBackground(ContextCompat.getDrawable(context, R.drawable.green_button_bg));

                selectedBtn = radioGroup.getCheckedRadioButtonId();
                if (selectedBtn != -1) {

                    radioButton = dialogueBinding.getRoot().findViewById(selectedBtn);
                    if (radioButton.getText().equals("Other")) {
                        dialog.dismiss();
                        methodGiveReasonDialogue();
                        CancelRideBottomSheet.this.dismiss();
                    }
                }
            }
        });

        dialog.show();
    }

    @Override
    public void onClick(View view) {
        switch (view.getId()) {

            case R.id.cancelRideBtn:
                cancelRideDialogue();

                break;

            case R.id.submitReasonText:
                reasonDialog.dismiss();
                break;

            case R.id.tv_cancel:
                dismiss();
                break;

            case R.id.notSubmitReasonText:
                reasonDialog.dismiss();
                break;

            case R.id.submitReasonBtn:
                dialog.dismiss();
                break;


            default:
                break;

        }
    }
}