package com.opusaimobility.driver.ui.splash;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

import androidx.appcompat.app.AppCompatActivity;

import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.ui.auth.LoginActivity;
import com.opusaimobility.driver.ui.home.HomeActivity;

/**
 * SplashActivity — displayed for 2 seconds on launch.
 * Checks if driver is already authenticated; routes to Home or Login.
 */
public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        new Handler(Looper.getMainLooper()).postDelayed(this::checkSession, 2000);
    }

    private void checkSession() {
        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        String token  = prefs.getString(Constants.KEY_TOKEN, null);
        String userId = prefs.getString(Constants.KEY_USER_ID, null);

        boolean isLoggedIn = token != null && !token.isEmpty()
                          && userId != null && !userId.isEmpty();

        Intent intent = isLoggedIn
            ? new Intent(this, HomeActivity.class)
            : new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
