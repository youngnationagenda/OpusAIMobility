package com.opusaimobility.driver.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityOtpVerifyBinding;
import com.opusaimobility.driver.ui.home.HomeActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * OtpVerifyActivity — Phone number OTP verification.
 *
 * Sends OTP via: POST /api/sendOtp  { phone }
 * Verifies via:  POST /api/verifyOtp { phone, code }
 *
 * SNS SMS is the primary delivery channel (falls back to Twilio).
 * In sandbox mode the OTP is returned in the API response for testing.
 */
public class OtpVerifyActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "OtpVerify";
    private ActivityOtpVerifyBinding binding;
    private String phone;
    private String email;
    private CountDownTimer resendTimer;
    private static final long RESEND_COOLDOWN_MS = 60_000L;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityOtpVerifyBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        phone = getIntent().getStringExtra("phone");
        email = getIntent().getStringExtra("email");

        if (phone != null) {
            binding.tvPhoneHint.setText(getString(R.string.otp_sent_to, phone));
        }

        binding.btnVerify.setOnClickListener(v -> verifyOtp());
        binding.tvResend.setOnClickListener(v -> resendOtp());

        startResendTimer();
    }

    private void verifyOtp() {
        String otp = binding.etOtp.getText().toString().trim();
        if (TextUtils.isEmpty(otp) || otp.length() < 4) {
            binding.etOtp.setError("Enter valid OTP");
            return;
        }

        setLoading(true);
        try {
            JSONObject body = new JSONObject();
            body.put("phone",    phone);
            body.put("phone_no", phone);
            body.put("email",    email);
            body.put("code",     otp);

            NetworkSingleton.getInstance().getApiService()
                .verifyOtp(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        setLoading(false);
                        handleVerifyResponse(response.body());
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        setLoading(false);
                        Toast.makeText(OtpVerifyActivity.this, R.string.error_network, Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            setLoading(false);
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void resendOtp() {
        binding.tvResend.setEnabled(false);
        try {
            JSONObject body = new JSONObject();
            body.put("phone",    phone);
            body.put("phone_no", phone);

            NetworkSingleton.getInstance().getApiService()
                .sendOtp(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        Toast.makeText(OtpVerifyActivity.this, "OTP resent", Toast.LENGTH_SHORT).show();
                        startResendTimer();
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        binding.tvResend.setEnabled(true);
                        Toast.makeText(OtpVerifyActivity.this, R.string.error_network, Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            binding.tvResend.setEnabled(true);
        }
    }

    private void handleVerifyResponse(String rawResponse) {
        if (rawResponse == null) { Toast.makeText(this, R.string.error_server, Toast.LENGTH_SHORT).show(); return; }
        try {
            JSONObject json = new JSONObject(rawResponse);
            String code = json.optString("code", "400");
            if ("200".equals(code)) {
                Intent intent = new Intent(this, HomeActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish();
            } else {
                Toast.makeText(this, "Invalid or expired OTP", Toast.LENGTH_SHORT).show();
            }
        } catch (JSONException e) {
            Toast.makeText(this, R.string.error_server, Toast.LENGTH_SHORT).show();
        }
    }

    private void startResendTimer() {
        if (resendTimer != null) resendTimer.cancel();
        binding.tvResend.setEnabled(false);
        resendTimer = new CountDownTimer(RESEND_COOLDOWN_MS, 1000) {
            @Override public void onTick(long ms) {
                binding.tvResend.setText(getString(R.string.resend_in_seconds, ms / 1000));
            }
            @Override public void onFinish() {
                binding.tvResend.setText(R.string.resend_otp);
                binding.tvResend.setEnabled(true);
            }
        }.start();
    }

    private void setLoading(boolean loading) {
        binding.btnVerify.setEnabled(!loading);
        binding.progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (resendTimer != null) resendTimer.cancel();
    }
}
