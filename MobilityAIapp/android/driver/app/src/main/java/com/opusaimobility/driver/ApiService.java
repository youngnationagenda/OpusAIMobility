package com.opusaimobility.driver;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Query;

/**
 * ApiService — Retrofit interface for all terraaimobility-api endpoints
 *
 * Base URL: Constants.API_URL  (https://opusaimobility.yna.co.ke/api/)
 *
 * All endpoints accept JSON body via POST.
 * All responses are String (parsed with Gson in repositories).
 */
public interface ApiService {

    // ── Auth ──────────────────────────────────────────────────────────────────
    @POST("login")
    Call<String> login(@Body Object body);

    @POST("registerUser")
    Call<String> register(@Body Object body);

    @POST("sendOtp")
    Call<String> sendOtp(@Body Object body);

    @POST("verifyOtp")
    Call<String> verifyOtp(@Body Object body);

    @POST("forgotPassword")
    Call<String> forgotPassword(@Body Object body);

    @POST("changePassword")
    Call<String> changePassword(@Body Object body);

    @POST("refreshToken")
    Call<String> refreshToken(@Body Object body);

    @POST("logout")
    Call<String> logout(@Body Object body);

    // ── Profile ───────────────────────────────────────────────────────────────
    @POST("getUserProfile")
    Call<String> getProfile(@Body Object body);

    @POST("editProfile")
    Call<String> updateProfile(@Body Object body);

    @POST("updateFcmToken")
    Call<String> updateFcmToken(@Body Object body);

    @POST("addDeviceData")
    Call<String> addDeviceData(@Body Object body);

    // ── Driver specific ───────────────────────────────────────────────────────
    @POST("getNearbyDrivers")
    Call<String> getNearbyDrivers(@Body Object body);

    @POST("trackDriver")
    Call<String> trackDriver(@Body Object body);

    @POST("showUserDocuments")
    Call<String> getDocuments(@Body Object body);

    @POST("verifyDocument")
    Call<String> updateDocumentStatus(@Body Object body);

    // ── Rides ─────────────────────────────────────────────────────────────────
    @POST("getRideTypes")
    Call<String> getRideTypes(@Body Object body);

    @POST("getRideHistory")
    Call<String> getRideHistory(@Body Object body);

    @POST("getRideDetails")
    Call<String> getRideDetails(@Body Object body);

    @POST("cancelRide")
    Call<String> cancelRide(@Body Object body);

    @POST("rateRide")
    Call<String> rateRide(@Body Object body);

    @POST("estimateFare")
    Call<String> estimateFare(@Body Object body);

    // ── Food delivery ─────────────────────────────────────────────────────────
    @POST("getFoodOrders")
    Call<String> getFoodOrders(@Body Object body);

    @POST("showFoodDeliveryOrders")
    Call<String> getDeliveryOrders(@Body Object body);

    @POST("updateOrderStatus")
    Call<String> updateFoodOrderStatus(@Body Object body);

    @POST("trackFoodOrder")
    Call<String> trackFoodOrder(@Body Object body);

    // ── Parcel delivery ───────────────────────────────────────────────────────
    @POST("showParcelOrders")
    Call<String> getParcelOrders(@Body Object body);

    @POST("parcel_changeStatus")
    Call<String> updateParcelStatus(@Body Object body);

    @POST("trackParcelOrder")
    Call<String> trackParcelOrder(@Body Object body);

    @POST("getGoodTypes")
    Call<String> getGoodTypes(@Body Object body);

    @POST("getPackageSizes")
    Call<String> getPackageSizes(@Body Object body);

    // ── Payments / Wallet ─────────────────────────────────────────────────────
    @POST("getWalletBalance")
    Call<String> getWalletBalance(@Body Object body);

    @POST("getPaymentMethods")
    Call<String> getPaymentMethods(@Body Object body);

    @POST("showWithdrawRequests")
    Call<String> getWithdrawHistory(@Body Object body);

    // ── Notifications ─────────────────────────────────────────────────────────
    @POST("getNotifications")
    Call<String> getNotifications(@Body Object body);

    @POST("sendMessageNotification")
    Call<String> sendNotification(@Body Object body);

    // ── Config & settings ─────────────────────────────────────────────────────
    @POST("getSettings")
    Call<String> getSettings(@Body Object body);

    @POST("showCountries")
    Call<String> getCountries(@Body Object body);

    @POST("getServiceCharges")
    Call<String> getServiceCharges(@Body Object body);

    @POST("getReportReasons")
    Call<String> getReportReasons(@Body Object body);

    @POST("getHtmlPage")
    Call<String> getHtmlPage(@Body Object body);

    // ── File upload (S3 pre-signed URL) ──────────────────────────────────────
    @POST("upload")
    Call<String> requestUploadUrl(@Body Object body);

    // ── Health check ─────────────────────────────────────────────────────────
    @GET("health")
    Call<String> health();
}
