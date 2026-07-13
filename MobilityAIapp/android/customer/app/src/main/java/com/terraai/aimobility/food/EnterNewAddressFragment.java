package com.terraai.aimobility.food;

import android.util.Log;

import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.libraries.places.api.Places;
import com.google.android.libraries.places.api.model.AutocompletePrediction;
import com.google.android.libraries.places.api.model.AutocompleteSessionToken;
import com.google.android.libraries.places.api.model.LocationBias;
import com.google.android.libraries.places.api.model.Place;
import com.google.android.libraries.places.api.model.RectangularBounds;
import com.google.android.libraries.places.api.model.TypeFilter;
import com.google.android.libraries.places.api.net.FetchPlaceRequest;
import com.google.android.libraries.places.api.net.FetchPlaceResponse;
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest;
import com.google.android.libraries.places.api.net.PlacesClient;
import com.terraai.aimobility.adapter.ShowLocationsAdapter;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.AdapterLongClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.NearbyModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentEnterNewAddressBinding;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;


public class EnterNewAddressFragment extends RootFragment implements View.OnClickListener {

    FragmentEnterNewAddressBinding binding;
    ArrayList<NearbyModelClass> nearLocationList = new ArrayList<>();
    Handler handler;
    Runnable runable;
    String searchQuery;
    ShowLocationsAdapter showLocationsAdapter;
    TextWatcher textWatcher;
    FragmentCallBack fragmentCallBack;
    private String latitude, longtitude;
    private PlacesClient placesClient;
    private AutocompleteSessionToken sessionToken;

    public EnterNewAddressFragment() {
        // Required empty public constructor
    }


    public EnterNewAddressFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentEnterNewAddressBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longtitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");

        if (!Places.isInitialized()) {
            Places.initialize(binding.getRoot().getContext().getApplicationContext(), binding.getRoot().getContext().getString(R.string.google_map_key));
        }

        placesClient = Places.createClient(getActivity());

        sessionToken = AutocompleteSessionToken.newInstance();

        initializeListeners();
        methodSetNearLocationAdapter();
        return view;
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);

        textWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
                nearLocationList.clear();
                if (binding.etSearchPlaces.getText().length() > 0) {
                    searchQuery = charSequence.toString();
                    timerCallApi();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {

            }
        };

        binding.etSearchPlaces.addTextChangedListener(textWatcher);
        binding.etSearchPlaces.requestFocus();
        Functions.showKeyboard(getActivity());
    }


    public void timerCallApi() {

        if (handler != null && runable != null) {
            handler.removeCallbacks(runable);
        }

        if (handler == null)
            handler = new Handler();

        if (runable == null) {
            runable = () -> getPlacePredictions();
        }

        handler.postDelayed(runable, 1000);
    }

    private void getPlacePredictions() {
        nearLocationList.clear();

        final LocationBias bias = RectangularBounds.newInstance(
                Functions.getCoordinate(Double.parseDouble(latitude), Double.parseDouble(longtitude), -500, -500),
                Functions.getCoordinate(Double.parseDouble(latitude), Double.parseDouble(longtitude), 500, 500)
        );

        final FindAutocompletePredictionsRequest newRequest = FindAutocompletePredictionsRequest
                .builder()
                .setSessionToken(sessionToken)
                .setTypeFilter(TypeFilter.ESTABLISHMENT)
                .setQuery("" + searchQuery)
                .setLocationBias(bias)
                .setCountries(Functions.getCountryCode(getActivity()))
                .setCountry(Functions.getCountryCode(getActivity()))
                .build();

        placesClient.findAutocompletePredictions(newRequest).addOnSuccessListener((response) -> {
            for (AutocompletePrediction prediction : response.getAutocompletePredictions()) {
                List<Place.Field> fields = Arrays.asList(Place.Field.ID, Place.Field.NAME, Place.Field.LAT_LNG, Place.Field.ADDRESS);
                FetchPlaceRequest placeRequest = FetchPlaceRequest.builder(prediction.getPlaceId(), fields).build();
                placesClient.fetchPlace(placeRequest).addOnSuccessListener(new OnSuccessListener<FetchPlaceResponse>() {
                    @Override
                    public void onSuccess(FetchPlaceResponse fetchPlaceResponse) {

                        Place place = fetchPlaceResponse.getPlace();
                        NearbyModelClass model = new NearbyModelClass();

                        model.title = place.getName();
                        model.address = place.getAddress();
                        model.lat = place.getLatLng().latitude;
                        model.lng = place.getLatLng().longitude;
                        LatLng latLng = new LatLng(place.getLatLng().latitude, place.getLatLng().longitude);
                        model.latLng = latLng;
                        model.placeId = place.getId();
                        model.isLiked = "0";
                        nearLocationList.add(model);
                        showLocationsAdapter.notifyDataSetChanged();
                    }
                });
            }
        }).addOnFailureListener((exception) -> {
            if (exception instanceof ApiException) {
                ApiException apiException = (ApiException) exception;
                Log.e("aimobility", apiException.getMessage() != null ? apiException.getMessage() : apiException.toString(), apiException);
            }
        });
    }

    /*Method SetRecentLocationAdapter*/
    private void methodSetNearLocationAdapter() {
        LinearLayoutManager layoutManager = new LinearLayoutManager(getActivity());
        binding.placeRecyclerview.setLayoutManager(layoutManager);
        showLocationsAdapter = new ShowLocationsAdapter(getActivity(), false, nearLocationList, new AdapterClickListener() {
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
                        ft.replace(R.id.enter_address_container, addDeliveryNote).addToBackStack(null).commit();

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
        }, false);
        binding.placeRecyclerview.setAdapter(showLocationsAdapter);
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
}