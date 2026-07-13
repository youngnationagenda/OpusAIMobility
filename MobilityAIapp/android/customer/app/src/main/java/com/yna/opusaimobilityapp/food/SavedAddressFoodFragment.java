package com.yna.opusaimobilityapp.food;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.android.gms.maps.model.LatLng;
import com.yna.opusaimobilityapp.adapter.ShowLocationsAdapter;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.Interface.AdapterLongClickListener;
import com.yna.opusaimobilityapp.Interface.CallbackResponse;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.model.NearbyModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentSavedAddressBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

public class SavedAddressFoodFragment extends RootFragment implements View.OnClickListener , SwipeRefreshLayout.OnRefreshListener {

    FragmentSavedAddressBinding binding;
    ShowLocationsAdapter showSavedLocationsAdapter;
    String userId;

    ArrayList<NearbyModelClass> savedList = new ArrayList<>();
    String latitude, longtitude;
    FragmentCallBack fragmentCallBack;

    public SavedAddressFoodFragment() {
        // Required empty public constructor
    }

    public SavedAddressFoodFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentSavedAddressBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longtitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        initializeListeners();
        methodSetSavedLocationAdapter();
        callApiOfShowUserPlaces();

        return view;
    }

    private void initializeListeners() {
        binding.backBtn.setOnClickListener(this);
        binding.swiperefreshlayout.setOnRefreshListener(this);
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

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
            e.printStackTrace();
        }

        if (savedList.isEmpty() && !binding.swiperefreshlayout.isRefreshing()) {
            binding.shimmerView.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerView.shimmerViewContainer.startShimmer();
        }
        savedList.clear();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showUserPlaces(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.swiperefreshlayout.setRefreshing(false);
                        binding.shimmerView.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerView.shimmerViewContainer.stopShimmer();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    JSONArray msgarray = respobj.getJSONArray("msg");
                                    for (int i = 0; i < msgarray.length(); i++) {
                                        JSONObject msgobj = msgarray.getJSONObject(i);
                                        JSONObject userPlace = msgobj.getJSONObject("UserPlace");

                                        String lat = userPlace.getString("lat");
                                        String lng = userPlace.getString("long");
                                        String id = userPlace.getString("id");

                                        double latitude = Double.parseDouble(lat);
                                        double longitude = Double.parseDouble(lng);
                                        LatLng latlng = new LatLng(latitude, longitude);

                                        NearbyModelClass model = new NearbyModelClass();
                                        model.flat = userPlace.optString("flat");
                                        model.buildingName = userPlace.optString("building_name");
                                        model.addressLabel = userPlace.optString("address_label");
                                        model.additonalAddressInformation = userPlace.optString("additonal_address_information");
                                        model.addInstruction = userPlace.optString("instruction");

                                        model.title = userPlace.getString("name");
                                        model.address = userPlace.getString("location_string");
                                        model.placeId = userPlace.getString("google_place_id");
                                        model.id = id;
                                        model.latLng = latlng;
                                        model.lat = latitude;
                                        model.lng = longitude;
                                        model.isEditable = true;
                                        savedList.add(model);
                                    }
                                    showSavedLocationsAdapter.notifyDataSetChanged();
                                } else {
                                    binding.noDataView.noDataLocation.setVisibility(View.VISIBLE);
                                    savedList.clear();
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

    /*Method SetSavedLocationAdapter*/
    private void methodSetSavedLocationAdapter() {

        binding.savedAddressRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity()));
        showSavedLocationsAdapter = new ShowLocationsAdapter(getActivity(), true, savedList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int postion, Object model, View view) {

                NearbyModelClass nearbyModelClass1 = (NearbyModelClass) model;

                switch (view.getId()) {
                    case R.id.savedLocationIcon:
                        Functions.customAlertDialog(getActivity(), "Remove Favourite", "Are you sure you want to remove this save location?", "Delete", true,new CallbackResponse() {
                            @Override
                            public void responce(String resp) {
                                if (resp != null && resp.equalsIgnoreCase("okay")) {
                                    String favPlaceId = nearbyModelClass1.id;
                                    callApiForDeletePlace(favPlaceId);
                                }
                            }
                        });
                        break;

                    case R.id.locationLayout:
                        NearbyModelClass nearbyModelClass = (NearbyModelClass) model;
                        if(fragmentCallBack != null){
                            Bundle bundle = new Bundle();
                            bundle.putSerializable("model",nearbyModelClass);
                            fragmentCallBack.onItemClick(bundle);
                        }

                        getActivity().onBackPressed();

                        break;

                    case R.id.ic_edit:
                        NearbyModelClass modelClass = (NearbyModelClass) model;
                        AddDeliveryNote addDeliveryNote = new AddDeliveryNote(new FragmentCallBack() {
                            @Override
                            public void onItemClick(Bundle bundle) {
                                if (bundle != null) {
                                    if(bundle.containsKey("onDelete")){
                                        binding.swiperefreshlayout.setRefreshing(true);
                                        callApiOfShowUserPlaces();
                                    }else{
                                        fragmentCallBack.onItemClick(bundle);
                                        getActivity().onBackPressed();
                                    }
                                }
                            }
                        });
                        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                        Bundle bundle = new Bundle();
                        bundle.putSerializable("nearModel", modelClass);
                        addDeliveryNote.setArguments(bundle);
                        FragmentTransaction ft = fragmentManager.beginTransaction();
                        ft.setCustomAnimations(R.anim.in_from_bottom, R.anim.out_to_top, R.anim.in_from_top, R.anim.out_from_bottom);
                        ft.replace(R.id.save_food_container, addDeliveryNote).addToBackStack(null).commit();

                        break;


                    default:
                        break;
                }

            }
        }, new AdapterLongClickListener() {
            @Override
            public void onLongItemClick(int postion, Object model, View view) {
                NearbyModelClass nearbyModelClass1 = (NearbyModelClass) model;
                Functions.customAlertDialog(getActivity(), "Remove Favourite", "Are you sure you want to remove this save location?", "Delete",true, new CallbackResponse() {
                    @Override
                    public void responce(String resp) {
                        if (resp != null && resp.equalsIgnoreCase("okay")) {
                            String favPlaceId = nearbyModelClass1.id;
                            callApiForDeletePlace(favPlaceId);
                        }
                    }
                });
            }
        } , true);
        binding.savedAddressRecyclerView.setAdapter(showSavedLocationsAdapter);

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
                                    callApiOfShowUserPlaces();
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
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



    @Override
    public void onRefresh() {
        binding.swiperefreshlayout.setRefreshing(true);
        callApiOfShowUserPlaces();
    }


}