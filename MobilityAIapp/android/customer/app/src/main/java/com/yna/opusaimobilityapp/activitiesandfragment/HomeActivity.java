package com.yna.opusaimobilityapp.activitiesandfragment;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.annotation.Nullable;
import com.yna.opusaimobilityapp.codeclasses.AppCompatLocaleActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;

import com.google.firebase.messaging.FirebaseMessaging;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.IOnBackPressed;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.codeclasses.Variables;
import com.yna.opusaimobilityapp.ride.MainFragment;
import com.yna.opusaimobilityapp.ride.bookride.StartRideFragment;
import com.yna.opusaimobilityapp.ride.bookride.WheretoFragment;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

public class HomeActivity extends AppCompatLocaleActivity {

    MainFragment mainFragment;
    long mBackPressed = 0;
    String userId;
    String token;



    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        setContentView(R.layout.activity_home);

        MyPreferences.mPrefs = getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);
        userId = MyPreferences.getSharedPreference(HomeActivity.this).getString(MyPreferences.USER_ID, "");
        getPublicIp();

        if (savedInstanceState == null) {
            reload();
        } else {
            mainFragment = (MainFragment) getSupportFragmentManager().getFragments().get(0);
        }

    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);


    }

    private void getPublicIp() {
        RetrofitRequest.JsonPostRequest(this,
                new JSONObject().toString(),
                Singleton.getApiCall(HomeActivity.this).getIp(), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            try {
                                if (resp != null) {
                                    JSONObject responce = new JSONObject(resp);
                                    String ip = responce.optString("ip");
                                    addFirebaseTokon(ip);
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }

    public void addFirebaseTokon(String ip) {

        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        return;
                    }
                    token = task.getResult();
                    MyPreferences.getSharedPreference(HomeActivity.this).edit().putString(MyPreferences.deviceTokon, token).commit();


                    JSONObject params = new JSONObject();
                    try {
                        params.put("user_id", userId);
                        params.put("device", getString(R.string.device));
                        params.put("version", Functions.getVersion(HomeActivity.this));
                        params.put("ip", "" + ip);
                        params.put("device_token", token);
                    } catch (JSONException e) {
                        e.printStackTrace();
                    }
                    RetrofitRequest.JsonPostRequest(this,
                            params.toString(),
                            Singleton.getApiCall(HomeActivity.this).addDeviceData(params.toString()), new ApiCallback() {
                                @Override
                                public void onResponce(String resp,boolean isSuccess) {

                                }
                            });
                });
    }


    public void reload() {
        mainFragment = new MainFragment();
        final FragmentManager fragmentManager = getSupportFragmentManager();
        fragmentManager.beginTransaction().replace(R.id.homeActivity_Container, mainFragment).commit();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        for (Fragment fragment : getSupportFragmentManager().getFragments()) {
            fragment.onActivityResult(requestCode, resultCode, data);

        }
    }


    @Override
    public void onBackPressed() {

        int count = getSupportFragmentManager().getBackStackEntryCount();
        if (count == 0) {
            if (mBackPressed + 2000 > System.currentTimeMillis()) {
                super.onBackPressed();
            } else {
                Toast.makeText(HomeActivity.this, "Press again to exit", Toast.LENGTH_SHORT).show();
                mBackPressed = System.currentTimeMillis();
            }
        } else {
            FragmentManager fragmentManager = getSupportFragmentManager();
            String fragmentTag = fragmentManager.getBackStackEntryAt(fragmentManager.getBackStackEntryCount() - 1).getName();
            Fragment currentFragment = fragmentManager.findFragmentByTag(fragmentTag);
            if (currentFragment != null && !currentFragment.equals("")) {
                if (currentFragment instanceof StartRideFragment) {
                    StartRideFragment startRideFragment = (StartRideFragment) currentFragment;
                    startRideFragment.backPress();
                } else if (currentFragment instanceof WheretoFragment) {
                    if (!(currentFragment instanceof IOnBackPressed) || !((IOnBackPressed) currentFragment).onBackPressed()) {
                        super.onBackPressed();
                        return;
                    } else {
                        return;
                    }
                } else {
                    super.onBackPressed();
                }
            } else {
                super.onBackPressed();
            }

        }
    }


}