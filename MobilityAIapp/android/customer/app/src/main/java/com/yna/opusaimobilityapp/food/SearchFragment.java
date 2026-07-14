package com.yna.opusaimobilityapp.food;

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

import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.foodadapter.MenuAdapter;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.model.CalculationModel;
import com.yna.opusaimobilityapp.model.ChildExpandListModel;
import com.yna.opusaimobilityapp.model.MenuDetailsModel;
import com.yna.opusaimobilityapp.model.MenuModel;
import com.yna.opusaimobilityapp.model.ParentExpandListModel;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentSearchBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

import io.paperdb.Paper;


public class SearchFragment extends RootFragment implements View.OnClickListener {

    FragmentSearchBinding binding;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    String searchQuery;
    Handler handler;
    Runnable runable;
    String userId;
    Bundle bundle;
    ResturantModel resturantModel;
    ArrayList<MenuDetailsModel> restaurantMenuItemtempList = new ArrayList<>();
    ArrayList<MenuModel> mainList = new ArrayList<>();
    MenuAdapter menuAdapter;

    public SearchFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentSearchBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        bundle = getArguments();
        if (bundle != null) {
            resturantModel = (ResturantModel) bundle.getSerializable("dataModel");
        }

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                Functions.showKeyboard(getActivity());
                binding.etSearch.requestFocus();
            }
        },200);

        initListener();

        addTextWatcher();
        carList = Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        methodSetMenuAdapter();
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
                binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.VISIBLE);
                binding.shimmerFrameLayout.shimmerViewContainer.startShimmer();
                binding.mainLayout.setVisibility(View.GONE);
                binding.noDataLayout.noDataView.setVisibility(View.GONE);
                timerCallApi();
            }

            @Override
            public void afterTextChanged(Editable s) {
                //auto generated method
            }
        });
    }

    private void initListener() {
        binding.clickable.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
            }
        });
        binding.noDataLayout.tvBackBtn.setOnClickListener(this);
        binding.noDataLayout.findFood.setOnClickListener(this);
    }

    public void timerCallApi() {

        if (handler != null && runable != null) {
            handler.removeCallbacks(runable);
        }

        if (handler == null)
            handler = new Handler();

        if (runable == null) {
            runable = () -> fetchResponse();
        }

        handler.postDelayed(runable, 1000);
    }

    private void fetchResponse() {

        JSONObject params = new JSONObject();
        try {
            params.put("keyword", searchQuery);
            params.put("restaurant_id", resturantModel.getId());
        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.frameLayout.setVisibility(View.GONE);


        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).searchRestaurantMenu(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        binding.shimmerFrameLayout.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameLayout.shimmerViewContainer.stopShimmer();
                        binding.mainLayout.setVisibility(View.VISIBLE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONArray msgObj = respobj.getJSONArray("msg");

                                        binding.mainLayout.setVisibility(View.VISIBLE);
                                        binding.noDataLayout.noDataView.setVisibility(View.GONE);
                                        for (int i = 0; i < msgObj.length(); i++) {
                                            restaurantMenuItemtempList = new ArrayList<>();
                                            JSONObject msg = msgObj.getJSONObject(i);
                                            JSONObject resturantMenu = msg.getJSONObject("RestaurantMenu");

                                            MenuModel menuModel = new MenuModel();
                                            menuModel.setMenuId(resturantMenu.getString("id"));
                                            menuModel.setMenuName(resturantMenu.getString("name"));
                                            menuModel.setMenuImage(resturantMenu.getString("image"));
                                            menuModel.setDescription(resturantMenu.getString("description"));
                                            menuModel.setActive(resturantMenu.getString("active"));

                                            JSONObject restaurantMenuItem = msg.getJSONObject("RestaurantMenuItem");
                                            MenuDetailsModel menuDetailsModel = new MenuDetailsModel();
                                            menuDetailsModel.setMenuId(resturantMenu.getString("id"));
                                            menuDetailsModel.setMenuName(resturantMenu.getString("name"));

                                            menuDetailsModel.setMenuItemId(restaurantMenuItem.getString("id"));
                                            menuDetailsModel.setName(restaurantMenuItem.getString("name"));
                                            menuDetailsModel.setDescription(restaurantMenuItem.getString("description"));
                                            menuDetailsModel.setPrice(restaurantMenuItem.getString("price"));
                                            menuDetailsModel.setImage(restaurantMenuItem.getString("image"));
                                            menuDetailsModel.setActive(restaurantMenuItem.getString("active"));
                                            menuDetailsModel.setOutOfOrder(restaurantMenuItem.getString("out_of_order"));


                                            ArrayList<MenuModel> tempListMenu = new ArrayList<>();

                                            JSONArray restaurantMenuExtraSection = msg.getJSONArray("RestaurantMenuExtraSection");
                                            if (restaurantMenuExtraSection.length() > 0) {
                                                ArrayList<ParentExpandListModel> menuSectionList = new ArrayList<>();
                                                for (int y = 0; y < restaurantMenuExtraSection.length(); y++) {
                                                    JSONObject menuExtrasSectionObj = restaurantMenuExtraSection.getJSONObject(y);
                                                    ParentExpandListModel parentExpandListModel = new ParentExpandListModel();
                                                    parentExpandListModel.setParentName(menuExtrasSectionObj.getString("name"));
                                                    parentExpandListModel.setParentId(menuExtrasSectionObj.getString("id"));
                                                    parentExpandListModel.setIsRequired(menuExtrasSectionObj.getString("required"));
                                                    parentExpandListModel.setActive(menuExtrasSectionObj.getString("active"));
                                                    menuSectionList.add(parentExpandListModel);


                                                    JSONArray restaurantMenuExtraItem = menuExtrasSectionObj.getJSONArray("RestaurantMenuExtraItem");
                                                    if (restaurantMenuExtraItem.length() > 0) {
                                                        ArrayList<ChildExpandListModel> menuDetailList = new ArrayList<>();
                                                        for (int z = 0; z < restaurantMenuExtraItem.length(); z++) {
                                                            JSONObject menuExtrasObj = restaurantMenuExtraItem.getJSONObject(z);
                                                            ChildExpandListModel childExpandListModel = new ChildExpandListModel();
                                                            childExpandListModel.setChildName(menuExtrasObj.getString("name"));
                                                            childExpandListModel.setMenuExtraChildid(menuExtrasObj.getString("id"));
                                                            childExpandListModel.setPriceAddOns(menuExtrasObj.getString("price"));
                                                            childExpandListModel.setActive(menuExtrasObj.getString("active"));
                                                            menuDetailList.add(childExpandListModel);
                                                        }
                                                        parentExpandListModel.setChildExpandListModel(menuDetailList);
                                                    }
                                                }
                                                menuDetailsModel.setMenuSectionList(menuSectionList);
                                            }
                                            restaurantMenuItemtempList.add(menuDetailsModel);

                                            menuModel.setMenuModelArrayList(restaurantMenuItemtempList);
                                            tempListMenu.add(menuModel);
                                            mainList.clear();
                                            mainList.addAll(tempListMenu);
                                            Functions.logDMsg("exception at mainList : " + mainList.size());
                                        }
                                        methodSetMenuAdapter();
                                    } else {
                                        binding.mainLayout.setVisibility(View.GONE);
                                        mainList.clear();
                                        binding.noDataLayout.noDataView.setVisibility(View.VISIBLE);
                                        binding.noDataLayout.tvBackBtn.setText(getString(R.string.back_to)+resturantModel.getResturantName());
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: " + e.toString());
                                }
                            }
                        }
                        else
                        {

                        }
                    }
                });
    }

    private void methodSetMenuAdapter() {
        menuAdapter = new MenuAdapter(getActivity(), mainList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                //for item click listener
            }
        }, new MenuAdapter.OnItemClickListener() {
            @Override
            public void onItemClick(Object model, int postion, View view) {
                MenuDetailsModel menuDetailsModel = (MenuDetailsModel) model;
                Functions.hideSoftKeyboard(getActivity());
                AddToCartFragment addToCartFragment = new AddToCartFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        if(bundle != null) {
                            menuAdapter.itemListDataAdapter.updateList();
                            menuAdapter.notifyDataSetChanged();
                        }
                    }
                });
                FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                Bundle bundle = new Bundle();
                bundle.putSerializable("recipeMenuDetailsModel", menuDetailsModel);
                bundle.putSerializable("resturantModel", resturantModel);
                bundle.putString("fromWhere", "menu");
                addToCartFragment.setArguments(bundle);
                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                ft.replace(R.id.clickable, addToCartFragment).addToBackStack(null).commit();
            }
        } , true);


        binding.recyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.recyclerView.setAdapter(menuAdapter);
        menuAdapter.notifyDataSetChanged();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {

            case R.id.tv_back_btn:
                Functions.hideSoftKeyboard(getActivity());
               getActivity().onBackPressed();
                break;

            default:
                break;
        }
    }
}