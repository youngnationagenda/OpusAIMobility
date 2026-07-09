package com.terraai.aimobility.food;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.mapclasses.MapWorker;
import com.terraai.aimobility.model.ConfirmLocationModel;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentAddDeliveryNoteBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

public class AddDeliveryNote extends RootFragment implements View.OnClickListener, OnMapReadyCallback {

    Context context;
    String userId;
    Marker pickupMarker;
    Bitmap pickUpMarkerBitmap;
    Bundle bundle;
    NearbyModelClass nearbyModelClass = new NearbyModelClass();
    MapWorker mapWorker;
    ConfirmLocationModel confirmLocationModel;
    FragmentAddDeliveryNoteBinding binding;
    FragmentCallBack fragmentCallBack;
    private LatLng mDefaultLocation;
    private GoogleMap mGoogleMap;
    private String riderInstruction, title, addLabel, flat, buildingName, myAddressInformation;

    public AddDeliveryNote(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentAddDeliveryNoteBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        userId = MyPreferences.getSharedPreference(context).getString(MyPreferences.USER_ID, "");
        bundle = getArguments();
        if (bundle != null) {
            nearbyModelClass = (NearbyModelClass) bundle.getSerializable("nearModel");
            mDefaultLocation = nearbyModelClass.latLng;
            addLabel = nearbyModelClass.addressLabel;
            flat = nearbyModelClass.flat;
            buildingName = nearbyModelClass.buildingName;
            myAddressInformation = nearbyModelClass.additonalAddressInformation;
            title = nearbyModelClass.title;
            if (nearbyModelClass.isEditable) {
                binding.deleteBtn.setVisibility(View.VISIBLE);
            }
            riderInstruction = nearbyModelClass.addInstruction;
        }

        initializeListeners();

        setUpScreenData();

        addTextWatcher();

        binding.map4.onCreate(savedInstanceState);
        setupMapIfNeeded();
        pickUpMarkerBitmap = Functions.getMarkerDropPinView(context);
        return view;
    }

    private void addTextWatcher() {
        binding.etAddressInformation.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                checkValidation();
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });
    }



    private void checkValidation(){
        if (TextUtils.isEmpty(binding.etAddressInformation.getText().toString())) {
            disableButton();
        }
        else {
            enableButton();
        }
    }

    private void enableButton() {
        binding.btnSaveContinue.setClickable(true);
        binding.btnSaveContinue.setEnabled(true);
        binding.btnSaveContinue.setBackground(ContextCompat.getDrawable(context, R.drawable.app_color_bg_btn));
    }

    private void disableButton() {
        binding.btnSaveContinue.setClickable(false);
        binding.btnSaveContinue.setEnabled(false);
        binding.btnSaveContinue.setBackground(ContextCompat.getDrawable(context, R.drawable.un_selected_btn_grey));
    }


    private void setUpScreenData() {


        binding.tvAddress.setText(title);

        binding.etAddInstruction.setText(riderInstruction);
        binding.etAddressInformation.setText(myAddressInformation);

        binding.etBuildingName.setText(buildingName);
        binding.etAddLabel.setText(addLabel);
        binding.etFlat.setText(flat);

        checkValidation();

    }

    private void initializeListeners() {
        binding.moveThePin.setOnClickListener(this);
        binding.btnSaveContinue.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.deleteBtn.setOnClickListener(this);
    }



    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
            binding.map4.onResume();
            binding.map4.getMapAsync(this);
        }
    }

    @Override
    public void onMapReady(@NonNull GoogleMap googleMap) {
        mGoogleMap = googleMap;
        mapWorker = new MapWorker(context, this.mGoogleMap);
        if (mGoogleMap != null) {

            googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(getActivity(), R.raw.gray_map));

            if (ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(getActivity()
                    , Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {

                return;
            }

            mGoogleMap.setMyLocationEnabled(true);
            mGoogleMap.getUiSettings().setAllGesturesEnabled(false);
            mGoogleMap.getUiSettings().setMyLocationButtonEnabled(false);
            mGoogleMap.getUiSettings().setCompassEnabled(false);
            mGoogleMap.setMyLocationEnabled(false);
            zoomToCurrentLocation();
            mGoogleMap.setOnCameraIdleListener(new GoogleMap.OnCameraIdleListener() {
                @Override
                public void onCameraIdle() {
                    sendScreenPosition();
                }
            });
        }
    }


    private void zoomToCurrentLocation() {
        mGoogleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(mDefaultLocation, 13));
        binding.mapOverlay.setVisibility(View.GONE);
    }


    private void sendScreenPosition() {
        if (pickupMarker == null)
            pickupMarker = mapWorker.addMarker(mDefaultLocation, pickUpMarkerBitmap);
        else {
            pickupMarker.remove();
            pickupMarker = mapWorker.addMarker(mDefaultLocation, pickUpMarkerBitmap);
        }
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.backBtn:
                getActivity().onBackPressed();
                break;

            case R.id.move_the_pin:
                Functions.hideSoftKeyboard(getActivity());
                ConfirmLocation confirmLocation = new ConfirmLocation(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            confirmLocationModel = (ConfirmLocationModel) bundle.getSerializable("dataModel");
                            mDefaultLocation = new LatLng(confirmLocationModel.lat,confirmLocationModel.lng);
                            binding.tvAddress.setText(Functions.getAddressSubString(context, mDefaultLocation));
                            sendScreenPosition();
                            zoomToCurrentLocation();
                        }
                    }
                });


                FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                Bundle bundle = new Bundle();
                confirmLocationModel = new ConfirmLocationModel();
                confirmLocationModel.lat = mDefaultLocation.latitude;
                confirmLocationModel.lng = mDefaultLocation.longitude;
                confirmLocationModel.title = binding.tvAddress.getText().toString();
                confirmLocationModel.additionalInfo = "" + binding.etAddressInformation.getText().toString();
                bundle.putSerializable("nearModel", confirmLocationModel);
                confirmLocation.setArguments(bundle);
                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                ft.replace(R.id.add_delivery_container, confirmLocation).addToBackStack(null).commit();
                break;


            case R.id.btn_save_continue:

                callApiForSaveAddress();

                break;

            case R.id.delete_btn:

                callApiForDeletePlace(nearbyModelClass.id);

                break;

            default:
                break;
        }
    }


    private void callApiForDeletePlace(String favPlaceId) {
        JSONObject params = new JSONObject();
        try {
            params.put("id", favPlaceId);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).deleteUserPlace(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    Bundle bundle = new Bundle();
                                    bundle.putString("onDelete", "done");
                                    fragmentCallBack.onItemClick(bundle);
                                    getActivity().onBackPressed();
                                } else {
                                    Functions.dialouge(getActivity(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }

    private void callApiForSaveAddress() {
        JSONObject params = new JSONObject();

        try {
            params.put("lat", mDefaultLocation.latitude);
            params.put("long", mDefaultLocation.longitude);
            params.put("location_string", Functions.getAddressString(context, mDefaultLocation.latitude, mDefaultLocation.longitude));
            if (TextUtils.isEmpty(binding.etAddLabel.getText().toString())) {
                params.put("name", Functions.getAddressSubString(getActivity(), mDefaultLocation));
            } else {
                params.put("name", binding.etAddLabel.getText().toString());
            }

            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
            params.put("flat", binding.etFlat.getText().toString());
            params.put("building_name", binding.etBuildingName.getText().toString());
            params.put("address_label", binding.etAddLabel.getText().toString());
            params.put("additonal_address_information", binding.etAddressInformation.getText().toString());
            params.put("instruction", binding.etAddInstruction.getText().toString());
            if (nearbyModelClass.isEditable) {
                params.put("id", nearbyModelClass.id);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        binding.btnSaveContinue.startLoading();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).addUserPlace(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.btnSaveContinue.stopLoading();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    JSONObject placeobj = respobj.getJSONObject("msg").getJSONObject("UserPlace");

                                    NearbyModelClass model = new NearbyModelClass();

                                    model.title = placeobj.optString("name");
                                    String lat = placeobj.optString("lat","0.0");
                                    String lng = placeobj.optString("long","0.0");
                                    model.id = placeobj.optString("id");
                                    model.address = placeobj.optString("location_string");

                                    model.flat = placeobj.optString("flat");
                                    model.buildingName = placeobj.optString("building_name");
                                    model.addressLabel = placeobj.optString("address_label");
                                    model.additonalAddressInformation = placeobj.optString("additonal_address_information");
                                    model.addInstruction = placeobj.optString("instruction");

                                    model.placeId = "";

                                    double latitude = Double.parseDouble(lat);
                                    double longitude = Double.parseDouble(lng);
                                    LatLng latlng = new LatLng(latitude, longitude);
                                    model.latLng = latlng;
                                    model.lat = latitude;
                                    model.lng = longitude;

                                    Bundle bundle = new Bundle();
                                    bundle.putSerializable("model", model);

                                    if (fragmentCallBack != null)
                                        fragmentCallBack.onItemClick(bundle);

                                    getActivity().onBackPressed();
                                } else {
                                    Functions.dialouge(getActivity(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        getActivity().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN);
    }

    @Override
    public void onDetach() {
        super.onDetach();
        getActivity().getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
    }
}