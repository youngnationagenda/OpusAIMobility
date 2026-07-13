package com.yna.opusaimobilityapp.codeclasses;

import android.content.Context;
import android.text.TextUtils;
import android.util.Log;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.activitiesandfragment.FoodActivity;
import com.yna.opusaimobilityapp.Interface.APICallBack;
import com.yna.opusaimobilityapp.Interface.APICallBackList;
import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.model.ActiveRequestModel;
import com.yna.opusaimobilityapp.model.CategoriesModel;
import com.yna.opusaimobilityapp.model.FoodListModel;
import com.yna.opusaimobilityapp.model.NearbyModelClass;
import com.yna.opusaimobilityapp.model.RestaurantRatingModel;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.model.TimeModel;
import com.yna.opusaimobilityapp.model.YourOrdersModel;
import com.yna.opusaimobilityapp.model.rideModels.Driver;
import com.yna.opusaimobilityapp.model.rideModels.RideType;
import com.yna.opusaimobilityapp.model.rideModels.Vehicle;
import com.yna.opusaimobilityapp.parcel.model.ParcelHistoryModel;
import com.yna.opusaimobilityapp.parcel.model.Rider;
import com.yna.opusaimobilityapp.parcel.model.RiderOrderMultiStop;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;

public class DataParse {
    static ActiveRequestModel requestModel;

    public static void orderParseData(JSONObject respobj, APICallBack apiCallBack) {

        try {
            JSONObject msgobj = respobj.getJSONObject("msg");

            JSONObject requestObj = msgobj.getJSONObject("Request");

            requestModel = new ActiveRequestModel();

            requestModel.setOnTheWay(requestObj.optString("on_the_way"));
            requestModel.setArriveOnLocation(requestObj.optString("arrive_on_location"));
            requestModel.setStartRide(requestObj.optString("start_ride"));
            requestModel.setEndRide(requestObj.optString("end_ride"));
            requestModel.setCollectPayment(requestObj.optString("collect_payment"));
            requestModel.setPickupLat(requestObj.optString("pickup_lat"));
            requestModel.setPickupLong(requestObj.optString("pickup_long"));
            requestModel.setDestinationLat(requestObj.optString("dropoff_lat"));
            requestModel.setDestinationLong(requestObj.optString("dropoff_long"));
            requestModel.setDestinationLocation(requestObj.optString("dropoff_location"));
            requestModel.setPickupAddressLoc(requestObj.optString("pickup_location"));
            requestModel.setPickupLocationShortString(requestObj.optString("pickup_location_short_string"));
            requestModel.setDropoffLocationShortString(requestObj.optString("dropoff_location_short_string"));
            requestModel.setWalletPay(requestObj.optString("wallet_pay"));
            requestModel.setFinal_fare(requestObj.optString("final_fare"));
            requestModel.setRequest(requestObj.optString("request"));
            requestModel.setRequestId(requestObj.optString("id"));
            requestModel.setEnd_ride_datetime(requestObj.optString("end_ride_datetime"));
            requestModel.setPaymentType(requestObj.optString("payment_type"));

            JSONObject driverobj = msgobj.getJSONObject("Driver");

            Gson gson = new Gson();
            requestModel.driver = gson.fromJson(driverobj.toString(), Driver.class);
            requestModel.driver.setLong(driverobj.optString("long"));
            if(TextUtils.isEmpty(requestModel.driver.getLat()) || TextUtils.isEmpty(requestModel.driver.getLng())){
                requestModel.driver.setLat("0.0");
                requestModel.driver.setLong("0.0");
            }


            JSONObject vehicleobj = msgobj.getJSONObject("Vehicle");
            requestModel.vehical = gson.fromJson(vehicleobj.toString(), Vehicle.class);
            requestModel.vehical.setLong(vehicleobj.optString("long"));
            if(TextUtils.isEmpty(requestModel.vehical.getLat()) || TextUtils.isEmpty(requestModel.vehical.getLng())){
                requestModel.vehical.setLat(requestModel.driver.getLat());
                requestModel.vehical.setLong(requestModel.driver.getLng());
            }


            JSONObject ridetypeObj = vehicleobj.getJSONObject("RideType");
            requestModel.rideType = gson.fromJson(ridetypeObj.toString(), RideType.class);


            JSONObject userObject = msgobj.getJSONObject("User");
            requestModel.setUserWallet(userObject.optString("wallet"));

        } catch (JSONException e) {
            e.printStackTrace();
            Functions.logDMsg("Exception: "+e);
        }

        apiCallBack.onParseData(requestModel);

    }


    public static void resturentParseData(JSONObject respobj, APICallBackList apiCallBack) {
        ArrayList<ResturantModel> tempList = new ArrayList<>();
        try {
            JSONArray msgarray = respobj.getJSONArray("msg");

            for (int i = 0; i < msgarray.length(); i++) {
                JSONObject mainObj = msgarray.getJSONObject(i);
                ResturantModel resturantModel = new ResturantModel();

                JSONObject restaurantObj = mainObj.optJSONObject("Restaurant");

                resturantModel.setResturantImage(restaurantObj.optString("image"));
                resturantModel.setResturantName(restaurantObj.optString("name"));
                resturantModel.setTvTime(restaurantObj.optString("preparation_time"));
                resturantModel.setId(restaurantObj.optString("id"));
                resturantModel.setAbout(restaurantObj.optString("about"));
                resturantModel.setCoverImage(restaurantObj.optString("cover_image"));
                resturantModel.setDeliveryFreeRange(restaurantObj.optString("delivery_free_range"));
                resturantModel.setMinOrderPrice(restaurantObj.optString("min_order_price"));
                resturantModel.setPhone(restaurantObj.optString("phone"));
                resturantModel.setPreparation_time(restaurantObj.optString("preparation_time"));
                resturantModel.setResturantLat(restaurantObj.optString("lat","0.0"));
                resturantModel.setResturantLong(restaurantObj.optString("long","0.0"));
                resturantModel.setSpeciality(restaurantObj.optString("speciality"));
                resturantModel.setSlogan(restaurantObj.optString("slogan"));
                resturantModel.setIsLiked(restaurantObj.optString("favourite"));
                resturantModel.setBlock(restaurantObj.optString("block"));
                resturantModel.setOpen(restaurantObj.optString("open"));

                resturantModel.setCity(restaurantObj.optString("city"));
                resturantModel.setCountry(restaurantObj.optString("country"));
                resturantModel.setLocation_string(restaurantObj.optString("location_string"));
                resturantModel.setState(restaurantObj.optString("state"));

                resturantModel.setDeliveryMinTime(restaurantObj.optString("delivery_min_time"));
                resturantModel.setDeliveryMaxTime(restaurantObj.optString("delivery_max_time"));
                resturantModel.setDeliveryFee(restaurantObj.optString("delivery_fee"));

                if(restaurantObj.has("TotalRatings")) {
                    JSONObject totalRatingsObj = restaurantObj.optJSONObject("TotalRatings");
                    resturantModel.setTotalRatings(String.format("%.03s", totalRatingsObj.optString("avg", "0")));
                    resturantModel.setTotalRatingCount(totalRatingsObj.optString("totalRatings", "0"));
                }


                if(mainObj.has("0")) {
                    JSONObject distance = mainObj.optJSONObject("0");
                    resturantModel.setDistance(distance.optString("distance"));
                }

                ArrayList<TimeModel> timeModelArrayList = new ArrayList<>();
                JSONArray timingArray = mainObj.optJSONArray("RestaurantTiming");
                for (int x = 0; x < timingArray.length(); x++) {
                    JSONObject timingObj = timingArray.getJSONObject(x);
                    TimeModel timeModel = new TimeModel();
                    timeModel.setId(timingObj.optString("id"));
                    timeModel.setDay(timingObj.optString("day"));
                    timeModel.setOpening_time(timingObj.optString("opening_time"));
                    timeModel.setClosing_time(timingObj.optString("closing_time"));
                    timeModelArrayList.add(timeModel);
                }

                resturantModel.setTimeModelArrayList(timeModelArrayList);

                ArrayList<RestaurantRatingModel> restaurantRatingModelArrayList = new ArrayList<>();
                if(mainObj.has("RestaurantRating")) {
                    JSONArray ratingArray = mainObj.optJSONArray("RestaurantRating");
                    for (int x = 0; x < ratingArray.length(); x++) {
                        JSONObject ratingObj = ratingArray.getJSONObject(x);
                        if(ratingObj.has("User")) {
                            JSONObject userObj = ratingObj.getJSONObject("User");
                            RestaurantRatingModel restaurantRatingModel = new RestaurantRatingModel();
                            restaurantRatingModel.setId(ratingObj.optString("id"));
                            restaurantRatingModel.setStar(ratingObj.optString("star"));
                            restaurantRatingModel.setComment(ratingObj.optString("comment"));
                            restaurantRatingModel.setCreated(ratingObj.optString("created"));
                            restaurantRatingModel.setName(userObj.optString("first_name") + " " + userObj.optString("last_name"));
                            restaurantRatingModel.setImage(userObj.optString("image"));
                            restaurantRatingModelArrayList.add(restaurantRatingModel);
                        }
                    }
                }
                resturantModel.setRestaurantRatingModelArrayList(restaurantRatingModelArrayList);
                tempList.add(resturantModel);
            }
        }
        catch (JSONException e) {
            e.printStackTrace();
            Functions.logDMsg("e at resturant parse : "+e.toString());
            apiCallBack.onParseData(tempList);
        }

        apiCallBack.onParseData(tempList);

    }

    public static void favResponseParseData(JSONObject respobj, APICallBackList apiCallBack) {
        ArrayList<ResturantModel> tempList = new ArrayList<>();
        try {
                JSONArray msgarray = respobj.getJSONArray("msg");
                for (int i = 0; i < msgarray.length(); i++) {
                    JSONObject mainObj = msgarray.getJSONObject(i);
                    ResturantModel resturantModel = new ResturantModel();

                    JSONObject restaurantObj = mainObj.optJSONObject("Restaurant");

                    resturantModel.setResturantImage(restaurantObj.optString("image"));
                    resturantModel.setResturantName(restaurantObj.optString("name"));
                    resturantModel.setDeliveryAmount(restaurantObj.optString(""));
                    resturantModel.setTvTime(restaurantObj.optString("preparation_time"));
                    resturantModel.setId(restaurantObj.optString("id"));
                    resturantModel.setAbout(restaurantObj.optString("about"));
                    resturantModel.setCoverImage(restaurantObj.optString("cover_image"));
                    resturantModel.setDeliveryFreeRange(restaurantObj.optString("delivery_free_range"));
                    resturantModel.setMinOrderPrice(restaurantObj.optString("min_order_price"));
                    resturantModel.setPhone(restaurantObj.optString("phone"));
                    resturantModel.setPreparation_time(restaurantObj.optString("preparation_time"));
                    resturantModel.setResturantLat(restaurantObj.optString("lat","0.0"));
                    resturantModel.setResturantLong(restaurantObj.optString("long","0.0"));
                    resturantModel.setSpeciality(restaurantObj.optString("speciality"));
                    resturantModel.setSlogan(restaurantObj.optString("slogan"));
                    resturantModel.setIsLiked("1");
                    resturantModel.setOpen(restaurantObj.optString("open"));
                    resturantModel.setBlock(restaurantObj.optString("block"));

                    resturantModel.setCity(restaurantObj.optString("city"));
                    resturantModel.setCountry(restaurantObj.optString("country"));
                    resturantModel.setLocation_string(restaurantObj.optString("location_string"));
                    resturantModel.setState(restaurantObj.optString("state"));

                    resturantModel.setDeliveryMinTime(restaurantObj.optString("delivery_min_time"));
                    resturantModel.setDeliveryMaxTime(restaurantObj.optString("delivery_max_time"));
                    resturantModel.setDeliveryFee(restaurantObj.optString("delivery_fee"));

                    if(mainObj.has("TotalRatings")) {
                        JSONObject totalRatingsObj = mainObj.optJSONObject("TotalRatings");
                        resturantModel.setTotalRatings(String.format("%.03s", totalRatingsObj.optString("avg")));
                        resturantModel.setTotalRatingCount(totalRatingsObj.optString("totalRatings"));
                    }
                    ArrayList<TimeModel> timeModelArrayList = new ArrayList<>();
                    JSONArray timingArray = restaurantObj.optJSONArray("RestaurantTiming");
                    for (int x = 0; x < timingArray.length(); x++) {
                        JSONObject timingObj = timingArray.getJSONObject(x);
                        TimeModel timeModel = new TimeModel();
                        timeModel.setId(timingObj.optString("id"));
                        timeModel.setDay(timingObj.optString("day"));
                        timeModel.setOpening_time(timingObj.optString("opening_time"));
                        timeModel.setClosing_time(timingObj.optString("closing_time"));
                        timeModelArrayList.add(timeModel);
                    }

                    resturantModel.setTimeModelArrayList(timeModelArrayList);

                    ArrayList<RestaurantRatingModel> restaurantRatingModelArrayList = new ArrayList<>();
                    JSONArray ratingArray = restaurantObj.optJSONArray("RestaurantRating");
                    for (int x = 0; x < ratingArray.length(); x++) {
                        JSONObject ratingObj = ratingArray.getJSONObject(x);
                        JSONObject userObj = ratingObj.getJSONObject("User");
                        RestaurantRatingModel restaurantRatingModel = new RestaurantRatingModel();
                        restaurantRatingModel.setId(ratingObj.optString("id"));
                        restaurantRatingModel.setStar(ratingObj.optString("star"));
                        restaurantRatingModel.setComment(ratingObj.optString("comment"));
                        restaurantRatingModel.setCreated(ratingObj.optString("created"));
                        restaurantRatingModel.setName(userObj.optString("first_name") + " " + userObj.optString("last_name"));
                        restaurantRatingModel.setImage(userObj.optString("image"));
                        restaurantRatingModelArrayList.add(restaurantRatingModel);
                    }
                    resturantModel.setRestaurantRatingModelArrayList(restaurantRatingModelArrayList);
                    tempList.add(resturantModel);
            }
        } catch (JSONException e) {
            e.printStackTrace();
            Functions.logDMsg("e at resturant parse : "+e.toString());
            apiCallBack.onParseData(tempList);
        }

        apiCallBack.onParseData(tempList);

    }

    public static void callApiForFavourite(Context context, String userId, String restaurantId, ResturantModel item, FoodActivity foodActivity) {
        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
            params.put("restaurant_id", restaurantId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        RetrofitRequest.JsonPostRequest(context,
                params.toString(),
                Singleton.getApiCall(context).addFavouriteRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            foodActivity.updateFav(item);
                        }
                        else
                        {
                            Functions.cancelLoader();
                        }
                    }
                });

    }

    public static void callApiForFavourite(Context context, String userId, String restaurantId) {
        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
            params.put("restaurant_id", restaurantId);
        } catch (Exception e) {
            e.printStackTrace();
        }
        RetrofitRequest.JsonPostRequest(context,
                params.toString(),
                Singleton.getApiCall(context).addFavouriteRestaurant(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                        }
                        else
                        {

                        }
                    }
                });


    }

    public static void resturantCategoriesParseData(JSONObject respobj, APICallBackList apiCallBack) {
        ArrayList<CategoriesModel> tempList = new ArrayList<>();
        try {
            JSONArray msgarray = respobj.getJSONArray("msg");

            for (int i = 0; i < msgarray.length(); i++) {
                JSONObject mainObj = msgarray.getJSONObject(i);
                JSONObject foodCategoryObj = mainObj.optJSONObject("FoodCategory");

                CategoriesModel resturantModel = new CategoriesModel();

                resturantModel.setId(foodCategoryObj.optString("id"));
                resturantModel.setCategoryImage(foodCategoryObj.optString("image"));
                resturantModel.setCategoryName(foodCategoryObj.optString("title"));
                resturantModel.setIcon(foodCategoryObj.optString("icon"));
                tempList.add(resturantModel);
            }
        } catch (JSONException e) {
            e.printStackTrace();
            apiCallBack.onParseData(tempList);
        }

        apiCallBack.onParseData(tempList);

    }



    public static void showOrderDetail(JSONObject msg, APICallBack apiCallBack) {
        YourOrdersModel yourOrdersModel = new YourOrdersModel();
        try {
            JSONObject foodOrder = msg.optJSONObject("FoodOrder");

            JSONObject restaurantObj = msg.optJSONObject("Restaurant");
            JSONObject couponUsed = msg.optJSONObject("CouponUsed");
            JSONObject paymentCard = msg.optJSONObject("PaymentCard");
            JSONObject restaurantRating = msg.optJSONObject("RestaurantRating");
            JSONArray jsonArray = msg.optJSONArray("FoodOrderMenuItem");

            yourOrdersModel = new YourOrdersModel();
            yourOrdersModel.setOrderId(foodOrder.optString("id"));
            yourOrdersModel.setHotelAccepted(foodOrder.optString("hotel_accepted"));
            yourOrdersModel.setAcceptedReason(foodOrder.optString("accepted_reason"));
            yourOrdersModel.setAcceptedReason(foodOrder.optString("accepted_reason"));
            yourOrdersModel.setQuantity(foodOrder.optString("quantity"));
            yourOrdersModel.setPrice(foodOrder.optString("price"));
            yourOrdersModel.setLastFour(paymentCard.optString("last_4"));
            yourOrdersModel.setCardType(paymentCard.optString("brand"));

            yourOrdersModel.setRatingId(paymentCard.optString("brand"));

            yourOrdersModel.setStatus(foodOrder.optString("status"));
            String deliveryFee = foodOrder.optString("delivery_fee");
            yourOrdersModel.setDeliveryFee(deliveryFee);
            yourOrdersModel.setPaymentCardId(foodOrder.optString("payment_card_id"));
            yourOrdersModel.setDelivery(foodOrder.optString("delivery"));
            yourOrdersModel.setRiderTip(foodOrder.optString("rider_tip"));
            String tax = foodOrder.optString("tax");
            yourOrdersModel.setTax(tax);
            String subtotal = foodOrder.optString("sub_total");
            yourOrdersModel.setSubTotal(subtotal);
            yourOrdersModel.setInstructions(restaurantRating.optString("id"));

            yourOrdersModel.setRejectedReason(foodOrder.optString("rejected_reason"));
            yourOrdersModel.setRestaurantDeliveryFee(foodOrder.optString("restaurant_delivery_fee"));
            yourOrdersModel.setDeliveryFeePerKm(foodOrder.optString("delivery_fee_per_km"));

            yourOrdersModel.setTracking(foodOrder.optString("tracking"));

            yourOrdersModel.setDeliveryDateTime(foodOrder.optString("delivery_date_time"));
            yourOrdersModel.setRiderInstruction(foodOrder.optString("rider_instruction"));
            yourOrdersModel.setCreated(foodOrder.optString("created"));

            double total = Double.parseDouble(subtotal) + Double.parseDouble(tax);
            total = total + Double.parseDouble(deliveryFee);
            double discountDouble = Functions.roundoffDecimal((total * Double.parseDouble(foodOrder.optString("discount"))) / 100);
            double discountValue = Functions.roundoffDecimal(total - discountDouble);

            yourOrdersModel.setDiscount("" + discountDouble);
            yourOrdersModel.setTotalAmount(discountValue);

            ResturantModel resturantModel = new ResturantModel();
            resturantModel.setResturantImage(restaurantObj.optString("image"));
            resturantModel.setResturantName(restaurantObj.optString("name"));
            resturantModel.setTvTime(restaurantObj.optString("preparation_time"));
            resturantModel.setId(restaurantObj.optString("id"));
            resturantModel.setAbout(restaurantObj.optString("about"));
            resturantModel.setCoverImage(restaurantObj.optString("cover_image"));
            resturantModel.setDeliveryFreeRange(restaurantObj.optString("delivery_free_range"));
            resturantModel.setMinOrderPrice(restaurantObj.optString("min_order_price"));
            resturantModel.setPhone(restaurantObj.optString("phone"));
            resturantModel.setPreparation_time(restaurantObj.optString("preparation_time"));
            resturantModel.setResturantLat(restaurantObj.optString("lat","0.0"));
            resturantModel.setResturantLong(restaurantObj.optString("long","0.0"));
            resturantModel.setSpeciality(restaurantObj.optString("speciality"));
            resturantModel.setSlogan(restaurantObj.optString("slogan"));
            resturantModel.setIsLiked(restaurantObj.optString("favourite"));
            resturantModel.setBlock(restaurantObj.optString("block"));
            resturantModel.setOpen(restaurantObj.optString("open"));

            resturantModel.setCity(restaurantObj.optString("city"));
            resturantModel.setCountry(restaurantObj.optString("country"));
            resturantModel.setLocation_string(restaurantObj.optString("location_string"));
            resturantModel.setState(restaurantObj.optString("state"));

            resturantModel.setDeliveryMinTime(restaurantObj.optString("delivery_min_time"));
            resturantModel.setDeliveryMaxTime(restaurantObj.optString("delivery_max_time"));
            resturantModel.setDeliveryFee(restaurantObj.optString("delivery_fee"));

            yourOrdersModel.setResturantModel(resturantModel);

            NearbyModelClass nearbyModelClass = new NearbyModelClass();

            JSONObject userPlace = msg.optJSONObject("UserPlace");

            if (userPlace.optString("lat","0.0") != null && !userPlace.optString("lat","0.0").equals("null")) {
                nearbyModelClass.title = userPlace.optString("name");
                String lat = userPlace.optString("lat","0.0");
                String lng = userPlace.optString("long","0.0");
                nearbyModelClass.id = userPlace.optString("id");
                nearbyModelClass.address = userPlace.optString("location_string");

                nearbyModelClass.flat = userPlace.optString("flat");
                nearbyModelClass.buildingName = userPlace.optString("building_name");
                nearbyModelClass.addressLabel = userPlace.optString("address_label");
                nearbyModelClass.additonalAddressInformation = userPlace.optString("additonal_address_information");
                nearbyModelClass.addInstruction = userPlace.optString("instruction");

                nearbyModelClass.placeId = "";

                double latitude = Double.parseDouble(lat);
                double longitude = Double.parseDouble(lng);
                nearbyModelClass.lat = latitude;
                nearbyModelClass.lng = longitude;

                yourOrdersModel.setNearbyModelClass(nearbyModelClass);
            }

            yourOrdersModel.setCouponCodeid(couponUsed.optString("coupon_id"));
            yourOrdersModel.setCouponId(couponUsed.optString("id"));

            ArrayList<FoodListModel> modelArrayList = new ArrayList<>();
            for (int x = 0; x < jsonArray.length(); x++) {
                JSONObject jsonObject = jsonArray.getJSONObject(x);
                FoodListModel foodListModel = new FoodListModel();
                foodListModel.setMenuId(jsonObject.optString("id"));
                foodListModel.setItemName(jsonObject.optString("name"));
                foodListModel.setTvQuantity(jsonObject.optString("quantity"));
                foodListModel.setAmount(jsonObject.optString("price"));
                foodListModel.setImage(jsonObject.optString("image"));

                JSONArray foodOrderMenuExtraItem = jsonObject.optJSONArray("FoodOrderMenuExtraItem");
                ArrayList<HashMap<String, String>> extraItem = new ArrayList<>();
                for (int a = 0; a < foodOrderMenuExtraItem.length(); a++) {
                    JSONObject object = foodOrderMenuExtraItem.getJSONObject(a);
                    HashMap<String, String> names = new HashMap<>();
                    names.put("menu_extra_item_id", object.optString("id"));
                    names.put("menu_extra_item_name", object.optString("name"));
                    names.put("menu_extra_item_price", object.optString("price"));
                    names.put("menu_extra_item_quantity", object.optString("quantity"));
                    extraItem.add(names);
                }

                foodListModel.setExtraItem(extraItem);
                modelArrayList.add(foodListModel);
            }

            if (msg.has("RiderOrder")) {

                JSONObject riderOrder = msg.getJSONObject("RiderOrder");
                JSONObject riderObject = riderOrder.optJSONObject("RiderOrder");
                yourOrdersModel.setOnTheWay(riderObject.optString("on_the_way_to_pickup"));


                yourOrdersModel.setPickupDatetime(riderObject.optString("pickup_datetime"));
                yourOrdersModel.setOnTheWayToDropoff(riderObject.optString("on_the_way_to_dropoff"));
                yourOrdersModel.setDelivered(riderObject.optString("delivered"));
                yourOrdersModel.setOrderCreated(riderObject.optString("created"));

                JSONObject rider = riderOrder.optJSONObject("Rider");

                JSONObject vehicle = rider.optJSONObject("Vehicle");

                yourOrdersModel.setDriverId(rider.optString("id"));

                yourOrdersModel.setDriverFname(rider.optString("first_name"));
                yourOrdersModel.setDriverLname(rider.optString("last_name"));
                yourOrdersModel.setDriverPhoneNo(rider.optString("phone"));
                yourOrdersModel.setDriverUsername(rider.optString("username"));
                yourOrdersModel.setDrivePic(rider.optString("image"));
                yourOrdersModel.setDriverFullName(rider.optString("first_name") + rider.optString("last_name"));


                yourOrdersModel.setVehicleMake(vehicle.optString("make"));
                yourOrdersModel.setVehicleModel(vehicle.optString("model"));
                yourOrdersModel.setLicensePlate(vehicle.optString("license_plate"));
                yourOrdersModel.setVehicleImage(vehicle.optString("image"));
                yourOrdersModel.setRideTypeId(vehicle.optString("ride_type_id"));

                yourOrdersModel.setVehicleLat(vehicle.optString("lat","0.0"));
                yourOrdersModel.setVehicleLng(vehicle.optString("long","0.0"));


                if (!yourOrdersModel.getCreated().equals("0000-00-00 00:00:00")) {
                    yourOrdersModel.setOrderStatus("created");
                }

                if (!yourOrdersModel.getOnTheWay().equals("0000-00-00 00:00:00")) {
                    yourOrdersModel.setOrderStatus("ontheway");
                }

                if (!yourOrdersModel.getPickupDatetime().equals("0000-00-00 00:00:00")) {
                    yourOrdersModel.setOrderStatus("pickupDatetime");
                }

                if (!yourOrdersModel.getOnTheWayToDropoff().equals("0000-00-00 00:00:00")) {
                    yourOrdersModel.setOrderStatus("onTheWayToDropoff");
                }

                if (!yourOrdersModel.getDelivered().equals("0000-00-00 00:00:00")) {
                    yourOrdersModel.setOrderStatus("delivered");
                }

            }
        }catch (JSONException e){
            e.printStackTrace();
            apiCallBack.onParseData(yourOrdersModel);
        }

        apiCallBack.onParseData(yourOrdersModel);

    }

    public static ParcelHistoryModel parseParcelOrderResponce(JSONObject msg,ParcelHistoryModel parcelHistoryModel){

        try {
            JSONObject parcelOrderObj = msg.getJSONObject("ParcelOrder");
            JSONObject riderObj = msg.getJSONObject("Rider");
            JSONObject RiderOrder = msg.getJSONObject("RiderOrder");
            JSONArray riderOrderMultiStop = msg.getJSONArray("RiderOrderMultiStop");

            parcelHistoryModel.setPaymentCardId(parcelOrderObj.optString("payment_card_id"));

            parcelHistoryModel.setSenderLocationLat(parcelOrderObj.optString("sender_location_lat"));
            parcelHistoryModel.setSenderLocationLong(parcelOrderObj.optString("sender_location_long"));

            parcelHistoryModel.setOrderId(parcelOrderObj.optString("id"));
            parcelHistoryModel.setStatus(parcelOrderObj.optString("status"));
            parcelHistoryModel.setTotal(parcelOrderObj.optString("total"));
            parcelHistoryModel.setSenderName(parcelOrderObj.optString("sender_name"));
            parcelHistoryModel.setSenderPhone(parcelOrderObj.optString("sender_phone"));


            parcelHistoryModel.onTheWayToPickup = RiderOrder.optString("on_the_way_to_pickup");
            parcelHistoryModel.pickupDatetime = RiderOrder.optString("pickup_datetime");


            ObjectMapper om = new ObjectMapper();
            try {
                parcelHistoryModel.rider = om.readValue(riderObj.toString(), Rider.class);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }


            parcelHistoryModel.orderMultiStops.clear();
            for (int i = 0; i < riderOrderMultiStop.length(); i++) {
                JSONObject object = riderOrderMultiStop.getJSONObject(i);
                RiderOrderMultiStop orderStatus = new RiderOrderMultiStop();
                orderStatus.id = object.optString("id");
                orderStatus.rider_order_id = object.optString("rider_order_id");
                orderStatus.parcel_order_id = object.optString("parcel_order_id");
                orderStatus.on_the_way_to_pickup = object.optString("on_the_way_to_pickup");
                orderStatus.pickup_datetime = object.optString("pickup_datetime");
                orderStatus.on_the_way_to_dropoff = object.optString("on_the_way_to_dropoff");
                orderStatus.delivered = object.optString("delivered");
                orderStatus.signature = object.optString("signature");
                orderStatus.created = object.optString("created");
                parcelHistoryModel.orderMultiStops.add(orderStatus);
            }

        }catch (Exception e){

        }
        return parcelHistoryModel;
    }
}
