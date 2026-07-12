package com.terraai.aimobility.parcel.fragmentandactivities;

import android.os.Bundle;

import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;

import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.R;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.databinding.FragmentDeliveryRecipientBinding;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.parcel.adapter.ParcelChangeAddress;
import com.terraai.aimobility.parcel.model.RecipientModel;
import com.rilixtech.widget.countrycodepicker.CountryCodePicker;


public class DeliveryRecipientF extends Fragment implements View.OnClickListener {

    FragmentDeliveryRecipientBinding binding;
    boolean value = false;
    FragmentCallBack fragmentCallBack;
    public DeliveryRecipientF() {
        // Required empty public constructor
    }
    public DeliveryRecipientF(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack=fragmentCallBack;
    }

    LocationModel locationModel;
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentDeliveryRecipientBinding.inflate(getLayoutInflater());

        initControl();
        disableButton();
        addTextWatcher();

        Bundle bundle=getArguments();
        if(bundle!=null && bundle.getSerializable("data")!=null){
            model= (RecipientModel) bundle.getSerializable("data");
            setUpScreenData();
        }



        return binding.getRoot();
    }




    private void initControl() {
        binding.backBtn.setOnClickListener(this);
        binding.recipientLayout.setOnClickListener(this);
        binding.nextBtn.setOnClickListener(this);
        binding.typesOfItemBtn.setOnClickListener(this);
        binding.itemWeightLayout.setOnClickListener(this);
        binding.recipeintAddressBtn.setOnClickListener(this);


    }




    private void setUpScreenData() {

        binding.etRecipientPhone.setText(model.getRecipientNumber());

        binding.etRecipientName.setText(model.getRecipientName());

        binding.tvDropOffAddres.setText(model.getRecipientAddress());
        binding.etRecipientFloor.setText(model.getRecipientFloor());
        binding.etRecipientNote.setText(model.getRecipientNote());
        binding.etDeliveryInstruction.setText(model.getDeliveryInstruction());

        binding.tvTypeOfItem.setText(model.getTypeOfItem());

        binding.tvItemWeight.setText(model.getPackageSize());


    }

    private void addTextWatcher() {
        binding.etRecipientName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void afterTextChanged(Editable editable) {
                if (isValid(false)) {
                    enableButton();
                } else {
                    disableButton();
                }
            }
        });

        binding.etRecipientPhone.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void afterTextChanged(Editable editable) {
                if (isValid(false)) {
                    enableButton();
                } else {
                    disableButton();
                }
            }
        });


    }

    private void enableButton() {
        binding.nextBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

    }

    private void disableButton() {
        binding.nextBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
    }





    RecipientModel model=new RecipientModel();
    private void selectRecipient() {

        model.setRecipientName(binding.etRecipientName.getText().toString());
        model.setRecipientAddress(binding.tvDropOffAddres.getText().toString());
        model.setRecipientFloor(binding.etRecipientFloor.getText().toString());
        model.setRecipientNote(binding.etRecipientNote.getText().toString());
        model.setRecipientNumber(binding.etRecipientPhone.getText().toString());


        model.setDeliveryInstruction(binding.etDeliveryInstruction.getText().toString());

        if(fragmentCallBack!=null){
            Bundle bundle=new Bundle();
            bundle.putSerializable("data",model);
            fragmentCallBack.onItemClick(bundle);
        }
        getParentFragmentManager().popBackStack();
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {



            case R.id.backBtn:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;



            case R.id.recipeint_address_btn:

                ParcelChangeAddress parcelChangeAddress = new ParcelChangeAddress(true, false, new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        locationModel = (LocationModel) bundle.getSerializable("locationModel");
                        binding.tvDropOffAddres.setText(locationModel.getFulldropOffAddress());

                        model.setRecipientLat(locationModel.getDropOfflat());
                        model.setRecipientLong(locationModel.getDropOfflng());

                        if (isValid(false)) {
                            enableButton();
                        }
                        else {
                            disableButton();
                        }

                    }
                });

                Bundle bundle1 = new Bundle();
                bundle1.putSerializable("dataModel", locationModel);
                parcelChangeAddress.setArguments(bundle1);
                FragmentTransaction beginTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                beginTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                beginTransaction.add(R.id.delivery_detail_container, parcelChangeAddress, "wheretoFragment").addToBackStack("wheretoFragment").commit();

                break;


            case R.id.recipientLayout:

                if (!value) {
                    binding.tvRecipentName.setText(binding.etRecipientName.getText().toString());
                    binding.tvRecipentAddress.setText(binding.tvDropOffAddres.getText().toString());
                    binding.tvRecipentPhone.setText(binding.etRecipientPhone.getText().toString());

                    if (TextUtils.isEmpty(binding.etRecipientFloor.getText().toString())) {
                        binding.tvRecipentInstruction.setVisibility(View.GONE);
                    } else {
                        binding.tvRecipentInstruction.setText(binding.etRecipientFloor.getText().toString());
                    }

                    binding.recipientDetailsLayout.setVisibility(View.GONE);
                    binding.anonymousLayout.setVisibility(View.VISIBLE);
                    binding.ovoLayout.setVisibility(View.GONE);
                    binding.addDeliveryViewLine.setVisibility(View.GONE);
                    Functions.hideSoftKeyboard(getActivity());
                    binding.recipientArrow.setImageResource(R.drawable.ic_arrow_down);
                    binding.viewRecipient.setVisibility(View.GONE);

                    value = true;
                } else {

                    binding.recipientDetailsLayout.setVisibility(View.VISIBLE);
                    binding.anonymousLayout.setVisibility(View.GONE);
                    binding.ovoLayout.setVisibility(View.VISIBLE);
                    Functions.hideSoftKeyboard(getActivity());
                    binding.addDeliveryViewLine.setVisibility(View.VISIBLE);
                    binding.recipientArrow.setImageResource(R.drawable.ic_arrow_up);
                    binding.viewRecipient.setVisibility(View.VISIBLE);
                    value = false;
                }

                break;

            case R.id.nextBtn:
                if(isValid(true)){
                Functions.hideSoftKeyboard(getActivity());
                selectRecipient();
                }
                break;
            case R.id.typesOfItemBtn:

                openTypeOfItemScreen();

                break;

            case R.id.itemWeightLayout:

                openItemWeightScreen();
                break;

            default:
                break;
        }

    }


    private boolean isValid(boolean showMessage) {
        if (TextUtils.isEmpty(binding.etRecipientName.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please enter recipient name!",Toast.LENGTH_LONG).show();
            }
            return false;
        }

       else if (TextUtils.isEmpty(binding.etRecipientPhone.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please enter recipient number!",Toast.LENGTH_LONG).show();
            }
            return false;
        }


       else if (TextUtils.isEmpty(binding.tvDropOffAddres.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please enter recipient address!",Toast.LENGTH_LONG).show();
            }
            return false;
        }


       else if (TextUtils.isEmpty(binding.tvItemWeight.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please select item size!",Toast.LENGTH_LONG).show();
            }
            return false;
        }


      else  if (TextUtils.isEmpty(binding.tvTypeOfItem.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please select item type!",Toast.LENGTH_LONG).show();
            }
            return false;
        }


        return true;
    }


    private void openTypeOfItemScreen() {
        TypeOfItemFragment typeOfItemFragment = new TypeOfItemFragment(true, new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {

                    binding.tvTypeOfItem.setText(bundle.getString("item_name"));
                    model.setTypeOfItem(bundle.getString("item_name"));
                    model.setTypeOfItemId(bundle.getString("item_id"));

                    if (isValid(false)) {
                        enableButton();
                    } else {
                        disableButton();
                    }
                }
            }
        });
        typeOfItemFragment.show(getChildFragmentManager(), "");
        Functions.hideSoftKeyboard(getActivity());
    }

    private void openItemWeightScreen() {
        TotalWeightFragment totalWeightFragment = new TotalWeightFragment(true, new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    binding.tvItemWeight.setText(bundle.getString("item_weight"));

                    model.setPrice(bundle.getString("item_price"));
                    model.setPackageID(bundle.getString("item_id"));
                    model.setPackageSize(bundle.getString("item_weight"));
                    binding.tvTotal.setText(MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency) + model.getPrice());

                    if (isValid(false)) {
                        enableButton();
                    } else {
                        disableButton();
                    }
                }
            }
        });
        totalWeightFragment.show(getChildFragmentManager(), "");
        Functions.hideSoftKeyboard(getActivity());

    }


}