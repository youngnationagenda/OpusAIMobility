package com.opusaimobility.driver.ui.profile;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.bumptech.glide.Glide;
import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.R;
import com.opusaimobility.driver.databinding.ActivityProfileBinding;
import com.opusaimobility.driver.ui.settings.SettingsActivity;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * ProfileActivity — Driver profile management.
 *
 * Features:
 *  - View/edit name, phone, email
 *  - Profile photo upload (S3 pre-signed URL via POST /api/upload)
 *  - View vehicle details
 *  - Navigate to Documents, Earnings, Settings
 */
public class ProfileActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "Profile";
    private ActivityProfileBinding binding;
    private String userId;

    private final ActivityResultLauncher<String> photoPickerLauncher =
        registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (uri != null) uploadProfilePhoto(uri);
        });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityProfileBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId = prefs.getString(Constants.KEY_USER_ID, "");

        binding.ivBack.setOnClickListener(v -> finish());
        binding.ivProfilePhoto.setOnClickListener(v ->
            photoPickerLauncher.launch("image/*"));
        binding.btnSave.setOnClickListener(v -> saveProfile());
        binding.btnDocuments.setOnClickListener(v ->
            startActivity(new Intent(this, DocumentsActivity.class)));
        binding.btnEarnings.setOnClickListener(v ->
            startActivity(new Intent(this, EarningsActivity.class)));
        binding.btnSettings.setOnClickListener(v ->
            startActivity(new Intent(this, SettingsActivity.class)));

        loadProfile();
    }

    private void loadProfile() {
        binding.progressBar.setVisibility(View.VISIBLE);
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);

            NetworkSingleton.getInstance().getApiService()
                .getProfile(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        binding.progressBar.setVisibility(View.GONE);
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            JSONObject msg  = json.optJSONObject("msg");
                            JSONObject user = msg != null ? msg.optJSONObject("User") : null;
                            if (user == null && msg != null) user = msg;
                            if (user != null) populateUI(user);
                        } catch (JSONException e) {
                            Log.e(TAG, "Parse error: " + e.getMessage());
                        }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        binding.progressBar.setVisibility(View.GONE);
                    }
                });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
        }
    }

    private void populateUI(JSONObject user) {
        try {
            binding.etFirstName.setText(user.optString("first_name", ""));
            binding.etLastName.setText( user.optString("last_name",  ""));
            binding.etPhone.setText(    user.optString("phone",      ""));
            binding.etEmail.setText(    user.optString("email",      ""));
            binding.tvRating.setText(   user.optString("rating",     "5.0") + " ★");
            binding.tvTotalTrips.setText(user.optString("total_trips","0") + " trips");

            String imageUrl = user.optString("image", "");
            if (!imageUrl.isEmpty()) {
                Glide.with(this).load(imageUrl).circleCrop()
                    .placeholder(R.drawable.ic_driver_avatar).into(binding.ivProfilePhoto);
            }
        } catch (Exception e) {
            Log.e(TAG, "populateUI error: " + e.getMessage());
        }
    }

    private void saveProfile() {
        String firstName = binding.etFirstName.getText().toString().trim();
        String lastName  = binding.etLastName.getText().toString().trim();
        String phone     = binding.etPhone.getText().toString().trim();

        binding.btnSave.setEnabled(false);
        try {
            JSONObject body = new JSONObject();
            body.put("user_id",    userId);
            body.put("first_name", firstName);
            body.put("last_name",  lastName);
            body.put("phone",      phone);

            NetworkSingleton.getInstance().getApiService()
                .updateProfile(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        binding.btnSave.setEnabled(true);
                        Toast.makeText(ProfileActivity.this, "Profile updated", Toast.LENGTH_SHORT).show();
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        binding.btnSave.setEnabled(true);
                        Toast.makeText(ProfileActivity.this, "Update failed", Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            binding.btnSave.setEnabled(true);
        }
    }

    private void uploadProfilePhoto(Uri uri) {
        // 1. Request S3 pre-signed URL from Lambda
        try {
            JSONObject uploadRequest = new JSONObject();
            uploadRequest.put("folder",    "user");
            uploadRequest.put("entity_id", userId);
            uploadRequest.put("mime_type", "image/jpeg");

            NetworkSingleton.getInstance().getApiService()
                .requestUploadUrl(new Gson().fromJson(uploadRequest.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            if ("200".equals(json.optString("code"))) {
                                JSONObject result = json.getJSONObject("msg");
                                String uploadUrl = result.getString("uploadUrl");
                                String publicUrl = result.getString("publicUrl");
                                // 2. PUT file directly to S3 pre-signed URL
                                uploadFileToS3(uri, uploadUrl, publicUrl);
                            }
                        } catch (JSONException e) {
                            Log.e(TAG, "Upload URL parse error: " + e.getMessage());
                        }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Toast.makeText(ProfileActivity.this, "Upload init failed", Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void uploadFileToS3(Uri localUri, String s3UploadUrl, String publicUrl) {
        // Execute S3 PUT on background thread
        new Thread(() -> {
            try {
                java.io.InputStream inputStream = getContentResolver().openInputStream(localUri);
                if (inputStream == null) return;
                byte[] bytes = inputStream.readAllBytes();
                inputStream.close();

                java.net.URL url = new java.net.URL(s3UploadUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setDoOutput(true);
                conn.setRequestMethod("PUT");
                conn.setRequestProperty("Content-Type", "image/jpeg");
                conn.getOutputStream().write(bytes);
                int responseCode = conn.getResponseCode();
                conn.disconnect();

                if (responseCode == 200 || responseCode == 204) {
                    // 3. Save publicUrl to profile
                    runOnUiThread(() -> {
                        Glide.with(this).load(localUri).circleCrop()
                            .placeholder(R.drawable.ic_driver_avatar).into(binding.ivProfilePhoto);
                        saveImageUrl(publicUrl);
                        Toast.makeText(this, "Photo uploaded", Toast.LENGTH_SHORT).show();
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "S3 upload error: " + e.getMessage());
                runOnUiThread(() ->
                    Toast.makeText(this, "Upload failed", Toast.LENGTH_SHORT).show());
            }
        }).start();
    }

    private void saveImageUrl(String imageUrl) {
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);
            body.put("image",   imageUrl);

            NetworkSingleton.getInstance().getApiService()
                .updateProfile(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override public void onResponse(Call<String> call, Response<String> response) {
                        Log.d(TAG, "Image URL saved to DynamoDB");
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {}
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error saving image: " + e.getMessage());
        }
    }
}
