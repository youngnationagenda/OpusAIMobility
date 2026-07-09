package com.terraai.aimobility.food;

import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.terraai.aimobility.Interface.APICallBackList;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.R;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.SpacesItemDecorationBottom;
import com.terraai.aimobility.databinding.FragmentBrowseBinding;
import com.terraai.aimobility.foodadapter.TopCategoriesAdapter;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.CategoriesModel;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.util.ArrayList;


public class BrowseFragment extends RootFragment implements SwipeRefreshLayout.OnRefreshListener, View.OnClickListener {

    FragmentBrowseBinding binding;
    ArrayList<CategoriesModel> topCategoriesModelArrayList = new ArrayList<>();
    TopCategoriesAdapter topCategoriesAdapter;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    Context context;

    public BrowseFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment

        binding = FragmentBrowseBinding.inflate(getLayoutInflater());
        View rootView = binding.getRoot();
        context = getActivity();
        checkCart();
        initLayouts();
        getTopCategoriesData();

        return rootView;

    }


    public void checkCart() {
        try {
            if (carList.size() > 0) {
                binding.cartFrameLayout.tvCart.setText(context.getString(R.string.view_bucket, String.valueOf(carList.size())));
                binding.cartFrameLayout.tvCart.setOnClickListener(this);
            } else {
                binding.cartFrameLayout.cartLayout.setVisibility(View.GONE);
            }
        }catch (Exception e){
            e.printStackTrace();
        }
    }

    private void initLayouts() {

        binding.swipeRefreshLayout.setOnRefreshListener(this);
        binding.noInternetLayout.tryAgainBtn.setOnClickListener(this);

        binding.searchProductEdit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                if (topCategoriesAdapter != null)
                    topCategoriesAdapter.getFilter().filter(s.toString());
            }
        });

    }

    private void getTopCategoriesData() {

        JSONObject params = new JSONObject();

        if (topCategoriesModelArrayList.isEmpty() && !binding.swipeRefreshLayout.isRefreshing()) {
            binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
            binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
        }
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showFoodCategory(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.swipeRefreshLayout.setRefreshing(false);
                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.noInternetLayout.noInternetView.setVisibility(View.GONE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        DataParse.resturantCategoriesParseData(respobj, new APICallBackList() {
                                            @Override
                                            public void onParseData(ArrayList arrayList) {
                                                topCategoriesModelArrayList.clear();
                                                topCategoriesModelArrayList.addAll(arrayList);
                                                methodSetTopCategoriesAdapter();
                                            }
                                        });
                                    } else {
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                            if (resp.toString().contains("No Internet Connection")) {
                                binding.noInternetLayout.noInternetView.setVisibility(View.VISIBLE);
                            }
                        }
                    }
                });

    }

    private void methodSetTopCategoriesAdapter() {

        topCategoriesAdapter = new TopCategoriesAdapter(getActivity(), topCategoriesModelArrayList, new AdapterClickListener() {
            public void onItemClickListener(int position, Object model, View view) {
                CategoriesModel categoriesModel = (CategoriesModel) model;
                switch (view.getId()) {

                    case R.id.mainLayout:

                        methodOpenCategories(categoriesModel);

                        break;

                    default:
                        break;

                }
            }
        });

        GridLayoutManager gridLayoutManager = new GridLayoutManager(getContext(), 2, GridLayoutManager.VERTICAL, false);
        binding.topCategoriesRcView.setLayoutManager(gridLayoutManager);
        binding.topCategoriesRcView.setAdapter(topCategoriesAdapter);
        topCategoriesAdapter.notifyDataSetChanged();

        if (carList.size() > 0) {
            int space = (int) getContext().getResources().getDimension(R.dimen._58sdp);
            binding.topCategoriesRcView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }


    }

    private void methodOpenCategories(CategoriesModel categoriesModel) {

        Functions.hideSoftKeyboard(getActivity());
        ResturantAgainstCatFragment resturantAgainstCatFragment = new ResturantAgainstCatFragment();
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putSerializable("categoriesModel", categoriesModel);
        resturantAgainstCatFragment.setArguments(bundle);
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.browser_container, resturantAgainstCatFragment).addToBackStack(null).commit();

    }

    @Override
    public void onRefresh() {
        binding.swipeRefreshLayout.setRefreshing(true);
        getTopCategoriesData();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.tv_cart:
                Bundle bundle = new Bundle();
                bundle.putSerializable("carList", carList);
                ViewBucketSheetFragment viewBucketSheetFragment = new ViewBucketSheetFragment(R.id.main_food_container);
                viewBucketSheetFragment.setArguments(bundle);
                viewBucketSheetFragment.show(getActivity().getSupportFragmentManager(), "viewBucketSheetFragment");
                break;

            case R.id.try_again_btn:
                getTopCategoriesData();
                break;


            default:
                break;
        }
    }

    @Override
    public void setMenuVisibility(boolean menuVisible) {
        super.setMenuVisibility(menuVisible);
        if (menuVisible) {
            getTopCategoriesData();
        }
    }
}