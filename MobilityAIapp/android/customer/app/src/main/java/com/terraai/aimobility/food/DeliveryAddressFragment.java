package com.terraai.aimobility.food;

import android.util.Log;

import android.content.DialogInterface;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.gms.maps.model.LatLng;
import com.terraai.aimobility.adapter.ShowLocationsAdapter;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.AdapterLongClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.NearbyModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentDeliveryAddressBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;


public class DeliveryAddressFragment extends RootFragment implements View.OnClickListener {

    FragmentDeliveryAddressBinding binding;
    ArrayList<NearbyModelClass> recentPlaceList = new ArrayList<>();
    String userId;
    ShowLocationsAdapter showRecentLocationsAdapter;
    private String latitude, longtitude;
    double pickUpLat, pickUpLong;
    FragmentCallBack fragmentCallBack;
    private LatLng pickupLatlong;
    NearbyModelClass nearbyModelClass = new NearbyModelClass();
    Bundle bundlePutBack;

    public DeliveryAddressFragment() {
        // Required empty public constructor
    }

    public DeliveryAddressFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentDeliveryAddressBinding.inflate(getLayoutInflater());
        View rootView = binding.getRoot();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");

        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longtitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
        pickUpLat = Double.parseDouble(latitude);
        pickUpLong = Double.parseDouble(longtitude);


        pickupLatlong = new LatLng(pickUpLat, pickUpLong);

        bundlePutBack = getArguments();
        if (bundlePutBack != null) {
            nearbyModelClass = (NearbyModelClass) bundlePutBack.getSerializable("nearModel");
        }

        initializeListeners();
        methodSetRecentAdapter();
        callApiOfShowUserPlaces();

        return rootView;
    }

    private void initializeListeners() {

        binding.tvCurrentLocation.setText(Functions.getAddressString(getContext(),pickUpLat,pickUpLong));

        binding.savedPlacesBtn.setOnClickListener(this);
        binding.searchLayout.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.currentBtn.setOnClickListener(this);
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.savedPlacesBtn:

                Functions.hideSoftKeyboard(getActivity());
                methodOpenSavedAddress();

                break;

            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

                break;

            case R.id.searchLayout:

                Functions.hideSoftKeyboard(getActivity());
                methodOpenSearchScreen();

                break;


            case R.id.currentBtn:

                Functions.hideSoftKeyboard(getActivity());
                AddDeliveryNote addDeliveryNote = new AddDeliveryNote(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if (bundle != null) {
                            fragmentCallBack.onItemClick(bundle);
                            getActivity().onBackPressed();
                        }
                    }
                });
                FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                Bundle bundle = new Bundle();
                nearbyModelClass = new NearbyModelClass();
                nearbyModelClass.latLng = pickupLatlong;
                nearbyModelClass.title = Functions.getAddressSubString(getActivity(), pickupLatlong);

                bundle.putSerializable("nearModel", nearbyModelClass);
                addDeliveryNote.setArguments(bundle);

                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
                ft.replace(R.id.delivery_address_container, addDeliveryNote).addToBackStack(null).commit();
                break;

            default:
                break;
        }

    }


    private void callApiOfShowUserPlaces() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        recentPlaceList.clear();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRecentLocations(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msgarray = respobj.getJSONArray("msg");

                                        for (int i = 0; i < msgarray.length(); i++) {
                                            JSONObject msgobj = msgarray.getJSONObject(i);
                                            JSONObject userPlace = msgobj.getJSONObject("RecentLocation");

                                            String name = userPlace.getString("short_name");
                                            String lat = userPlace.getString("lat");
                                            String lng = userPlace.getString("long");
                                            String id = userPlace.getString("id");
                                            String locationString = userPlace.getString("location_string");

                                            double latitude = Double.parseDouble(lat);
                                            double longitude = Double.parseDouble(lng);
                                            LatLng latlng = new LatLng(latitude, longitude);

                                            NearbyModelClass model = new NearbyModelClass();
                                            model.addInstruction = userPlace.optString("instruction");
                                            model.title = name;
                                            model.address = locationString;
                                            model.id = id;
                                            model.latLng = latlng;
                                            model.lat = latitude;
                                            model.lng = longitude;
                                            model.isEditable = false;
                                            recentPlaceList.add(model);
                                        }
                                        showRecentLocationsAdapter.notifyDataSetChanged();
                                    } else {
                                        binding.tvRecentLocation.setVisibility(View.GONE);
                                        recentPlaceList.clear();
                                    }

                                    showRecentLocationsAdapter.notifyDataSetChanged();
                                } catch (JSONException e) {
                                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                                    Functions.logDMsg("exception at showRecentLocations : " + e.toString());
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }

    /*Method SetSavedLocationAdapter*/
    private void methodSetRecentAdapter() {
        binding.recentLocationRcView.setLayoutManager(new LinearLayoutManager(getActivity()));
        showRecentLocationsAdapter = new ShowLocationsAdapter(getActivity(), false, recentPlaceList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {
                switch (view.getId()) {
                    case R.id.locationLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        NearbyModelClass nearbyModelClass = (NearbyModelClass) model;
                        AddDeliveryNote addDeliveryNote = new AddDeliveryNote(new FragmentCallBack() {
                            @Override
                            public void onItemClick(Bundle bundle) {
                                if (bundle != null) {
                                    fragmentCallBack.onItemClick(bundle);
                                    getActivity().onBackPressed();
                                }
                            }
                        });
                        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                        Bundle bundle = new Bundle();
                        bundle.putSerializable("nearModel", nearbyModelClass);
                        addDeliveryNote.setArguments(bundle);
                        FragmentTransaction ft = fragmentManager.beginTransaction();
                        ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
                        ft.replace(R.id.delivery_address_container, addDeliveryNote).addToBackStack(null).commit();
                        break;

                    default:
                        break;
                }

            }
        }, new AdapterLongClickListener() {
            @Override
            public void onLongItemClick(int postion, Object model, View view) {
                NearbyModelClass modelClass = (NearbyModelClass) model;
                deleteMessageDialog(modelClass);
            }
        }, false);
        binding.recentLocationRcView.setAdapter(showRecentLocationsAdapter);
        showRecentLocationsAdapter.notifyDataSetChanged();
    }


    // this is the delete message diloge which will show after long press in chat message
    private void deleteMessageDialog(final NearbyModelClass modelClass) {
        final CharSequence[] options;
        options = new CharSequence[]{getString(R.string.delete_this_place), getString(R.string.cancel)};
        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity(), R.style.AlertDialogCustom);
        builder.setTitle(null);
        builder.setItems(options, new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int item) {
                if (options[item].equals(getString(R.string.delete_this_place))) {
                    updateRecent(modelClass.id);
                } else if (options[item].equals(getString(R.string.cancel))) {
                    dialog.dismiss();
                }
            }
        });
        builder.show();
    }

    private void updateRecent(String id) {
        JSONObject params = new JSONObject();
        try {
            params.put("id", id);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        Functions.showLoader(getActivity(), false, false);

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).deleteRecentLocation(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                Functions.logDMsg("resp at updateRecent : " + resp);
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        callApiOfShowUserPlaces();
                                    } else {
                                        Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
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

    private void methodOpenSavedAddress() {

        Functions.hideSoftKeyboard(getActivity());
        SavedAddressFoodFragment savedAddressFoodFragment = new SavedAddressFoodFragment(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    nearbyModelClass = (NearbyModelClass) bundle.getSerializable("model");
                    if (fragmentCallBack != null) {
                        bundlePutBack = new Bundle();
                        bundlePutBack.putSerializable("model", nearbyModelClass);
                        fragmentCallBack.onItemClick(bundlePutBack);
                    }
                    getActivity().onBackPressed();
                }
            }
        });
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.delivery_address_container, savedAddressFoodFragment).addToBackStack(null).commit();
    }

    private void methodOpenSearchScreen() {

        Functions.hideSoftKeyboard(getActivity());
        EnterNewAddressFragment enterNewAddressFragment = new EnterNewAddressFragment(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    nearbyModelClass = (NearbyModelClass) bundle.getSerializable("model");
                    if (fragmentCallBack != null) {
                        bundlePutBack = new Bundle();
                        bundlePutBack.putSerializable("model", nearbyModelClass);
                        fragmentCallBack.onItemClick(bundlePutBack);
                    }
                    getActivity().onBackPressed();
                }
            }
        });
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.delivery_address_container, enterNewAddressFragment).addToBackStack(null).commit();
    }

}