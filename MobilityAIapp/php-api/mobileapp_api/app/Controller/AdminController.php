<?php

App::uses('Utility', 'Lib');
App::uses('Message', 'Lib');
class AdminController extends AppController
{

    //public $components = array('Email');

    public $autoRender = false;
    public $layout = false;


    public function beforeFilter()
    {

        $json = file_get_contents('php://input');
        $json_error = Utility::isJsonError($json);

        if( !function_exists('apache_request_headers') ) {
            $headers =  Utility::apache_request_headers();
        }else {
            $headers = apache_request_headers();
        }



        if ($json_error == "false") {
            if(APP_STATUS == "demo") {

                $client_api_key = 0;
                if (array_key_exists("Api-Key", $headers) ) {
                    $client_api_key = $headers['Api-Key'];

                }else if (array_key_exists("API-KEY", $headers)){

                    $client_api_key = $headers['API-KEY'];
                }


                if($client_api_key > 0) {


                    if ($client_api_key != ADMIN_API_KEY) {

                        Message::ACCESSRESTRICTED();
                        die();

                    }
                }else {
                    $output['code'] = 201;
                    $output['msg'] = "API KEY is missing";

                    echo json_encode($output);
                    die();

                }

            }
            return true;


        } else {

            return true;

            $output['code'] = 202;
            $output['msg'] = $json_error;

            echo json_encode($output);
            die();


        }

    }
    public function index(){


        echo "Congratulations!. You have configured your mobile api correctly";

    }

    public function login() //changes done by irfan
    {
        $this->loadModel('Admin');
        $this->loadModel('Country');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            // $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $email = strtolower($data['email']);
            $password = $data['password'];


            if ($email != null && $password != null) {
                $userData = $this->Admin->loginAllUsers($email, $password);

                if ($userData) {
                    $user_id = $userData[0]['Admin']['id'];

                    // $this->UserInfo->id = $user_id;
                    // $savedField = $this->UserInfo->saveField('device_token', $device_token);

                    $output = array();
                    $userDetails = $this->Admin->getUserDetailsFromID($user_id);
                    $country_details = $this->Country->getDefaultCurrency();
                    if(count($country_details) > 0){
                        $userDetails['Country'] = $country_details['Country'];

                    }else{

                        $userDetails['Country'] = array();
                    }

                    //CustomEmail::welcomeStudentEmail($email);
                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);


                } else {
                    echo Message::INVALIDDETAILS();
                    die();

                }


            } else {
                echo Message::ERROR();
                die();
            }
        }
    }

    public function loginVendor() //changes done by irfan
    {
        $this->loadModel('User');
        $this->loadModel('Country');



        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            // $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $email = strtolower($data['email']);
            $password = $data['password'];
            $role = "vendor";


            if ($email != null && $password != null) {
                $userData = $this->User->verify($email,$password,$role);

                if ($userData) {
                    $user_id = $userData[0]['User']['id'];


                    $output = array();
                    $userDetails = $this->User->getUserDetailsFromID($user_id);
                    $country_details = $this->Country->getDefaultCurrency();
                    if(count($country_details) > 0){
                        $userDetails['Country'] = $country_details['Country'];

                    }else{

                        $userDetails['Country'] = array();
                    }

                    //CustomEmail::welcomeStudentEmail($email);
                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);


                } else {
                    echo Message::INVALIDDETAILS();
                    die();

                }


            } else {
                echo Message::ERROR();
                die();
            }
        }
    }

    public function showRiders(){

        $this->loadModel('User');
        $this->loadModel('Restaurant');
        $this->loadModel('ParcelOrder');
        $this->loadModel('FoodOrder');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);




            if(isset($data['restaurant_id'])){

                $restaurant_id = $data['restaurant_id'];

                $details = $this->Restaurant->getDetails($restaurant_id);

                $lat = $details['Restaurant']['lat'];
                $long = $details['Restaurant']['long'];

            }else if(isset($data['parcel_order_id'])){



                $details = $this->ParcelOrder->getDetails($data['parcel_order_id']);

                $lat = $details['ParcelOrder']['sender_location_lat'];
                $long = $details['ParcelOrder']['sender_location_long'];




            }else if(isset($data['food_order_id'])){



                $details = $this->FoodOrder->getOrderDetailsRestaurantData($data['food_order_id']);

                $lat = $details['Restaurant']['lat'];
                $long = $details['Restaurant']['long'];




            }







            if(count($details) > 0) {

                $riders = $this->User->getNearByUsers($lat, $long);


                $output['code'] = 200;

                $output['msg'] = $riders;


                echo json_encode($output);


                die();
            }else {


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function showUsers(){

        $this->loadModel('User');
        $this->loadModel('FoodOrder');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['user_id'])) {
                $users = $this->User->getUserDetailsFromID($data['user_id']);
                $orders = $this->FoodOrder->getUserOrders($data['user_id']);
                $users['User']['FoodOrder'] = $orders;
            }else  if(isset($data['role'])) {
                $users = $this->User->getUsers($data['role']);
            }else{
                $users = $this->User->getAllUsers();

            }







            $output['code'] = 200;

            $output['msg'] = $users;


            echo json_encode($output);


            die();


        }


    }



    public function showUserPlaces(){

        $this->loadModel('UserPlace');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];


            $user_places = $this->UserPlace->getUserPlaces($user_id);


            if (count($user_places) > 0) {


                $output['code'] = 200;

                $output['msg'] = $user_places;


                echo json_encode($output);


                die();

            } else {

                Message::EMPTYDATA();
                die();

            }


        }


    }

    public function showFoodCategory()
    {

        $this->loadModel("FoodCategory");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['id'])){

                $details = $this->FoodCategory->getDetails($data['id']);


            }else {

                $details = $this->FoodCategory->getAll();
            }

            $output['code'] = 200;

            $output['msg'] = $details;
            echo json_encode($output);


            die();
        }
    }

    public function showUserSubmittedRatings(){

        $this->loadModel('UserPlace');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];


            $user_places = $this->UserPlace->getUserPlaces($user_id);


            if (count($user_places) > 0) {


                $output['code'] = 200;

                $output['msg'] = $user_places;


                echo json_encode($output);


                die();

            } else {

                Message::EMPTYDATA();
                die();

            }


        }


    }
    public function showWithdrawRequest()
    {

        $this->loadModel("WithdrawRequest");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['user_id'])) {
                $user_id = $data['user_id'];


                $requests = $this->WithdrawRequest->getUserPendingWithdrawRequest($user_id);

            }else if(isset($data['id'])) {
                $requests = $this->WithdrawRequest->getDetails($data['id']);

            }else{
                $requests = $this->WithdrawRequest->getAllPendingRequests(0);
            }






            $output['code'] = 200;

            $output['msg'] = $requests;


            echo json_encode($output);


            die();


        }
    }

    public function sendPushNotification()
    {

        $this->loadModel("User");


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            if(APP_STATUS == "demo"){



                $output['code'] = 201;

                $output['msg'] = "Sorry this feature is disabled in demo mode";


                echo json_encode($output);


                die();
            }
            $txt = $data['txt'];


            if (isset($data['role'])) {
                $role = $data['role'];


                $users = $this->User->getUsers($role);

            } else {

                $users = $this->User->getAllUsersNotification();
            }

            if (count($users) > 0) {


                foreach ($users as $user) {


                    $device_token = $user['User']['device_token'];

                    if (strlen($device_token) > 15) {


                        $notification['to'] = $device_token;
                        $notification['notification']['title'] = "";
                        $notification['notification']['body'] = $txt;
                        $notification['notification']['badge'] = "1";
                        $notification['notification']['sound'] = "default";
                        $notification['notification']['icon'] = "";


                        $notification['data']['title'] = "";
                        $notification['data']['body'] = $txt;

                        $notification['data']['icon'] = "";
                        $notification['data']['badge'] = "1";
                        $notification['data']['sound'] = "default";


                        $notification['headings']['en'] = "alert";
                        $notification['include_player_ids'] = array($device_token);
                        $notification['content_available'] = true;
                        $notification['contents']['en'] = $txt;


                        Utility::sendPushNotificationToMobileDevice(json_encode($notification));


                    }
                }
            }

            $output['code'] = 200;

            $output['msg'] = "sucessfully sent";
            echo json_encode($output);


            die();

        }


    }
    public function withdrawRequestApproval()
    {


        $this->loadModel("WithdrawRequest");

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];
            $withdraw_data['status'] = $data['status'];

            $withdraw_data['updated'] = date('Y-m-d H:i:s', time());


            $details = $this->WithdrawRequest->getDetails($id);

            if(count($details) > 0) {

                if($data['status'] == 1){
                    $this->User->id = $details['WithdrawRequest']['user_id'];
                    $user_wallet['wallet'] = 0;
                    $user_wallet['reset_wallet_datetime'] = date('Y-m-d H:i:s', time());
                    $this->User->save($user_wallet);



                }

                $this->WithdrawRequest->id = $id;
                $this->WithdrawRequest->save($withdraw_data);


                $output = array();
                $details = $this->WithdrawRequest->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }else{


                Message::EMPTYDATA();
                die();
            }



        }
    }

    public function restaurantOwnerResponse()
    {

        $this->loadModel("FoodOrder");
        $this->loadModel("Restaurant");
        $this->loadModel("FoodOrderMenuItem");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $order_id       = $data['order_id'];


            $response = $data['response'];
            $reason = $data['reason'];
            $restaurant_response['status_datetime'] = date('Y-m-d H:i:s', time());

            $result = $this->FoodOrder->getDetails($order_id);

            $restaurant_user_device_token = $result['Restaurant']['User']['device_token'];

            $restaurant_response['hotel_accepted'] = $response;
            if($response == 1) {


                $restaurant_response['accepted_reason'] = $reason;
                $restaurant_response['status'] = 1;
                // $restaurant_detail = $this->Order->getRestaurantName($order_id);


                //Firebase::updateRestaurantOrderStatus($order_id, $result[0]['Restaurant']['name']);

                /**autometic assign**/


               /* $setting_details = $this->Setting->getSettingsAgainstType("auto_assign_order");

                if (count($setting_details) > 0) {

                    if ($setting_details['Setting']['value'] == 1) {
                        $rest_details = $this->RestaurantLocation->getRestaurantLocation($result[0]['Restaurant']['id']);

                        $this->findAvailableNearestRiders($order_id, $rest_details);
                    }

                }*/


                /*********/

            }  if($response == 2){


                $restaurant_response['rejected_reason'] = $reason;
                $restaurant_response['status'] = 3;



            }



           // $user_id = $data['user_id'];


            $id            =  $result['Restaurant']['id'];



            // $restaurant_id = $id[0]['Restaurant']['id'];

            if(count($id) > 0){

                $hotel_response = $this->FoodOrder->checkAcceptedOrRejectedResponse($order_id);



                $device_token =  $result['User']['device_token'];
                $menu_details = $this->FoodOrderMenuItem->getMenuItem($order_id);

                if ($hotel_response['FoodOrder']['hotel_accepted'] == 0) {

                    if($response == 1) {
                        $this->FoodOrder->id = $order_id;
                        $delivery = $this->FoodOrder->field('delivery');
                        if($delivery < 1){

                            $restaurant_response['status'] = 3;

                        }
                        $this->FoodOrder->id = $order_id;
                        if ($this->FoodOrder->save($restaurant_response)) {

                            /* send push notification*/





                            if (strlen($device_token) > 10) {

                                /************notification*************/


                                $notification['to'] = $device_token;
                                $notification['notification']['title'] = "Order has been accepted by the restaurant";
                                $notification['notification']['body'] = $menu_details['FoodOrderMenuItem']['name'].' has been accepted by '.$result['Restaurant']['name'];
                                $notification['notification']['badge'] = "1";
                                $notification['notification']['sound'] = "default";
                                $notification['notification']['icon'] = "";
                                $notification['notification']['type'] = "";



                                $notification['data']['title'] = "Order has been accepted by the restaurant";
                                $notification['data']['body'] = $menu_details['FoodOrderMenuItem']['name'].' has been accepted by '.$result['Restaurant']['name'];
                                $notification['data']['badge'] = "1";
                                $notification['data']['sound'] = "default";
                                $notification['data']['icon'] = "";
                                $notification['data']['type'] = "";
                                $notification['data']['data']= "";


                                $r = Utility::sendPushNotificationToMobileDevice(json_encode($notification));


                                $notification['to'] = $restaurant_user_device_token;
                                $notification['notification']['title'] = "Order has been accepted by the restaurant";
                                $notification['notification']['badge'] = "1";
                                $notification['notification']['sound'] = "default";
                                $notification['notification']['icon'] = "";
                                $notification['notification']['type'] = "";
                                $notification['notification']['data']= "";

                                $notification['data']['title'] = "Order has been accepted by the restaurant";
                                $notification['data']['icon'] = "";
                                $notification['data']['badge'] = "1";
                                $notification['data']['sound'] = "default";
                                $notification['data']['type'] = "";
                                Utility::sendPushNotificationToMobileDevice(json_encode($notification));




                                /********end notification***************/
                            }

                            echo Message::DATASUCCESSFULLYSAVED();


                            die();
                        } else {

                            echo Message::DATASAVEERROR();
                            die();

                        }
                    }else{

                        $this->FoodOrder->id = $order_id;
                        if ($this->FoodOrder->save($restaurant_response)) {


                            /************notification*************/


                            $notification['to'] = $device_token;
                            $notification['notification']['title'] = "Order has been rejected by the restaurant";
                            $notification['notification']['body'] = $reason;
                            $notification['notification']['badge'] = "1";
                            $notification['notification']['sound'] = "default";
                            $notification['notification']['icon'] = "";
                            $notification['notification']['type'] = "";
                            $notification['data']['title'] = "Order has been rejected by the restaurant";
                            $notification['data']['body'] = $reason;
                            $notification['data']['badge'] = "1";
                            $notification['data']['sound'] = "default";
                            $notification['data']['icon'] = "";
                            $notification['data']['type'] = "";


                            Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                            $notification['to'] = $restaurant_user_device_token;
                            $notification['notification']['title'] = "Order has been rejected by the restaurant";
                            $notification['notification']['body'] = $reason;
                            $notification['notification']['badge'] = "1";
                            $notification['notification']['sound'] = "default";
                            $notification['notification']['icon'] = "";
                            $notification['notification']['type'] = "";
                            $notification['notification']['data']= "";

                            $notification['data']['title'] = "Order has been rejected by the restaurant";
                            $notification['notification']['body'] = $reason;
                            $notification['data']['icon'] = "";
                            $notification['data']['badge'] = "1";
                            $notification['data']['sound'] = "default";
                            $notification['data']['type'] = "";
                            Utility::sendPushNotificationToMobileDevice(json_encode($notification));



                            /********end notification***************/



                            echo Message::DATASUCCESSFULLYSAVED();


                            die();
                        } else {

                            echo Message::DATASAVEERROR();
                            die();

                        }

                    }
                } else if ($hotel_response['FoodOrder']['hotel_accepted'] == 1) {


                    $output['code'] = 201;
                    $output['msg']  = "Already Accepted";
                    echo json_encode($output);
                    die();
                } else if ($hotel_response['FoodOrder']['hotel_accepted'] == 2) {


                    $output['code'] = 201;
                    $output['msg']  = "Already Rejected";
                    echo json_encode($output);
                    die();
                }
            }else{

                $output['code'] = 203;
                $output['msg']  = "restaurant do not exist";
                echo json_encode($output);
                die();

            }

        }
    }


    public function findAvailableNearestRiders($order_id,$restaurant){


        $this->loadModel('Order');
        $this->loadModel('RiderOrder');
        $this->loadModel('User');
        $this->loadModel('UserInfo');

        // $order_detail   = $this->Order->getOrderDetailBasedOnID($order_id);

        $res_lat = $restaurant['RestaurantLocation']['lat'];
        $res_long = $restaurant['RestaurantLocation']['long'];



        $json = Firebase::getRiderLocations();

        $data = json_decode($json, TRUE);



        if(count($data) > 0) {


            foreach ($data as $key => $val) {





                //echo $data['rider_lat'].'<br>';

                $distance[$key]['distance'] = Lib::distance($res_lat, $res_long, $val['rider_lat'], $val['rider_long'], "N");
                $distance[$key]['rider_id'] = $key;


            }



            array_multisort($distance, SORT_ASC, $distance);



            //$datanew = array_keys($distance, min($distance));
            foreach ($distance as $d) {


                $ifRiderExist =  $this->User->ifRiderExist($d['rider_id']);

                if($ifRiderExist > 0){


                    $ifassigned = $this->RiderOrder->checkIfOrderHasBeenAssignedToRiderOrNot($order_id, $d['rider_id']);
                    $rider_online = $this->UserInfo->checkIfRiderOnline($d['rider_id']);


                    if ($ifassigned == 0 && $rider_online == 1) {
                        $output = $this->assignOrderToRiderAutometically($d['rider_id'], 1, $order_id);



                        return $output;


                    }else{



                    }
                }


            }
        }else{

            $output['code'] = 201;

            $output['msg'] = "No rider location exist in database";
            return $output;


        }



    }

    public function assignOrderToRiderAutometically($rider_user_id,$assigner_user_id,$order_id)
    {

        $this->loadModel("RiderOrder");
        $this->loadModel("Order");
        $this->loadModel("UserInfo");







        //  $rider_user_id = $data['rider_user_id'];
        //$assigner_user_id = $data['assigner_user_id'];
        //$order_id = $data['order_id'];
        $created = date('Y-m-d H:i:s', time() - 60 * 60 * 4);

        $this->Order->id = $order_id;
        $delivery = $this->Order->field('delivery');
        if($delivery == 0){


            $output['code'] = 201;

            $output['msg'] = "You can't assign this order to any rider because user will himself pickup the food from the restaurant ";
            return $output;
        }

        if(isset($data['id'])){
            // $this->RiderOrder->id = $data['id'];
            $this->RiderOrder->delete($data['id']);

        }

        $rider_order['rider_user_id'] = $rider_user_id;
        $rider_order['assigner_user_id'] = $assigner_user_id;
        $rider_order['order_id'] = $order_id;
        $rider_order['assign_date_time'] = $created;
        $this->UserInfo->id = $rider_user_id;

        //$device_token = $this->UserInfo->field('device_token');
        $rider_name = $this->UserInfo->field('first_name');


        if ($this->RiderOrder->isDuplicateRecord($rider_user_id, $assigner_user_id, $order_id) <= 0) {

            if ($this->RiderOrder->save($rider_order)) {

                /*firebase*/
                $rider_order_id = $this->RiderOrder->getLastInsertId();


                $curl_date[$order_id] =
                    array (



                        'order_status' => 'Order has been assigned to '.$rider_name,
                        'map_change' => "1",




                    );

                $curl = curl_init();

                curl_setopt_array($curl, array(
                    CURLOPT_URL => FIREBASE_URL."tracking_status.json",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_ENCODING => "",
                    CURLOPT_MAXREDIRS => 10,
                    CURLOPT_TIMEOUT => 30,
                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                    CURLOPT_CUSTOMREQUEST => "PATCH",
                    CURLOPT_POSTFIELDS => json_encode($curl_date),
                    CURLOPT_HTTPHEADER => array(
                        "cache-control: no-cache",
                        "content-type: application/json",
                        "postman-token: 6b83e517-1eaf-2013-dab4-29b19c86e09e"
                    ),
                ));

                $response_curl = curl_exec($curl);
                $err = curl_error($curl);

                curl_close($curl);

                if ($err) {
                    // echo "cURL Error #:" . $err;
                } else {
                    //echo $response_curl;
                }


                $this->Order->id = $order_id;
                $user_id_order = $this->Order->field('user_id');
                $this->UserInfo->id = $user_id_order;
                $user_device_token = $this->UserInfo->field('device_token');
                $this->UserInfo->id = $rider_user_id;
                $rider_device_token = $this->UserInfo->field('device_token');


                $order_detail   = $this->Order->getOrderDetailBasedOnID($order_id);

                $notification['to'] = $rider_device_token;
                $notification['notification']['title'] = "Order has been assigned to the rider";
                $notification['notification']['body'] = 'Order #'.$order_detail[0]['Order']['id'] .' '.$order_detail[0]['OrderMenuItem'][0]['name'];
                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";
                $notification['notification']['type'] = "";
                $notification['notification']['data']= "";

                PushNotification::sendPushNotificationToMobileDevice(json_encode($notification));
                //PushNotification::sendPushNotificationToTablet(json_encode($notification));


                /********end notification***************/


                /************notification to USER*************/





                $notification['to'] = $user_device_token;
                $notification['notification']['title'] = "Order has been assigned to the rider";
                $notification['notification']['body'] = 'Order #'.$order_detail[0]['Order']['id'] .' '.$order_detail[0]['OrderMenuItem'][0]['name'];
                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";
                $notification['notification']['type'] = "";
                $notification['notification']['data']= "";

                PushNotification::sendPushNotificationToMobileDevice(json_encode($notification));
                //PushNotification::sendPushNotificationToTablet(json_encode($notification));


                /********end notification***************/

                /*firebase*/



                $curl_data2['order_id'] = $order_id;
                $curl_data2['status'] = "0";
                $curl_data2['symbol'] = $order_detail[0]['Restaurant']['Currency']['symbol'];
                $curl_data2['price'] = $order_detail[0]['Order']['price'];
                $curl_data2['restaurants'] = $order_detail[0]['Restaurant']['name'];

                $curl = curl_init();

                curl_setopt_array($curl, array(
                    CURLOPT_URL => FIREBASE_URL."RiderOrdersList/".$rider_user_id."/CurrentOrders/.json",
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_ENCODING => "",
                    CURLOPT_MAXREDIRS => 10,
                    CURLOPT_TIMEOUT => 30,
                    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                    CURLOPT_CUSTOMREQUEST => "POST",
                    CURLOPT_POSTFIELDS => json_encode($curl_data2),
                    CURLOPT_HTTPHEADER => array(
                        "cache-control: no-cache",
                        "content-type: application/json",
                        "postman-token: 6b83e517-1eaf-2013-dab4-29b19c86e09e"
                    ),
                ));

                $response_curl = curl_exec($curl);
                $err = curl_error($curl);

                curl_close($curl);

                if ($err) {
                    // echo "cURL Error #:" . $err;
                } else {
                    $snap = json_decode($response_curl,true);
                    $name = $snap['name'];
                    $this->RiderOrder->id = $rider_order_id;
                    $this->RiderOrder->saveField('snap',$name);
                }


                $output['code'] = 200;
                $output['msg']  = "Order has been assigned successfully to Rider";
                return $output;

            } else {


                $output['code'] = 201;
                $output['msg']  = "save error";
                return $output;
            }

        } else {


            $output['code'] = 201;
            $output['msg']  = "duplicate data";
            return $output;
        }



    }


    public function stats()
    {

        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("Trip");
        $this->loadModel("Request");
        $this->loadModel("Vehicle");
        $this->loadModel("User");


        if ($this->request->isPost()) {




                $food_total_orders = $this->FoodOrder->getAllOrdersCount();
                $food_total_sales = $this->FoodOrder->getTotalOrderPrice();
                $parcel_total_orders = $this->ParcelOrder->getAllOrdersCount();
                $parcel_total_sales = $this->ParcelOrder->getTotalOrderPrice();
                $trip_total_orders = $this->Trip->getAllOrdersCount();
                $trip_total_sales = $this->Trip->getTotalOrderPrice();
                $total_requests = $this->Request->getTotalRequests();
                $total_requests_sales = $this->Request->getTotalOrderPrice();
                $offline_drivers = $this->Vehicle->getTotalOnlineOfflineVehicles(0);
                $online_drivers = $this->Vehicle->getTotalOnlineOfflineVehicles(1);
                $vendors = $this->User->getUsersCount("vendor");
                $customers = $this->User->getUsersCount("customer");
                $drivers = $this->User->getUsersCount("driver");


            $food_pending_orders = $this->FoodOrder->getOrdersCountAccordingToStatus(0);
            $food_active_orders = $this->FoodOrder->getOrdersCountAccordingToStatus(1);
            $food_completed_orders = $this->FoodOrder->getOrdersCountAccordingToStatus(2);

                        $parcel_completed_orders = $this->ParcelOrder->getOrdersCountAccordingToStatus(2);
                        $parcel_pending_orders = $this->ParcelOrder->getOrdersCountAccordingToStatus(0);
                        $parcel_active_orders = $this->ParcelOrder->getOrdersCountAccordingToStatus(1);



                $output['code'] = 200;

                $output['msg']['All']['total_orders'] =  $food_total_orders + $parcel_total_orders + $trip_total_orders;
                $output['msg']['All']['total_sales'] =  number_format((float)$trip_total_sales[0]['total_sales'] + $total_requests_sales[0]['total_sales'] + $food_total_sales[0]['total_sales'] + $parcel_total_sales[0]['total_sales'], 2, '.', '');
                $output['msg']['All']['completed_orders'] =  $food_completed_orders + $parcel_completed_orders + $trip_total_orders;
                $output['msg']['FoodDelivery']['total_orders'] =  $food_total_orders;

                $output['msg']['FoodDelivery']['pending_orders'] =  $food_pending_orders;
                $output['msg']['FoodDelivery']['active_orders'] =  $food_active_orders;
                $output['msg']['FoodDelivery']['completed_orders'] =  $food_completed_orders;
                $output['msg']['FoodDelivery']['total_sales'] =  number_format((float)$food_total_sales[0]['total_sales'], 2, '.', '');

                $output['msg']['ParcelDelivery']['total_orders'] =  $parcel_total_orders;
                $output['msg']['ParcelDelivery']['pending_orders'] =  $parcel_pending_orders;
                $output['msg']['ParcelDelivery']['active_orders'] =  $parcel_active_orders;
                $output['msg']['ParcelDelivery']['completed_orders'] =  $parcel_completed_orders;
                $output['msg']['ParcelDelivery']['total_sales'] = number_format((float)$parcel_total_sales[0]['total_sales'], 2, '.', '');


                $output['msg']['RideSharing']['total_orders'] =  $trip_total_orders;
                $output['msg']['RideSharing']['completed_orders'] =  $trip_total_orders;

                $output['msg']['RideSharing']['total_sales'] =   number_format((float)$trip_total_sales[0]['total_sales'] + $total_requests_sales[0]['total_sales'], 2, '.', '');


            $output['msg']['Drivers']['total'] =  $online_drivers + $offline_drivers;
            $output['msg']['Drivers']['total_online'] =  $online_drivers;
            $output['msg']['Drivers']['total_offline'] =  $offline_drivers;

            $output['msg']['Users']['total'] =  $customers + $drivers + $vendors;
            $output['msg']['Users']['customers'] =  $customers;
            $output['msg']['Users']['drivers'] =  $drivers;
            $output['msg']['Users']['vendors'] =  $vendors;


            echo json_encode($output);


                die();

        }
    }
    public function showMainMenus()
    {

        $this->loadModel("RestaurantMenu");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            if(isset($data['id'])){

                $menus = $this->RestaurantMenu->getDetails($data['id']);


            }else {

                $restaurant_id = $data['restaurant_id'];
                $menus = $this->RestaurantMenu->getMainMenu($restaurant_id);

            }
            if (count($menus) > 0) {


                $output['code'] = 200;

                $output['msg'] =  $menus;
                echo json_encode($output);


                die();
            } else {


                Message::ACCESSRESTRICTED();
                die();
            }
        }
    }

    public function showMenuItems()
    {

        $this->loadModel("RestaurantMenuItem");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $restaurant_menu_id = $data['restaurant_menu_id'];

            $menu_items = $this->RestaurantMenuItem->getMenuItems($restaurant_menu_id);


            $output['code'] = 200;

            $output['msg'] = $menu_items;
            echo json_encode($output);


            die();
        }
    }



    public function showMenuExtraItems()
    {

        $this->loadModel("RestaurantMenuExtraItem");
        $this->loadModel("RestaurantMenuExtraSection");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $restaurant_menu_item_id = $data['restaurant_menu_item_id'];
            $restaurant_id           = $data['restaurant_id'];



            // $menu_extra_items = $this->RestaurantMenuExtraItem->getMenuExtraItems($restaurant_menu_item_id);
            $menu_extra_items = $this->RestaurantMenuExtraSection->getSectionsWithItems($restaurant_id, $restaurant_menu_item_id);

            if (count($menu_extra_items) > 0) {
                for ($i = 0; $i < count($menu_extra_items); $i++) {
                    // //this array was repeating so we remove this at one place
                    //$new_menu_extra_items[$i]['RestaurantMenuExtraSection'] = $menu_extra_items[$i]['RestaurantMenuExtraSection'];
                    $menu_extra_items[$i]['RestaurantMenuExtraSection']['RestaurantMenuExtraItem'] = $menu_extra_items[$i]['RestaurantMenuExtraItem'];
                    unset($menu_extra_items[$i]['RestaurantMenuExtraItem']);
                }

            }

            $output['code'] = 200;

            $output['msg'] = $menu_extra_items;
            echo json_encode($output);


            die();
        }
    }



    public function showMenuExtraItemsWithSections()
    {

        $this->loadModel("RestaurantMenuExtraSection");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $restaurant_id = $data['restaurant_id'];

            $menu_extra_items = $this->RestaurantMenuExtraSection->getSectionsWithItems($restaurant_id);
            /*if(count($menu_extra_items) > 0) {
            for($i=0; $i < count($menu_extra_items);$i++){

            $new_menu_extra_items[$i]['RestaurantMenuExtraSection'] = $menu_extra_items[$i]['RestaurantMenuExtraSection'];
            $new_menu_extra_items[$i]['RestaurantMenuExtraSection'][''] = $menu_extra_items[$i]['RestaurantMenuExtraSection'];
            }

            }*/
            $output['code']   = 200;

            $output['msg'] = $menu_extra_items;
            echo json_encode($output);


            die();
        }
    }

    public function showParcelOrders(){

        $this->loadModel('ParcelOrder');
        $this->loadModel('RiderOrder');
        $this->loadModel('Vehicle');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            //$starting_point = $data['starting_point'];


            // $user_id = $data['user_id'];



            if(isset($data['status'])) {

                $status = $data['status'];


                $order_details = $this->ParcelOrder->getOrdersAccordingToStatus($status);

            }else{

                $order_details = $this->ParcelOrder->getAllOrders();

            }

            if (count($order_details) > 0) {

                foreach ($order_details as $key => $order) {

                    //$order_details = $this->Order->getDetails($order['Order']['id']);

                    $rider_order_detail = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($order['ParcelOrder']['id']);

                    if (count($rider_order_detail) > 0) {

                        $order_details[$key]['RiderOrder'] = $rider_order_detail['RiderOrder'];

                       // $vehicle_detail = $this->Vehicle->getUserVehicle($rider_order_detail['RiderOrder']['rider_user_id']);


                            //$order_details[$key]['RiderOrder']['Rider']['Vehicle'] = $vehicle_detail['Vehicle'];
                            $order_details[$key]['RiderOrder']['Rider'] = $rider_order_detail['Rider'];


                    }else{

                        $order_details[$key]['RiderOrder'] = $rider_order_detail;

                    }

                }


                $output['code'] = 200;

                $output['msg'] = $order_details;


                echo json_encode($output);


                die();

            } else {

                Message::EMPTYDATA();
                die();

            }


        }


    }


    /*public function showParcelOrders(){

        $this->loadModel("Order");
        $this->loadModel("RiderOrder");
        $this->loadModel("Vehicle");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $status = $data['status'];


            $orders = $this->Order->getOrdersAccordingToStatus($status);

            if(count($orders) > 0) {
                foreach ($orders as $key => $order) {

                    //$order_details = $this->Order->getDetails($order['Order']['id']);

                    $rider_order_detail = $this->RiderOrder->getRiderOrderAgainstOrderID($order['Order']['id']);

                    if (count($rider_order_detail) > 0) {

                        $orders[$key]['RiderOrder'] = $rider_order_detail;

                        $vehicle_detail = $this->Vehicle->getUserVehicle($rider_order_detail['RiderOrder']['rider_user_id']);
                        $orders[$key]['RiderOrder']['Rider']['Vehicle'] = $vehicle_detail['Vehicle'];
                    }

                }


                $output['code'] = 200;

                $output['msg'] = $orders;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }
        }
    }*/


    public function addMenu()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('RestaurantMenu');
        $this->loadModel('Restaurant');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $name        = $data['name'];
            $description = $data['description'];


            $restaurant_id = $data['restaurant_id'];


            $created = date('Y-m-d H:i:s', time());

            $post_data['name']          = $name;
            $post_data['description']   = $description;
            $post_data['restaurant_id'] = $restaurant_id;

            $post_data['created'] = $created;



            if (isset($data['image']) && $data['image'] != " ") {

                $image      = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath                 = Utility::uploadFileintoFolderDir($image, $folder_url);
                $post_data['image'] = $filePath;
            }

            if (isset($data['id'])) {

                if (isset($data['image']) && $data['image'] != " ") {
                    $menu = $this->RestaurantMenu->getDetails($data['id']);
                    $image_db = $menu['RestaurantMenu']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image      = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath                 = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $post_data['image'] = $filePath;
                }

                $this->RestaurantMenu->id = $data['id'];
                $this->RestaurantMenu->save($post_data);

                $details = $this->RestaurantMenu->getMainMenuFromID($data['id']);


            } else if ($this->RestaurantMenu->isDuplicateRecord($name, $description, $restaurant_id) == 0) {

                if ($this->RestaurantMenu->save($post_data)) {

                    $id   = $this->RestaurantMenu->getLastInsertId();
                    $details = $this->RestaurantMenu->getMainMenuFromID($id);


                } else {


                    echo Message::DATASAVEERROR();
                    die();
                }
            } else {

                echo Message::DUPLICATEDATE();
                die();
            }

            $output['code'] = 200;

            $output['msg'] = $details;
            echo json_encode($output);
            die();

        }
    }



    public function addMenuItem()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('RestaurantMenu');
        $this->loadModel('RestaurantMenuItem');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $name               = $data['name'];
            $description        = $data['description'];
            $restaurant_menu_id = $data['restaurant_menu_id'];
            $price              = $data['price'];
            //$out_of_order       = $data['out_of_order'];
            $created            = date('Y-m-d H:i:s', time() - 60 * 60 * 4);



            $restaurant_menu_item['name']               = $name;
            $restaurant_menu_item['description']        = $description;
            $restaurant_menu_item['restaurant_menu_id'] = $restaurant_menu_id;
            $restaurant_menu_item['price']              = $price;
            $restaurant_menu_item['created']            = $created;
           // $restaurant_menu_item['out_of_order']            = $out_of_order;



            if (isset($data['image']) && $data['image'] != " ") {

                $image      = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath                 = Utility::uploadFileintoFolderDir($image, $folder_url);
                $restaurant_menu_item['image'] = $filePath;
            }


            if (isset($data['id'])) {

                if (isset($data['image']) && $data['image'] != " ") {
                    $menu = $this->RestaurantMenuItem->getDetails($data['id']);
                    $image_db = $menu['RestaurantMenuItem']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image      = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath                 = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $restaurant_menu_item['image'] = $filePath;
                }

                $this->RestaurantMenuItem->id = $data['id'];
                $this->RestaurantMenuItem->save($restaurant_menu_item);
                $menu = $this->RestaurantMenuItem->getMenuItemFromID($data['id']);
            } else if ($this->RestaurantMenuItem->isDuplicateRecord($name, $description, $restaurant_menu_id, $price) == 0) {


                if ($this->RestaurantMenuItem->save($restaurant_menu_item)) {
                    $id   = $this->RestaurantMenuItem->getLastInsertId();
                    $menu = $this->RestaurantMenuItem->getMenuItemFromID($id);
                    $this->RestaurantMenu->id = $restaurant_menu_id;
                    $this->RestaurantMenu->saveField('has_menu_item', 1);


                } else {


                    echo Message::DATASAVEERROR();
                    die();
                }

            } else {

                echo Message::DUPLICATEDATE();
                die();
            }
            $output['code'] = 200;

            $output['msg'] = $menu;
            echo json_encode($output);
            die();

        }
    }

    public function addMenuExtraItem()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('RestaurantMenuExtraItem');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $name = $data['name'];
            //  $description = $data['description'];

            $price = $data['price'];

            $restaurant_menu_extra_section_id = $data['restaurant_menu_extra_section_id'];
            $created                          = date('Y-m-d H:i:s', time() - 60 * 60 * 4);


            $restaurant_menu_extra_item['name'] = $name;
            // $restaurant_menu_extra_item['description'] = $description;

            $restaurant_menu_extra_item['price']   = $price;
            $restaurant_menu_extra_item['created'] = $created;

            $restaurant_menu_extra_item['restaurant_menu_extra_section_id'] = $restaurant_menu_extra_section_id;


            if (isset($data['id'])) {
                $this->RestaurantMenuExtraItem->id = $data['id'];
                $this->RestaurantMenuExtraItem->save($restaurant_menu_extra_item);
                $menu = $this->RestaurantMenuExtraItem->getMenuExtraItemFromID($data['id']);
            } else if ($this->RestaurantMenuExtraItem->isDuplicateRecord($name, $price, $restaurant_menu_extra_section_id) == 0) {


                if ($this->RestaurantMenuExtraItem->save($restaurant_menu_extra_item)) {
                    $id   = $this->RestaurantMenuExtraItem->getLastInsertId();
                    $menu = $this->RestaurantMenuExtraItem->getMenuExtraItemFromID($id);


                } else {


                    echo Message::DATASAVEERROR();
                    die();
                }
            } else {

                echo Message::DUPLICATEDATE();
                die();
            }

            $output['code'] = 200;

            $output['msg'] = $menu;
            echo json_encode($output);
            die();
        }
    }


    public function addMenuExtraSection()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('Restaurant');
        $this->loadModel('RestaurantMenuExtraSection');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $name    = $data['name'];
            $user_id = $data['user_id'];
            //  $description = $data['description'];

            $required      = $data['required'];
            $id            = $this->Restaurant->getRestaurantID($user_id);
            $restaurant_id = $id[0]['Restaurant']['id'];

            $created = date('Y-m-d H:i:s', time() - 60 * 60 * 4);

            $restaurant_menu_item_id                                  = $data['restaurant_menu_item_id'];
            $restaurant_menu_extra_section['restaurant_menu_item_id'] = $restaurant_menu_item_id;
            $restaurant_menu_extra_section['name']                    = $name;

            $restaurant_menu_extra_section['restaurant_id'] = $restaurant_id;
            $restaurant_menu_extra_section['required']      = $required;



            if (isset($data['id'])) {
                $this->RestaurantMenuExtraSection->id = $data['id'];
                $this->RestaurantMenuExtraSection->save($restaurant_menu_extra_section);
                $section_names = $this->RestaurantMenuExtraSection->getRecentlyAddedSection($data['id']);

            } else if ($this->RestaurantMenuExtraSection->isDuplicateRecord($name, $restaurant_menu_item_id, $restaurant_id) == 0) {

                if ($this->RestaurantMenuExtraSection->save($restaurant_menu_extra_section)) {
                    $id            = $this->RestaurantMenuExtraSection->getLastInsertId();
                    $section_names = $this->RestaurantMenuExtraSection->getRecentlyAddedSection($id);


                } else {


                    echo Message::DATASAVEERROR();
                    die();
                }
            } else {

                echo Message::DUPLICATEDATE();
                die();
            }

            $output['code'] = 200;

            $output['msg'] = $section_names;
            echo json_encode($output);
            die();


        }
    }

    public function deleteMainMenu()
    {

        $this->loadModel("RestaurantMenu");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $id = $data['id'];
            $details = $this->RestaurantMenu->getDetails($id);

            if(count($details) > 0) {
                $this->RestaurantMenu->delete($id,true);

                $output['code'] = 200;
                $output['msg'] = "deleted";
                echo json_encode($output);

                die();

            }else{
                Message::EMPTYDATA();
                die();

            }
        }





    }

    public function deleteMenuItem()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        $this->loadModel("RestaurantMenuItem");
        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $id = $data['id'];
            $details = $this->RestaurantMenuItem->getDetails($id);

            if(count($details) > 0) {
                $this->RestaurantMenuItem->delete($id,true);

                $output['code'] = 200;
                $output['msg'] = "deleted";
                echo json_encode($output);

                die();

            }else{
                Message::EMPTYDATA();
                die();

            }
        }


    }





    public function deleteMenuExtraSection()
    {



        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel("RestaurantMenuExtraSection");

        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $id = $data['id'];



            $details =    $this->RestaurantMenuExtraSection->getDetails($id);
            if(count($details) > 0) {
                $this->RestaurantMenuExtraSection->delete($id,true);

                $output['code'] = 200;
                $output['msg'] = "deleted";
                echo json_encode($output);

                die();

            }else{
                Message::EMPTYDATA();
                die();

            }


        }
    }

    public function deleteMenuExtraItem()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel("RestaurantMenuExtraItem");
        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $id = $data['id'];


            $details = $this->RestaurantMenuExtraItem->getDetails($id);

            if(count($details) > 0) {

                $this->RestaurantMenuExtraItem->delete($id,true);

                $output['code'] = 200;
                $output['msg'] = "deleted";
                echo json_encode($output);

                die();

            }else{
                Message::EMPTYDATA();
                die();

            }


        }
    }

    public function addPackageSize()
    {



        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('PackageSize');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $package['title'] =  $data['title'];
            $package['description'] =  $data['description'];
            $package['price'] =  $data['price'];





            if(isset($data['id'])){

                $id = $data['id'];
                $details =  $this->PackageSize->getDetails($id);

                if(count($details) > 0) {


                    if (isset($data['image'])) {


                        $image_db = $details['PackageSize']['image'];
                        if (strlen($image_db) > 5) {
                            @unlink($image_db);

                        }

                        $image = $data['image'];
                        $folder_url = UPLOADS_FOLDER_URI;

                        $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                        $package['image'] = $filePath;

                    }


                    $this->PackageSize->id = $id;
                    $this->PackageSize->save($package);

                    $details = $this->PackageSize->getDetails($id);

                    $output['code'] = 200;
                    $output['msg'] = $details;
                    echo json_encode($output);
                    die();
                }else{

                    Message::EMPTYDATA();
                    die();
                }

            }


            $if_exist = $this->PackageSize->ifExist($package);
            if(count($if_exist) < 1) {

                if (isset($data['image'])) {



                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $package['image'] = $filePath;

                }

                $this->PackageSize->save($package);
                $id = $this->PackageSize->getInsertID();
                $details = $this->PackageSize->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }else{
                Message::DUPLICATEDATE();
                die();

            }

        }





    }

    public function showPackageSize(){

        $this->loadModel('PackageSize');





        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $details =  $this->PackageSize->getDetails($data['id']);

            }else {


                $details = $this->PackageSize->getAll();

            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }
        }


    }
    public function deletePackageSize(){

        $this->loadModel('PackageSize');

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->PackageSize->getDetails($id);
            if(count($details) > 0 ) {


                $this->PackageSize->delete($id,true);

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }

    public function showVehicles(){

        $this->loadModel('Vehicle');





        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $details =  $this->Vehicle->getDetails($data['id']);

            }else {


                $details = $this->Vehicle->getAll();

            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }
        }


    }

    public function showFoodOrders(){

        $this->loadModel("FoodOrder");
        $this->loadModel("RiderOrder");
        $this->loadModel("Vehicle");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['status'])) {

                $status = $data['status'];


                $orders = $this->FoodOrder->getOrdersAgainstStatus($status);

            }else{

                $orders = $this->FoodOrder->getAllOrdersAdmin();

            }
            if(count($orders) > 0) {
                foreach ($orders as $key => $order) {

                    //$order_details = $this->Order->getDetails($order['Order']['id']);

                    $rider_order_detail = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($order['FoodOrder']['id']);

                    if (count($rider_order_detail) > 0) {

                        $orders[$key]['RiderOrder'] = $rider_order_detail['RiderOrder'];


                        $vehicle_detail = $this->Vehicle->getUserVehicle($rider_order_detail['RiderOrder']['rider_user_id']);
                        $orders[$key]['RiderOrder']['Rider'] = $rider_order_detail['Rider'];
                        //$orders[$key]['RiderOrder']['Rider']['Vehicle'] = $vehicle_detail['Vehicle'];
                    }else{

                        $orders[$key]['RiderOrder'] = $rider_order_detail;

                    }

                }


                $output['code'] = 200;

                $output['msg'] = $orders;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }
        }
    }


    public function showRestaurantFoodOrders(){

        $this->loadModel("FoodOrder");
        $this->loadModel("RiderOrder");
        $this->loadModel("Vehicle");
        $this->loadModel("Restaurant");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];
            $status = $data['status'];

            $restaurant_details = $this->Restaurant->isRestaurantExist($user_id);

            if(count($restaurant_details) > 0){


                $orders = $this->FoodOrder->getAllOrdersAgainstRestaurantID($restaurant_details['Restaurant']['id'],$status);

                if(count($orders) > 0) {
                    foreach ($orders as $key => $order) {

                        //$order_details = $this->Order->getDetails($order['Order']['id']);

                        $rider_order_detail = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($order['FoodOrder']['id']);

                        if (count($rider_order_detail) > 0) {

                            $orders[$key]['RiderOrder'] = $rider_order_detail['RiderOrder'];


                            $vehicle_detail = $this->Vehicle->getUserVehicle($rider_order_detail['RiderOrder']['rider_user_id']);
                            $orders[$key]['RiderOrder']['Rider'] = $rider_order_detail['Rider'];
                            //$orders[$key]['RiderOrder']['Rider']['Vehicle'] = $vehicle_detail['Vehicle'];
                        }else{

                            $orders[$key]['RiderOrder'] = $rider_order_detail;

                        }

                    }


                    $output['code'] = 200;

                    $output['msg'] = $orders;


                    echo json_encode($output);


                    die();
                }else{


                    Message::EMPTYDATA();
                    die();
                }

            }else{





                    Message::EMPTYDATA();
                    die();
               
            }




        }
    }


    public function showOrderDetail()
    {

        $this->loadModel("ParcelOrder");
        $this->loadModel("FoodOrder");
        $this->loadModel("RiderOrder");
        $this->loadModel("Vehicle");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['food_order_id'])){

                $order_id = $data['food_order_id'];
                $order_details = $this->FoodOrder->getDetails($order_id);

                $rider_order_detail = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($order_id);
                $rider_order_log_detail = $this->RiderOrder->getFoodLogAgainstOrderID($order_id);


            }else{

                $order_id = $data['parcel_order_id'];
                $order_details = $this->ParcelOrder->getDetails($order_id);
                $rider_order_detail = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($order_id);
                $rider_order_log_detail = $this->RiderOrder->getParcelLogAgainstOrderID($order_id);


            }



            //$order_details = $this->Order->getDetails($order['Order']['id']);








            $order_details['RiderOrderLog'] = $rider_order_log_detail;
            if (count($rider_order_detail) > 0) {

                $order_details['RiderOrder'] = $rider_order_detail['RiderOrder'];


                $vehicle_detail = $this->Vehicle->getUserVehicle($rider_order_detail['RiderOrder']['rider_user_id']);
                $order_details['RiderOrder']['Rider'] = $rider_order_detail['Rider'];



                $order_details['RiderOrder']['Rider']['Vehicle'] = $vehicle_detail['Vehicle'];
            }else{

                $order_details['RiderOrder'] = $rider_order_detail;

            }







            $output['code'] = 200;

            $output['msg']    = $order_details;


            echo json_encode($output);


            die();
        }
    }
    public function addHtmlPage()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        $this->loadModel('HtmlPage');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            //$user['password'] = $data['password'];
            $name = $data['name'];

            $text = $data['text'];

            $created = date('Y-m-d H:i:s', time());

            $html['name']= $name;
            $html['text'] = $text;
            $html['created'] = $created;



            $ifExist = $this->HtmlPage->ifExist($name);
            if(count($ifExist) < 1 ) {

                $this->HtmlPage->save($html);

                $id = $this->HtmlPage->getInsertID();
                $output = array();
                $details = $this->HtmlPage->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }else{

                $this->HtmlPage->id = $ifExist['HtmlPage']['id'];
                $this->HtmlPage->save($html);


                $output = array();
                $details = $this->HtmlPage->getDetails($ifExist['HtmlPage']['id']);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();
            }
        }
    }


    public function showHtmlPage(){

        $this->loadModel('HtmlPage');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['name'])){

                $name = $data['name'];

                $ifExist = $this->HtmlPage->ifExist($name);
            }else if(isset($data['id'])){

                $ifExist = $this->HtmlPage->getDetails($data['id']);

            }else{

                $ifExist = $this->HtmlPage->getAll();

            }



            if(count($ifExist) > 0 ) {





                $output['code'] = 200;

                $output['msg'] = $ifExist;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();


            }

        }


    }


    public function registerRider()
    {


        $this->loadModel('User');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if (isset($data['email'])) {

                $email_count = $this->User->isEmailAlreadyExist($data['email']);
                if ($email_count > 0) {


                    $output['code'] = 200;
                    $output['msg'] = "rider already existed";
                    echo json_encode($output);
                    die();

                }
            }

            $user['created'] = date('Y-m-d H:i:s', time());

            if (isset($data['role'])) {

                $user['role'] = $data['role'];
            }

            if (isset($data['username'])) {

                $user['username'] = $data['username'];
            }

            if (isset($data['country_id'])) {

                $user['country_id'] = $data['country_id'];
            }

            if (isset($data['gender'])) {

                $user['gender'] = strtolower($data['gender']);
            }

            if (isset($data['first_name'])) {

                $user['first_name'] = strtolower($data['first_name']);
            }

            if (isset($data['last_name'])) {

                $user['last_name'] = strtolower($data['last_name']);
            }

            if (isset($data['password'])) {

                $user['password'] = strtolower($data['password']);
            }
            if (isset($data['phone'])) {

                $user['phone'] = $data['phone'];
            }
            if (isset($data['dob'])) {

                $user['dob'] = strtolower($data['dob']);
            }
            if (isset($data['image'])) {


                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $user['image'] = $filePath;
            }

            if (count($user) > 0) {

                if(isset($data['id'])){
                    $this->User->id = $data['id'];
                    $this->User->save($user);



                    $output = array();
                    $userDetails = $this->User->getUserDetailsFromID( $data['id']);


                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);
                    die();


                }
                $this->User->save($user);
                $user_id = $this->User->getInsertID();


                $output = array();
                $userDetails = $this->User->getUserDetailsFromID($user_id);


                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);
                die();


            }

        }










    }

    public function addRideType()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        $this->loadModel('RideType');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $vehicle_type['name'] =  $data['name'];
            $vehicle_type['description'] =  $data['description'];
            $vehicle_type['passenger_capacity'] =  $data['passenger_capacity'];
            $vehicle_type['base_fare'] =  $data['base_fare'];
            $vehicle_type['cost_per_minute'] =  $data['cost_per_minute'];
            $vehicle_type['cost_per_distance'] =  $data['cost_per_distance'];
            $vehicle_type['distance_unit'] =  $data['distance_unit'];



            if(isset($data['id'])){

                $id = $data['id'];
                $details =  $this->RideType->getDetails($id);
                if(count($details) > 0) {


                    if (isset($data['image'])) {


                        $image_db = $details['RideType']['image'];
                        if (strlen($image_db) > 5) {
                            @unlink($image_db);

                        }

                        $image = $data['image'];
                        $folder_url = UPLOADS_FOLDER_URI;

                        $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                        $vehicle_type['image'] = $filePath;


                    }


                    $this->RideType->id = $id;
                    $this->RideType->save($vehicle_type);

                    $details = $this->RideType->getDetails($id);

                    $output['code'] = 200;
                    $output['msg'] = $details;
                    echo json_encode($output);
                    die();
                }else{

                    Message::EMPTYDATA();
                    die();
                }

            }


            $if_exist = $this->RideType->ifExist($vehicle_type);
            if(count($if_exist) < 1) {
                if (isset($data['image'])) {

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $vehicle_type['image'] = $filePath;


                }


                $this->RideType->save($vehicle_type);
                $id = $this->RideType->getInsertID();
                $details = $this->RideType->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }else{
                Message::DUPLICATEDATE();
                die();

            }

        }




    }

    public function showRideTypes(){

        $this->loadModel('RideType');





        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $details =  $this->RideType->getDetails($data['id']);

            }else {


                $details = $this->RideType->getAll();

            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }
        }


    }
    public function deleteRideType(){

        $this->loadModel('RideType');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->RideType->getDetails($id);
            if(count($details) > 0 ) {


                $this->RideType->delete($id,true);

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }

    public function showUserDocuments(){

        $this->loadModel('UserDocument');





        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];
            $details = $this->UserDocument->getUserDocument($user_id);



            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function verifyDocument()
    {
        $this->loadModel('UserDocument');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);


            $id        = $data['id'];
            $status = $data['status'];




            $this->UserDocument->id = $id;
            if ($this->UserDocument->saveField('status',$status)) {

                $user_info = $this->UserDocument->getDetails($id);
                $result['code'] = 200;
                $result['msg']  = $user_info;
                echo json_encode($result);
                die();
            } else {


                echo Message::DATASAVEERROR();
                die();


            }

        } else {

            echo Message::INCORRECTPASSWORD();
            die();




        }

    }
    public function editUser()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user['first_name'] = $data['first_name'];
            $user['last_name'] = $data['last_name'];
            $user['phone'] = $data['phone'];
            $user['email'] = $data['email'];
            $user['role'] = $data['role'];
            $user['country_id'] = $data['country_id'];
            //$user['admin_per_order_commission'] = $data['admin_per_order_commission'];
            //$user['rider_fee_per_order'] = $data['rider_fee_per_order'];


            $user_id = $data['user_id'];


            //$username_exist = $this->User->editIsUsernameAlreadyExist($data['username'], $user_id);
            $email_exist = $this->User->editIsEmailAlreadyExist($data['email'], $user_id);
            $phone = $this->User->editIsphoneNoAlreadyExist($data['phone'], $user_id);

            if($email_exist > 0){

                $output['code'] = 201;

                $output['msg'] = "email already exist";


                echo json_encode($output);


                die();

            }

            if($phone > 0){

                $output['code'] = 201;

                $output['msg'] = "phone already exist";


                echo json_encode($output);


                die();

            }
            $this->User->id = $user_id;
            $this->User->save($user);


            $output = array();
            $userDetails = $this->User->getUserDetailsFromID($user_id);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


        }
    }


    public function addRestaurantTiming(){

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel("RestaurantTiming");

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $restaurant_id = $data['restaurant_id'];
            $restaurant_timing = $data['restaurant_timing'];

            $details = $this->RestaurantTiming->getDetails($restaurant_id);
            if(count($details) > 0){

                $this->RestaurantTiming->deleteRestaurantTiming($restaurant_id);
            }


            foreach ($restaurant_timing as $k => $v) {


                $timing[$k]['day'] = $v['day'];
                $timing[$k]['opening_time'] = $v['opening_time'];
                $timing[$k]['closing_time'] = $v['closing_time'];
                $timing[$k]['restaurant_id'] = $restaurant_id;

            }

            $this->RestaurantTiming->saveAll($timing);

            $details = $this->RestaurantTiming->getDetails($restaurant_id);

            if(count($details) > 0) {

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);

                die();

            }else{

                Message::EmptyDATA();
                die();

            }
        }

    }

    public function addServiceCharge()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('ServiceCharge');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $post_data['type'] = $data['type'];
            $post_data['value'] = $data['value'];


            $post_data['created'] = date('Y-m-d H:i:s', time());
            $details = $this->ServiceCharge->checkDuplicate($post_data);

            if(isset($data['id'])){

                $this->ServiceCharge->id = $data['id'];
                $this->ServiceCharge->save($post_data);

                $details = $this->ServiceCharge->getDetails($data['id']);



                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();
            }
            if(count($details) < 1) {




                $this->ServiceCharge->save($post_data);

                $id = $this->ServiceCharge->getInsertID();

                $output = array();
                $details = $this->ServiceCharge->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();



            }else{


                echo Message::DUPLICATEDATE();
                die();

            }

        }
    }

    public function showServiceCharges(){

        $this->loadModel('ServiceCharge');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['id'])){

                $details = $this->ServiceCharge->getDetails($data['id']);

            }else{

                $details = $this->ServiceCharge->getAll();
            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function addReportReason()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('ReportReason');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $report['title'] = $data['title'];


            $report['created'] = date('Y-m-d H:i:s', time());
            $details = $this->ReportReason->checkDuplicate($data['title']);

            if(isset($data['id'])){

                $this->ReportReason->id = $data['id'];
                $this->ReportReason->save($report);

                $details = $this->ReportReason->getDetails($data['id']);



                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();
            }
            if($details < 1) {




                $this->ReportReason->save($report);

                $id = $this->ReportReason->getInsertID();

                $output = array();
                $details = $this->ReportReason->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();



            }else{


                echo Message::DUPLICATEDATE();
                die();

            }

        }
    }

    public function showReportReasons(){

        $this->loadModel('ReportReason');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['id'])){

                $details = $this->ReportReason->getDetails($data['id']);

            }else{

                $details = $this->ReportReason->getAll();
            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function deleteReportReason(){

        $this->loadModel('ReportReason');

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->ReportReason->getDetails($id);

            if(count($details) > 0 ) {
                $this->ReportReason->id = $id;
                $this->ReportReason->delete();


                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }

    public function addRestaurant()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        $this->loadModel("Restaurant");

        $this->loadModel("RestaurantTiming");


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $name = $data['name'];


            $min_order_price = $data['min_order_price'];



            $user_id = $data['user_id'];

            $lat = $data['lat'];
            $long = $data['long'];



            if(isset($data['admin_commission'])){

                $admin_commission = $data['admin_commission'];
                $restaurant['admin_commission'] = $admin_commission;

            }




            $restaurant['name'] = $name;





            $restaurant['user_id'] = $user_id;





            $restaurant['min_order_price'] = $min_order_price;

            $restaurant['delivery_fee'] = $data['delivery_fee'];

            $restaurant['delivery_min_time'] = $data['delivery_min_time'];

            $restaurant['delivery_max_time'] = $data['delivery_max_time'];


            $restaurant['lat'] = $lat;
            $restaurant['long'] = $long;
            $location_data = Utility::getCountryCityProvinceFromLatLong($lat,$long);
            $restaurant['location_string'] = $location_data['location_string'];




            $created = date('Y-m-d H:i:s', time());



            $restaurant['created'] = $created;


            if(isset($data['id'])){

                $restaurant_id = $data['id'];
                $rest_details = $this->Restaurant->getDetails($restaurant_id);
                if (isset($data['image']) && $data['image'] != " ") {

                    $image_db = $rest_details['Restaurant']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }
                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $restaurant['image'] = $filePath;


                }

                if (isset($data['cover_image']) && $data['cover_image'] != " ") {
                    $image_db = $rest_details['Restaurant']['cover_image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }
                    $cover_image = $data['cover_image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($cover_image, $folder_url);
                    $restaurant['cover_image'] = $filePath;


                }

                $this->Restaurant->id = $restaurant_id;
                $this->Restaurant->save($restaurant);

                $rest_details = $this->Restaurant->getDetails($restaurant_id);
                $output['code'] = 200;
                $output['msg'] = $rest_details;
                echo json_encode($output);


                die();



            }
            if ($this->Restaurant->save($restaurant)) {

                $restaurant_id = $this->Restaurant->getInsertID();




                if (isset($data['image']) && $data['image'] != " ") {

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $restaurant['image'] = $filePath;
                    $this->Restaurant->id = $restaurant_id;
                    $this->Restaurant->save($restaurant);

                }




                $rest_details = $this->Restaurant->getDetails($restaurant_id);
                $output['code'] = 200;
                $output['msg'] = $rest_details;
                echo json_encode($output);


                die();


            }
        }


    }


    public function showUserDeliveryAddress()
    {


        $this->loadModel("User");



        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];



            $userDetails = $this->User->getUserDetailsFromID($user_id);


            $output['code'] = 200;

            $output['msg'] = $userDetails;


            echo json_encode($output);


            die();


        }
    }

    public function changePassword()
    {
        $this->loadModel('User');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);


            $user_id        = $data['user_id'];
            $this->User->id = $user_id;



            $new_password   = $data['password'];




            $this->request->data['password'] = $new_password;
            $this->User->id                  = $user_id;


            if ($this->User->save($this->request->data)) {

                $user_info = $this->User->getUserDetailsFromID($user_id);
                $result['code'] = 200;
                $result['msg']  = $user_info;
                echo json_encode($result);
                die();
            } else {


                echo Message::DATASAVEERROR();
                die();


            }

        } else {

            echo Message::INCORRECTPASSWORD();
            die();




        }

    }


    public function deleteUser(){

        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $details = $this->User->getUserDetailsFromID($user_id);
            if(count($details) > 0 ) {

                $this->User->id = $user_id;
                $this->User->delete();

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }

    public function addCoupon()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel("Coupon");
        //$this->loadModel("Restaurant");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $coupon_code   = $data['coupon_code'];
            $limit_users   = $data['limit_users'];
            $discount      = $data['discount'];
            $expiry_date   = $data['expiry_date'];
            $created = date('Y-m-d H:i:s', time());






            $coupon['coupon_code']   = $coupon_code;
            $coupon['limit_users']   = $limit_users;
            $coupon['discount']      = $discount;
            $coupon['expiry_date']   = $expiry_date;
            $coupon['created']   = $created;




            if(isset($data['id'])){

                $this->Coupon->id = $data['id'];
                $this->Coupon->save($coupon);
                $coupon_detail = $this->Coupon->getDetails($data['id']);


                $output['code'] = 200;

                $output['msg'] = $coupon_detail;
                echo json_encode($output);


                die();

            }else{


                if (count($this->Coupon->isCouponCodeExist($coupon_code)) < 1) {
                    if ($this->Coupon->save($coupon)) {
                        $id = $this->Coupon->getInsertID();
                        $coupon_detail = $this->Coupon->getDetails($id);


                        $output['code'] = 200;

                        $output['msg'] = $coupon_detail;
                        echo json_encode($output);


                        die();
                    } else {

                        echo Message::DATASAVEERROR();
                        die();

                    }
                }else{


                    Message::DUPLICATEDATE();
                    die();
                }




            }

        }
    }
    public function showCoupons()
    {

        $this->loadModel("Coupon");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['coupon_id'])){

                $coupons = $this->Coupon->getDetails($data['coupon_id']);


            }else{


                $coupons = $this->Coupon->getAll();

            }

            if(count($coupons) > 0) {

                $output['code'] = 200;

                $output['msg'] = $coupons;
                echo json_encode($output);


                die();
            }else{
                Message::EMPTYDATA();
                die();
            }
        }
    }
    public function deleteCoupon()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel("Coupon");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $coupon_id = $data['coupon_id'];
            $coupon_detail = $this->Coupon->getDetails($coupon_id);

            if (count($coupon_detail) > 0) {


                $this->Coupon->id = $coupon_id;

                if ($this->Coupon->delete()) {

                    Message::DELETEDSUCCESSFULLY();
                    die();
                } else {

                    echo Message::DATASAVEERROR();
                    die();

                }
            } else {


                Message::EMPTYDATA();
                die();

            }
        }
    }

    public function addAppSliderImage()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        $this->loadModel('AppSlider');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $image = $data['image'];
           // $user_id = $data['user_id'];

            if (isset($data['image']) && $data['image'] != " ") {

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $post_data['image'] = $filePath;
            }

            if (isset($data['url'])) {


                $post_data['url'] = $data['url'];
            }


            if (isset($data['id'])) {
                $id = $data['id'];
                $app_slider = $this->AppSlider->getImageDetail($id);
                $image_path = $app_slider[0]['AppSlider']['image'];
                if (isset($data['url'])) {


                    $post_data['url'] = $data['url'];
                }
                @unlink($image_path);

                $this->AppSlider->id = $id;
                $this->AppSlider->save($post_data);
                echo Message::DATASUCCESSFULLYSAVED();

                die();

            } else if ($this->AppSlider->save($post_data)) {

                echo Message::DATASUCCESSFULLYSAVED();

                die();
            } else {


                echo Message::DATASAVEERROR();
                die();
            }


        }
    }

    public function showAppSliderImages()
    {

        $this->loadModel("AppSlider");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $images = $this->AppSlider->getImages();


            $output['code'] = 200;

            $output['msg'] = $images;
            echo json_encode($output);


            die();
        }
    }

    public function deleteAppSliderImage()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel("AppSlider");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $app_slider = $this->AppSlider->getDetails($id);
            if (count($app_slider) > 0) {
                $image_path = $app_slider['AppSlider']['image'];

                @unlink($image_path);
                if ($this->AppSlider->deleteAppSlider($id)) {

                    Message::DELETEDSUCCESSFULLY();


                    die();

                } else {

                    Message::ERROR();


                    die();

                }


            } else {

                $output['code'] = 202;

                $output['msg'] = "no image exist";
                echo json_encode($output);
                die();
            }


        }
    }

    public function addTax()
    {


        $this->loadModel('Tax');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $tax['city'] = $data['city'];
            $tax['state'] = $data['state'];
            $tax['country_id'] = $data['country_id'];
            $tax['tax'] = $data['tax'];


            if (isset($data['id'])) {

                $tax_id = $data['id'];
                $this->Tax->id = $tax_id;

                if ($this->Tax->save($tax)) {

                    $detail = $this->Tax->getDetail($tax_id);

                    $output['code'] = 200;
                    $output['msg'] = $detail;
                    echo json_encode($output);

                    die();
                } else {


                    echo Message::DATASAVEERROR();
                    die();
                }
            } else {

                $count = $this->Tax->isDuplicateRecord($data['city'], $data['state'], $data['country_id']);
                if ($count == 0) {
                    if ($this->Tax->save($tax)) {
                        $id = $this->Tax->getLastInsertId();
                        $detail = $this->Tax->getDetail($id);

                        $output['code'] = 200;
                        $output['msg'] = $detail;
                        echo json_encode($output);

                        die();
                    } else {


                        echo Message::DATASAVEERROR();
                        die();
                    }
                }else{

                    echo Message::DATAALREADYEXIST();
                    die();

                }
            }


        }
    }

    public function deleteTrip()
    {

        $this->loadModel("Trip");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->Trip->getDetail($id);

            if(count($details) > 0){


                $this->Trip->delete($id,true);

                $details = $this->Trip->getDetail($id);
                if(count($details) < 1){
                    $output['code'] = 200;

                    $output['msg'] = "deleted successfully";
                    echo json_encode($output);

                    die();
                }else{

                    $output['code'] = 201;

                    $output['msg'] = "something went wrong";
                    echo json_encode($output);
                    die();
                }
            }else{

                $output['code'] = 201;

                $output['msg'] = "No tax details found";
                echo json_encode($output);
                die();

            }


        }
    }

    public function showTripRequests()
    {

        $this->loadModel("Request");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['id'])){

                $details = $this->Request->getDetails($data['id']);

            }else if(isset($data['request'])) {

                $details = $this->Request->getDetailsAgainstStatus($data['request']);
            }else{

                $details = $this->Request->getAll();

            }
            if(count($details) > 0) {

                $output['code'] = 200;

                $output['msg'] = $details;
                echo json_encode($output);


                die();
            }else{
                Message::EMPTYDATA();
                die();

            }
        }
    }

    public function showTrips()
    {

        $this->loadModel("Trip");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['id'])){

                $details = $this->Trip->getDetails($data['id']);

            }else {

                $details = $this->Trip->getAll();

            }
            if(count($details) > 0) {

                $output['code'] = 200;

                $output['msg'] = $details;
                echo json_encode($output);


                die();
            }else{
                Message::EMPTYDATA();
                die();

            }
        }
    }

    public function showTripsHistory(){

        $this->loadModel('Trip');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            if(isset($data['user_id'])) {

                $user_id = $data['user_id'];
                $user_places = $this->Trip->getUserCompletedTripsWithoutLimit($user_id,"customer");
            }else{

                $user_id = $data['driver_id'];

                $user_places = $this->Trip->getUserCompletedTripsWithoutLimit($user_id,"driver");
            }



            if (count($user_places) > 0) {


                $output['code'] = 200;

                $output['msg'] = $user_places;


                echo json_encode($output);


                die();

            } else {

                Message::EMPTYDATA();
                die();

            }


        }


    }

    public function showTaxDetail()
    {

        $this->loadModel("Tax");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->Tax->getDetail($id);

            if(count($details) > 0) {

                $output['code'] = 200;

                $output['msg'] = $details;
                echo json_encode($output);


                die();
            }else{
                Message::EMPTYDATA();
                die();

            }
        }
    }
    public function showTaxes()
    {

        $this->loadModel("Tax");


        if ($this->request->isPost()) {


            $taxes = $this->Tax->getAll();


            $output['code'] = 200;

            $output['msg'] = $taxes;
            echo json_encode($output);


            die();
        }
    }
    public function assignOrderToRider()
    {

        $this->loadModel("RiderOrder");
        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("User");
        $this->loadModel("Vehicle");


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $rider_user_id = $data['rider_user_id'];

            //$order_id = $data['order_id'];
            $created = date('Y-m-d H:i:s', time());



            if(isset($data['id'])){

                $this->RiderOrder->delete($data['id']);

            }
            $vehicle_exist = $this->Vehicle->getUserVehicle($rider_user_id);

            if(count($vehicle_exist) < 1){

                $output['code'] = 201;

                $output['msg'] = "Driver's vehicle doesn't exist. Please register driver's vehicle or choose another driver";
                echo json_encode($output);


                die();

            }
            $rider_order['rider_user_id'] = $rider_user_id;

            if(isset($data['food_order_id'])){

                $notification_type = "food_order";
                $rider_order['food_order_id'] = $data['food_order_id'];

                $if_order_assigned = $this->RiderOrder->ifFoodOrderHasAlreadyBeenAssigned($data['food_order_id']);


                if(count($if_order_assigned) > 0){

                    $rider_response = $if_order_assigned['RiderOrder']['rider_response'];
                    $rider_order_db_id = $if_order_assigned['RiderOrder']['id'];


                    if($rider_response == 1) {

                        $output['code'] = 201;

                        $output['msg'] = "You cannot assign this order to any other driver as it has been already accepted by the Driver";
                        echo json_encode($output);


                        die();
                    }else {


                        $this->RiderOrder->id = $rider_order_db_id;
                        $this->RiderOrder->saveField('rider_response', 2);
                        $this->RiderOrder->clear();
                    }

                }


               /* if ($this->RiderOrder->isDuplicateRecordFood($rider_user_id, $data['food_order_id']) > 0) {

                    echo Message::DUPLICATEDATE();
                    die();

                }*/

                $this->FoodOrder->id = $data['food_order_id'];
                $this->FoodOrder->saveField('status',1);
            }else{

                $notification_type = "parcel_order";

                if ($this->RiderOrder->isDuplicateRecordParcel($rider_user_id, $data['parcel_order_id']) > 0) {

                    echo Message::DUPLICATEDATE();
                    die();

                }
                $rider_order['parcel_order_id'] = $data['parcel_order_id'];
                $rider_order['assign_date_time'] = $created;


                $if_order_assigned = $this->RiderOrder->ifParcelOrderHasAlreadyBeenAssigned($data['parcel_order_id']);


                if(count($if_order_assigned) > 0){

                    $rider_response = $if_order_assigned['RiderOrder']['rider_response'];
                    $rider_order_db_id = $if_order_assigned['RiderOrder']['id'];


                    if($rider_response == 1) {

                        $output['code'] = 201;

                        $output['msg'] = "You cannot assign this order to any other driver as it has been already accepted by the Driver";
                        echo json_encode($output);


                        die();
                    }else {


                        $this->RiderOrder->id = $rider_order_db_id;
                        $this->RiderOrder->saveField('rider_response', 2);
                        $this->RiderOrder->clear();
                    }

                }
            }








                if ($this->RiderOrder->save($rider_order)) {

                    $rider_order_id = $this->RiderOrder->getInsertID();
                    $details = $this->RiderOrder->getDetails($rider_order_id);

                    $msg = "You have received the new order request";
                    $notification['to'] = $details['Rider']['device_token'];
                    $notification['notification']['title'] = $msg;
                    $notification['notification']['body'] = "";
                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";
                    $notification['notification']['type'] = $notification_type;
                    $notification['data']['title'] = $msg;
                    $notification['data']['body'] = '';
                    $notification['data']['icon'] = "";
                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $notification['data']['type'] = $notification_type;
                    $push = Utility::sendPushNotificationToMobileDevice(json_encode($notification));


                   
                    //$this->Order->id = $order_id;
                    //$this->Order->saveField('status',1);



                    $output['code'] = 200;

                    $output['msg'] = $details;
                    echo json_encode($output);


                    die();

                } else {


                    echo Message::DUPLICATEDATE();
                    die();
                }


        }
    }
    public function deleteTax()
    {

        $this->loadModel("Tax");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->Tax->getDetail($id);

            if(count($details) > 0){

                $this->Tax->id = $id;
                $this->Tax->delete();

                $details = $this->Tax->getDetail($id);
                if(count($details) < 1){
                    $output['code'] = 200;

                    $output['msg'] = "deleted successfully";
                    echo json_encode($output);

                    die();
                }else{

                    $output['code'] = 201;

                    $output['msg'] = "something went wrong";
                    echo json_encode($output);
                    die();
                }
            }else{

                $output['code'] = 201;

                $output['msg'] = "No tax details found";
                echo json_encode($output);
                die();

            }


        }
    }

    public function showCountries(){

        $this->loadModel('Country');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){
                $countries = $this->Country->getDetails($data['id']);


            }else {

                if(isset($data['active'])){

                    $active = $data['active'];

                    $countries = $this->Country->getCountriesAccordingToStatus($active);
                }else{

                    $countries = $this->Country->getAll();
                }


            }



            $output['code'] = 200;

            $output['msg'] = $countries;


            echo json_encode($output);


            die();


        }


    }


    public function addCountry(){

        $this->loadModel('Country');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $country['iso'] =  $data['iso'];
            $country['name'] =  $data['name'];

            $country['iso3'] =  $data['iso3'];
            $country['country_code'] =  $data['country_code'];
            $country['currency_code'] =  $data['currency_code'];
            $country['currency_symbol'] =  $data['currency_symbol'];
            $country['active'] =  $data['active'];

            if(isset($data['id'])) {


                $this->Country->id = $data['id'];
                $this->Country->save($country);

                $details = $this->Country->getDetails($data['id']);


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{


                $this->Country->save($country);

                $id = $this->Country->getInsertID();
                $details = $this->Country->getDetails($id);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();


            }
        }


    }

    public function deleteCountry(){

        $this->loadModel('Country');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $country_id = $data['country_id'];

            $details = $this->Country->getDetails($country_id);
            if(count($details) > 0 ) {

                $this->Country->id = $country_id;
                $this->Country->delete();

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }

    public function updateUserActiveStatus()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user['active'] = $data['active'];




            $user_id = $data['user_id'];


            $this->User->id = $user_id;
            $this->User->save($user);


            $output = array();
            $userDetails = $this->User->getUserDetailsFromID($user_id);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


        }
    }

    public function updateStoreActiveStatus()
    {


        $this->loadModel('Store');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $store['active'] = $data['active'];




            $store_id = $data['store_id'];

            if(APP_STATUS == "demo"){

                $output['code'] = 201;
                $output['msg'] = "You cannot change the status of the store in demo mode. contact the administrator";
                echo json_encode($output);
                die();

            }
            $this->Store->id = $store_id;
            $this->Store->save($store);


            $output = array();
            $userDetails = $this->Store->getDetails($store);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


        }
    }

    public function updateOrderStatus()
    {


        $this->loadModel('FoodOrder');
        $this->loadModel('ParcelOrder');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $order['status'] = $data['status'];
            $order['status_datetime'] = date('Y-m-d H:i:s', time());



            if(isset($data['food_order_id'])){
                $order_id = $data['food_order_id'];
                $this->FoodOrder->id = $order_id;
                $this->FoodOrder->save($order);
                $details = $this->FoodOrder->getDetails($order);
            }else{


                $order_id = $data['parcel_order_id'];
                $this->ParcelOrder->id = $order_id;
                $this->ParcelOrder->save($order);
                $details = $this->ParcelOrder->getDetails($order);
            }







            $output = array();



            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);


        }
    }
    public function addVehicleType()
    {



        $this->loadModel('VehicleType');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $vehicle_type['name'] =  $data['name'];
            $vehicle_type['description'] =  $data['description'];
            $vehicle_type['per_km_mile_charge'] =  $data['per_km_mile_charge'];



            if(isset($data['id'])){

                $id = $data['id'];
                $details =  $this->VehicleType->getDetails($id);
                if(count($details) > 0) {


                    if (isset($data['image'])) {


                        $image_db = $details['VehicleType']['image'];
                        if (strlen($image_db) > 5) {
                            @unlink($image_db);

                        }

                        $image = $data['image'];
                        $folder_url = UPLOADS_FOLDER_URI;

                        $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                        $vehicle_type['image'] = $filePath;


                    }


                    $this->VehicleType->id = $id;
                    $this->VehicleType->save($vehicle_type);

                    $details = $this->VehicleType->getDetails($id);

                    $output['code'] = 200;
                    $output['msg'] = $details;
                    echo json_encode($output);
                    die();
                }else{

                    Message::EMPTYDATA();
                    die();
                }

            }


            $if_exist = $this->VehicleType->ifExist($vehicle_type);
            if(count($if_exist) < 1) {
                if (isset($data['image'])) {

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $vehicle_type['image'] = $filePath;


                }


                $this->VehicleType->save($vehicle_type);
                $id = $this->VehicleType->getInsertID();
                $details = $this->VehicleType->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }else{
                Message::DUPLICATEDATE();
                die();

            }

        }




    }

    public function showVehicleTypes(){

        $this->loadModel('VehicleType');





        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $details =  $this->VehicleType->getDetails($data['id']);

            }else {


                $details = $this->VehicleType->getAll();

            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }
        }


    }
    public function deleteVehicleType(){

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('VehicleType');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->VehicleType->getDetails($id);
            if(count($details) > 0 ) {


                $this->VehicleType->delete($id,true);

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }


    public function addGoodType()
    {



        $this->loadModel('GoodType');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $good_type['name'] =  $data['name'];



            if(isset($data['id'])){

                $id = $data['id'];
                $details =  $this->GoodType->getDetails($id);
                if(count($details) > 0) {




                    $this->GoodType->id = $id;
                    $this->GoodType->save($good_type);

                    $details = $this->GoodType->getDetails($id);

                    $output['code'] = 200;
                    $output['msg'] = $details;
                    echo json_encode($output);
                    die();
                }else{

                    Message::EMPTYDATA();
                    die();
                }

            }


            $if_exist = $this->GoodType->ifExist($good_type);
            if(count($if_exist) < 1) {



                $this->GoodType->save($good_type);
                $id = $this->GoodType->getInsertID();
                $details = $this->GoodType->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }else{
                Message::DUPLICATEDATE();
                die();

            }

        }





    }

    public function showGoodTypes(){

        $this->loadModel('GoodType');





        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $details =  $this->GoodType->getDetails($data['id']);

            }else {


                $details = $this->GoodType->getAll();

            }




            if(count($details) > 0) {


                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }
        }


    }
    public function deleteGoodType(){

        $this->loadModel('GoodType');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->GoodType->getDetails($id);
            if(count($details) > 0 ) {


                $this->GoodType->delete($id,true);

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }
    public function featuredCategory()
    {


        $this->loadModel('Category');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $category['featured'] = $data['featured'];
            $category_id = $data['category_id'];






            $this->Category->id = $category_id;
            $this->Category->save($category);


            $output = array();
            $userDetails = $this->Category->getDetails($category_id);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


        }
    }


    public function addProduct()
    {


        $this->loadModel('Product');
        $this->loadModel('ProductImage');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $store_id = $data['store_id'];
            $category_id = $data['category_id'];
            $title = $data['title'];
            $price = $data['price'];
            $sale_price = $data['sale_price'];
            $description = $data['description'];

            $created = date('Y-m-d H:i:s', time());


            $product['store_id'] = $store_id;
            $product['category_id'] = $category_id;
            $product['title'] = $title;
            $product['price'] = $price;
            $product['sale_price'] = $sale_price;
            $product['description'] = $description;


            $folder_url = UPLOADS_FOLDER_URI;


            if (isset($data['id'])) {
                $product_id = $data['id'];
                $product['updated'] = $created;


                $this->Product->id = $product_id;
                $this->Product->save($product);
                $details = $this->Product->getDetails($product_id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();
            } else {

                $product['created'] = $created;
                $this->Product->save($product);
                $product_id = $this->Product->getInsertID();
                $details = $this->Product->getDetails($product_id);

                if (isset($data['images'])) {
                    if (count($data['images']) > 0) {

                        $images = $data['images'];
                        $product_images = $this->ProductImage->getProductImageAgainstProductID($product_id);
                        if (count($product_images) > 0) {
                            foreach ($product_images as $product_image) {

                                $product_db_image = $product_image['ProductImage']['image'];
                                if (strlen($product_db_image) > 5) {
                                    @unlink($product_db_image);

                                }
                            }

                            $this->ProductImage->deleteAll(array(
                                'product_id' => $product_id
                            ), false);
                        }
                        foreach ($images as $k => $v) {


                            $filePath = Utility::uploadFileintoFolderDir($v['image'], $folder_url);

                            $images[$k]['image'] = $filePath;
                            $images[$k]['product_id'] = $product_id;
                            $images[$k]['created'] = $created;

                        }

                        $this->ProductImage->saveAll($images);
                    }


                }


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }
        }



    }


    public function addProductImages()
    {


        $this->loadModel('Product');
        $this->loadModel('ProductImage');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $product_id = $data['product_id'];

            $created = date('Y-m-d H:i:s', time());



            $folder_url = UPLOADS_FOLDER_URI;



            $details = $this->Product->getDetails($product_id);

            if (count($details > 0)) {



                if (isset($data['images'])) {
                    if (count($data['images']) > 0) {


                        $images = $data['images'];
                        $product_images = $this->ProductImage->getProductImageAgainstProductID($product_id);
                        if(count($product_images) > 0) {
                            foreach ($product_images as $product_image) {

                                $product_db_image = $product_image['ProductImage']['image'];
                                if (strlen($product_db_image) > 5) {
                                    @unlink($product_db_image);

                                }
                            }

                            $this->ProductImage->deleteAll(array(
                                'product_id' => $product_id
                            ), false);
                        }
                        foreach ($images as $k => $v) {




                            $filePath = Utility::uploadFileintoFolderDir($v['image'], $folder_url);

                            $images[$k]['image'] = $filePath;
                            $images[$k]['product_id'] = $product_id;
                            $images[$k]['created'] = $created;

                        }

                        $this->ProductImage->saveAll($images);
                    }





                }

                $details = $this->Product->getDetails($product_id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();
            }else{

                Message::EMPTYDATA();
                die();

            }


        }
    }

    public function deleteProduct(){

        $this->loadModel('Product');
        $this->loadModel('ProductImage');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $product_id = $data['product_id'];
            $details = $this->Product->getDetails($product_id);

            if (count($details > 0)) {


                $product_images = $this->ProductImage->getProductImageAgainstProductID($product_id);

                if (count($product_images) > 0) {
                    foreach ($product_images as $product_image) {

                        $product_db_image = $product_image['ProductImage']['image'];
                        if (strlen($product_db_image) > 5) {
                            @unlink($product_db_image);

                        }
                    }

                    $this->Product->deleteAll(array(
                        'Product.id' => $product_id
                    ), true);
                }


                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();
            }

        }


    }


    public function deleteProductSingleImage(){

        $this->loadModel('Product');
        $this->loadModel('ProductImage');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $product_image_id = $data['product_image_id'];
            $details = $this->ProductImage->getDetails($product_image_id);

            if (count($details > 0)) {






                $product_db_image = $details['ProductImage']['image'];
                if (strlen($product_db_image) > 5) {
                    @unlink($product_db_image);

                }

                $this->ProductImage->id = $product_image_id;
                $this->ProductImage->delete();


                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();
            }

        }


    }

    public function addUser()
    {

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }

        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $email = $data['email'];
            $password = $data['password'];
            $first_name = $data['first_name'];
            $phone = $data['phone'];
            $country_id = $data['country_id'];

            $last_name = $data['last_name'];
            $role = $data['role'];



            $created = date('Y-m-d H:i:s', time());


            if ($email != null && $password != null) {


                //$ip  = $data['ip'];

                $user['email'] = $email;
                $user['password'] = $password;
                $user['phone'] = $phone;
                $user['country_id'] = $country_id;
                $user['first_name'] = $first_name;
                $user['last_name'] = $last_name;
                $user['role'] = strtolower($role);
                $user['created'] = $created;


                $count = $this->User->isEmailAlreadyExist($email);



                if ($count && $count > 0) {
                    echo Message::DATAALREADYEXIST();
                    die();

                } else {


                    if (!$this->User->save($user)) {
                        echo Message::DATASAVEERROR();
                        die();
                    }

                    $user_id = $this->User->getInsertID();


                    $output = array();
                    $userDetails = $this->User->getUserDetailsFromID($user_id);

                    //CustomEmail::welcomeStudentEmail($email);
                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);


                }
            } else {
                echo Message::ERROR();
            }
        }
    }

    public function addCategory()
    {



        $this->loadModel('Category');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $cat['name'] =  $data['name'];
            // $cat['store_id'] =  $data['store_id'];

            $cat['description'] =  $data['description'];
            $cat['level'] = $data['level'];

            if(isset($data['id'])){

                $id = $data['id'];



                if (isset($data['image'])) {

                    $details =  $this->Category->getDetails($id);
                    $image_db = $details['Category']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_CATEGORY_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $cat['image'] = $filePath;



                }



                $this->Category->id = $id;
                $this->Category->save($cat);
                $details =  $this->Category->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }else {

                if (isset($data['image'])) {

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_CATEGORY_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $cat['image'] = $filePath;


                }


                $this->Category->save($cat);
                $id = $this->Category->getInsertID();
                $details = $this->Category->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }

        }




    }

    public function showCategories(){

        $this->loadModel('Category');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $categories = $this->Category->getAll();
            if(isset($data['category_id'])){

                $categories = $this->Category->getDetails($data['category_id']);
            }

            if(isset($data['level'])){

                $categories = $this->Category->getCategoriesAgainstLevel($data['level']);
            }






            $output['code'] = 200;

            $output['msg'] = $categories;



            echo json_encode($output);


            die();


        }


    }



    public function deleteCategory(){

        $this->loadModel('Category');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $category_id = $data['category_id'];



            $this->Category->id = $category_id;
            $this->Category->saveField('active',0);





            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }

    public function addStore()
    {



        $this->loadModel('Store');
        $this->loadModel('StoreLocation');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $cat['name'] =  $data['name'];
            $cat['user_id'] =  $data['user_id'];
            $cat['about'] =  $data['about'];
            $cat['shipping_base_fee'] =  $data['shipping_base_fee'];
            $cat['shipping_fee_per_distance'] =  $data['shipping_fee_per_distance'];
            $cat['distance_unit'] =  $data['distance_unit'];

            $store_location['lat'] = $data['lat'];
            $store_location['long'] = $data['long'];
            $store_location['city'] = $data['city'];
            $store_location['state'] = $data['state'];
            $store_location['country_id'] = $data['country_id'];
            $store_location['zip_code'] = $data['zip_code'];


            if(isset($data['id'])){

                $id = $data['id'];

                $store_location_details = $this->StoreLocation->getStoreLocation($id);
                if(count($store_location_details) > 0){

                    $store_location_id = $store_location_details['StoreLocation']['id'];
                    $this->StoreLocation->id = $store_location_id;
                    $this->StoreLocation->save($store_location);

                }

                if (isset($data['logo'])) {

                    $details =  $this->Store->getDetails($id);
                    $image_db = $details['Store']['logo'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['logo'];
                    $folder_url = UPLOADS_FOLDER_STORE_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $cat['logo'] = $filePath;



                }

                if (isset($data['cover'])) {

                    $details =  $this->Store->getDetails($id);
                    $image_db = $details['Store']['cover'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['cover'];
                    $folder_url = UPLOADS_FOLDER_STORE_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $cat['cover'] = $filePath;



                }


                $details =  $this->Store->getDetails($id);
                $this->Store->id = $id;
                $this->Store->save($cat);




                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }else {

                if (isset($data['logo'])) {

                    $image = $data['logo'];
                    $folder_url = UPLOADS_FOLDER_STORE_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $cat['logo'] = $filePath;


                }

                if (isset($data['cover'])) {

                    $image = $data['cover'];
                    $folder_url = UPLOADS_FOLDER_STORE_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $cat['cover'] = $filePath;


                }


                $this->Store->save($cat);
                $id = $this->Store->getInsertID();

                $store_location['store_id'] = $id;
                $this->StoreLocation->save($store_location);

                $details = $this->Store->getDetails($id);



                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }

        }




    }


    public function addStoreImageAndCover(){



        $this->loadModel('Store');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $store_id = $data['store_id'];
            $cat = array();

            if (isset($data['logo'])) {

                $details = $this->Store->getDetails($store_id);
                $image_db = $details['Store']['logo'];
                if (strlen($image_db) > 5) {
                    @unlink($image_db);

                }

                $image = $data['logo'];
                $folder_url = UPLOADS_FOLDER_STORE_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $cat['logo'] = $filePath;


            }

            if (isset($data['cover'])) {

                $details = $this->Store->getDetails($store_id);
                $image_db = $details['Store']['cover'];
                if (strlen($image_db) > 5) {
                    @unlink($image_db);

                }

                $image = $data['cover'];
                $folder_url = UPLOADS_FOLDER_STORE_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $cat['cover'] = $filePath;


            }
            $details = $this->Store->getDetails($store_id);

            if(count($cat) > 0) {

                $this->Store->id = $store_id;
                $this->Store->save($cat);
                $details = $this->Store->getDetails($store_id);



            }

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();
        }
    }

    public function showStores(){

        $this->loadModel('Store');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $stores = $this->Store->getAll();
            if(isset($data['store_id'])){

                $stores = $this->Store->getDetails($data['store_id']);
            }






            $output['code'] = 200;

            $output['msg'] = $stores;



            echo json_encode($output);


            die();


        }


    }


    public function addAdminUser()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('Admin');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $email = $data['email'];
            $password = $data['password'];
            $first_name = $data['first_name'];
            $last_name = $data['last_name'];
            $role = $data['role'];



            $created = date('Y-m-d H:i:s', time());


            if ($email != null && $password != null) {


                //$ip  = $data['ip'];

                $user['email'] = $email;
                $user['password'] = $password;
                $user['first_name'] = $first_name;

                $user['last_name'] = $last_name;
                $user['role'] = $role;
                $user['created'] = $created;


                $count = $this->Admin->isEmailAlreadyExist($email);



                if ($count && $count > 0) {
                    echo Message::DATAALREADYEXIST();
                    die();

                } else {


                    if (!$this->Admin->save($user)) {
                        echo Message::DATASAVEERROR();
                        die();
                    }

                    $user_id = $this->Admin->getInsertID();


                    $output = array();
                    $userDetails = $this->Admin->getUserDetailsFromID($user_id);

                    //CustomEmail::welcomeStudentEmail($email);
                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);


                }
            } else {
                echo Message::ERROR();
            }
        }
    }


    public function editAdminUser()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('Admin');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $email = $data['email'];

            $first_name = $data['first_name'];
            $last_name = $data['last_name'];
            $role = $data['role'];

            $created = date('Y-m-d H:i:s', time());


            $user['email'] = $email;

            $user['first_name'] = $first_name;

            $user['last_name'] = $last_name;
            $user['role'] = $role;
            $user['created'] = $created;


            $user_id = $data['id'];



            $userDetails = $this->Admin->getUserDetailsFromID($user_id);
            if(count($userDetails)) {
                $this->Admin->id = $user_id;
                $this->Admin->save($user);


                $output = array();
                $userDetails = $this->Admin->getUserDetailsFromID($user_id);


                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);

            }else{
                Message::EMPTYDATA();
                die();


            }
        }
    }

    public function showAdminUsers(){

        $this->loadModel('Admin');




        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $details = $this->Admin->getUserDetailsFromID($data['id']);


            }else{


                $details = $this->Admin->getAll();

            }

            if(count($details) > 0) {

                $output['code'] = 200;

                $output['msg'] = $details;
                echo json_encode($output);


                die();
            }else{
                Message::EMPTYDATA();
                die();
            }
        }

    }

    public function showRestaurants()
    {

        $this->loadModel("Restaurant");
        $this->loadModel("RestaurantRating");

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){


                $restaurants = $this->Restaurant->getDetails($data['id']);

                if(count($restaurants) > 0){
                $ratings = $this->RestaurantRating->getAvgRatings($data['id']);

                if (count($ratings) > 0) {
                    $restaurants['TotalRatings']["avg"] = $ratings[0]['average'];
                    $restaurants['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];





                }

                    $output['code'] = 200;

                    $output['msg'] = $restaurants;
                    echo json_encode($output);


                    die();

                }else{

                    Message::EMPTYDATA();
                    die();

                }
            }

            $restaurants = $this->Restaurant->getAllRestaurants();


            $i = 0;
            foreach ($restaurants as $rest) {
                $ratings = $this->RestaurantRating->getAvgRatings($rest['Restaurant']['id']);

                if (count($ratings) > 0) {
                    $restaurants[$i]['TotalRatings']["avg"] = $ratings[0]['average'];
                    $restaurants[$i]['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                }
                $i++;

            }
            $output['code'] = 200;

            $output['msg'] = $restaurants;
            echo json_encode($output);


            die();
        }
    }

    public function showUserRestaurant()
    {

        $this->loadModel("Restaurant");
        $this->loadModel("RestaurantRating");

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];



                $restaurant_details = $this->Restaurant->isRestaurantExist($user_id);

                if(count($restaurant_details) > 0){
                    $ratings = $this->RestaurantRating->getAvgRatings($restaurant_details['Restaurant']['id']);

                    if (count($ratings) > 0) {
                        $restaurant_details['Restaurant']['TotalRatings']["avg"] = $ratings[0]['average'];
                        $restaurant_details['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];





                    }

                    $output['code'] = 200;

                    $output['msg'] = $restaurant_details;
                    echo json_encode($output);


                    die();

                }else{

                    Message::EMPTYDATA();
                    die();

                }
            }



    }

    public function addFoodCategory()
    {


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('FoodCategory');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $post_data['title'] =  $data['title'];


            if(isset($data['id'])){

                $id = $data['id'];



                if (isset($data['image'])) {

                    $details =  $this->FoodCategory->getDetails($id);
                    $image_db = $details['FoodCategory']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $post_data['image'] = $filePath;



                }

                if (isset($data['icon'])) {

                    $details =  $this->FoodCategory->getDetails($id);
                    $image_db = $details['FoodCategory']['icon'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['icon'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $post_data['icon'] = $filePath;



                }


                $this->FoodCategory->id = $id;
                $this->FoodCategory->save($post_data);
                $details =  $this->FoodCategory->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }

            if (isset($data['image'])) {

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $post_data['image'] = $filePath;



            }


            if (isset($data['icon'])) {

                $image = $data['icon'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $post_data['icon'] = $filePath;



            }







            $this->FoodCategory->save($post_data);
            $id = $this->FoodCategory->getInsertID();
            $details =  $this->FoodCategory->getDetails($id);

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();




        }



    }

    public function deleteFoodCategory(){

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('FoodCategory');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $category_id = $data['id'];



            $this->FoodCategory->id = $category_id;
            $this->FoodCategory->delete();





            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }




    public function addTopicCategory()
    {



        $this->loadModel('TopicCategory');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $post_data['name'] =  $data['name'];


            if(isset($data['id'])){

                $id = $data['id'];



                if (isset($data['image'])) {

                    $details =  $this->TopicCategory->getDetails($id);
                    $image_db = $details['TopicCategory']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $post_data['image'] = $filePath;



                }




                $this->TopicCategory->id = $id;
                $this->TopicCategory->save($post_data);
                $details =  $this->TopicCategory->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }

            if (isset($data['image'])) {

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $post_data['image'] = $filePath;



            }



            $this->TopicCategory->save($post_data);
            $id = $this->TopicCategory->getInsertID();
            $details =  $this->TopicCategory->getDetails($id);

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();




        }




    }


    public function showMainCategories(){

        $this->loadModel('MainCategory');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $categories = $this->MainCategory->getAll();


            //pr($categories);


            $output['code'] = 200;

            $output['msg'] = $categories;
            $output['msg'] = $categories;


            echo json_encode($output);


            die();


        }


    }

    public function deleteAdmin(){

        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('Admin');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $details = $this->Admin->getUserDetailsFromID($user_id);
            if(count($details) > 0 ) {

                $this->Admin->id = $user_id;
                $this->Admin->delete();

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }
    public function showAllUsers(){

        $this->loadModel('User');




        if ($this->request->isPost()) {




            $users = $this->User->getAll();





            $output['code'] = 200;

            $output['msg'] = $users;


            echo json_encode($output);


            die();


        }


    }


    public function addPaymentMethod(){

        $this->loadModel('PaymentMethod');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $payment_method['status'] = $data['status'];
                $payment_method['key'] = $data['key'];
                $this->PaymentMethod->id = $data['id'];
                $this->PaymentMethod->save($payment_method);

                $details = $this->PaymentMethod->getDetails($data['id']);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }


            $payment_method['status'] = $data['status'];
            $payment_method['key'] = $data['key'];
            $payment_method['name'] = $data['name'];

            $count = $this->PaymentMethod->checkDuplicate($payment_method);

            if($count < 1) {


                $this->PaymentMethod->save($payment_method);
                $id = $this->PaymentMethod->getInsertID();
                $details = $this->PaymentMethod->getDetails($id);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();
            }else{



                $output['code'] = 201;

                $output['msg'] = "duplicate";


                echo json_encode($output);


                die();
            }


        }

    }


    public function assignFoodCategoryToRestaurant(){

        $this->loadModel('RestaurantCategory');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

           $restaurant_id = $data['restaurant_id'];
           $food_category_ids = $data['food_category_ids'];
            $post_data = array();
           $i = 0;


           if(APP_STATUS == "demo"){



               $output['code'] = 201;

               $output['msg'] = "Sorry this feature is disabled in demo mode";


               echo json_encode($output);


               die();
           }
            $this->RestaurantCategory->deleteAllRestaurantCategory($restaurant_id);
           if(count($food_category_ids) > 0){

               foreach ($food_category_ids as $key=> $val){

                   $details = $this->RestaurantCategory->checkDuplicate($val['food_category_id'],$restaurant_id);

                   if(count($details) < 1) {
                       $post_data[$i]['restaurant_id'] = $restaurant_id;
                       $post_data[$i]['food_category_id'] = $val['food_category_id'];
                       $i++;

                   }

               }
               

               if(count($post_data) > 0) {


                   $this->RestaurantCategory->saveAll($post_data);


               }
           }



            $output['code'] = 200;

            $output['msg'] = "success";


            echo json_encode($output);


            die();







        }

    }

    public function unAssignFoodCategoryToRestaurant(){

        $this->loadModel('RestaurantCategory');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];



            $details = $this->RestaurantCategory->getDetails($id);

            if(count($details) > 0){





                $this->RestaurantCategory->id = $details['RestaurantCategory']['id'];
               $this->RestaurantCategory->delete();


                $output['code'] = 200;

                $output['msg'] = "success";


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();

            }







        }

    }


    public function addSettings(){

        $this->loadModel('Setting');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['id'])){

                $contact['source'] = $data['source'];
                $contact['type'] = $data['type'];

                if(isset($data['category'])){


                    $contact['category'] = $data['category'];
                }

                $details = $this->Setting->getDetails($data['id']);

                if (isset($data['image'])) {


                    $image_db = $details['Setting']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $contact['image'] = $filePath;



                }



                $this->Setting->id = $data['id'];
                $this->Setting->save($contact);

                $details = $this->Setting->getDetails($data['id']);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }


            $contact['source'] = $data['source'];
            $contact['type'] = $data['type'];

            if (isset($data['image'])) {




                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $contact['image'] = $filePath;



            }





            $this->Setting->save($contact);
            $id = $this->Setting->getInsertID();
            $details = $this->Setting->getDetails($id);

            $output['code'] = 200;

            $output['msg'] = $details;


            echo json_encode($output);


            die();



        }

    }


    public function activateSettings(){

        $this->loadModel('Setting');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $category = $data['category'];
            $active = $data['active'];
            $type = $data['type'];


            $details = $this->Setting->getSettingsAgainstCategoryAndType($category,$type);
            if(count($details) > 0) {

                //first deactivate all settings
                $this->Setting->updateSettingsAgainstCategory($category, 0);


                //only active single category setting
                $this->Setting->updateSettingsAgainstCategoryAndType($category, $active,$type);

                $details = $this->Setting->getSettingsAgainstCategory($category);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);


                die();

            }else{

                $output['code'] = 200;
                $output['msg'] = "no category in the database with this name";
                echo json_encode($output);


                die();


            }
        }




    }


    public function test(){

        $result = Utility::sendSmsVerification("03137370772","hello");

        echo json_encode($result);


        die();
    }

    public function deleteSettings(){

        $this->loadModel('Setting');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->Setting->getDetails($data['id']);
            if(count($details) > 0 ) {

                $this->Setting->id = $id;
                $this->Setting->delete();

                $output['code'] = 200;

                $output['msg'] = "deleted";


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }


    public function updateDefaultCountry(){

        $this->loadModel('Country');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];
            $country['default'] = $data['default'];
            $country['active'] = $data['active'];
            $this->Country->setDefaultToZero();
            $details = $this->Country->getDetails($data['id']);
            if(count($details) > 0 ) {

                $this->Country->id = $id;
                $this->Country->save($country);

                $details = $this->Country->getDetails($data['id']);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }


    public function updateDefaultCity(){

        $this->loadModel('City');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];
            //$city['default'] = $data['default'];


            $details = $this->City->getDetails($data['id']);
            if(count($details) > 0 ) {

                $this->City->id = $id;
                $this->City->saveField('default',$data['default']);

                $details = $this->City->getDetails($data['id']);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "Invalid id: Do not exist";


                echo json_encode($output);


                die();


            }

        }




    }



    public function showCities()
    {


        $this->loadModel("City");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $country_id = $data['country_id'];


            $cities = $this->City->getCitiesAgainstCountry($country_id);



            $output['code'] = 200;

            $output['msg'] = $cities;


            echo json_encode($output);


            die();


        }
    }






    public function deleteSubCategory(){

        $this->loadModel('SubCategory');
        $this->loadModel('FeaturedCategory');
        $this->loadModel('Form');
        $this->loadModel('Option');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];
            $this->SubCategory->delete($id);

            $forms =  $this->Form->getFormAgainstCategoryID($id);
            foreach ($forms as $form){


                $form_id = $form['Form']['id'];
                $this->Option->deleteAllOptions($form_id);


            }
            $this->Form->deleteAllFields($id);
            $this->FeaturedCategory->deleteFeaturedSubCategory($id);




            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }










    public function changeAdminPassword()
    {
        $this->loadModel('Admin');


        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);


            $user_id        = $data['user_id'];




            $new_password   = $data['password'];




            $this->request->data['password'] = $new_password;
            $this->Admin->id                  = $user_id;


            if ($this->Admin->save($this->request->data)) {

                $user_info = $this->Admin->getUserDetailsFromID($user_id);
                $result['code'] = 200;
                $result['msg']  = $user_info;
                echo json_encode($result);
                die();
            } else {


                echo Message::DATASAVEERROR();
                die();


            }

        } else {

            echo Message::INCORRECTPASSWORD();
            die();




        }

    }
    public function currentAdminChangePassword()
    {
        if(APP_STATUS == "demo"){



            $output['code'] = 201;

            $output['msg'] = "Sorry this feature is disabled in demo mode";


            echo json_encode($output);


            die();
        }
        $this->loadModel('Admin');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id        = $data['user_id'];
            $this->Admin->id = $user_id;
            $email          = $this->Admin->field('email');

            $old_password   = $data['old_password'];
            $new_password   = $data['new_password'];


            if ($this->Admin->verifyPassword($email, $old_password)) {

                $this->request->data['password'] = $new_password;
                $this->Admin->id                  = $user_id;


                if ($this->Admin->save($this->request->data)) {

                    $user_info = $this->Admin->getUserDetailsFromID($user_id);
                    $result['code'] = 200;
                    $result['msg']  = $user_info;
                    echo json_encode($result);
                    die();
                } else {


                    echo Message::DATASAVEERROR();
                    die();


                }

            } else {

                echo Message::INCORRECTPASSWORD();
                die();

            }


        }

    }






}