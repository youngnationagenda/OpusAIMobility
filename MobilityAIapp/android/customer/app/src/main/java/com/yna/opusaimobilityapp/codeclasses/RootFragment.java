package com.yna.opusaimobilityapp.codeclasses;



import androidx.fragment.app.Fragment;

import com.yna.opusaimobilityapp.Interface.OnBackPressListener;


public class RootFragment extends Fragment implements OnBackPressListener {

    @Override
    public boolean onBackPressed() {
        return new BackPressImplementation(this).onBackPressed();
    }
}