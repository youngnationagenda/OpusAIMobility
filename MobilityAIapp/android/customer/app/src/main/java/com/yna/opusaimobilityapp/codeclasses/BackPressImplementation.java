package com.yna.opusaimobilityapp.codeclasses;


import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;

import com.yna.opusaimobilityapp.Interface.OnBackPressListener;


public class BackPressImplementation implements OnBackPressListener {

    private Fragment parentFragment;

    public BackPressImplementation(Fragment parentFragment) {
        this.parentFragment = parentFragment;
    }

    @Override
    public boolean onBackPressed() {

        if (parentFragment == null) return false;

        int childCount = parentFragment.getChildFragmentManager().getBackStackEntryCount();

        if (childCount == 0) {
            return false;
        } else {
            try {

                // get the child Fragment
                FragmentManager childFragmentManager = parentFragment.getChildFragmentManager();
                OnBackPressListener childFragment = (OnBackPressListener) childFragmentManager.getFragments().get(0);

                if (!childFragment.onBackPressed()) {
                    childFragmentManager.popBackStackImmediate();
                }

                return true;

            } catch (Exception e) {
                return false;
            }

        }
    }

}