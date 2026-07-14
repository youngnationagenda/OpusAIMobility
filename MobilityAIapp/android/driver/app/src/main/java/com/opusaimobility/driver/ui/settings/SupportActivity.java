package com.opusaimobility.driver.ui.settings;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.databinding.ActivitySupportBinding;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SupportActivity extends AppCompatActivity {

    private ActivitySupportBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySupportBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        binding.ivBack.setOnClickListener(v -> finish());

        binding.btnCallSupport.setOnClickListener(v ->
            startActivity(new Intent(Intent.ACTION_DIAL,
                Uri.parse("tel:" + Constants.SUPPORT_PHONE))));

        binding.btnEmailSupport.setOnClickListener(v ->
            startActivity(new Intent(Intent.ACTION_SENDTO,
                Uri.parse("mailto:" + Constants.SUPPORT_EMAIL))));

        binding.btnSendMessage.setOnClickListener(v -> sendSupportMessage());
    }

    private void sendSupportMessage() {
        String message = binding.etMessage.getText().toString().trim();
        if (message.isEmpty()) { binding.etMessage.setError("Enter message"); return; }

        try {
            JSONObject body = new JSONObject();
            body.put("to",      Constants.SUPPORT_EMAIL);
            body.put("name",    "Driver Support");
            body.put("subject", "Driver App Support Request");
            body.put("message", "<p>" + message + "</p><p>App: Driver v"
                + com.opusaimobility.driver.BuildConfig.VERSION_NAME + "</p>");

            NetworkSingleton.getInstance().getApiService()
                .sendNotification(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        Toast.makeText(SupportActivity.this,
                            "Message sent to support team", Toast.LENGTH_LONG).show();
                        binding.etMessage.setText("");
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Toast.makeText(SupportActivity.this,
                            "Failed to send message", Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            Toast.makeText(this, "Error", Toast.LENGTH_SHORT).show();
        }
    }
}
