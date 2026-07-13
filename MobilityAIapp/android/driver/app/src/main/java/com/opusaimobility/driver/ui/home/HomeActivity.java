package com.opusaimobility.driver.ui.home;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityHomeBinding;
import com.opusaimobility.driver.services.LocationTrackingService;
import com.opusaimobility.driver.services.WebSocketService;
import com.opusaimobility.driver.ui.auth.LoginActivity;
import com.opusaimobility.driver.ui.profile.EarningsActivity;
import com.opusaimobility.driver.ui.profile.ProfileActivity;
import com.opusaimobility.driver.ui.ride.RideHistoryActivity;
import com.opusaimobility.driver.ui.settings.SettingsActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * HomeActivity — Driver dashboard.
 *
 * Shows:
 *  - Online/Offline toggle (starts/stops LocationTrackingService + WebSocket)
 *  - Real-time map showing current location
 *  - Earnings summary
 *  - Bottom navigation: Map | History | Earnings | Profile
 *
 * When driver goes ONLINE:
 *  1. Starts LocationTrackingService (foreground, posts GPS to AWS IoT)
 *  2. Connects WebSocketService (receives ride/delivery requests from API Gateway)
 *  3. Sends driver_online event via WebSocket
 */
public class HomeActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "Home";
    private ActivityHomeBinding binding;
    private boolean isOnline = false;
    private String userId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityHomeBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId  = prefs.getString(Constants.KEY_USER_ID, "");
        isOnline = prefs.getBoolean(Constants.KEY_IS_ONLINE, false);

        setupToolbar();
        setupOnlineToggle();
        setupBottomNavigation();
        loadDriverStatus();
        loadEarningsSummary();

        // Restore online state
        updateOnlineUI(isOnline);
    }

    private void setupToolbar() {
        binding.ivNotifications.setOnClickListener(v ->
            Toast.makeText(this, "Notifications", Toast.LENGTH_SHORT).show());
    }

    private void setupOnlineToggle() {
        binding.switchOnline.setChecked(isOnline);
        binding.switchOnline.setOnCheckedChangeListener((btn, checked) -> {
            setDriverOnlineStatus(checked);
        });
    }

    private void setDriverOnlineStatus(boolean online) {
        isOnline = online;
        getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE)
            .edit().putBoolean(Constants.KEY_IS_ONLINE, online).apply();

        updateOnlineUI(online);

        if (online) {
            startLocationTracking();
            startWebSocket();
        } else {
            stopLocationTracking();
        }

        // Notify backend of status change
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);
            body.put("action", online ? Constants.WS_ACTION_DRIVER_ONLINE : Constants.WS_ACTION_DRIVER_OFFLINE);
            body.put("active", online ? 1 : 0);

            NetworkSingleton.getInstance().getApiService()
                .updateProfile(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        Log.d(TAG, "Driver status updated: " + (online ? "ONLINE" : "OFFLINE"));
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Log.w(TAG, "Status update failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void updateOnlineUI(boolean online) {
        binding.tvOnlineStatus.setText(online ? R.string.status_online : R.string.status_offline);
        binding.tvOnlineStatus.setTextColor(getColor(online ? R.color.colorOnline : R.color.colorOffline));
        binding.viewStatusDot.setBackgroundResource(online ? R.drawable.dot_online : R.drawable.dot_offline);
    }

    private void startLocationTracking() {
        Intent intent = new Intent(this, LocationTrackingService.class);
        intent.putExtra("userId", userId);
        startForegroundService(intent);
        Log.d(TAG, "Location tracking started");
    }

    private void stopLocationTracking() {
        stopService(new Intent(this, LocationTrackingService.class));
        Log.d(TAG, "Location tracking stopped");
    }

    private void startWebSocket() {
        Intent intent = new Intent(this, WebSocketService.class);
        intent.putExtra("userId", userId);
        startService(intent);
        Log.d(TAG, "WebSocket service started");
    }

    private void setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_map) {
                // Default / map view — already shown
                return true;
            } else if (id == R.id.nav_history) {
                startActivity(new Intent(this, RideHistoryActivity.class));
                return true;
            } else if (id == R.id.nav_earnings) {
                startActivity(new Intent(this, EarningsActivity.class));
                return true;
            } else if (id == R.id.nav_profile) {
                startActivity(new Intent(this, ProfileActivity.class));
                return true;
            }
            return false;
        });
    }

    private void loadDriverStatus() {
        if (userId.isEmpty()) return;
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);

            NetworkSingleton.getInstance().getApiService()
                .getProfile(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            if ("200".equals(json.optString("code"))) {
                                JSONObject msg  = json.optJSONObject("msg");
                                JSONObject user = msg != null ? msg.optJSONObject("User") : null;
                                if (user != null) {
                                    String name = user.optString("first_name","") + " " + user.optString("last_name","");
                                    binding.tvDriverName.setText(name.trim());
                                    String rating = user.optString("rating","5.0");
                                    binding.tvRating.setText(rating);
                                }
                            }
                        } catch (JSONException e) {
                            Log.e(TAG, "Profile parse error: " + e.getMessage());
                        }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Log.w(TAG, "Profile load failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void loadEarningsSummary() {
        // Fetch today's earnings from ride history
        binding.tvTodayEarnings.setText(Constants.DEFAULT_CURRENCY + " 0.00");
        binding.tvTodayTrips.setText("0 trips");
    }

    public void logout() {
        stopLocationTracking();
        stopService(new Intent(this, WebSocketService.class));

        getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE).edit().clear().apply();
        NetworkSingleton.reset();

        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
