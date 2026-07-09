package com.terraai.aimobility.food;

import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.foodadapter.AllRestaurantsAdapter;
import com.terraai.aimobility.Interface.APICallBackList;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.ResturantModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentSearchResturantBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.util.ArrayList;


public class SearchFragmentResturant extends RootFragment implements View.OnClickListener {

    FragmentSearchResturantBinding binding;
    ArrayList<ResturantModel> allRestaurantsModelArrayList = new ArrayList<>();
    AllRestaurantsAdapter allRestaurantsAdapter;
    String searchQuery;
    Handler handler;
    Runnable runable;
    String userId;
    FragmentCallBack fragmentCallBack;
    FoodActivity foodActivity;

    public SearchFragmentResturant() {
        // Required empty public constructor
    }

    public SearchFragmentResturant(FragmentCallBack callBack) {
        this.fragmentCallBack = callBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentSearchResturantBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        foodActivity = (FoodActivity) this.getActivity();
        Functions.showKeyboard(getActivity());
        binding.etSearch.requestFocus();
        initListener();

        addTextWatcher();
        methodSetAllRestaurantsAdapter();
        return view;
    }

    private void addTextWatcher() {
        binding.etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                //auto generated method
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int start, int before, int count) {
                searchQuery = charSequence.toString();
                timerCallApi();
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });
    }

    private void initListener() {
        binding.noDataLayout.findFood.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
    }


    public void timerCallApi() {

        if (handler != null && runable != null) {
            handler.removeCallbacks(runable);
        }

        if (handler == null)
            handler = new Handler();

        if (runable == null) {
            runable = () -> getAllRestaurantsData();
        }

        handler.postDelayed(runable, 1000);
    }

    private void getAllRestaurantsData() {

        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
            params.put("keyword", searchQuery);
        } catch (Exception e) {
            e.printStackTrace();
        }

        binding.noDataLayout.noDataView.setVisibility(View.GONE);
        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
        binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).searchRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.mainLayout.setVisibility(View.VISIBLE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturentParseData(respobj, new APICallBackList() {
                                            @Override
                                            public void onParseData(ArrayList arrayList) {
                                                binding.categoryName.setVisibility(View.VISIBLE);
                                                binding.categoryName.setText(arrayList.size() + getContext().getString(R.string.result_of) + " " + searchQuery);
                                                allRestaurantsModelArrayList.addAll(arrayList);
                                                allRestaurantsAdapter.notifyDataSetChanged();
                                            }
                                        });
                                    } else {
                                        binding.mainLayout.setVisibility(View.GONE);
                                        binding.noDataLayout.noDataView.setVisibility(View.VISIBLE);
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


    private void methodSetAllRestaurantsAdapter() {

        allRestaurantsAdapter = new AllRestaurantsAdapter(getActivity(), allRestaurantsModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                ResturantModel resturantModel = (ResturantModel) model;
                switch (view.getId()) {

                    case R.id.mainLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        Fragment currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromOther");
                        FragmentManager manager = getActivity().getSupportFragmentManager();
                        FragmentTransaction transaction = manager.beginTransaction();
                        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        transaction.replace(R.id.search_container, currentFragment).addToBackStack(null).commit();
                        break;


                    case R.id.favLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        ResturantModel item = allRestaurantsModelArrayList.get(position);
                        likedAllRestaurants(position, item);
                        break;

                    case R.id.ratingLayout:
                        Functions.hideSoftKeyboard(getActivity());
                        ReviewsFragment reviewsFragment = new ReviewsFragment();
                        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                        FragmentTransaction ft = fragmentManager.beginTransaction();
                        Bundle bundle = new Bundle();
                        bundle.putSerializable("dataModel", resturantModel);
                        reviewsFragment.setArguments(bundle);
                        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        ft.replace(R.id.search_container, reviewsFragment).addToBackStack(null).commit();
                        break;


                    default:
                        break;
                }
            }
        });

        binding.recyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.recyclerView.setAdapter(allRestaurantsAdapter);
        allRestaurantsAdapter.notifyDataSetChanged();

    }


    private void likedAllRestaurants(int position, ResturantModel item) {

        String action = item.getIsLiked();
        if (action != null) {
            if (action.equals("1")) {
                action = "0";
            } else {
                action = "1";
            }
        }

        allRestaurantsModelArrayList.remove(position);
        item.setIsLiked(action);
        allRestaurantsModelArrayList.add(position, item);
        allRestaurantsAdapter.notifyItemChanged(position);

        DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, item.getId(), item, foodActivity);

    }

    public void getChangedList(ResturantModel recipeDataModel) {
        Functions.updatList(allRestaurantsModelArrayList, recipeDataModel);
        allRestaurantsAdapter.notifyDataSetChanged();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.find_food:
                Functions.showKeyboard(getActivity());
                binding.etSearch.requestFocus();
                break;


            case R.id.backBtn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

                break;

            default:
                break;
        }
    }
}