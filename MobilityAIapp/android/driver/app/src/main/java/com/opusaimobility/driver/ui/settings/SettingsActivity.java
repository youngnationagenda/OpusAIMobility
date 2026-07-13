package com.opusaimobility.driver.ui.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.databinding.ActivitySettingsBinding;
import com.opusaimobility.driver.ui.auth.LoginActivity;

public class SettingsActivity extends AppCompatActivity {

    private ActivitySettingsBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySettingsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.ivBack.setOnClickListener(v -> finish());

        binding.btnSupport.setOnClickListener(v ->
            startActivity(new Intent(this, SupportActivity.class)));

        binding.btnPrivacyPolicy.setOnClickListener(v ->
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(Constants.PRIVACY_POLICY))));

        binding.btnTerms.setOnClickListener(v ->
            startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(Constants.TERMS_CONDITIONS))));

        binding.btnLogout.setOnClickListener(v -> showLogoutDialog());

        binding.tvVersion.setText("Version " + com.opusaimobility.driver.BuildConfig.VERSION_NAME);
    }

    private void showLogoutDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Logout", (d, w) -> logout())
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void logout() {
        getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE).edit().clear().apply();
        NetworkSingleton.reset();

        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
