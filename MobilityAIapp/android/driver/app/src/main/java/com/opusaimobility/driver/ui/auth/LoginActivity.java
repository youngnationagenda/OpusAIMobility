package com.opusaimobility.driver.ui.auth;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityLoginBinding;
import com.opusaimobility.driver.model.ApiResponse;
import com.opusaimobility.driver.model.UserModel;
import com.opusaimobility.driver.ui.home.HomeActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * LoginActivity — Driver login screen.
 *
 * Posts to: POST /api/login
 * Body: { email, password, role: "driver", device_token }
 *
 * On success: saves JWT to SharedPreferences, starts HomeActivity.
 * On 201: shows "Invalid credentials".
 */
public class LoginActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "Login";
    private ActivityLoginBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityLoginBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.btnLogin.setOnClickListener(v -> attemptLogin());
        binding.tvForgotPassword.setOnClickListener(v ->
            startActivity(new Intent(this, ForgotPasswordActivity.class)));
        binding.tvRegister.setOnClickListener(v ->
            startActivity(new Intent(this, RegisterActivity.class)));
    }

    private void attemptLogin() {
        String email    = binding.etEmail.getText().toString().trim().toLowerCase();
        String password = binding.etPassword.getText().toString().trim();

        if (TextUtils.isEmpty(email)) {
            binding.etEmail.setError(getString(R.string.error_email_required));
            return;
        }
        if (TextUtils.isEmpty(password)) {
            binding.etPassword.setError(getString(R.string.error_password_required));
            return;
        }

        setLoading(true);

        // Get stored FCM token
        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        String fcmToken = prefs.getString(Constants.KEY_FCM_TOKEN, "");

        try {
            JSONObject body = new JSONObject();
            body.put("email", email);
            body.put("password", password);
            body.put("role", Constants.ROLE_DRIVER);
            body.put("device_token", fcmToken);

            NetworkSingleton.getInstance().getApiService()
                .login(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        setLoading(false);
                        handleLoginResponse(response.body());
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        setLoading(false);
                        Log.e(TAG, "Login network error: " + t.getMessage());
                        Toast.makeText(LoginActivity.this,
                            R.string.error_network, Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            setLoading(false);
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void handleLoginResponse(String rawResponse) {
        if (rawResponse == null) {
            Toast.makeText(this, R.string.error_server, Toast.LENGTH_SHORT).show();
            return;
        }
        try {
            JSONObject json = new JSONObject(rawResponse);
            String code = json.optString("code", "400");

            if ("200".equals(code)) {
                JSONObject msg = json.getJSONObject("msg");

                // Extract tokens
                JSONObject tokens    = msg.optJSONObject("tokens");
                JSONObject userObj   = msg.optJSONObject("User");
                String idToken       = tokens != null ? tokens.optString("idToken", "") : msg.optString("idToken", "");
                String accessToken   = tokens != null ? tokens.optString("accessToken", "") : "";
                String refreshToken  = tokens != null ? tokens.optString("refreshToken", "") : "";

                // Validate role — driver apps only accept driver/rider roles
                String role = userObj != null ? userObj.optString("role", "") : "";
                if (!Constants.ROLE_DRIVER.equals(role) && !Constants.ROLE_RIDER.equals(role)) {
                    Toast.makeText(this, R.string.error_not_driver, Toast.LENGTH_LONG).show();
                    return;
                }

                // Persist session
                String userId = userObj != null ? userObj.optString("userId", userObj.optString("id", "")) : "";
                getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE)
                    .edit()
                    .putString(Constants.KEY_TOKEN,         idToken)
                    .putString(Constants.KEY_ACCESS_TOKEN,  accessToken)
                    .putString(Constants.KEY_REFRESH_TOKEN, refreshToken)
                    .putString(Constants.KEY_USER_ID,       userId)
                    .putString(Constants.KEY_USER_DATA,     rawResponse)
                    .apply();

                NetworkSingleton.reset();

                Intent intent = new Intent(this, HomeActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                startActivity(intent);
                finish();

            } else {
                String message = json.optString("msg", getString(R.string.error_invalid_credentials));
                Toast.makeText(this, message, Toast.LENGTH_LONG).show();
            }
        } catch (JSONException e) {
            Log.e(TAG, "JSON parse error: " + e.getMessage());
            Toast.makeText(this, R.string.error_server, Toast.LENGTH_SHORT).show();
        }
    }

    private void setLoading(boolean loading) {
        binding.btnLogin.setEnabled(!loading);
        binding.progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }
}
