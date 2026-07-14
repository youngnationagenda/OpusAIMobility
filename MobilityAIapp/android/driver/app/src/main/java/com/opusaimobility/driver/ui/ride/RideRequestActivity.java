package com.opusaimobility.driver.ui.ride;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityRideRequestBinding;
import com.opusaimobility.driver.services.WebSocketService;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * RideRequestActivity — Shown when a new ride request arrives via WebSocket.
 *
 * Displays:
 *  - Rider name + rating
 *  - Pickup address + distance from driver
 *  - Dropoff address
 *  - Estimated fare
 *  - Countdown timer (RIDE_REQUEST_TIMEOUT_SEC seconds to accept)
 *
 * Accept → POST /api/requestRide with status=accepted
 * Reject → dismisses and resumes waiting
 */
public class RideRequestActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "RideRequest";
    private ActivityRideRequestBinding binding;
    private CountDownTimer countdownTimer;
    private String rideId;
    private String userId;
    private JSONObject rideData;

    private final BroadcastReceiver cancelReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            // Rider cancelled before driver responded
            Toast.makeText(RideRequestActivity.this, "Ride was cancelled by rider", Toast.LENGTH_SHORT).show();
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRideRequestBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId = prefs.getString(Constants.KEY_USER_ID, "");

        String rawData = getIntent().getStringExtra("data");
        parseRideRequest(rawData);

        LocalBroadcastManager.getInstance(this).registerReceiver(
            cancelReceiver, new IntentFilter(WebSocketService.ACTION_RIDE_CANCEL));

        binding.btnAccept.setOnClickListener(v -> acceptRide());
        binding.btnReject.setOnClickListener(v -> { countdownTimer.cancel(); finish(); });

        startCountdown();
    }

    private void parseRideRequest(String rawData) {
        if (rawData == null) { finish(); return; }
        try {
            JSONObject json = new JSONObject(rawData);
            rideData = json;
            rideId = json.optString("rideId", json.optString("ride_id", ""));

            String riderName    = json.optString("riderName", "Rider");
            String riderRating  = json.optString("riderRating", "5.0");
            String pickup       = json.optString("pickup", "Pickup location");
            String dropoff      = json.optString("dropoff", "Dropoff location");
            String fare         = json.optString("fare", "0.00");
            String distance     = json.optString("distance", "—");
            String eta          = json.optString("eta", "—");

            binding.tvRiderName.setText(riderName);
            binding.tvRiderRating.setText(riderRating + " ★");
            binding.tvPickup.setText(pickup);
            binding.tvDropoff.setText(dropoff);
            binding.tvFare.setText(Constants.DEFAULT_CURRENCY + " " + fare);
            binding.tvDistance.setText(distance);
            binding.tvEta.setText(eta);

        } catch (JSONException e) {
            Log.e(TAG, "Parse error: " + e.getMessage());
            finish();
        }
    }

    private void acceptRide() {
        if (countdownTimer != null) countdownTimer.cancel();
        binding.btnAccept.setEnabled(false);
        binding.progressBar.setVisibility(View.VISIBLE);

        try {
            JSONObject body = new JSONObject();
            body.put("user_id",  userId);
            body.put("ride_id",  rideId);
            body.put("status",   "accepted");
            body.put("driver_id", userId);

            NetworkSingleton.getInstance().getApiService()
                .cancelRide(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        binding.progressBar.setVisibility(View.GONE);
                        Intent intent = new Intent(RideRequestActivity.this, ActiveRideActivity.class);
                        intent.putExtra("rideId", rideId);
                        if (rideData != null) intent.putExtra("rideData", rideData.toString());
                        startActivity(intent);
                        finish();
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        binding.progressBar.setVisibility(View.GONE);
                        binding.btnAccept.setEnabled(true);
                        Toast.makeText(RideRequestActivity.this, R.string.error_network, Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
            binding.btnAccept.setEnabled(true);
        }
    }

    private void startCountdown() {
        countdownTimer = new CountDownTimer(Constants.RIDE_REQUEST_TIMEOUT_SEC * 1000L, 1000) {
            @Override
            public void onTick(long ms) {
                binding.tvTimer.setText(String.valueOf(ms / 1000));
            }
            @Override
            public void onFinish() {
                binding.tvTimer.setText("0");
                Toast.makeText(RideRequestActivity.this, "Request timed out", Toast.LENGTH_SHORT).show();
                finish();
            }
        }.start();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (countdownTimer != null) countdownTimer.cancel();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(cancelReceiver);
    }
}
