package com.opusaimobility.driver.ui.auth;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityForgotPasswordBinding;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ForgotPasswordActivity extends AppCompatActivity {

    private ActivityForgotPasswordBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityForgotPasswordBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.btnSendReset.setOnClickListener(v -> sendReset());
        binding.ivBack.setOnClickListener(v -> finish());
    }

    private void sendReset() {
        String email = binding.etEmail.getText().toString().trim().toLowerCase();
        if (TextUtils.isEmpty(email)) { binding.etEmail.setError("Email required"); return; }

        binding.btnSendReset.setEnabled(false);
        binding.progressBar.setVisibility(View.VISIBLE);

        try {
            JSONObject body = new JSONObject();
            body.put("email", email);

            NetworkSingleton.getInstance().getApiService()
                .forgotPassword(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        binding.progressBar.setVisibility(View.GONE);
                        Toast.makeText(ForgotPasswordActivity.this,
                            "Password reset email sent to " + email, Toast.LENGTH_LONG).show();
                        finish();
                    }
                    @Override
                    public void onFailure(Call<String> call, Throwable t) {
                        binding.progressBar.setVisibility(View.GONE);
                        binding.btnSendReset.setEnabled(true);
                        Toast.makeText(ForgotPasswordActivity.this, R.string.error_network, Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
            binding.btnSendReset.setEnabled(true);
        }
    }
}
