package com.terraai.aimobility.model;

import java.io.Serializable;
import java.util.ArrayList;

public class YourOrdersModel implements Serializable {

    String orderId;
    String hotelAccepted;
    String acceptedReason;
    String quantity;
    String price;
    String deliveryFee;
    String paymentCardId;
    String delivery;
    String riderTip;
    String tax;
    String subTotal;
    String instructions;
    String rejectedReason;
    String restaurantDeliveryFee;
    String deliveryFeePerKm;
    String discount;
    String tracking;
    String riderInstruction;
    String deliveryDateTime;
    String couponId;
    String status;
    String couponCodeid;
    String cardType;
    String ratingId;
    String created;
    String lastFour;
    ResturantModel resturantModel;
    NearbyModelClass nearbyModelClass;
    double totalAmount;
    ArrayList<FoodListModel> modelArrayList;


    String vehicleMake, vehicleModel, vehicleImage, licensePlate, vehicleLat,
            vehicleLng, rideTypeId, rideTypeName;

    String distance;
    String drivePic;
    String driverFname;
    String driverLname;
    String driverPhoneNo;
    String onTheWay;
    String pickupLat;
    String pickupLong;
    String driverUsername;
    String destinationLat;
    String destinationLong;
    String pickupLocation;
    String destinationLocation;
    String request = "0";
    String walletPay;
    String arriveOnLocation;
    String startRide;
    String endRide;
    String requestId;
    String driverId;
    String reason;
    String collectPayment;
    String avgRatings;


    String pickupDatetime;
    String onTheWayToDropoff;
    String delivered;
    String orderCreated;
    String orderStatus = "";
    String driverFullName;


    public YourOrdersModel() {
    }

    public String getOrderCreated() {
        return orderCreated;
    }

    public void setOrderCreated(String orderCreated) {
        this.orderCreated = orderCreated;
    }

    public String getPickupDatetime() {
        return pickupDatetime;
    }

    public void setPickupDatetime(String pickupDatetime) {
        this.pickupDatetime = pickupDatetime;
    }

    public String getOnTheWayToDropoff() {
        return onTheWayToDropoff;
    }

    public void setOnTheWayToDropoff(String onTheWayToDropoff) {
        this.onTheWayToDropoff = onTheWayToDropoff;
    }

    public String getDelivered() {
        return delivered;
    }

    public void setDelivered(String delivered) {
        this.delivered = delivered;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getDriverFullName() {
        return driverFullName;
    }

    public void setDriverFullName(String driverFullName) {
        this.driverFullName = driverFullName;
    }

    public String getVehicleMake() {
        return vehicleMake;
    }

    public void setVehicleMake(String vehicleMake) {
        this.vehicleMake = vehicleMake;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public String getVehicleImage() {
        return vehicleImage;
    }

    public void setVehicleImage(String vehicleImage) {
        this.vehicleImage = vehicleImage;
    }

    public String getLicensePlate() {
        return licensePlate;
    }

    public void setLicensePlate(String licensePlate) {
        this.licensePlate = licensePlate;
    }

    public String getVehicleLat() {
        return vehicleLat;
    }

    public void setVehicleLat(String vehicleLat) {
        this.vehicleLat = vehicleLat;
    }

    public String getVehicleLng() {
        return vehicleLng;
    }

    public void setVehicleLng(String vehicleLng) {
        this.vehicleLng = vehicleLng;
    }

    public String getRideTypeId() {
        return rideTypeId;
    }

    public void setRideTypeId(String rideTypeId) {
        this.rideTypeId = rideTypeId;
    }

    public String getRideTypeName() {
        return rideTypeName;
    }

    public void setRideTypeName(String rideTypeName) {
        this.rideTypeName = rideTypeName;
    }

    public String getDistance() {
        return distance;
    }

    public void setDistance(String distance) {
        this.distance = distance;
    }

    public String getDrivePic() {
        return drivePic;
    }

    public void setDrivePic(String drivePic) {
        this.drivePic = drivePic;
    }

    public String getDriverFname() {
        return driverFname;
    }

    public void setDriverFname(String driverFname) {
        this.driverFname = driverFname;
    }

    public String getDriverLname() {
        return driverLname;
    }

    public void setDriverLname(String driverLname) {
        this.driverLname = driverLname;
    }

    public String getDriverPhoneNo() {
        return driverPhoneNo;
    }

    public void setDriverPhoneNo(String driverPhoneNo) {
        this.driverPhoneNo = driverPhoneNo;
    }

    public String getOnTheWay() {
        return onTheWay;
    }

    public void setOnTheWay(String onTheWay) {
        this.onTheWay = onTheWay;
    }

    public String getPickupLat() {
        return pickupLat;
    }

    public void setPickupLat(String pickupLat) {
        this.pickupLat = pickupLat;
    }

    public String getPickupLong() {
        return pickupLong;
    }

    public void setPickupLong(String pickupLong) {
        this.pickupLong = pickupLong;
    }

    public String getDriverUsername() {
        return driverUsername;
    }

    public void setDriverUsername(String driverUsername) {
        this.driverUsername = driverUsername;
    }

    public String getDestinationLat() {
        return destinationLat;
    }

    public void setDestinationLat(String destinationLat) {
        this.destinationLat = destinationLat;
    }

    public String getDestinationLong() {
        return destinationLong;
    }

    public void setDestinationLong(String destinationLong) {
        this.destinationLong = destinationLong;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getDestinationLocation() {
        return destinationLocation;
    }

    public void setDestinationLocation(String destinationLocation) {
        this.destinationLocation = destinationLocation;
    }

    public String getRequest() {
        return request;
    }

    public void setRequest(String request) {
        this.request = request;
    }

    public String getWalletPay() {
        return walletPay;
    }

    public void setWalletPay(String walletPay) {
        this.walletPay = walletPay;
    }

    public String getArriveOnLocation() {
        return arriveOnLocation;
    }

    public void setArriveOnLocation(String arriveOnLocation) {
        this.arriveOnLocation = arriveOnLocation;
    }

    public String getStartRide() {
        return startRide;
    }

    public void setStartRide(String startRide) {
        this.startRide = startRide;
    }

    public String getEndRide() {
        return endRide;
    }

    public void setEndRide(String endRide) {
        this.endRide = endRide;
    }

    public String getRequestId() {
        return requestId;
    }

    public void setRequestId(String requestId) {
        this.requestId = requestId;
    }

    public String getDriverId() {
        return driverId;
    }

    public void setDriverId(String driverId) {
        this.driverId = driverId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getCollectPayment() {
        return collectPayment;
    }

    public void setCollectPayment(String collectPayment) {
        this.collectPayment = collectPayment;
    }

    public String getAvgRatings() {
        return avgRatings;
    }

    public void setAvgRatings(String avgRatings) {
        this.avgRatings = avgRatings;
    }

    public String getRatingId() {
        return ratingId;
    }

    public void setRatingId(String ratingId) {
        this.ratingId = ratingId;
    }

    public String getCardType() {
        return cardType;
    }

    public void setCardType(String cardType) {
        this.cardType = cardType;
    }

    public ArrayList<FoodListModel> getModelArrayList() {
        return modelArrayList;
    }

    public void setModelArrayList(ArrayList<FoodListModel> modelArrayList) {
        this.modelArrayList = modelArrayList;
    }

    public String getLastFour() {
        return lastFour;
    }

    public void setLastFour(String lastFour) {
        this.lastFour = lastFour;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getCreated() {
        return created;
    }

    public void setCreated(String created) {
        this.created = created;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCouponId() {
        return couponId;
    }

    public void setCouponId(String couponId) {
        this.couponId = couponId;
    }

    public String getCouponCodeid() {
        return couponCodeid;
    }

    public void setCouponCodeid(String couponCodeid) {
        this.couponCodeid = couponCodeid;
    }

    public NearbyModelClass getNearbyModelClass() {
        return nearbyModelClass;
    }

    public void setNearbyModelClass(NearbyModelClass nearbyModelClass) {
        this.nearbyModelClass = nearbyModelClass;
    }

    public ResturantModel getResturantModel() {
        return resturantModel;
    }

    public void setResturantModel(ResturantModel resturantModel) {
        this.resturantModel = resturantModel;
    }

    public String getDeliveryDateTime() {
        return deliveryDateTime;
    }

    public void setDeliveryDateTime(String deliveryDateTime) {
        this.deliveryDateTime = deliveryDateTime;
    }

    public String getQuantity() {
        return quantity;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(String deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public String getPaymentCardId() {
        return paymentCardId;
    }

    public void setPaymentCardId(String paymentCardId) {
        this.paymentCardId = paymentCardId;
    }

    public String getDelivery() {
        return delivery;
    }

    public void setDelivery(String delivery) {
        this.delivery = delivery;
    }

    public String getRiderTip() {
        return riderTip;
    }

    public void setRiderTip(String riderTip) {
        this.riderTip = riderTip;
    }

    public String getTax() {
        return tax;
    }

    public void setTax(String tax) {
        this.tax = tax;
    }

    public String getSubTotal() {
        return subTotal;
    }

    public void setSubTotal(String subTotal) {
        this.subTotal = subTotal;
    }

    public String getInstructions() {
        return instructions;
    }

    public void setInstructions(String instructions) {
        this.instructions = instructions;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public String getRestaurantDeliveryFee() {
        return restaurantDeliveryFee;
    }

    public void setRestaurantDeliveryFee(String restaurantDeliveryFee) {
        this.restaurantDeliveryFee = restaurantDeliveryFee;
    }

    public String getDeliveryFeePerKm() {
        return deliveryFeePerKm;
    }

    public void setDeliveryFeePerKm(String deliveryFeePerKm) {
        this.deliveryFeePerKm = deliveryFeePerKm;
    }

    public String getDiscount() {
        return discount;
    }

    public void setDiscount(String discount) {
        this.discount = discount;
    }

    public String getTracking() {
        return tracking;
    }

    public void setTracking(String tracking) {
        this.tracking = tracking;
    }

    public String getRiderInstruction() {
        return riderInstruction;
    }

    public void setRiderInstruction(String riderInstruction) {
        this.riderInstruction = riderInstruction;
    }

    public String getAcceptedReason() {
        return acceptedReason;
    }

    public void setAcceptedReason(String acceptedReason) {
        this.acceptedReason = acceptedReason;
    }

    public String getHotelAccepted() {
        return hotelAccepted;
    }

    public void setHotelAccepted(String hotelAccepted) {
        this.hotelAccepted = hotelAccepted;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

}
