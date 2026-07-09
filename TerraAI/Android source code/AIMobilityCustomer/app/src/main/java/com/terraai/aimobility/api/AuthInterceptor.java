package com.terraai.aimobility.api;

import android.content.Context;
import android.util.Log;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.aws.CognitoAuthManager;

import java.io.IOException;

import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * OkHttp interceptor that attaches api-key and Cognito JWT token to every request.
 * On 401 response, attempts token refresh and retries once.
 */
public class AuthInterceptor implements Interceptor {

    private static final String TAG = "aimobility.AuthInterceptor";
    private final Context context;

    public AuthInterceptor(Context context) {
        this.context = context.getApplicationContext();
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        Request.Builder builder = original.newBuilder()
                .header("api-key", Constants.API_KEY)
                .header("Content-Type", "application/json");

        String token = CognitoAuthManager.getIdToken(context);
        if (token != null && !token.isEmpty()) {
            builder.header("Authorization", "Bearer " + token);
        }

        Response response = chain.proceed(builder.build());

        if (response.code() == 401 && token != null) {
            Log.d(TAG, "Got 401, attempting token refresh...");
            response.close();

            String refreshed = CognitoAuthManager.refreshAndGetToken(context);
            if (refreshed != null && !refreshed.isEmpty()) {
                Request retry = original.newBuilder()
                        .header("api-key", Constants.API_KEY)
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + refreshed)
                        .build();
                return chain.proceed(retry);
            }
        }

        return response;
    }
}
