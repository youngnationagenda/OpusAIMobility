package com.terraai.aimobility.activitiesandfragment;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import com.terraai.aimobility.codeclasses.AppCompatLocaleActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;

import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.R;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.ride.loginsignup.LoginOrSignupFragment;

public class LoginActivity extends AppCompatLocaleActivity {

    LoginOrSignupFragment loginOrSignupFragment;
    long mBackPressed = 0;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        setContentView(R.layout.activity_main);


        if (savedInstanceState == null) {
            reload();
        } else {
            loginOrSignupFragment = (LoginOrSignupFragment) getSupportFragmentManager().getFragments().get(0);
        }

    }

    public void reload() {
        loginOrSignupFragment = new LoginOrSignupFragment();
        final FragmentManager fragmentManager = getSupportFragmentManager();
        fragmentManager.beginTransaction().replace(R.id.main_activity_container, loginOrSignupFragment).commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }


    @RequiresApi(api = Build.VERSION_CODES.M)
    @Override
    public void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {
            fragment.onActivityResult(requestCode, resultCode, data);
        }
    }

    @Override
    public void onBackPressed() {
        int count = this.getSupportFragmentManager().getBackStackEntryCount();
        if (count == 0) {
            if (mBackPressed + 2000 > System.currentTimeMillis()) {
                super.onBackPressed();
                return;
            } else {
                Toast.makeText(getBaseContext(), getString(R.string.tap_again), Toast.LENGTH_SHORT).show();
                mBackPressed = System.currentTimeMillis();
            }
        } else {
            super.onBackPressed();
        }
    }

}