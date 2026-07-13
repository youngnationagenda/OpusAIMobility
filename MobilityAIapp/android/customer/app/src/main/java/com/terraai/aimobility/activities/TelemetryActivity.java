package com.terraai.aimobility.activities;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.terraai.aimobility.Constants;
import com.yna.opusaimobilityapp.R;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * TelemetryActivity — TERRA-081
 * ───────────────────────────────
 * Android BMS (Battery Management System) telemetry screen.
 *
 * Displays live data fetched from GET /iot/telemetry:
 *   - Battery temperature, motor temperature, controller temp
 *   - Battery health percentage + cycle count
 *   - Efficiency (Wh/km) + total energy consumed
 *   - Brake wear status + swap count
 *   - Eco score (0-100) with color-coded badge
 *
 * Polling: every 8 seconds via Handler
 * WebSocket: optional real-time via OkHttp (upgrade in Sprint 4)
 *
 * Layout file required: res/layout/activity_telemetry.xml
 * (see companion layout file: activity_telemetry_layout.xml)
 */
public class TelemetryActivity extends AppCompatActivity {

    private static final String TAG         = "TelemetryActivity";
    private static final String API_BASE    = Constants.BASE_URL + "api";
    private static final long   POLL_MS     = 8_000L;

    // UI references
    private TextView      tvBatteryTemp, tvMotorTemp, tvControllerTemp;
    private TextView      tvHealth, tvCycleCount, tvEfficiency;
    private TextView      tvEnergyTotal, tvBrakeWear, tvSwapCount;
    private TextView      tvEcoScore, tvLastSwap, tvStatus;
    private ProgressBar   pbHealth, pbBrakeWear, pbEcoScore;
    private CardView      cardEcoScore;
    private SwipeRefreshLayout swipeRefresh;

    private final Handler       handler   = new Handler(Looper.getMainLooper());
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private boolean polling = false;
    private String  authToken;

    // ── Lifecycle ─────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_telemetry);

        authToken = getIntent().getStringExtra("authToken");
        if (getSupportActionBar() != null) getSupportActionBar().setTitle("Fleet Telemetry");

        bindViews();
        setupSwipeRefresh();
        fetchTelemetry();
        startPolling();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopPolling();
        executor.shutdown();
    }

    // ── View Binding ──────────────────────────────────────────────────────

    private void bindViews() {
        tvBatteryTemp    = findViewById(R.id.tv_battery_temp);
        tvMotorTemp      = findViewById(R.id.tv_motor_temp);
        tvControllerTemp = findViewById(R.id.tv_controller_temp);
        tvHealth         = findViewById(R.id.tv_health);
        tvCycleCount     = findViewById(R.id.tv_cycle_count);
        tvEfficiency     = findViewById(R.id.tv_efficiency);
        tvEnergyTotal    = findViewById(R.id.tv_energy_total);
        tvBrakeWear      = findViewById(R.id.tv_brake_wear);
        tvSwapCount      = findViewById(R.id.tv_swap_count);
        tvEcoScore       = findViewById(R.id.tv_eco_score);
        tvLastSwap       = findViewById(R.id.tv_last_swap);
        tvStatus         = findViewById(R.id.tv_status);
        pbHealth         = findViewById(R.id.pb_health);
        pbBrakeWear      = findViewById(R.id.pb_brake_wear);
        pbEcoScore       = findViewById(R.id.pb_eco_score);
        cardEcoScore     = findViewById(R.id.card_eco_score);
        swipeRefresh     = findViewById(R.id.swipe_refresh);
    }

    private void setupSwipeRefresh() {
        if (swipeRefresh != null) {
            swipeRefresh.setColorSchemeColors(Color.parseColor("#10B981"), Color.parseColor("#6366F1"));
            swipeRefresh.setOnRefreshListener(() -> {
                fetchTelemetry();
                if (swipeRefresh != null) swipeRefresh.setRefreshing(false);
            });
        }
    }

    // ── Polling ───────────────────────────────────────────────────────────

    private void startPolling() {
        polling = true;
        handler.postDelayed(pollRunnable, POLL_MS);
    }

    private void stopPolling() {
        polling = false;
        handler.removeCallbacks(pollRunnable);
    }

    private final Runnable pollRunnable = new Runnable() {
        @Override public void run() {
            if (!polling) return;
            fetchTelemetry();
            handler.postDelayed(this, POLL_MS);
        }
    };

    // ── API Fetch ─────────────────────────────────────────────────────────

    private void fetchTelemetry() {
        executor.execute(() -> {
            try {
                URL url = new URL(API_BASE + "/iot/telemetry");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setRequestProperty("Content-Type", "application/json");
                if (authToken != null && !authToken.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + authToken);
                }
                conn.setConnectTimeout(8000);
                conn.setReadTimeout(8000);

                int responseCode = conn.getResponseCode();
                if (responseCode == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) sb.append(line);
                    reader.close();

                    // Parse outer wrapper { msg: { batteryTemp, ... } }
                    JSONObject outer = new JSONObject(sb.toString());
                    JSONObject data  = outer.optJSONObject("msg");
                    if (data == null) data = outer; // direct telemetry object

                    final JSONObject telemetry = data;
                    runOnUiThread(() -> updateUI(telemetry));
                } else {
                    Log.w(TAG, "Telemetry API returned: " + responseCode);
                    runOnUiThread(() -> showStatus("Polling... (HTTP " + responseCode + ")", false));
                }
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Telemetry fetch error: " + e.getMessage());
                runOnUiThread(() -> showStatus("Connection error — retrying", false));
            }
        });
    }

    // ── UI Updates ────────────────────────────────────────────────────────

    private void updateUI(JSONObject t) {
        try {
            double batteryTemp    = t.optDouble("batteryTemp",    28.0);
            double motorTemp      = t.optDouble("motorTemp",      42.0);
            double controllerTemp = t.optDouble("controllerTemp", 38.0);
            double health         = t.optDouble("healthPercentage", 94.0);
            int    cycles         = t.optInt("cycleCount",       156);
            double efficiency     = t.optDouble("efficiencyWhKm", 38.0);
            double energyTotal    = t.optDouble("totalEnergyConsumed", 0.0);
            int    brakeWear      = t.optInt("brakeWearStatus",  80);
            int    swapCount      = t.optInt("swapCount",        0);
            int    ecoScore       = t.optInt("ecoScore",         88);
            long   lastSwapTs     = t.optLong("lastSwapTimestamp", 0L);

            // Temperatures
            tvBatteryTemp.setText(String.format(Locale.US, "%.1f°C", batteryTemp));
            tvBatteryTemp.setTextColor(batteryTemp > 50 ? Color.RED : batteryTemp > 40 ? Color.parseColor("#F59E0B") : Color.parseColor("#10B981"));

            tvMotorTemp.setText(String.format(Locale.US, "%.1f°C", motorTemp));
            tvMotorTemp.setTextColor(motorTemp > 70 ? Color.RED : Color.parseColor("#6366F1"));

            tvControllerTemp.setText(String.format(Locale.US, "%.1f°C", controllerTemp));

            // Health
            tvHealth.setText(String.format(Locale.US, "%.1f%%", health));
            if (pbHealth != null) pbHealth.setProgress((int) health);

            tvCycleCount.setText(cycles + " cycles");

            // Efficiency
            tvEfficiency.setText(String.format(Locale.US, "%.1f Wh/km", efficiency));
            tvEnergyTotal.setText(String.format(Locale.US, "%.1f kWh total", energyTotal / 1000.0));

            // Brake wear
            tvBrakeWear.setText(brakeWear + "% remaining");
            if (pbBrakeWear != null) pbBrakeWear.setProgress(brakeWear);
            tvBrakeWear.setTextColor(brakeWear < 20 ? Color.RED : brakeWear < 50 ? Color.parseColor("#F59E0B") : Color.parseColor("#10B981"));

            // Swap count
            tvSwapCount.setText(swapCount + " battery swaps");

            // Eco score
            tvEcoScore.setText(String.valueOf(ecoScore));
            if (pbEcoScore != null) pbEcoScore.setProgress(ecoScore);
            int ecoColor = ecoScore >= 80 ? Color.parseColor("#10B981") : ecoScore >= 60 ? Color.parseColor("#F59E0B") : Color.RED;
            tvEcoScore.setTextColor(ecoColor);
            if (cardEcoScore != null) cardEcoScore.setCardBackgroundColor(ecoScore >= 80 ? Color.parseColor("#D1FAE5") : Color.parseColor("#FEF3C7"));

            // Last swap
            if (lastSwapTs > 0) {
                long minsAgo = (System.currentTimeMillis() - lastSwapTs) / 60000;
                tvLastSwap.setText(minsAgo < 60 ? minsAgo + " min ago" : (minsAgo / 60) + "h ago");
            } else {
                tvLastSwap.setText("—");
            }

            showStatus("Live — updated just now", true);

        } catch (Exception e) {
            Log.e(TAG, "UI update error", e);
        }
    }

    private void showStatus(String msg, boolean ok) {
        if (tvStatus == null) return;
        tvStatus.setText(msg);
        tvStatus.setTextColor(ok ? Color.parseColor("#10B981") : Color.parseColor("#EF4444"));
    }
}
