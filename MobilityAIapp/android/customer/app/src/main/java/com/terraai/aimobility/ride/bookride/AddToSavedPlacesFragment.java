package com.terraai.aimobility.ride.bookride;

import android.util.Log;

import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.core.content.ContextCompat;

import com.google.android.gms.maps.model.LatLng;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.NearbyModelClass;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentAddToSavedPlacesBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;


public class AddToSavedPlacesFragment extends RootFragment implements View.OnClickListener {

    Bundle bundle;
    String address, title, latitude, longitude;
    FragmentCallBack callBack;
    FragmentAddToSavedPlacesBinding binding;

    public AddToSavedPlacesFragment(FragmentCallBack fragmentCallBack) {
        this.callBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentAddToSavedPlacesBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        bundle = getArguments();

        if (bundle != null) {
            latitude = bundle.getString("latitude");
            longitude = bundle.getString("longitude");
            address = bundle.getString("address");
            title = bundle.getString("title");
        }

        initializeListeners();
        setUpScreenData();

        return view;
    }

    private void setUpScreenData() {
        String uri = Functions.getStaticMapViewUrl(getContext(), latitude, longitude);

        Uri uri1 = Uri.parse(uri);
        binding.ivMap.setImageURI(uri1);
        binding.tvTitle.setText(title);
        binding.tvAddress.setText(address);
    }

    private void initializeListeners() {
        binding.backBtn.setOnClickListener(this);
        binding.saveBtn.setOnClickListener(this);
        binding.saveBtn.setEnabled(false);
        binding.saveBtn.setClickable(false);
        binding.etAddress.setText(address);

        binding.etName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

                if (binding.etName.getText().length() > 0) {
                    binding.saveBtn.setEnabled(true);
                    binding.saveBtn.setClickable(true);
                    binding.saveBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));

                } else {
                    binding.saveBtn.setEnabled(false);
                    binding.saveBtn.setClickable(false);
                    binding.saveBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }

            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

                break;

            case R.id.saveBtn:

                Functions.hideSoftKeyboard(getActivity());

                callApiCallForSave();

                break;

            default:
                break;
        }
    }

    private void callApiCallForSave() {
        JSONObject params = new JSONObject();

        try {
            params.put("lat", latitude);
            params.put("long", longitude);
            params.put("location_string", address);
            params.put("name", binding.etName.getText().toString());
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
            params.put("language_id", "1");
            params.put("flat", "");
            params.put("building_name", "");
            params.put("address_label", "");
            params.put("instruction", "");


        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        binding.saveBtn.startLoading();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).addUserPlace(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.saveBtn.stopLoading();
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

                                    model.placeId = "";

                                    double latitude = Double.parseDouble(lat);
                                    double longitude = Double.parseDouble(lng);
                                    LatLng latlng = new LatLng(latitude, longitude);
                                    model.latLng = latlng;
                                    model.lat = latitude;
                                    model.lng = longitude;

                                    Bundle bundle = new Bundle();
                                    bundle.putSerializable("model", model);

                                    if (callBack != null)
                                        callBack.onItemClick(bundle);

                                    getActivity().onBackPressed();
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
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




}