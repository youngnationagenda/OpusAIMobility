package com.terraai.aimobility.activitiesandfragment;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import com.terraai.aimobility.api.ApiInterface;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.AppCompatLocaleActivity;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.R;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.Variables;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

import cat.ereza.customactivityoncrash.CustomActivityOnCrash;
import cat.ereza.customactivityoncrash.config.CaocConfig;

public class CustomErrorActivity extends AppCompatLocaleActivity implements View.OnClickListener {

    String pacakgeName;
    TextView errorDetailsText;
    ApiInterface apiInterface;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        setContentView(R.layout.activity_custom_error);
        //apiInterface = ApiClient.getRetrofitReport().create(ApiInterface.class);
        pacakgeName = getApplicationContext().getPackageName();

        RelativeLayout restartButton = findViewById(R.id.restart_button);
        RelativeLayout sendReposrt = findViewById(R.id.send_reposrt);

        if (pacakgeName.contains("qboxus")) {
            sendReposrt.setVisibility(View.VISIBLE);
        } else {
            sendReposrt.setVisibility(View.GONE);
        }

        final CaocConfig config = CustomActivityOnCrash.getConfigFromIntent(getIntent());

        if (config == null) {
            finish();
            return;
        }

        if (config.isShowRestartButton() && config.getRestartActivityClass() != null) {
            restartButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    startActivity(new Intent(CustomErrorActivity.this,SplashActivity.class));
                    finishAffinity();
                }
            });
        } else {
            restartButton.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    startActivity(new Intent(CustomErrorActivity.this,SplashActivity.class));
                    finishAffinity();
                }
            });
        }


        findViewById(R.id.detail_button).setOnClickListener(this::onClick);

        sendReposrt.setOnClickListener(this::onClick);
    }


    @Override
    public void onClick(View v) {

        switch (v.getId()) {
            case R.id.send_reposrt:
                //callApiForSendReport();
                break;

            case R.id.detail_button:
                showAlert();
                break;
        }
    }


    public void showAlert() {
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setTitle(R.string.customactivityoncrash_error_activity_error_details_title)
                .setMessage(CustomActivityOnCrash.getAllErrorDetailsFromIntent(CustomErrorActivity.this, getIntent()))
                .setPositiveButton(R.string.customactivityoncrash_error_activity_error_details_close, null)
                .setNeutralButton(R.string.customactivityoncrash_error_activity_error_details_copy,
                        (dialog1, which) -> copyErrorToClipboard())
                .show();
    }


    private void copyErrorToClipboard() {
        String errorInformation = CustomActivityOnCrash.getAllErrorDetailsFromIntent(CustomErrorActivity.this, getIntent());

        ClipboardManager clipboard = (ClipboardManager) getSystemService(CLIPBOARD_SERVICE);

        //Are there any devices without clipboard...?
        if (clipboard != null) {
            ClipData clip = ClipData.newPlainText(getString(R.string.customactivityoncrash_error_activity_error_details_clipboard_label), errorInformation);
            clipboard.setPrimaryClip(clip);
            Toast.makeText(CustomErrorActivity.this, R.string.customactivityoncrash_error_activity_error_details_copied, Toast.LENGTH_SHORT).show();
        }
    }


    private void callApiForSendReport() {
        JSONObject jsonObject = new JSONObject();
        try {
            jsonObject.put("bundle_id", pacakgeName);
            jsonObject.put("crash", CustomActivityOnCrash.getAllErrorDetailsFromIntent(CustomErrorActivity.this, getIntent()));
        } catch (JSONException e) {
            e.printStackTrace();
        }

        Functions.showLoader(this,false,false);
        RetrofitRequest.JsonPostRequest(this,
                jsonObject.toString(),
                Singleton.getApiCall(CustomErrorActivity.this).addCrashReport(jsonObject.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            Functions.cancelLoader();
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });
    }


}