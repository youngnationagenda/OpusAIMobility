package com.terraai.aimobility.food;

import android.util.Log;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationBottom;
import com.terraai.aimobility.foodadapter.FavouriteAdapter;
import com.terraai.aimobility.Interface.APICallBackList;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentFavouriteBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.util.ArrayList;



public class FavouriteFragment extends RootFragment implements SwipeRefreshLayout.OnRefreshListener , View.OnClickListener{

    FragmentFavouriteBinding binding;
    ArrayList<ResturantModel> favouriteList = new ArrayList<>();
    FavouriteAdapter favouriteAdapter;
    private String userId;
    FoodActivity foodActivity;
    Context context;
    public FavouriteFragment() {
        // Required empty public constructor
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentFavouriteBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        foodActivity = (FoodActivity) this.getActivity();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        checkCart();
        initLayouts();
        methodSetFavouriteAdapter();
        getFavouriteData();
        return view;

    }

    ArrayList<CalculationModel> carList = new ArrayList<>();
    public void checkCart(){
        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        // [AWS] Read result discarded
        if (carList.size() > 0) {
            binding.viewCartContainer.cartLayout.setVisibility(View.VISIBLE);
            binding.viewCartContainer.tvCart.setText(context.getString(R.string.view_bucket, String.valueOf(carList.size())));
            binding.viewCartContainer.tvCart.setOnClickListener(this);
        }else{
            binding.viewCartContainer.cartLayout.setVisibility(View.GONE);
        }

    }

    private void initLayouts() {
        binding.swipeRefreshLayout.setOnRefreshListener(this);
        binding.noInternetLayout.tryAgainBtn.setOnClickListener(this);
    }

    private void getFavouriteData() {

        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (favouriteList.isEmpty() && !binding.swipeRefreshLayout.isRefreshing()) {
            binding.shimmerFrameContainer.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameContainer.shimmerViewContainer.startShimmer();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showFavouriteRestaurants(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.swipeRefreshLayout.setRefreshing(false);
                        binding.shimmerFrameContainer.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameContainer.shimmerViewContainer.stopShimmer();
                        binding.noInternetLayout.noInternetView.setVisibility(View.GONE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        binding.mainLayout.setVisibility(View.VISIBLE);
                                        binding.nodataLayout.setVisibility(View.GONE);
                                        DataParse.favResponseParseData(respobj, new APICallBackList() {
                                            @Override
                                            public void onParseData(ArrayList arrayList) {
                                                favouriteList.clear();
                                                favouriteList.addAll(arrayList);
                                                favouriteAdapter.notifyDataSetChanged();
                                            }
                                        });

                                    } else {
                                        binding.nodataLayout.setVisibility(View.VISIBLE);
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }
                            }
                        }
                        else
                        {
                            binding.swipeRefreshLayout.setRefreshing(true);
                            if(resp.contains("No Internet Connection")){
                                binding.noInternetLayout.noInternetView.setVisibility(View.VISIBLE);
                            }
                        }
                    }
                });

    }


    private void methodSetFavouriteAdapter() {

        favouriteAdapter = new FavouriteAdapter(getActivity(), favouriteList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                ResturantModel resturantModel = (ResturantModel) model;
                switch (view.getId()) {

                    case R.id.favLayout:
                        likedAllRestaurants(position, resturantModel);
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
                        ft.replace(R.id.main_food_container, reviewsFragment).addToBackStack(null).commit();
                        break;

                    case R.id.mainLayout:

                        Functions.hideSoftKeyboard(getActivity());
                        Fragment currentFragment = RestaurantMenuFragment.getInstance(resturantModel, "fromOther");
                        FragmentManager manager = getActivity().getSupportFragmentManager();
                        FragmentTransaction transaction = manager.beginTransaction();
                        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                        transaction.replace(R.id.main_food_container, currentFragment).addToBackStack(null).commit();


                        break;
                    default:
                        break;
                }
            }
        });

        binding.favRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding. favRecyclerView.setAdapter(favouriteAdapter);
        favouriteAdapter.notifyDataSetChanged();

        if (carList.size() > 0) {
            int space = (int) binding.getRoot().getContext().getResources().getDimension(R.dimen._58sdp);
            binding.favRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }

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


        item.setIsLiked(action);
        favouriteList.remove(position);
        favouriteAdapter.notifyDataSetChanged();

        if(favouriteList.isEmpty()){
            binding.mainLayout.setVisibility(View.GONE);
            binding.nodataLayout.setVisibility(View.VISIBLE);
        }

        DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, item.getId(), item, foodActivity);
    }

    @Override
    public void onRefresh() {
        binding.swipeRefreshLayout.setRefreshing(true);
        getFavouriteData();

    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.tv_cart:
                Bundle bundle =new Bundle();
                bundle.putSerializable("carList",carList);
                ViewBucketSheetFragment viewBucketSheetFragment = new ViewBucketSheetFragment(R.id.main_food_container);
                viewBucketSheetFragment.setArguments(bundle);
                viewBucketSheetFragment.show(getActivity().getSupportFragmentManager(), "viewBucketSheetFragment");
                break;

            case R.id.try_again_btn:
                getFavouriteData();
                break;

            default:
                break;

        }
    }

    @Override
    public void setMenuVisibility(boolean menuVisible) {
        super.setMenuVisibility(menuVisible);
        if(menuVisible){
            getFavouriteData();
        }
    }
}