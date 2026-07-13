package com.yna.opusaimobilityapp.food;

import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentPagerAdapter;
import androidx.viewpager.widget.ViewPager;

import com.google.android.material.navigation.NavigationBarView;
import com.yna.opusaimobilityapp.Interface.FirstPageFragmentListener;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentFoodMainBinding;


public class FoodMainFragment extends Fragment {
    
    FragmentFoodMainBinding binding;
    MyAdapter adapter;
    MenuItem prevMenuItem;

    public FoodMainFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentFoodMainBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        methodSetViewPagerAdapter();

        binding.bottomNavigationView.setOnItemSelectedListener(new NavigationBarView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull MenuItem item) {
                switch (item.getItemId()) {
                    case R.id.home_menu:
                        binding.viewPager.setCurrentItem(0);
                        break;
                    case R.id.shop_profile_menu:
                        binding.viewPager.setCurrentItem(1);
                        break;
                    case R.id.me_menu:
                        binding.viewPager.setCurrentItem(2);
                        break;

                    case R.id.fav_menu:
                        binding.viewPager.setCurrentItem(3);
                        break;
                }
                return false;
            }
        });

        binding.viewPager.addOnPageChangeListener(new ViewPager.OnPageChangeListener() {
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {

            }

            @Override
            public void onPageSelected(int position) {
                if (prevMenuItem != null) {
                    prevMenuItem.setChecked(false);
                } else {
                    binding.bottomNavigationView.getMenu().getItem(0).setChecked(false);
                }
                binding.bottomNavigationView.getMenu().getItem(position).setChecked(true);
                prevMenuItem = binding.bottomNavigationView.getMenu().getItem(position);

            }

            @Override
            public void onPageScrollStateChanged(int state) {

            }
        });

        return view;

    }

    /*Method SetViewPagerAdapter*/
    private void methodSetViewPagerAdapter() {
        adapter = new MyAdapter(getActivity(), getActivity().getSupportFragmentManager());
        binding.viewPager.setOffscreenPageLimit(4);
        binding.viewPager.setPagingEnabled(false);
        binding.viewPager.setAdapter(adapter);
    }



    public static class MyAdapter extends FragmentPagerAdapter {

        private final FragmentManager mFragmentManager;
        public Fragment mFragmentAtPos0;
        FirstPageListener listener = new FirstPageListener();
        Context context;


        public MyAdapter(Context context, FragmentManager fragmentManager) {
            super(fragmentManager, BEHAVIOR_RESUME_ONLY_CURRENT_FRAGMENT);
            this.mFragmentManager = fragmentManager;
            this.context = context;
        }

        @Override
        public Fragment getItem(int position) {
            if (position == 0) {
                if (mFragmentAtPos0 == null) {
                    mFragmentAtPos0 = new FoodHomeFragment(listener);
                }
                return mFragmentAtPos0;

            }
            if (position == 1) {
                return new BrowseFragment();
            }
            if (position == 2) {
                return new OrdersFragment();
            }
            if (position == 3) {
                return new FavouriteFragment();
            }

            return null;
        }

        @Override
        public int getCount() {
            return 4;
        }


        @Override
        public int getItemPosition(Object object) {
            if (object instanceof FoodHomeFragment &&
                    mFragmentAtPos0 instanceof FoodHomeTwo) {
                return POSITION_NONE;
            }
            if (object instanceof FoodHomeTwo &&
                    mFragmentAtPos0 instanceof FoodHomeFragment) {
                return POSITION_NONE;
            }
            return POSITION_UNCHANGED;
        }

        private final class FirstPageListener implements
                FirstPageFragmentListener {
            public void onSwitchToNextFragment() {
                mFragmentManager.beginTransaction().remove(mFragmentAtPos0)
                        .commitNow();
                if (mFragmentAtPos0 instanceof FoodHomeFragment) {
                    mFragmentAtPos0 = new FoodHomeTwo(listener);
                } else { // Instance of NextFragment
                    mFragmentAtPos0 = new FoodHomeFragment(listener);
                }
                notifyDataSetChanged();
            }
        }

    }

}
