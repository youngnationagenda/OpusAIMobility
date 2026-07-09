package com.terraai.aimobility.codeclasses;



import androidx.fragment.app.Fragment;

import com.terraai.aimobility.Interface.OnBackPressListener;


public class RootFragment extends Fragment implements OnBackPressListener {

    @Override
    public boolean onBackPressed() {
        return new BackPressImplementation(this).onBackPressed();
    }
}