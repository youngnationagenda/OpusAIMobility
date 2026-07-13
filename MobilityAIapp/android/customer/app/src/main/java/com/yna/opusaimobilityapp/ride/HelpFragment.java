package com.yna.opusaimobilityapp.ride;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentHelpBinding;


public class HelpFragment extends RootFragment implements View.OnClickListener {

    FragmentHelpBinding binding;

    public HelpFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentHelpBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        initializeListeners();

        return view;
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.callBtn.setOnClickListener(this);
        binding.emailBtn.setOnClickListener(this);
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:

                getActivity().onBackPressed();
                break;


            case R.id.call_btn:
                if (Constants.PHONE_NO != null) {
                    Intent intent = new Intent(Intent.ACTION_DIAL,
                            Uri.fromParts("tel", Constants.PHONE_NO, null));
                    startActivity(intent);
                }

                break;


            case R.id.email_btn:


                Intent intent = new Intent(Intent.ACTION_SEND);
                intent.putExtra(Intent.EXTRA_EMAIL, Constants.SUPPORT_EMAIL);

                intent.setType("message/rfc822");
                startActivity(Intent.createChooser(intent, "Choose an email client"));

                break;

            default:
                break;
        }
    }
}