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
import com.opusaimobility.driver.databinding.ActivityRegisterBinding;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * RegisterActivity — New driver registration.
 *
 * Posts to: POST /api/registerUser
 * Body: { first_name, last_name, email, phone, password, role: "driver" }
 *
 * On success: saves JWT → navigates to OTP verification.
 */
public class RegisterActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "Register";
    private ActivityRegisterBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityRegisterBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.btnRegister.setOnClickListener(v -> attemptRegister());
        binding.tvLogin.setOnClickListener(v -> finish());
    }

    private void attemptRegister() {
        String firstName = binding.etFirstName.getText().toString().trim();
        String lastName  = binding.etLastName.getText().toString().trim();
        String email     = binding.etEmail.getText().toString().trim().toLowerCase();
        String phone     = binding.etPhone.getText().toString().trim();
        String password  = binding.etPassword.getText().toString().trim();
        String confirm   = binding.etConfirmPassword.getText().toString().trim();

        if (TextUtils.isEmpty(firstName)) { binding.etFirstName.setError("Required"); return; }
        if (TextUtils.isEmpty(email))     { binding.etEmail.setError("Required"); return; }
        if (TextUtils.isEmpty(phone))     { binding.etPhone.setError("Required"); return; }
        if (TextUtils.isEmpty(password))  { binding.etPassword.setError("Required"); return; }
        if (!password.equals(confirm))    { binding.etConfirmPassword.setError("Passwords don't match"); return; }
        if (password.length() < 8)        { binding.etPassword.setError("Min 8 characters"); return; }

        setLoading(true);

        try {
            JSONObject body = new JSONObject();
            body.put("first_name", firstName);
            body.put("last_name",  lastName);
            body.put("email",      email);
            body.put("phone",      phone);
            body.put("password",   password);
            body.put("role",       Constants.ROLE_DRIVER);
            body.put("country_id", Constants.DEFAULT_COUNTRY_ID);

            NetworkSingleton.getInstance().getApiService()
                .register(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        setLoading(false);
                        handleRegisterResponse(response.body(), email, phone);
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        setLoading(false);
                        Toast.makeText(RegisterActivity.this, R.string.error_network, Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            setLoading(false);
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void handleRegisterResponse(String rawResponse, String email, String phone) {
        if (rawResponse == null) { Toast.makeText(this, R.string.error_server, Toast.LENGTH_SHORT).show(); return; }
        try {
            JSONObject json = new JSONObject(rawResponse);
            String code = json.optString("code", "400");
            if ("200".equals(code)) {
                JSONObject msg     = json.getJSONObject("msg");
                JSONObject tokens  = msg.optJSONObject("tokens");
                JSONObject userObj = msg.optJSONObject("User");
                String idToken     = tokens != null ? tokens.optString("idToken","") : "";
                String userId      = userObj != null ? userObj.optString("userId", userObj.optString("id","")) : "";

                getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE)
                    .edit()
                    .putString(Constants.KEY_TOKEN,   idToken)
                    .putString(Constants.KEY_USER_ID, userId)
                    .putString(Constants.KEY_USER_DATA, rawResponse)
                    .apply();

                // Go to OTP verification
                Intent intent = new Intent(this, OtpVerifyActivity.class);
                intent.putExtra("phone", phone);
                intent.putExtra("email", email);
                startActivity(intent);
                finish();
            } else {
                Toast.makeText(this, json.optString("msg", "Registration failed"), Toast.LENGTH_LONG).show();
            }
        } catch (JSONException e) {
            Toast.makeText(this, R.string.error_server, Toast.LENGTH_SHORT).show();
        }
    }

    private void setLoading(boolean loading) {
        binding.btnRegister.setEnabled(!loading);
        binding.progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
    }
}
