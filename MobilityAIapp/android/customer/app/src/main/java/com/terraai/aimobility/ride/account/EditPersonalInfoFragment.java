package com.terraai.aimobility.ride.account;

import android.util.Log;

import android.app.Dialog;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.RadioButton;
import android.widget.RadioGroup;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentEditPersonalInfoBinding;
import com.yna.opusaimobilityapp.databinding.GenderDialogBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class EditPersonalInfoFragment extends RootFragment implements View.OnClickListener {
    FragmentEditPersonalInfoBinding binding;

    String username, userId, fname, lname, countryId, image, email, stDob, number, gender;
    SharedPreferences.Editor prefsEditor;
    Dialog dialog;
    boolean isSocailLogin;
    FragmentCallBack fragmentCallBack;

    public EditPersonalInfoFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentEditPersonalInfoBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        countryId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.countryId, "");
        fname = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.fname, "");
        email = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.email, "");
        lname = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.lname, "");
        image = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.image, "");
        username = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.userName, "");
        gender = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.gender, "");
        stDob = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.dob, "");
        number = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.phoneNo, "");
        isSocailLogin = MyPreferences.getSharedPreference(getActivity()).getBoolean(MyPreferences.isloginwithSocail, false);
        prefsEditor = MyPreferences.getSharedPreference(getActivity()).edit();

        initLayouts();
        initializeListeners();
        setUpScreenData();

        return view;
    }

    @Override
    public void onResume() {
        super.onResume();
        binding.etFirstName.clearFocus();
        binding.etLastName.clearFocus();
    }

    private void initLayouts() {

        binding.etFirstName.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        binding.etLastName.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);

    }

    private void initializeListeners() {
        binding.saveBtn.setOnClickListener(this);
        binding.dateLayout.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);

        if (isSocailLogin) {
            binding.emailEdit.setVisibility(View.GONE);
        } else {
            binding.emailTextInput.setOnClickListener(this);
        }
        binding.phoneLayout.setOnClickListener(this);
        binding.genderLayout.setOnClickListener(this);
    }

    private void setUpScreenData() {
        binding.etFirstName.setText(fname);
        binding.etLastName.setText(lname);
        binding.tvEmail.setText(email);
        if (gender != null && !gender.equals("")) {
            binding.tvGender.setText(gender);
        }
        binding.tvDob.setText(DateOperations.changeDateFormat("yyyy-MM-dd", "MM/dd/yyyy", stDob));
        binding.tvPhone.setText(number);

    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.saveBtn:
                Functions.hideSoftKeyboard(getActivity());
                if (checkInputValue()) {
                    callApiForEditProfile();
                }
                break;

            case R.id.dateLayout:
                Functions.hideSoftKeyboard(getActivity());
                Functions.methodOpenDateTimePicker( binding.tvDob.getText().toString(), getActivity().getSupportFragmentManager(), new com.terraai.aimobility.Interface.Callback() {
                    @Override
                    public void onResponce(String resp) {
                        binding.tvDob.setText(resp);
                    }
                });
                break;

            case R.id.genderLayout:
                Functions.hideSoftKeyboard(getActivity());
                genderDialog();
                break;

            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;


            case R.id.emailTextInput:
                Functions.hideSoftKeyboard(getActivity());
                UpdateEmailFragment emailFragment = new UpdateEmailFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            email = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.email, "");
                            binding.tvEmail.setText(email);
                        }
                    }
                });
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.editAccount_container, emailFragment, "emailFragment").addToBackStack("emailFragment").commit();


                break;

            case R.id.phoneLayout:
                Functions.hideSoftKeyboard(getActivity());

                AddPhoneNumFragment addPhoneNumFragment = new AddPhoneNumFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            number = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.phoneNo, "");
                            binding.tvPhone.setText(number);
                            binding.etFirstName.clearFocus();
                            binding.etLastName.clearFocus();
                        }
                    }
                });
                FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.add(R.id.editAccount_container, addPhoneNumFragment, "addPhoneNumFragment").addToBackStack("addPhoneNumFragment").commit();


                break;

            default:
                break;
        }
    }

    private void callApiForEditProfile() {

        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
            params.put("first_name", binding.etFirstName.getText().toString());
            params.put("last_name", "" + binding.etLastName.getText().toString());
            params.put("gender", "" + gender);
            params.put("dob", "" + DateOperations.changeDateFormat("MM/dd/yyyy", "yyyy-MM-dd", "" + binding.tvDob.getText().toString()));
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).editProfile(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONObject userdata = respobj.getJSONObject("msg").getJSONObject("User");
                                        SharedPreferences.Editor editor = MyPreferences.getSharedPreference(getActivity()).edit();
                                        editor.putString(MyPreferences.USER_ID, userdata.optString("id"));
                                        editor.putString(MyPreferences.fname, userdata.optString("first_name"));
                                        editor.putString(MyPreferences.lname, userdata.optString("last_name"));
                                        editor.putString(MyPreferences.gender, userdata.optString("gender"));
                                        editor.putString(MyPreferences.dob, userdata.optString("dob"));
                                        editor.commit();

                                        if (fragmentCallBack != null) {
                                            fragmentCallBack.onItemClick(new Bundle());
                                        }
                                        getActivity().getSupportFragmentManager().popBackStackImmediate();
                                    } else {
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
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


    private boolean checkInputValue() {
        if (!Functions.isValidEmail(binding.tvEmail.getText().toString())) {
            binding.tvEmail.setError(binding.getRoot().getContext().getString(R.string.invalid_email));
            return false;
        }
        if (binding.tvDob.getText().length() == 0) {
            return false;
        }
        if (binding.etLastName.getText().length() == 0) {
            binding.etLastName.setError(binding.getRoot().getContext().getString(R.string.invalid_last_name));
            binding.etLastName.requestFocus();
            return false;
        }
        if (binding.etFirstName.getText().length() == 0) {
            binding.etFirstName.setError(binding.getRoot().getContext().getString(R.string.invalid_first_name));
            binding.etFirstName.requestFocus();
            return false;
        }

        return true;
    }


    public void genderDialog() {

        if (dialog != null) {
            dialog.dismiss();
        }

        dialog = new Dialog(getActivity());
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);

        GenderDialogBinding dialogBinding = GenderDialogBinding.inflate(LayoutInflater.from(getContext()));

        dialog.setContentView(dialogBinding.getRoot());

        dialog.getWindow().setBackgroundDrawable(ContextCompat.getDrawable(binding.getRoot().getContext(),R.drawable.d_round_corner_white_bkg));

        Window window = dialog.getWindow();

        window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);

        WindowManager.LayoutParams wlp = window.getAttributes();

        window.setAttributes(wlp);

        String genderValue = binding.tvGender.getText().toString();

        if (genderValue != null && genderValue.equals("Female")) {
            dialogBinding.femaleBtn.setChecked(true);
        }

        if (genderValue != null && genderValue.equals("Male")) {
            dialogBinding.maleBtn.setChecked(true);
        }

        if (genderValue != null && genderValue.equals("Other")) {
            dialogBinding.otherBtn.setChecked(true);
        }


        dialogBinding.radioGroup.setOnCheckedChangeListener(new RadioGroup.OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(RadioGroup group, int checkedId) {
                int childCount = group.getChildCount();
                for (int x = 0; x < childCount; x++) {
                    RadioButton btn = (RadioButton) group.getChildAt(x);
                    if (btn.getId() == checkedId) {
                        dialog.dismiss();
                        gender = btn.getText().toString();
                        binding.tvGender.setText(btn.getText().toString());
                    }
                }
            }
        });

        dialog.show();
    }

}