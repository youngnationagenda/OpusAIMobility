package com.yna.opusaimobilityapp.api;

import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Headers;
import retrofit2.http.POST;

public interface ApiInterface {


    @GET("https://api.ipify.org/?format=json")
    Call<String> getIp();


    @POST("addCrashReport")
    Call<String> addCrashReport(@Body String body);


    @POST("showCurrency")
    Call<String> showCurrency(@Body String body);

    @POST("addDeviceData")
    Call<String> addDeviceData(@Body String body);

    ////USER SIGNUP
    @Headers("Content-Type: application/json")
    @POST("verifyPhoneNo")
    Call<String> verifyPhoneNo(@Body String body);


    ////registerUser
    @Headers("Content-Type: application/json")
    @POST("registerUser")
    Call<String> registerUser(@Body String body);

    ////USER LOGIN
    @Headers("Content-Type: application/json")
    @POST("login")
    Call<String> login(@Body String body);


    /////forgotPassword
    @Headers("Content-Type: application/json")
    @POST("forgotPassword")
    Call<String> forgotPassword(@Body String body);


    /////verifyforgotPasswordCode
    @Headers("Content-Type: application/json")
    @POST("verifyForgotPasswordCode")
    Call<String> verifyforgotPasswordCode(@Body String body);

    /////changePasswordForgot
    @Headers("Content-Type: application/json")
    @POST("changePasswordForgot")
    Call<String> changePasswordForgot(@Body String body);

    /////changeEmailAddress
    @Headers("Content-Type: application/json")
    @POST("changeEmailAddress")
    Call<String> changeEmailAddress(@Body String body);


    /////verifyChangeEmailCode
    @Headers("Content-Type: application/json")
    @POST("verifyChangeEmailCode")
    Call<String> verifyChangeEmailCode(@Body String body);


    //changePassword
    @Headers("Content-Type: application/json")
    @POST("changePassword")
    Call<String> changePassword(@Body String body);

    /////Logout
    @Headers("Content-Type: application/json")
    @POST("logout")
    Call<String> logout(@Body String body);


    /////verifyCoupon
    @Headers("Content-Type: application/json")
    @POST("verifyCoupon")
    Call<String> verifyCoupon(@Body String body);


    /////showUserPlaces
    @Headers("Content-Type: application/json")
    @POST("showUserPlaces")
    Call<String> showUserPlaces(@Body String body);


    /////addUserPlace
    @Headers("Content-Type: application/json")
    @POST("addUserPlace")
    Call<String> addUserPlace(@Body String body);

    /////showRideTypes
    @Headers("Content-Type: application/json")
    @POST("showRideTypes")
    Call<String> showRideTypes(@Body String body);



    @Headers("Content-Type: application/json")
    @POST("showRideTypesParcelOrder")
    Call<String> showRideTypesParcelOrder(@Body String body);

    /////showRideTypes
    @Headers("Content-Type: application/json")
    @POST("showUserNotifications")
    Call<String> showUserNotifications(@Body String body);


    /////deleteUserPlace
    @Headers("Content-Type: application/json")
    @POST("deleteUserPlace")
    Call<String> deleteUserPlace(@Body String body);


    /////contactUs
    @Headers("Content-Type: application/json")
    @POST("contactUs")
    Call<String> contactUs(@Body String body);


    /////showCountries
    @Headers("Content-Type: application/json")
    @POST("showCountries")
    Call<String> showCountries(@Body String body);


    /////requestVehicle
    @Headers("Content-Type: application/json")
    @POST("requestVehicle")
    Call<String> requestVehicle(@Body String body);


    /////showUserCards
    @Headers("Content-Type: application/json")
    @POST("showUserCards")
    Call<String> showUserCards(@Body String body);

    /////addPaymentCard
    @Headers("Content-Type: application/json")
    @POST("addPaymentCard")
    Call<String> addPaymentCard(@Body String body);


    /////deletePaymentCard
    @Headers("Content-Type: application/json")
    @POST("deletePaymentCard")
    Call<String> deletePaymentCard(@Body String body);


    /////showActiveRequest
    @Headers("Content-Type: application/json")
    @POST("showActiveRequest")
    Call<String> showActiveRequest(@Body String body);


    /////rideCancelled
    @Headers("Content-Type: application/json")
    @POST("rideCancelled")
    Call<String> rideCancelled(@Body String body);


    ////editProfile
    @Headers("Content-Type: application/json")
    @POST("editProfile")
    Call<String> editProfile(@Body String body);


    ////changePhoneNo
    @Headers("Content-Type: application/json")
    @POST("changePhoneNo")
    Call<String> changePhoneNo(@Body String body);


    ////giveRatingsToDriver
    @Headers("Content-Type: application/json")
    @POST("giveRatingsToDriver")
    Call<String> giveRatingsToDriver(@Body String body);


    ////showTripsHistory
    @Headers("Content-Type: application/json")
    @POST("showTripsHistory")
    Call<String> showTripsHistory(@Body String body);


    ////showScheduleTrips
    @Headers("Content-Type: application/json")
    @POST("showScheduleTrips")
    Call<String> showScheduleTrips(@Body String body);

    ////addRecentLocation
    @Headers("Content-Type: application/json")
    @POST("addRecentLocation")
    Call<String> addRecentLocation(@Body String body);

    ////showRecentLocations
    @Headers("Content-Type: application/json")
    @POST("showRecentLocations")
    Call<String> showRecentLocations(@Body String body);

    ////deleteRecentLocation
    @Headers("Content-Type: application/json")
    @POST("deleteRecentLocation")
    Call<String> deleteRecentLocation(@Body String body);


    ////changeDropoffLocation
    @Headers("Content-Type: application/json")
    @POST("changeDropoffLocation")
    Call<String> changeDropoffLocation(@Body String body);


    ///showRequestDetails
    @Headers("Content-Type: application/json")
    @POST("showRequestDetails")
    Call<String> showRequestDetails(@Body String body);


    ///Food Side Api

    ///showRestaurants
    @Headers("Content-Type: application/json")
    @POST("showRestaurants")
    Call<String> showRestaurants(@Body String body);


    ///showFavouriteRestaurants
    @Headers("Content-Type: application/json")
    @POST("showFavouriteRestaurants")
    Call<String> showFavouriteRestaurants(@Body String body);


    ///showFoodCategory
    @Headers("Content-Type: application/json")
    @POST("showFoodCategory")
    Call<String> showFoodCategory(@Body String body);


    ///showRestaurantsAgainstCategory
    @Headers("Content-Type: application/json")
    @POST("showRestaurantsAgainstCategory")
    Call<String> showRestaurantsAgainstCategory(@Body String body);

    ///showRestaurantDetail
    @Headers("Content-Type: application/json")
    @POST("showRestaurantDetail")
    Call<String> showRestaurantDetail(@Body String body);

    ///addFavouriteRestaurant
    @Headers("Content-Type: application/json")
    @POST("addFavouriteRestaurant")
    Call<String> addFavouriteRestaurant(@Body String body);


    ///showAppSliderImages
    @Headers("Content-Type: application/json")
    @POST("showAppSliderImages")
    Call<String> showAppSliderImages(@Body String body);

    ///searchRestaurant
    @Headers("Content-Type: application/json")
    @POST("searchRestaurant")
    Call<String> searchRestaurant(@Body String body);

    ///placeFoodOrder
    @Headers("Content-Type: application/json")
    @POST("placeFoodOrder")
    Call<String> placeFoodOrder(@Body String body);

   ///showFoodDeliveryOrders
    @Headers("Content-Type: application/json")
    @POST("showFoodDeliveryOrders")
    Call<String> showFoodDeliveryOrders(@Body String body);

    ///filterRestaurant
    @Headers("Content-Type: application/json")
    @POST("filterRestaurant")
    Call<String> filterRestaurant(@Body String body);


   ///searchRestaurantMenu
    @Headers("Content-Type: application/json")
    @POST("searchRestaurantMenu")
    Call<String> searchRestaurantMenu(@Body String body);

    ///searchRestaurantMenu
    @Headers("Content-Type: application/json")
    @POST("giveRatingsToRestaurant")
    Call<String> giveRatingsToRestaurant(@Body String body);


    ///searchRestaurantMenu
    @Headers("Content-Type: application/json")
    @POST("showOrderDetail")
    Call<String> showOrderDetail(@Body String body);


    ///showRestaurantMenuItemDetail
    @Headers("Content-Type: application/json")
    @POST("showRestaurantMenuItemDetail")
    Call<String> showRestaurantMenuItemDetail(@Body String body);


    ///showGoodTypes
    @Headers("Content-Type: application/json")
    @POST("showGoodTypes")
    Call<String> showGoodTypes(@Body String body);


    ///showPackageSize
    @Headers("Content-Type: application/json")
    @POST("showPackageSize")
    Call<String> showPackageSize(@Body String body);


    ///placeParcelOrder
    @Headers("Content-Type: application/json")
    @POST("placeParcelOrder")
    Call<String> placeParcelOrder(@Body String body);





    ///showParcelOrders
    @Headers("Content-Type: application/json")
    @POST("showParcelOrders")
    Call<String> showParcelOrders(@Body String body);

   ///showRiderOrderDetails
    @Headers("Content-Type: application/json")
    @POST("showRiderOrderDetails")
    Call<String> showRiderOrderDetails(@Body String body);



    ///sendMessagePushNotification
    @Headers("Content-Type: application/json")
    @POST("sendMessageNotification")
    Call<String> sendMessageNotification(@Body String body);


    ///verifyEmail
    @Headers("Content-Type: application/json")
    @POST("verifyEmail")
    Call<String> verifyEmail(@Body String body);





}
