package com.terraai.aimobility.parcel.fragmentandactivities;

import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.core.content.ContextCompat;
import androidx.core.view.GravityCompat;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.google.android.gms.maps.model.LatLng;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.LocationModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentDeliveryDetailsBinding;
import com.terraai.aimobility.parcel.adapter.ParcelChangeAddress;
import com.terraai.aimobility.parcel.adapter.ParcelHistoryAdapter;
import com.terraai.aimobility.parcel.adapter.RecipientAdapter;
import com.terraai.aimobility.parcel.model.DeliveryMainModel;
import com.terraai.aimobility.parcel.model.ParcelHistoryModel;
import com.terraai.aimobility.parcel.model.RecipientModel;
import com.terraai.aimobility.ride.account.AccountFragment;
import com.rilixtech.widget.countrycodepicker.CountryCodePicker;

// import org.bouncycastle.cms.Recipient; // removed - not needed

import java.util.ArrayList;


public class DeliveryDetailsFragment extends RootFragment implements View.OnClickListener {

    boolean value = false;
    String userId, userName, userImage, userPhone, latitude, longtitude;
    double  pickLat, pickLong;
    LatLng pickupLatlong;
    LocationModel locationModel;
    FragmentDeliveryDetailsBinding binding;
    String  currencySymbol;

    public DeliveryDetailsFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentDeliveryDetailsBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longtitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        userPhone = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.phoneNo, "");
        currencySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        userName = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.fname, "")
                + " " + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.lname, "");
        pickLat = Double.parseDouble(latitude);
        pickLong = Double.parseDouble(longtitude);
        userImage = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.image, "");

        pickupLatlong = new LatLng(pickLat, pickLong);
        disableButton();
        initControl();
        setReceipentAdapter();

        setUpScreenData();
        addTextWatcher();
        return view;
    }

    private void addTextWatcher() {


        binding.etSenderName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                if (isValid(false)) {
                    enableButton();
                } else {
                    disableButton();
                }
            }

            @Override
            public void afterTextChanged(Editable editable) {

            }
        });
        binding.etSenderNumber.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                if (isValid(false)) {
                    enableButton();
                } else {
                    disableButton();
                }
            }

            @Override
            public void afterTextChanged(Editable editable) {

            }
        });
        binding.etSenderAddress.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                if (isValid(false)) {
                    enableButton();
                } else {
                    disableButton();
                }
            }

            @Override
            public void afterTextChanged(Editable editable) {

            }
        });


    }

    private void enableButton() {
        binding.nextBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
    }

    private void disableButton() {
        binding.nextBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
    }

    private boolean isValid(boolean showMessage) {

        if (TextUtils.isEmpty(binding.etSenderAddress.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please enter address!",Toast.LENGTH_LONG).show();
            }
            return false;
        }

        else if (TextUtils.isEmpty(binding.etSenderNumber.getText().toString())) {
            if(showMessage){
                Toast.makeText(getContext(),"Please enter number!",Toast.LENGTH_LONG).show();
            }
            return false;
        }

        else if(deliveryMainModel.getRecipientList().isEmpty()){
            if(showMessage){
                Toast.makeText(getContext(),"Please add recipient details!",Toast.LENGTH_LONG).show();
            }
            return false;
        }

        return true;
    }

    private void setUpScreenData() {
        String currentAddress = Functions.getAddressString(getActivity(), pickupLatlong.latitude , pickupLatlong.longitude);
        binding.etSenderAddress.setText(currentAddress);
        binding.tvAddressSenderOne.setText(currentAddress);

        binding.etSenderNumber.setText(userPhone);
        binding.tvPhoneSenderOne.setText(userPhone);
        binding.etSenderName.setText(userName);
        binding.tvNameSenderOne.setText(userName);

        if (userImage != null && !userImage.equalsIgnoreCase("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + userImage);
            binding.navigationFrame.userProfileImage.setImageURI(uri);
        }

        binding.navigationFrame.usernameTxt.setText(userName);
    }

    private void initControl() {

        binding.senderLayout.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.nextBtn.setOnClickListener(this);
        binding.addRecipientBtn.setOnClickListener(this);
        binding.senderAddressBtn.setOnClickListener(this);
        binding.navigationIcon.setOnClickListener(this);
        binding.navigationFrame.yourRidesLayout.setOnClickListener(this);
        binding.navigationFrame.settingBtn.setOnClickListener(this);
    }


    RecipientAdapter adapter;
    private void setReceipentAdapter() {
        adapter = new RecipientAdapter(getActivity(), deliveryMainModel.getRecipientList(), new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

                openAddRecipient(postion);
            }
        });
        binding.recyclerview.setAdapter(adapter);
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {


            case R.id.navigationIcon:

                if (binding.drawer.isDrawerOpen(GravityCompat.START)) {
                    binding.drawer.closeDrawer(GravityCompat.START);
                } else {
                    binding.drawer.openDrawer(GravityCompat.START);
                }

                break;



                case R.id.setting_btn:

                    AccountFragment payWithFragment = new AccountFragment();
                    FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                    transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                    transaction.add(R.id.fragment_main_container, payWithFragment).addToBackStack(null).commit();

                break;




            case R.id.yourRidesLayout:

                openOrderSection();
                binding.drawer.closeDrawers();

                break;

            case R.id.backBtn:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;


            case R.id.sender_address_btn:

                ParcelChangeAddress wheretoFragment = new ParcelChangeAddress(true, true, new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        locationModel = (LocationModel) bundle.getSerializable("locationModel");
                        binding.etSenderAddress.setText(locationModel.getFullpickUpAddress());
                        binding.tvAddressSenderOne.setText(locationModel.getFullpickUpAddress());
                        pickLat = locationModel.getPicklat();
                        pickLong = locationModel.getPicklng();
                        pickupLatlong = new LatLng(pickLat, pickLong);
                    }
                });

                Bundle bundle = new Bundle();
                bundle.putSerializable("dataModel", locationModel);
                wheretoFragment.setArguments(bundle);
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.delivery_detail_container, wheretoFragment, "wheretoFragment").addToBackStack("wheretoFragment").commit();

                break;



            case R.id.senderLayout:

                if (!value) {
                    if (TextUtils.isEmpty(binding.etSenderNoteDriver.getText().toString())) {
                        binding.tvSenderInstruction.setVisibility(View.GONE);
                    } else {
                        binding.tvSenderInstruction.setText(binding.etSenderNoteDriver.getText().toString());
                    }

                    binding.senderDetailsLayout.setVisibility(View.GONE);
                    binding.viewSender.setVisibility(View.GONE);
                    binding.namePhoneLayout.setVisibility(View.VISIBLE);
                    Functions.hideSoftKeyboard(getActivity());
                    binding.ivArrowDown.setImageResource(R.drawable.ic_arrow_down);
                    value = true;

                } else {

                    binding.senderDetailsLayout.setVisibility(View.VISIBLE);
                    binding.namePhoneLayout.setVisibility(View.GONE);
                    Functions.hideSoftKeyboard(getActivity());
                    binding.ivArrowDown.setImageResource(R.drawable.ic_arrow_up);
                    binding.viewSender.setVisibility(View.VISIBLE);
                    value = false;

                }

                break;

            case R.id.addRecipientBtn:
                openAddRecipient(-1);
                break;

            case R.id.nextBtn:
                if(isValid(true)) {
                    Functions.hideSoftKeyboard(getActivity());
                    methodOpenReviewDelivery();
                }
                break;

            default:
                break;
        }

    }


    private void openAddRecipient(int pos){
        DeliveryRecipientF deliveryRecipientF = new DeliveryRecipientF( new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if(bundle!=null) {
                    RecipientModel model =(RecipientModel) bundle.getSerializable("data");
                    if (pos < 0) {
                        deliveryMainModel.getRecipientList().add(model);
                    }
                    else
                        deliveryMainModel.getRecipientList().set(pos,model);

                    adapter.notifyDataSetChanged();
                    calculateTotalPrice();

                    if (isValid(false)) {
                        enableButton();
                    } else {
                        disableButton();
                    }

                }
            }
        });

        if(pos>=0) {
            Bundle bundle1 = new Bundle();
            bundle1.putSerializable("data",  deliveryMainModel.getRecipientList().get(pos));
            deliveryRecipientF.setArguments(bundle1);
        }
        FragmentTransaction beginTransaction = getActivity().getSupportFragmentManager().beginTransaction();
        beginTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        beginTransaction.add(R.id.delivery_detail_container, deliveryRecipientF, "").addToBackStack(null).commit();

    }


    private void openOrderSection() {
        HistoryParcelFragment historyParcelFragment = new HistoryParcelFragment();
        FragmentTransaction tr1 = getActivity().getSupportFragmentManager().beginTransaction();
        tr1.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        tr1.add(R.id.fragment_main_container, historyParcelFragment).addToBackStack(null).commit();
    }

    DeliveryMainModel deliveryMainModel = new DeliveryMainModel();
    private void methodOpenReviewDelivery() {

        deliveryMainModel.setSenderName(binding.etSenderName.getText().toString());
        deliveryMainModel.setSenderAddress(binding.etSenderAddress.getText().toString());
        deliveryMainModel.setSenderFloor(binding.etSenderAddFloor.getText().toString());
        deliveryMainModel.setSenderNote(binding.etSenderNoteDriver.getText().toString());
        deliveryMainModel.setSenderNumber(binding.etSenderNumber.getText().toString());
        deliveryMainModel.setSenderLat(pickLat);
        deliveryMainModel.setSenderLong(pickLong);



        Functions.hideSoftKeyboard(getActivity());
        ReviewDeliveryFragment reviewDeliveryFragment = new ReviewDeliveryFragment(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        getActivity().runOnUiThread(new Runnable() {
                            @Override
                            public void run() {

                                getParentFragmentManager().popBackStack();

                            }
                        });
                    }
                },1000);


            }
        });
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        Bundle args = new Bundle();
        args.putSerializable("dataModel", deliveryMainModel);
        reviewDeliveryFragment.setArguments(args);
        FragmentTransaction ft = fragmentManager.beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.delivery_detail_container, reviewDeliveryFragment).addToBackStack(null).commit();
    }

    public void calculateTotalPrice(){
        int totalPrice=0;
        for (RecipientModel item:deliveryMainModel.getRecipientList()){
            totalPrice=totalPrice+Integer.parseInt(item.getPrice());
        }
        deliveryMainModel.setTotalPrice(""+totalPrice);
        binding.tvTotal.setText(currencySymbol+deliveryMainModel.getTotalPrice());
    }



}