package com.yna.opusaimobilityapp.food;

import static android.view.View.GONE;
import static android.view.View.VISIBLE;

import static com.yna.opusaimobilityapp.bottomsheet.AnchorSheetBehavior.STATE_COLLAPSED;
import static com.yna.opusaimobilityapp.bottomsheet.AnchorSheetBehavior.STATE_EXPANDED;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Rect;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.core.widget.NestedScrollView;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.yna.opusaimobilityapp.activitiesandfragment.FoodActivity;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.DataParse;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.codeclasses.SpacesItemDecorationBottom;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.foodadapter.MenuAdapter;
import com.yna.opusaimobilityapp.foodadapter.MenuListAdapter;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.model.CalculationModel;
import com.yna.opusaimobilityapp.model.ChildExpandListModel;
import com.yna.opusaimobilityapp.model.MenuDetailsModel;
import com.yna.opusaimobilityapp.model.MenuModel;
import com.yna.opusaimobilityapp.model.ParentExpandListModel;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.bottomsheet.AnchorSheetBehavior;
import com.yna.opusaimobilityapp.databinding.FragmentRestaurantMenuBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;

import io.paperdb.Paper;


public class RestaurantMenuFragment extends RootFragment implements View.OnClickListener {

    public static int selectedPosition = 0;
    final double earthradius = 6371000;
    FragmentRestaurantMenuBinding binding;
    MenuAdapter menuAdapter;
    Context context;
    String userId, currenySymbol, resturentId;
    double pickUpLat, pickUpLong;
    ArrayList<MenuModel> menuArrayList = new ArrayList<>();
    ArrayList<MenuModel> mainList = new ArrayList<>();
    MenuListAdapter menuListAdapter;
    ResturantModel resturantModel;
    Bundle bundle;

    LinearLayoutManager linearLayoutManager;
    GoogleMap mGoogleMap;
    String latitude, longitude;
    double restlatitude, restlongitude;
    LatLng mDefaultLocation;
    LatLng dropLatlong;
    AnimatedVectorDrawable emptyHeart;
    AnimatedVectorDrawable fillHeart;
    boolean full = false;
    ArrayList<CalculationModel> carList = new ArrayList<>();
    ArrayList<MenuDetailsModel> restaurantMenuItemtempList = new ArrayList<>();
    CallBackListener callBackListener;
    BottomSheetBehavior anchorBehavior;
    FoodActivity foodActivity;
    boolean isScrollable = true;
    String fromWhere;

    public RestaurantMenuFragment() {
        // Required empty public constructor
    }

    public static RestaurantMenuFragment getInstance(ResturantModel resturantModel, String fromCheckout) {
        Bundle bundle = new Bundle();
        bundle.putSerializable("dataModel", resturantModel);
        bundle.putString("fromWhere", fromCheckout);
        RestaurantMenuFragment fragment = new RestaurantMenuFragment();
        fragment.setArguments(bundle);
        return fragment;
    }

    @Override
    @NonNull
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        if (context instanceof CallBackListener) {
            callBackListener = (CallBackListener) context;
        } else {
            throw new RuntimeException(context.toString() + " must implement OnFragmentCommunicationListener");
        }
    }

    @Override
    public void onDetach() {
        super.onDetach();
        callBackListener = null;
        selectedPosition = 0;
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentRestaurantMenuBinding.inflate(getLayoutInflater());

        View view = binding.getRoot();

        context = getActivity();
        bundle = getArguments();

        foodActivity = (FoodActivity) this.getActivity();

        if (bundle != null) {
            resturantModel = (ResturantModel) bundle.getSerializable("dataModel");
            fromWhere = bundle.getString("fromWhere");
        }
        methodSetMenuAdapter();
        methodSetRecipeMenuAdapter();

        checkCart(false);

        latitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLat, "0.0");
        longitude = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.myCurrentLng, "0.0");
        currenySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        restlatitude = Double.parseDouble(resturantModel.getResturantLat());
        restlongitude = Double.parseDouble(resturantModel.getResturantLong());

        resturentId = resturantModel.getId();

        dropLatlong = (new LatLng(restlatitude, restlongitude));

        pickUpLat = Double.parseDouble(latitude);
        pickUpLong = Double.parseDouble(longitude);
        mDefaultLocation = new LatLng(pickUpLat, pickUpLong);

        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");

        setupMapIfNeeded();

        initLayouts();
        initializeListeners();
        setUpScreenData();

        getMenuData();

        return view;
    }

    @SuppressLint("StringFormatMatches")
    public void checkCart(boolean b) {
        try {
            carList = Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        } catch (Exception e) {
            e.printStackTrace();
        }

        if (!carList.isEmpty() && !fromWhere.equals("fromCheckout")) {
            binding.cartViewContainer.cartLayout.setVisibility(VISIBLE);
            binding.cartViewContainer.tvCart.setText(context.getString(R.string.view_bucket, String.valueOf(carList.size())));
            binding.cartViewContainer.tvCart.setOnClickListener(this);
        } else {
            binding.cartViewContainer.cartLayout.setVisibility(View.GONE);
        }

        if (b) {
            menuAdapter.itemListDataAdapter.updateList();
            menuAdapter.notifyDataSetChanged();
        }

    }

    private void initLayouts() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            emptyHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(context, R.drawable.avd_heart_empty_black);
            fillHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(context, R.drawable.avd_heart_fill_black);
        }

        binding.linearBottomSheet.noInternetLayout.tryAgainBtn.setOnClickListener(this);
        linearLayoutManager = new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false);
        linearLayoutManager.isSmoothScrollbarEnabled();
        linearLayoutManager.isAutoMeasureEnabled();
        binding.linearBottomSheet.menuItemRecyclerView.setLayoutManager(linearLayoutManager);

        final Rect scrollBounds = new Rect();
        binding.linearBottomSheet.nestedScrollView.getHitRect(scrollBounds);
        binding.linearBottomSheet.nestedScrollView.setOnScrollChangeListener((NestedScrollView.OnScrollChangeListener)
                (v, scrollX, scrollY, oldScrollX, oldScrollY) -> {
                    for (int i = 0; i < binding.linearBottomSheet.menuItemRecyclerView.getAdapter().getItemCount(); i++) {
                        if (menuAdapter != null && binding.linearBottomSheet.menuItemRecyclerView.findViewHolderForAdapterPosition(i).itemView != null) {
                            View childView = binding.linearBottomSheet.menuItemRecyclerView.findViewHolderForAdapterPosition(i).itemView;
                            if (childView != null) {
                                if (childView.getLocalVisibleRect(scrollBounds)) {
                                    int finalI = i;
                                    new Handler().postDelayed(new Runnable() {
                                        @Override
                                        public void run() {
                                            Functions.logDMsg("isScrollable : " + isScrollable);
                                            methodCheckList(finalI);


                                        }
                                    }, 1000);
                                    break;
                                }
                            }
                        }
                    }
                    new Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            if (!isScrollable) {
                                isScrollable = true;
                            }
                        }
                    }, 2100);

                });



        anchorBehavior = BottomSheetBehavior.from(binding.linearBottomSheet.bottomSheetDetail);
        anchorBehavior.setPeekHeight(Functions.getScreenheight(getActivity())-Functions.convertDpToPx(getActivity(),200));
        anchorBehavior.setHideable(false);
        anchorBehavior.addBottomSheetCallback(new BottomSheetBehavior.BottomSheetCallback() {
            @Override
            public void onStateChanged(@NonNull View bottomSheet, int newState) {

                switch (anchorBehavior.getState()) {


                    case STATE_COLLAPSED:
                        binding.toolbar.setVisibility(VISIBLE);
                        binding.headerLayout.setVisibility(GONE);
                        break;

                    case STATE_EXPANDED:
                        binding.toolbar.setVisibility(GONE);
                        binding.headerLayout.setVisibility(VISIBLE);
                        break;

                    default:
                        break;
                }
            }

            @Override
            public void onSlide(@NonNull View bottomSheet, float slideOffset) {

            }
        });


    }

    private void methodCheckList(int visiblePosition) {
        for (int i = 0; i < menuArrayList.size(); i++) {
            if (menuArrayList.get(i).getMenuName().equals(mainList.get(visiblePosition).getMenuName())) {
                binding.menuRecyclerView.scrollToPosition(i);
                if (isScrollable) {
                    selectedPosition = i;
                    menuListAdapter.notifyDataSetChanged();
                }
            }
        }
    }

    private void methodCheckMainList(int visiblePosition) {
        for (int i = 0; i < menuArrayList.size(); i++) {
            if (menuArrayList.get(i).getMenuName().equals(mainList.get(visiblePosition).getMenuName())) {
                float y = binding.linearBottomSheet.menuItemRecyclerView.getY() + binding.linearBottomSheet.menuItemRecyclerView.getChildAt(i).getY();
                binding.linearBottomSheet.nestedScrollView.smoothScrollTo(0, (int) y);
            }
        }
    }

    private void initializeListeners() {

        binding.backBtnNav.setOnClickListener(this);
        binding.favBtn.setOnClickListener(this);
        binding.linearBottomSheet.tvMoreInfo.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.linearBottomSheet.searchBtn.setOnClickListener(this);

    }

    private void setUpScreenData() {
        binding.linearBottomSheet.tvResturantName.setText(Functions.decodeString(resturantModel.getResturantName()));
        binding.toolbarTitle.setText(Functions.decodeString(resturantModel.getResturantName()));
        binding.linearBottomSheet.tvDeliveryTime.setText(resturantModel.getDeliveryMinTime() + "-" + resturantModel.getDeliveryMinTime() + context.getString(R.string.min));
        binding.linearBottomSheet.ratingTxt.setText(resturantModel.getTotalRatings());
        binding.linearBottomSheet.ratingCount.setText("(" + Functions.getSuffix(resturantModel.getTotalRatingCount()) + ")");
        binding.linearBottomSheet.minOrderTxt.setText(context.getString(R.string.min_order) + " " + currenySymbol + resturantModel.getMinOrderPrice());
        binding.linearBottomSheet.tvAddress.setText(resturantModel.getLocation_string());

        String resturantImage = resturantModel.getResturantImage();
        if (resturantImage != null && !resturantImage.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + resturantImage);
            binding.menuImage.setImageURI(uri);
        }

        String favourite = resturantModel.getIsLiked();

        if (favourite.equals("") || favourite.equals("0")) {
            full = true;
            animate(binding.favIv);
        } else {
            full = false;
            animate(binding.favIv);
        }

    }

    // This method help to animate our view.
    public void animate(ImageView view) {
        AnimatedVectorDrawable drawable
                = full
                ? emptyHeart
                : fillHeart;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            view.setImageDrawable(drawable);
        }
        drawable.start();
        full = !full;
    }

    /*Method SetUpIfNeeded*/
    private void setupMapIfNeeded() {
        // Build the map.
        if (mGoogleMap == null) {
            MapsInitializer.initialize(getActivity());
        }
    }


    private void methodSetRecipeMenuAdapter() {

        menuListAdapter = new MenuListAdapter(getActivity(), menuArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {

                switch (view.getId()) {

                    case R.id.bgLayout:
                        selectedPosition = position;
                        menuListAdapter.notifyDataSetChanged();
                        isScrollable = false;
                        methodCheckMainList(position);
                        break;

                    default:
                        break;
                }
            }
        });

        binding.menuRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.HORIZONTAL, false));
        binding.menuRecyclerView.setAdapter(menuListAdapter);
        menuListAdapter.notifyDataSetChanged();

    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.back_btn_nav:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

                break;

            case R.id.backBtn:

                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();

                break;

            case R.id.tvMoreInfo:

                Functions.hideSoftKeyboard(getActivity());
                methodOpenRestaurantDetails();

                break;

            case R.id.fav_btn:

                if (full) {
                    full = true;
                    animate(binding.favIv);
                } else {
                    full = false;
                    animate(binding.favIv);
                }

                likedAllRestaurants(resturantModel);

                break;

            case R.id.searchBtn:

                Functions.hideSoftKeyboard(getActivity());
                SearchFragment searchFragment = new SearchFragment();
                FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
                Bundle b = new Bundle();
                b.putSerializable("dataModel", resturantModel);
                searchFragment.setArguments(b);
                FragmentTransaction ft = fragmentManager.beginTransaction();
                ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                ft.replace(R.id.restaurantMenu_f, searchFragment).addToBackStack(null).commit();

                break;


            case R.id.tv_cart:

                Bundle bundle = new Bundle();
                bundle.putSerializable("carList", carList);
                ViewBucketSheetFragment viewBucketSheetFragment = new ViewBucketSheetFragment(R.id.restaurantMenu_f);
                viewBucketSheetFragment.setArguments(bundle);
                viewBucketSheetFragment.show(getActivity().getSupportFragmentManager(), "viewBucketSheetFragment");

                break;

            case R.id.try_again_btn:

                getMenuData();
                break;

            default:
                break;
        }

    }


    private void likedAllRestaurants(ResturantModel item) {

        String action = item.getIsLiked();
        if (action != null) {
            if (action.equals("1")) {
                action = "0";
            } else {
                action = "1";
            }
        }
        item.setIsLiked(action);
        DataParse.callApiForFavourite(binding.getRoot().getContext(), userId, item.getId(), item, foodActivity);

    }


    private void getMenuData() {
        JSONObject params = new JSONObject();
        try {
            params.put("id", resturentId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        binding.linearBottomSheet.shimmerViewContainer.shimmerViewContainer.setVisibility(VISIBLE);
        binding.linearBottomSheet.shimmerViewContainer.shimmerViewContainer.startShimmer();

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showRestaurantDetail(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.linearBottomSheet.shimmerViewContainer.shimmerViewContainer.setVisibility(GONE);
                        binding.linearBottomSheet.shimmerViewContainer.shimmerViewContainer.stopShimmer();
                        binding.linearBottomSheet.mainLayout.setVisibility(View.VISIBLE);
                        binding.linearBottomSheet.noInternetLayout.noInternetView.setVisibility(View.GONE);

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONObject msgObj = respobj.getJSONObject("msg");
                                        JSONArray resturantMenu = msgObj.getJSONArray("RestaurantMenu");
                                        mainList.clear();
                                        menuArrayList.clear();
                                        ArrayList<MenuModel> tempListMenu = new ArrayList<>();
                                        for (int i = 0; i < resturantMenu.length(); i++) {
                                            JSONObject object = resturantMenu.getJSONObject(i);
                                            MenuModel menuModel = new MenuModel();

                                            menuModel.setMenuId(object.getString("id"));
                                            menuModel.setMenuName(object.getString("name"));
                                            menuModel.setMenuImage(object.getString("image"));
                                            menuModel.setDescription(object.getString("description"));
                                            menuModel.setActive(object.getString("active"));

                                            if (object.has("RestaurantMenuItem")) {
                                                JSONArray restaurantMenuItem = object.getJSONArray("RestaurantMenuItem");

                                                restaurantMenuItemtempList = new ArrayList<>();
                                                for (int x = 0; x < restaurantMenuItem.length(); x++) {
                                                    JSONObject menuDetailObj = restaurantMenuItem.getJSONObject(x);

                                                    MenuDetailsModel menuDetailsModel = new MenuDetailsModel();
                                                    menuDetailsModel.setMenuId(object.getString("id"));
                                                    menuDetailsModel.setMenuName(object.getString("name"));

                                                    menuDetailsModel.setMenuItemId(menuDetailObj.getString("id"));
                                                    menuDetailsModel.setName(menuDetailObj.getString("name"));
                                                    menuDetailsModel.setDescription(menuDetailObj.getString("description"));
                                                    menuDetailsModel.setPrice(menuDetailObj.getString("price"));
                                                    menuDetailsModel.setImage(menuDetailObj.getString("image"));
                                                    menuDetailsModel.setActive(menuDetailObj.getString("active"));
                                                    menuDetailsModel.setOutOfOrder(menuDetailObj.getString("out_of_order"));


                                                    JSONArray restaurantMenuExtraSection = menuDetailObj.getJSONArray("RestaurantMenuExtraSection");
                                                    if (restaurantMenuExtraSection.length() > 0) {
                                                        ArrayList<ParentExpandListModel> menuSectionList = new ArrayList<>();
                                                        for (int y = 0; y < restaurantMenuExtraSection.length(); y++) {
                                                            JSONObject menuExtrasSectionObj = restaurantMenuExtraSection.getJSONObject(y);
                                                            ParentExpandListModel parentExpandListModel = new ParentExpandListModel();
                                                            parentExpandListModel.setParentName(menuExtrasSectionObj.getString("name"));
                                                            parentExpandListModel.setParentId(menuExtrasSectionObj.getString("id"));
                                                            parentExpandListModel.setIsRequired(menuExtrasSectionObj.getString("required"));
                                                            menuDetailsModel.setExtraRequired(menuExtrasSectionObj.optString("required" , "0"));
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
                                                }

                                            }
                                            menuModel.setMenuModelArrayList(restaurantMenuItemtempList);
                                            tempListMenu.add(menuModel);
                                            menuArrayList.add(menuModel);
                                        }

                                        mainList.addAll(tempListMenu);
                                        menuAdapter.notifyDataSetChanged();
                                        menuListAdapter.notifyDataSetChanged();
                                    } else {
                                        Functions.dialouge(binding.getRoot().getContext(), binding.getRoot().getContext().getString(R.string.alert), respobj.getString("msg"));
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception : " + e.toString());
                                }
                            }
                        }
                        else
                        {
                            Functions.cancelLoader();
                            if (resp.toString().contains("No Internet Connection")) {
                                binding.linearBottomSheet.noInternetLayout.noInternetView.setVisibility(View.VISIBLE);
                            }
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
        }, (MenuAdapter.OnItemClickListener) (model, postion, view) -> {
            MenuDetailsModel menuDetailsModel = (MenuDetailsModel) model;
            Functions.hideSoftKeyboard(getActivity());
            AddToCartFragment addToCartFragment = new AddToCartFragment(new FragmentCallBack() {
                @Override
                public void onItemClick(Bundle bundle) {
                    if (bundle != null) {

                        if (callBackListener != null) {
                            callBackListener.onCallBack();
                        }
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
            ft.replace(R.id.restaurantMenu_f, addToCartFragment).addToBackStack(null).commit();
        }, false);


        binding.linearBottomSheet.menuItemRecyclerView.setAdapter(menuAdapter);
        menuAdapter.notifyDataSetChanged();
        if (carList.size() > 0) {
            int space = (int) context.getResources().getDimension(R.dimen._58sdp);
            binding.linearBottomSheet.menuItemRecyclerView.addItemDecoration(new SpacesItemDecorationBottom(space));
        }

    }


    private void methodOpenRestaurantDetails() {
        Functions.hideSoftKeyboard(getActivity());
        RestaurantDetailsFragment restaurantDetailsFragment = new RestaurantDetailsFragment(new FragmentCallBack() {
            @Override
            public void onItemClick(Bundle bundle) {
                if (bundle != null) {
                    resturantModel = (ResturantModel) bundle.getSerializable("dataModel");
                    String favourite = resturantModel.getIsLiked();

                    if (favourite.equals("") || favourite.equals("0")) {
                        full = true;
                        animate(binding.favIv);
                    } else {
                        full = false;
                        animate(binding.favIv);
                    }
                }
            }
        });
        FragmentManager fragmentManager = getActivity().getSupportFragmentManager();
        FragmentTransaction ft = fragmentManager.beginTransaction();
        Bundle bundle = new Bundle();
        bundle.putSerializable("dataModel", resturantModel);
        restaurantDetailsFragment.setArguments(bundle);
        ft.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        ft.replace(R.id.restaurantMenu_f, restaurantDetailsFragment).addToBackStack(null).commit();
    }

    public interface CallBackListener {
        void onCallBack();// pass any parameter in your onCallBack which you want to return
    }

}