package com.yna.opusaimobilityapp.ride.bookride;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

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
import com.yna.opusaimobilityapp.model.LocationModel;
import com.yna.opusaimobilityapp.model.NearbyModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentSearchLocationBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

import io.paperdb.Paper;


public class SavePlacesFragment extends RootFragment implements View.OnClickListener, SwipeRefreshLayout.OnRefreshListener {


    ShowLocationsAdapter showSavedLocationsAdapter;
    String userId;
    ArrayList<LatLng> latlngList = new ArrayList<>();
    ArrayList<NearbyModelClass> savedList = new ArrayList<>();
    String latitude, longtitude;
    Bundle bundle;
    String whichScreen;
    FragmentCallBack fragmentCallBack;
    LocationModel locationModel;
    boolean goBack;
    FragmentSearchLocationBinding binding;
    public SavePlacesFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentSearchLocationBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longtitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
        bundle = getArguments();
        if (bundle != null) {
            whichScreen = bundle.getString("fromWhere");
            locationModel = (LocationModel) bundle.getSerializable("locationModel");
            goBack = bundle.getBoolean("goBack");
        }

        methodInitLayouts();
        methodSetSavedLocationAdapter();

        callApiOfShowUserPlaces();

        return view;
    }


    /*Method InitLayouts*/
    private void methodInitLayouts() {

        binding.backBtn.setOnClickListener(this);
        binding.swiperefreshlayout.setOnRefreshListener(this);
    }


    private void callApiOfShowUserPlaces() {
        JSONObject params = new JSONObject();

        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (savedList.isEmpty() && !binding.swiperefreshlayout.isRefreshing()) {
            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        }
        savedList.clear();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showUserPlaces(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        binding.swiperefreshlayout.setRefreshing(false);
                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();

                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    JSONArray msgarray = respobj.getJSONArray("msg");
                                    for (int i = 0; i < msgarray.length(); i++) {
                                        JSONObject msgobj = msgarray.getJSONObject(i);
                                        JSONObject userPlace = msgobj.getJSONObject("UserPlace");

                                        String name = userPlace.getString("name");
                                        String lat = userPlace.getString("lat");
                                        String lng = userPlace.getString("long");
                                        String id = userPlace.getString("id");
                                        String locationString = userPlace.getString("location_string");
                                        String googlePlaceId = userPlace.getString("google_place_id");

                                        double latitude = Double.parseDouble(lat);
                                        double longitude = Double.parseDouble(lng);
                                        LatLng latlng = new LatLng(latitude, longitude);

                                        NearbyModelClass model = new NearbyModelClass();

                                        model.title = name;
                                        model.address = locationString;
                                        model.placeId = googlePlaceId;
                                        model.id = id;
                                        model.latLng = latlng;
                                        model.lat = latitude;
                                        model.lng = longitude;
                                        savedList.add(model);
                                        latlngList.add(latlng);
                                    }
                                    if (!savedList.isEmpty()) {
                                        Paper.book("Saved_Location").delete("saved_list");
                                        Paper.book("Saved_Location").write("saved_list", savedList);
                                        binding.rlSavedLocations.setVisibility(View.VISIBLE);
                                    }

                                    showSavedLocationsAdapter.notifyDataSetChanged();
                                } else {
                                    Paper.book("Saved_Location").delete("saved_list");
                                    savedList.clear();
                                    binding.noDataContainer.noDataLocation.setVisibility(View.VISIBLE);
                                    binding.rlSavedLocations.setVisibility(View.GONE);
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

        binding.savedLocationRecycler.setLayoutManager(new LinearLayoutManager(getActivity()));
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
                        if (!goBack) {
                            if (whichScreen.equals("dropOffScreen")) {
                                StartRideFragment startRideFragment = new StartRideFragment();
                                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                                LocationModel model1 = new LocationModel();
                                model1.setPickUpAddress(locationModel.getPickUpAddress());
                                model1.setPicklat(locationModel.getPicklat());
                                model1.setPicklng(locationModel.getPicklng());
                                model1.setFullpickUpAddress(locationModel.getFullpickUpAddress());
                                model1.setDropOffAddress(nearbyModelClass.title);
                                model1.setDropOfflat(nearbyModelClass.lat);
                                model1.setDropOfflng(nearbyModelClass.lng);
                                model1.setScheduledatetime(locationModel.getSchedule());
                                model1.setSchedule(locationModel.getScheduledatetime());
                                Bundle bundle = new Bundle();
                                bundle.putSerializable("locationModel", model1);
                                startRideFragment.setArguments(bundle);
                                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                                fragmentTransaction.add(R.id.searchLocation_Container, startRideFragment, "startRideFragment").addToBackStack("startRideFragment").commit();
                            } else {
                                Bundle callBackBundle = new Bundle();
                                callBackBundle.putString("Latitude", "" + nearbyModelClass.lat);
                                callBackBundle.putString("Longitude", "" + nearbyModelClass.lng);
                                callBackBundle.putString("Address", nearbyModelClass.title);
                                callBackBundle.putString("fullAddress", nearbyModelClass.address);
                                fragmentCallBack.onItemClick(callBackBundle);
                                getActivity().onBackPressed();
                            }
                        } else {
                            Bundle callBackBundle = new Bundle();
                            callBackBundle.putString("Latitude", "" + nearbyModelClass.lat);
                            callBackBundle.putString("Longitude", "" + nearbyModelClass.lng);
                            callBackBundle.putString("Address", nearbyModelClass.title);
                            callBackBundle.putString("fullAddress", nearbyModelClass.address);
                            fragmentCallBack.onItemClick(callBackBundle);
                            getActivity().onBackPressed();
                        }


                        break;

                    default:
                        break;
                }

            }
        }, new AdapterLongClickListener() {
            @Override
            public void onLongItemClick(int postion, Object model, View view) {
                //for long press
            }
        } , false);
        binding.savedLocationRecycler.setAdapter(showSavedLocationsAdapter);

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
                                    latlngList.clear();
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
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.backBtn:
                getActivity().onBackPressed();
                break;

            default:
                break;
        }
    }

    @Override
    public void onRefresh() {
        binding.swiperefreshlayout.setRefreshing(true);
        callApiOfShowUserPlaces();
    }
}