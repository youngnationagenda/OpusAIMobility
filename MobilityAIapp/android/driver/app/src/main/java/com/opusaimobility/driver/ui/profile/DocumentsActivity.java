package com.opusaimobility.driver.ui.profile;

import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.opusaimobility.driver.Constants;
import com.opusaimobility.driver.NetworkSingleton;
import com.opusaimobility.driver.databinding.ActivityDocumentsBinding;

import org.json.JSONException;
import org.json.JSONObject;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * DocumentsActivity — Driver KYC documents management.
 *
 * Documents uploaded to S3: uploads/documents/{userId}/{uuid}.jpg
 * S3 pre-signed URL via: POST /api/upload { folder: "document", entity_id: userId }
 * Document status tracked in DynamoDB gograb-user-documents
 */
public class DocumentsActivity extends AppCompatActivity {

    private static final String TAG = Constants.TAG + "Documents";
    private ActivityDocumentsBinding binding;
    private String userId;
    private String activeDocType;

    private final ActivityResultLauncher<String> docPickerLauncher =
        registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (uri != null && activeDocType != null) {
                uploadDocument(uri, activeDocType);
            }
        });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityDocumentsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        userId = prefs.getString(Constants.KEY_USER_ID, "");

        binding.ivBack.setOnClickListener(v -> finish());

        binding.btnUploadLicense.setOnClickListener(v -> {
            activeDocType = "driver_license";
            docPickerLauncher.launch("image/*");
        });
        binding.btnUploadId.setOnClickListener(v -> {
            activeDocType = "national_id";
            docPickerLauncher.launch("image/*");
        });
        binding.btnUploadVehicleReg.setOnClickListener(v -> {
            activeDocType = "vehicle_registration";
            docPickerLauncher.launch("image/*");
        });
        binding.btnUploadInsurance.setOnClickListener(v -> {
            activeDocType = "insurance";
            docPickerLauncher.launch("image/*");
        });

        loadDocuments();
    }

    private void loadDocuments() {
        try {
            JSONObject body = new JSONObject();
            body.put("user_id", userId);

            NetworkSingleton.getInstance().getApiService()
                .getDocuments(new Gson().fromJson(body.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            Log.d(TAG, "Documents loaded: " + json.optString("code"));
                            // TODO: Update UI document status chips
                        } catch (JSONException e) {
                            Log.e(TAG, "Parse error: " + e.getMessage());
                        }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        Log.w(TAG, "Load documents failed: " + t.getMessage());
                    }
                });
        } catch (JSONException e) {
            Log.e(TAG, "JSON error: " + e.getMessage());
        }
    }

    private void uploadDocument(Uri uri, String docType) {
        binding.progressBar.setVisibility(View.VISIBLE);
        try {
            JSONObject uploadRequest = new JSONObject();
            uploadRequest.put("folder",    "document");
            uploadRequest.put("entity_id", userId);
            uploadRequest.put("mime_type", "image/jpeg");
            uploadRequest.put("doc_type",  docType);

            NetworkSingleton.getInstance().getApiService()
                .requestUploadUrl(new Gson().fromJson(uploadRequest.toString(), Object.class))
                .enqueue(new Callback<String>() {
                    @Override
                    public void onResponse(Call<String> call, Response<String> response) {
                        binding.progressBar.setVisibility(View.GONE);
                        if (response.body() == null) return;
                        try {
                            JSONObject json = new JSONObject(response.body());
                            if ("200".equals(json.optString("code"))) {
                                JSONObject result  = json.getJSONObject("msg");
                                String uploadUrl   = result.getString("uploadUrl");
                                String publicUrl   = result.getString("publicUrl");
                                putFileToS3(uri, uploadUrl, publicUrl, docType);
                            }
                        } catch (JSONException e) {
                            Log.e(TAG, "Parse error: " + e.getMessage());
                        }
                    }
                    @Override public void onFailure(Call<String> call, Throwable t) {
                        binding.progressBar.setVisibility(View.GONE);
                        Toast.makeText(DocumentsActivity.this, "Upload init failed", Toast.LENGTH_SHORT).show();
                    }
                });
        } catch (JSONException e) {
            binding.progressBar.setVisibility(View.GONE);
        }
    }

    private void putFileToS3(Uri localUri, String s3UploadUrl, String publicUrl, String docType) {
        new Thread(() -> {
            try {
                java.io.InputStream is = getContentResolver().openInputStream(localUri);
                if (is == null) return;
                byte[] bytes = is.readAllBytes();
                is.close();

                java.net.URL url = new java.net.URL(s3UploadUrl);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setDoOutput(true);
                conn.setRequestMethod("PUT");
                conn.setRequestProperty("Content-Type", "image/jpeg");
                conn.getOutputStream().write(bytes);
                int code = conn.getResponseCode();
                conn.disconnect();

                if (code == 200 || code == 204) {
                    runOnUiThread(() -> {
                        Toast.makeText(this, docType.replace("_", " ") + " uploaded", Toast.LENGTH_SHORT).show();
                        loadDocuments();
                    });
                }
            } catch (Exception e) {
                Log.e(TAG, "S3 upload error: " + e.getMessage());
                runOnUiThread(() ->
                    Toast.makeText(this, "Upload failed: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }
        }).start();
    }
}
