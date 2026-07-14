package com.opusaimobility.driver.ui.ride;

import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.databinding.ActivityRideHistoryBinding;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RideHistoryActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "RideHistory";
    private ActivityRideHistoryBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRideHistoryBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.ivBack.setOnClickListener(v -> finish());
        loadRideHistory();
    }

    private void loadRideHistory() {
        binding.progressBar.setVisibility(View.VISIBLE);
        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        String userId = prefs.getString(Constants.KEY_USER_ID, "");

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
                        if (response.body() != null) {
                            try {
                                JSONObject json = new JSONObject(response.body());
                                Log.d(TAG, "Ride history loaded: " + json.optString("code"));
                                // TODO: Populate RecyclerView adapter
                            } catch (JSONException e) {
                                Log.e(TAG, "Parse error: " + e.getMessage());
                            }
                        }
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        binding.progressBar.setVisibility(View.GONE);
                        Log.w(TAG, "Load failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
        }
    }
}
