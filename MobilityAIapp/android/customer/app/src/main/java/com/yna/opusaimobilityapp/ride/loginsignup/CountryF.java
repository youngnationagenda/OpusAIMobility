package com.yna.opusaimobilityapp.ride.loginsignup;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.recyclerview.widget.LinearLayoutManager;

import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.adapter.CountryAdapter;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.databinding.FragmentCountryBinding;
import com.yna.opusaimobilityapp.model.CountryModel;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

public class CountryF extends RootFragment implements View.OnClickListener {

    public static String selectedCountry = "", selectedCountryId, selectedCountryCode = "", selectedCountryIos = "";
    FragmentCallBack callBack;
    List<CountryModel> countryModelList;
    CountryAdapter countryAdapter;
    FragmentCountryBinding binding;

    public CountryF(FragmentCallBack callBack) {
        this.callBack = callBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentCountryBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        methodInitViews();
        Bundle bundle = getArguments();
        if (bundle != null) {
            selectedCountryId = bundle.getString("countryId");
        }

        methodSetAdapter();
        callApiForCountryList();

        return view;
    }

    private void methodInitViews() {

        binding.backBtn.setOnClickListener(this);
        countryModelList = new ArrayList<>();
        binding.rv.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.rv.setHasFixedSize(false);


        binding.etSearch.setClickable(false);
        binding.etSearch.setEnabled(false);

        binding.etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                //auto generated method
            }

            @Override
            public void afterTextChanged(Editable s) {
                countryAdapter.getFilter().filter(s.toString());
            }
        });

    }

    private void methodSetAdapter() {
        countryAdapter = new CountryAdapter(getContext(), countryModelList, (postion, model_obj, view) -> {
            Functions.hideSoftKeyboard(getActivity());

            CountryModel model = (CountryModel) model_obj;

            selectedCountry = model.countryname;
            selectedCountryId = model.countryId;
            selectedCountryCode = model.countryCode;
            selectedCountryIos = model.shortName;

            Bundle bundle = new Bundle();
            bundle.putString("selected_country", selectedCountry);
            bundle.putString("selected_country_id", selectedCountryId);
            bundle.putString("selected_country_code", selectedCountryCode);
            bundle.putString("selected_country_ios", selectedCountryIos);
            callBack.onItemClick(bundle);
            getActivity().onBackPressed();

        });
        binding.rv.setAdapter(countryAdapter);
    }


    private void callApiForCountryList() {
        JSONObject params = new JSONObject();

        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
        binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showCountries(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.etSearch.setClickable(true);
                        binding.etSearch.setEnabled(true);
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                countryModelList = new ArrayList<>();
                                if (respobj.getString("code").equals("200")) {
                                    JSONArray msgarray = respobj.getJSONArray("msg");
                                    for (int i = 0; i < msgarray.length(); i++) {
                                        JSONObject countriesobj = msgarray.getJSONObject(i).getJSONObject("Country");
                                        CountryModel model = new CountryModel();
                                        model.countryId = "" + countriesobj.optString("id");
                                        model.countryname = "" + countriesobj.optString("name");
                                        model.countryCode = "" + countriesobj.optString("country_code");
                                        model.countryIos = "" + countriesobj.optString("iso3");
                                        model.currency = "" + countriesobj.optString("currency");
                                        model.shortName = "" + countriesobj.optString("short_name");
                                        countryModelList.add(model);
                                    }
                                    methodSetAdapter();
                                    countryAdapter.notifyDataSetChanged();
                                } else {
                                    Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {
                            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                            binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        }
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

            default:
                break;
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        selectedCountryId = "";
    }
}


