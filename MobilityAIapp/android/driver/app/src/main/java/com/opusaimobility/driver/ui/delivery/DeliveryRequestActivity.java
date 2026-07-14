package com.opusaimobility.driver.ui.delivery;

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
import com.opusaimobility.driver.databinding.ActivityDeliveryRequestBinding;
import com.opusaimobility.driver.services.WebSocketService;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * DeliveryRequestActivity — Food/Parcel delivery request from WebSocket.
 *
 * Handles both food orders (FoodOrder) and parcel orders (ParcelOrder).
 * Accept/reject within DELIVERY_REQUEST_TIMEOUT_SEC seconds.
 */
public class DeliveryRequestActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "DeliveryRequest";
    private ActivityDeliveryRequestBinding binding;
    private CountDownTimer countdownTimer;
    private String orderId;
    private String orderType; // "food" or "parcel"
    private String userId;

    private final BroadcastReceiver cancelReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) {
            Toast.makeText(DeliveryRequestActivity.this, "Order was cancelled", Toast.LENGTH_SHORT).show();
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityDeliveryRequestBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId = prefs.getString(Constants.KEY_USER_ID, "");

        parseRequest(getIntent().getStringExtra("data"));

        LocalBroadcastManager.getInstance(this).registerReceiver(
            cancelReceiver, new IntentFilter(WebSocketService.ACTION_RIDE_CANCEL));

        binding.btnAccept.setOnClickListener(v -> acceptDelivery());
        binding.btnReject.setOnClickListener(v -> { if (countdownTimer != null) countdownTimer.cancel(); finish(); });
        startCountdown();
    }

    private void parseRequest(String rawData) {
        if (rawData == null) { finish(); return; }
        try {
            JSONObject json = new JSONObject(rawData);
            orderId   = json.optString("orderId", json.optString("order_id", ""));
            orderType = json.optString("orderType", "food");
            binding.tvOrderType.setText(orderType.equals("food") ? "Food Order" : "Parcel Delivery");
            binding.tvPickupAddress.setText(json.optString("pickup", "Pickup"));
            binding.tvDropoffAddress.setText(json.optString("dropoff", json.optString("destination", "Dropoff")));
            binding.tvAmount.setText(Constants.DEFAULT_CURRENCY + " " + json.optString("amount", "0.00"));
            binding.tvDistance.setText(json.optString("distance", "—"));
        } catch (JSONException e) {
            Log.e(TAG, "Parse error: " + e.getMessage());
            finish();
        }
    }

    private void acceptDelivery() {
        if (countdownTimer != null) countdownTimer.cancel();
        binding.btnAccept.setEnabled(false);
        binding.progressBar.setVisibility(View.VISIBLE);

        try {
            JSONObject body = new JSONObject();
            body.put("user_id",  userId);
            body.put("food_order_id", orderId);
            body.put("order_id", orderId);
            body.put("status",   "2"); // assigned

            Call<String> call = "parcel".equals(orderType)
                ? NetworkSingleton.getInstance().getApiService()
                    .updateParcelStatus(new Gson().fromJson(body.toString(), Object.class))
                : NetworkSingleton.getInstance().getApiService()
                    .updateFoodOrderStatus(new Gson().fromJson(body.toString(), Object.class));

            call.enqueue(new Callback<String>() {
                @Override public void onResponse(Call<String> call2, Response<String> response) {
                    binding.progressBar.setVisibility(View.GONE);
                    Intent intent = new Intent(DeliveryRequestActivity.this, ActiveDeliveryActivity.class);
                    intent.putExtra("orderId",   orderId);
                    intent.putExtra("orderType", orderType);
                    startActivity(intent);
                    finish();
                }
                @Override public void onFailure(Call<String> call2, Throwable t) {
                    binding.progressBar.setVisibility(View.GONE);
                    binding.btnAccept.setEnabled(true);
                    Toast.makeText(DeliveryRequestActivity.this, R.string.error_network, Toast.LENGTH_SHORT).show();
                }
            });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
            binding.btnAccept.setEnabled(true);
        }
    }

    private void startCountdown() {
        countdownTimer = new CountDownTimer(Constants.DELIVERY_REQUEST_TIMEOUT_SEC * 1000L, 1000) {
            @Override public void onTick(long ms) { binding.tvTimer.setText(String.valueOf(ms / 1000)); }
            @Override public void onFinish()      { binding.tvTimer.setText("0"); finish(); }
        }.start();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (countdownTimer != null) countdownTimer.cancel();
        LocalBroadcastManager.getInstance(this).unregisterReceiver(cancelReceiver);
    }
}
