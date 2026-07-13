package com.opusaimobility.driver.ui.profile;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.databinding.ActivityEarningsBinding;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * EarningsActivity — Shows driver earnings summary + history.
 *
 * Data from: POST /api/getRideHistory (filtered by driver userId)
 * Also shows: wallet balance via POST /api/getWalletBalance
 */
public class EarningsActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "Earnings";
    private ActivityEarningsBinding binding;
    private String userId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEarningsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId = prefs.getString(Constants.KEY_USER_ID, "");

        binding.ivBack.setOnClickListener(v -> finish());

        loadEarnings();
        loadWalletBalance();
    }

    private void loadEarnings() {
        binding.progressBar.setVisibility(View.VISIBLE);
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);
            body.put("role",    Constants.ROLE_DRIVER);

            NetworkSingleton.getInstance().getApiService()
                .getRideHistory(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        binding.progressBar.setVisibility(View.GONE);
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            if ("200".equals(json.optString("code"))) {
                                calculateTotals(json.optJSONArray("msg"));
                            }
                        } catch (JSONException e) {
                            Log.e(TAG, "Parse error: " + e.getMessage());
                        }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        binding.progressBar.setVisibility(View.GONE);
                    }
                });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
        }
    }

    private void calculateTotals(JSONArray rides) {
        if (rides == null) { showZeroState(); return; }

        double totalEarnings = 0;
        int    totalRides    = rides.length();
        int    todayRides    = 0;
        double todayEarnings = 0;

        String today = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            .format(new java.util.Date());

        for (int i = 0; i < rides.length(); i++) {
            try {
                JSONObject ride = rides.getJSONObject(i);
                double fare = Double.parseDouble(ride.optString("fare", "0"));
                totalEarnings += fare;
                String created = ride.optString("created", "");
                if (created.startsWith(today)) {
                    todayRides++;
                    todayEarnings += fare;
                }
            } catch (Exception e) { /* skip */ }
        }

        final double finalTotal   = totalEarnings;
        final double finalToday   = todayEarnings;
        final int    finalTrips   = totalRides;
        final int    finalToday_r = todayRides;

        runOnUiThread(() -> {
            binding.tvTotalEarnings.setText(
                String.format("%s %.2f", Constants.DEFAULT_CURRENCY, finalTotal));
            binding.tvTodayEarnings.setText(
                String.format("%s %.2f", Constants.DEFAULT_CURRENCY, finalToday));
            binding.tvTotalTrips.setText(finalTrips + " total trips");
            binding.tvTodayTrips.setText(finalToday_r + " today");
        });
    }

    private void showZeroState() {
        binding.tvTotalEarnings.setText(Constants.DEFAULT_CURRENCY + " 0.00");
        binding.tvTodayEarnings.setText(Constants.DEFAULT_CURRENCY + " 0.00");
        binding.tvTotalTrips.setText("0 total trips");
        binding.tvTodayTrips.setText("0 today");
    }

    private void loadWalletBalance() {
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);

            NetworkSingleton.getInstance().getApiService()
                .getWalletBalance(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            JSONObject msg  = json.optJSONObject("msg");
                            if (msg != null) {
                                String balance = msg.optString("balance", "0.00");
                                binding.tvWalletBalance.setText(Constants.DEFAULT_CURRENCY + " " + balance);
                            }
                        } catch (JSONException e) { /* ignore */ }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {}
                });
        } catch (JSONException e) { /* ignore */ }
    }
}
