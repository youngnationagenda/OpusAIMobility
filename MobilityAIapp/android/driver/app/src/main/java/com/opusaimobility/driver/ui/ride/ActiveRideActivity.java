package com.opusaimobility.driver.ui.ride;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityActiveRideBinding;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * ActiveRideActivity — Shown while a ride is in progress.
 *
 * Ride statuses (mirrors PHP AdminController::updateOrderStatus pattern):
 *  0 = searching  1 = accepted  2 = arrived  3 = started  4 = completed  5 = cancelled
 *
 * Status updates post to: POST /api/updateOrderStatus
 * Map shows rider pickup + destination with route overlay.
 */
public class ActiveRideActivity extends AppCompatActivity implements OnMapReadyCallback {

    private static final String TAG = Constants.TAG + "ActiveRide";
    private ActivityActiveRideBinding binding;
    private GoogleMap googleMap;
    private String rideId;
    private String userId;
    private JSONObject rideData;
    private int currentStatus = 1; // accepted

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityActiveRideBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId = prefs.getString(Constants.KEY_USER_ID, "");
        rideId = getIntent().getStringExtra("rideId");

        String rawData = getIntent().getStringExtra("rideData");
        if (rawData != null) {
            try { rideData = new JSONObject(rawData); } catch (JSONException e) { /* ignore */ }
        }

        setupMap();
        setupUI();
        populateRideDetails();
    }

    private void setupMap() {
        SupportMapFragment mapFragment = (SupportMapFragment)
            getSupportFragmentManager().findFragmentById(R.id.mapFragment);
        if (mapFragment != null) mapFragment.getMapAsync(this);
    }

    @Override
    public void onMapReady(GoogleMap map) {
        googleMap = map;
        try {
            googleMap.setMyLocationEnabled(true);
        } catch (SecurityException e) {
            Log.w(TAG, "Location permission not granted for map");
        }

        if (rideData != null) {
            try {
                double pickupLat  = Double.parseDouble(rideData.optString("pickup_lat",  "-1.2921"));
                double pickupLng  = Double.parseDouble(rideData.optString("pickup_lng",  "36.8219"));
                double dropoffLat = Double.parseDouble(rideData.optString("dropoff_lat", "-1.3000"));
                double dropoffLng = Double.parseDouble(rideData.optString("dropoff_lng", "36.8500"));

                LatLng pickup  = new LatLng(pickupLat,  pickupLng);
                LatLng dropoff = new LatLng(dropoffLat, dropoffLng);

                googleMap.addMarker(new MarkerOptions().position(pickup).title("Pickup"));
                googleMap.addMarker(new MarkerOptions().position(dropoff).title("Dropoff"));
                googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(pickup, Constants.MAP_DEFAULT_ZOOM));
            } catch (NumberFormatException e) {
                googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(
                    new LatLng(Constants.DEFAULT_LAT, Constants.DEFAULT_LNG),
                    Constants.MAP_DEFAULT_ZOOM));
            }
        }
    }

    private void setupUI() {
        updateStatusUI();

        binding.btnNextStatus.setOnClickListener(v -> advanceStatus());
        binding.btnCall.setOnClickListener(v -> {
            // Initiate call to rider
            Toast.makeText(this, "Calling rider...", Toast.LENGTH_SHORT).show();
        });
        binding.btnCancel.setOnClickListener(v -> showCancelDialog());
    }

    private void populateRideDetails() {
        if (rideData == null) return;
        try {
            binding.tvPickupAddress.setText(rideData.optString("pickup",  "Pickup"));
            binding.tvDropoffAddress.setText(rideData.optString("dropoff", "Dropoff"));
            binding.tvFare.setText(Constants.DEFAULT_CURRENCY + " " + rideData.optString("fare", "0.00"));
            binding.tvRiderName.setText(rideData.optString("riderName", "Rider"));
        } catch (Exception e) {
            Log.e(TAG, "populateRideDetails error: " + e.getMessage());
        }
    }

    private void advanceStatus() {
        currentStatus++;
        if (currentStatus > 4) { // completed
            completeRide();
            return;
        }
        updateStatusOnBackend(currentStatus);
        updateStatusUI();
    }

    private void updateStatusUI() {
        String[] labels = { "", "Accepted", "Arrived at Pickup", "Trip Started", "Complete Ride", "Cancelled" };
        String[] actions = { "", "I've Arrived", "Start Trip", "Complete Trip", "", "" };

        if (currentStatus < labels.length)
            binding.tvRideStatus.setText(labels[currentStatus]);
        if (currentStatus < actions.length && !actions[currentStatus].isEmpty())
            binding.btnNextStatus.setText(actions[currentStatus]);

        // Hide cancel once trip started
        binding.btnCancel.setVisibility(currentStatus >= 3 ? View.GONE : View.VISIBLE);
    }

    private void updateStatusOnBackend(int status) {
        try {
            JSONObject body = new JSONObject();
            body.put("food_order_id", rideId);
            body.put("order_id",      rideId);
            body.put("status",        String.valueOf(status));
            body.put("user_id",       userId);

            NetworkSingleton.getInstance().getApiService()
                .updateFoodOrderStatus(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        Log.d(TAG, "Status updated to: " + status);
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Log.w(TAG, "Status update failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void completeRide() {
        updateStatusOnBackend(4);
        Intent intent = new Intent(this, RideCompleteActivity.class);
        intent.putExtra("rideId", rideId);
        if (rideData != null) intent.putExtra("rideData", rideData.toString());
        startActivity(intent);
        finish();
    }

    private void showCancelDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Cancel Ride")
            .setMessage("Are you sure you want to cancel this ride?")
            .setPositiveButton("Yes, Cancel", (d, w) -> {
                updateStatusOnBackend(5);
                finish();
            })
            .setNegativeButton("No", null)
            .show();
    }
}
