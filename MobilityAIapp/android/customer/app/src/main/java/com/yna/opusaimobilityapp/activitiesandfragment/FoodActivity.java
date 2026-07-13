package com.yna.opusaimobilityapp.activitiesandfragment;

import android.os.Bundle;

import com.yna.opusaimobilityapp.codeclasses.AppCompatLocaleActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;

import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.codeclasses.Variables;
import com.yna.opusaimobilityapp.food.BrowseFragment;
import com.yna.opusaimobilityapp.food.FavouriteFragment;
import com.yna.opusaimobilityapp.food.FoodHomeFragment;
import com.yna.opusaimobilityapp.food.FoodHomeTwo;
import com.yna.opusaimobilityapp.food.FoodMainFragment;
import com.yna.opusaimobilityapp.food.OrdersFragment;
import com.yna.opusaimobilityapp.food.PlaceOrdersFragment;
import com.yna.opusaimobilityapp.food.RestaurantMenuFragment;
import com.yna.opusaimobilityapp.food.ResturantAgainstCatFragment;
import com.yna.opusaimobilityapp.food.SearchFragmentResturant;
import com.yna.opusaimobilityapp.model.CalculationModel;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.R;

import java.util.ArrayList;

public class FoodActivity extends AppCompatLocaleActivity implements RestaurantMenuFragment.CallBackListener{

    public FoodMainFragment foodMainFragment;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        setContentView(R.layout.activity_food);


        if (savedInstanceState == null) {
            reload();
        } else {
            foodMainFragment = (FoodMainFragment) getSupportFragmentManager().getFragments().get(0);
        }
    }

    public void reload() {
        foodMainFragment = new FoodMainFragment();
        final FragmentManager fragmentManager = getSupportFragmentManager();
        fragmentManager.beginTransaction().replace(R.id.food_activityContainer, foodMainFragment).commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    public void checkFragment(){
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {
            if(fragment instanceof FoodHomeFragment){
                FoodHomeFragment mainFragment = (FoodHomeFragment) fragment;
                mainFragment.setUpScreenData();
            }

            if(fragment instanceof FoodHomeTwo){
                FoodHomeTwo mainFragment = (FoodHomeTwo) fragment;
                mainFragment.setUpScreenData();
            }

            if(fragment instanceof FavouriteFragment){
                FavouriteFragment mainFragment = (FavouriteFragment) fragment;
                mainFragment.checkCart();
            }


            if(fragment instanceof OrdersFragment){
                OrdersFragment mainFragment = (OrdersFragment) fragment;
                mainFragment.checkCart();
            }

            if(fragment instanceof BrowseFragment){
                BrowseFragment mainFragment = (BrowseFragment) fragment;
                mainFragment.checkCart();
            }

            if(fragment instanceof RestaurantMenuFragment){
                RestaurantMenuFragment mainFragment = (RestaurantMenuFragment) fragment;
                mainFragment.checkCart(true);
            }

            if(fragment instanceof ResturantAgainstCatFragment){
                ResturantAgainstCatFragment mainFragment = (ResturantAgainstCatFragment) fragment;
                mainFragment.checkCart();
            }

        }
    }



    public void updateist(ArrayList<CalculationModel> carList){
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {
            if(fragment instanceof FoodHomeFragment){
                FoodHomeFragment mainFragment = (FoodHomeFragment) fragment;
                mainFragment.setUpScreenData();
            }

            if(fragment instanceof FoodHomeTwo){
                FoodHomeTwo mainFragment = (FoodHomeTwo) fragment;
                mainFragment.setUpScreenData();
            }

            if(fragment instanceof FavouriteFragment){
                FavouriteFragment mainFragment = (FavouriteFragment) fragment;
                mainFragment.checkCart();
            }


            if(fragment instanceof OrdersFragment){
                OrdersFragment mainFragment = (OrdersFragment) fragment;
                mainFragment.checkCart();
            }

            if(fragment instanceof BrowseFragment){
                BrowseFragment mainFragment = (BrowseFragment) fragment;
                mainFragment.checkCart();
            }

            if(fragment instanceof RestaurantMenuFragment){
                RestaurantMenuFragment mainFragment = (RestaurantMenuFragment) fragment;
                mainFragment.checkCart(true);
            }

            if(fragment instanceof ResturantAgainstCatFragment){
                ResturantAgainstCatFragment mainFragment = (ResturantAgainstCatFragment) fragment;
                mainFragment.checkCart();
            }

        }
    }


    @Override
    public void onCallBack() {
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {

            if(fragment instanceof PlaceOrdersFragment){
                PlaceOrdersFragment mainFragment = (PlaceOrdersFragment) fragment;
                mainFragment.updateList(true);
            }

        }
    }

    public void updateFav(ResturantModel recipeDataModel) {
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {
            if(fragment instanceof FoodHomeFragment){
                FoodHomeFragment mainFragment = (FoodHomeFragment) fragment;
                mainFragment.getChangedList(recipeDataModel);
            }

            if(fragment instanceof FoodHomeTwo){
                FoodHomeTwo mainFragment = (FoodHomeTwo) fragment;
                mainFragment.getChangedList(recipeDataModel);
            }

            if(fragment instanceof SearchFragmentResturant){
                SearchFragmentResturant mainFragment = (SearchFragmentResturant) fragment;
                mainFragment.getChangedList(recipeDataModel);
            }
        }
    }
}