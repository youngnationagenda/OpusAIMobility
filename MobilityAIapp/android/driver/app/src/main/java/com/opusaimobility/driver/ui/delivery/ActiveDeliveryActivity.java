package com.opusaimobility.driver.ui.delivery;

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
import com.opusaimobility.driver.databinding.ActivityActiveDeliveryBinding;
import com.opusaimobility.driver.ui.home.HomeActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ActiveDeliveryActivity extends AppCompatActivity implements OnMapReadyCallback {

    private static final String TAG = Constants.TAG + "ActiveDelivery";
    private ActivityActiveDeliveryBinding binding;
    private GoogleMap googleMap;
    private String orderId;
    private String orderType;
    private String userId;
    private int currentStatus = 2; // assigned

    // Food order statuses: 1=pending,2=assigned,3=picked_up,4=on_the_way,5=delivered,6=cancelled
    private static final String[] STATUS_LABELS  = {"","Pending","Assigned","Picked Up","On the Way","Delivered","Cancelled"};
    private static final String[] BUTTON_LABELS  = {"","","Picked Up","On the Way","Mark Delivered","","Cancelled"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityActiveDeliveryBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId    = prefs.getString(Constants.KEY_USER_ID, "");
        orderId   = getIntent().getStringExtra("orderId");
        orderType = getIntent().getStringExtra("orderType");

        setupMap();
        updateStatusUI();

        binding.btnNextStatus.setOnClickListener(v -> advanceStatus());
        binding.btnCancel.setOnClickListener(v -> showCancelDialog());
    }

    private void setupMap() {
        SupportMapFragment mapFragment = (SupportMapFragment)
            getSupportFragmentManager().findFragmentById(R.id.mapFragment);
        if (mapFragment != null) mapFragment.getMapAsync(this);
    }

    @Override
    public void onMapReady(GoogleMap map) {
        googleMap = map;
        try { googleMap.setMyLocationEnabled(true); } catch (SecurityException e) { /* ignore */ }
        googleMap.moveCamera(CameraUpdateFactory.newLatLngZoom(
            new LatLng(Constants.DEFAULT_LAT, Constants.DEFAULT_LNG), Constants.MAP_DEFAULT_ZOOM));
    }

    private void advanceStatus() {
        currentStatus++;
        if (currentStatus >= 5) { completeDelivery(); return; }
        updateStatusOnBackend(currentStatus);
        updateStatusUI();
    }

    private void updateStatusUI() {
        if (currentStatus < STATUS_LABELS.length)
            binding.tvDeliveryStatus.setText(STATUS_LABELS[currentStatus]);
        if (currentStatus < BUTTON_LABELS.length && !BUTTON_LABELS[currentStatus].isEmpty())
            binding.btnNextStatus.setText(BUTTON_LABELS[currentStatus]);
        binding.btnCancel.setVisibility(currentStatus >= 4 ? View.GONE : View.VISIBLE);
    }

    private void updateStatusOnBackend(int status) {
        try {
            JSONObject body = new JSONObject();
            body.put("order_id",      orderId);
            body.put("food_order_id", orderId);
            body.put("parcel_order_id", orderId);
            body.put("status",        String.valueOf(status));
            body.put("user_id",       userId);

            Call<String> call = "parcel".equals(orderType)
                ? NetworkSingleton.getInstance().getApiService()
                    .updateParcelStatus(new Gson().fromJson(body.toString(), Object.class))
                : NetworkSingleton.getInstance().getApiService()
                    .updateFoodOrderStatus(new Gson().fromJson(body.toString(), Object.class));

            call.enqueue(new Callback<String>() {
                @Override public void onResponse(Call<String> call2, Response<String> response) {
                    Log.d(TAG, "Delivery status updated: " + status);
                }
                @Override public void onFailure(Call<String> call2, Throwable t) {
                    Log.w(TAG, "Status update failed: " + t.getMessage());
                }
            });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void completeDelivery() {
        updateStatusOnBackend(5);
        Toast.makeText(this, "Delivery completed!", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(this, HomeActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(intent);
        finish();
    }

    private void showCancelDialog() {
        new AlertDialog.Builder(this)
            .setTitle("Cancel Delivery")
            .setMessage("Are you sure you want to cancel this delivery?")
            .setPositiveButton("Yes", (d, w) -> { updateStatusOnBackend(6); finish(); })
            .setNegativeButton("No", null)
            .show();
    }
}
