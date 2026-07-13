package com.opusaimobility.driver.ui.ride;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.databinding.ActivityRideCompleteBinding;
import com.opusaimobility.driver.ui.home.HomeActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RideCompleteActivity extends AppCompatActivity {

    private ActivityRideCompleteBinding binding;
    private String rideId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRideCompleteBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        rideId = getIntent().getStringExtra("rideId");
        String rawData = getIntent().getStringExtra("rideData");

        if (rawData != null) {
            try {
                JSONObject rideData = new JSONObject(rawData);
                binding.tvFareAmount.setText(Constants.DEFAULT_CURRENCY + " " + rideData.optString("fare", "0.00"));
                binding.tvDistance.setText(rideData.optString("distance", "—"));
                binding.tvDuration.setText(rideData.optString("duration", "—"));
            } catch (JSONException e) { /* ignore */ }
        }

        binding.btnDone.setOnClickListener(v -> {
            submitRating();
            Intent intent = new Intent(this, HomeActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        });
    }

    private void submitRating() {
        float rating = binding.ratingBar.getRating();
        if (rating <= 0 || rideId == null) return;
        try {
            JSONObject body = new JSONObject();
            body.put("ride_id", rideId);
            body.put("rating",  rating);
            body.put("user_id", getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE)
                .getString(Constants.KEY_USER_ID, ""));

            NetworkSingleton.getInstance().getApiService()
                .rateRide(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {}
                    @Override public void onFailure(Call<String> call, Throwable t) {}
                });
        } catch (JSONException e) { /* ignore */ }
    }
}
