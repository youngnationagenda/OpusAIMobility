<?php

App::uses('Utility', 'Lib');
App::uses('Message', 'Lib');
App::uses('CustomEmail', 'Lib');
class ApiController extends AppController
{

    //public $components = array('Email');

    public $autoRender = false;
    public $layout = false;


    public function beforeFilter()
    {



        $this->loadModel('User');
        $json = file_get_contents('php://input');
        $json_error = Utility::isJsonError($json);

        if ($this->request->isPost()) {

            if (!function_exists('apache_request_headers')) {
                $headers = Utility::apache_request_headers();
            } else {
                $headers = apache_request_headers();
            }


            $user_id = 0;
            if (array_key_exists("User-Id", $headers)) {
                $user_id = $headers['User-Id'];

            } else if (array_key_exists("USER-ID", $headers)) {

                $user_id = $headers['USER-ID'];
            }


            if (array_key_exists("Auth-Token", $headers)) {
                $auth_token = $headers['Auth-Token'];

            } else if (array_key_exists("AUTH-TOKEN", $headers)) {

                $auth_token = $headers['AUTH-TOKEN'];
            }


            $client_api_key = 0;
            if (array_key_exists("Api-Key", $headers)) {
                $client_api_key = $headers['Api-Key'];

            } else if (array_key_exists("API-KEY", $headers)) {

                $client_api_key = $headers['API-KEY'];
            }


            if ($client_api_key > 0) {


                if ($client_api_key != API_KEY) {

                    Message::ACCESSRESTRICTED();
                    die();

                }
            } else {
                $output['code'] = 201;
                $output['msg'] = "API KEY is missing";

                echo json_encode($output);
                die();

            }

            if ($user_id > 0) {


                $userDetails = $this->User->getUserDetailsFromID($user_id);

                if (count($userDetails) > 0) {
                    $social = $userDetails['User']['social'];
                    $db_auth_token = $userDetails['User']['auth_token'];
                    $active = $userDetails['User']['active'];
                    if($active > 1){


                        $output['code'] = 501;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    if ($social == "facebook") {
                        return true;
                        $verify = Utility::getFacebookUserInfo($auth_token);

                        if ($verify) {

                            return true;
                        } else {


                            $output['code'] = 501;
                            $output['msg'] = "invalid facebook token";

                            echo json_encode($output);
                            die();
                        }

                    } else if ($social == "google") {

                        $verify = Utility::getGoogleUserInfo($auth_token);
                        return true;
                        if ($verify) {

                            return true;


                        } else {
                            return true;
                            $output['code'] = 501;
                            $output['msg'] = "invalid google token";

                            echo json_encode($output);
                            die();

                        }

                    } else if (strlen($social) < 2) {


                        if ($db_auth_token == $auth_token) {

                            return true;

                        } else {


                            $output['code'] = 501;
                            $output['msg'] = "invalid application token";

                            echo json_encode($output);
                            die();
                        }
                    }


                }
            }

            if ($json_error == "false") {


                return true;


            } else {

                return true;
                $output['code'] = 202;
                $output['msg'] = $json_error;

                echo json_encode($output);
                die();


            }
        }
    }




    public function index(){


        echo "Congratulations!. You have configured your mobile api correctly";

    }

    public function registerUser()
    {


        $this->loadModel('User');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $user['created'] = date('Y-m-d H:i:s', time());








            if(isset($data['role'])) {

                $user['role'] = $data['role'];
            }

            if(isset($data['phone'])) {

                $user['phone'] = $data['phone'];
            }




            if(isset($data['country_id'])) {

                $user['country_id'] = $data['country_id'];
            }


            if(isset($data['first_name'])){

                $first_name = $data['first_name'];
                $last_name = $data['last_name'];


                $user['first_name'] = $first_name;


                $user['last_name'] = $last_name;
            }

            if(isset($data['username'])){

                $username = $data['username'];

                if(preg_match('/[^a-z_\-0-9]/i', $username)){
                    $output['code'] = 201;
                    $output['msg'] = "invalid username";
                    echo json_encode($output);
                    die();

                }



                $user['username'] = $username;



            }


            if(isset($data['social']) && !isset($data['dob'])){
                $social_id = $data['social_id'];
                $auth_token = $data['auth_token'];
                $social = $data['social'];
                $user_details = $this->User->isSocialIDAlreadyExist($social_id);

                if(count($user_details) > 0 ){

                    $active = $user_details['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    if($social == "facebook"){

                        $verify = Utility::getFacebookUserInfo($auth_token);
                        $verify = true;
                        if($verify){

                            //$this->User->id = $user_details['User']['id'];
                            //$this->User->saveField('auth_token',$auth_token);

                            $output['code'] = 200;
                            $output['msg'] = $user_details;
                            echo json_encode($output);
                            die();

                        }else{

                            $output['code'] = 201;
                            $output['msg'] = "token invalid";
                            echo json_encode($output);
                            die();


                        }

                    }

                    if($social == "google"){

                        $verify = Utility::getGoogleUserInfo($auth_token);
                        $verify = true;
                        if($verify){

                            // $this->User->id = $user_details['User']['id'];
                            // $this->User->saveField('auth_token',$auth_token);

                            $output['code'] = 200;
                            $output['msg'] = $user_details;
                            echo json_encode($output);
                            die();

                        }else{
                            return true;

                            $output['code'] = 201;
                            $output['msg'] = "token invalid";
                            echo json_encode($output);
                            die();


                        }

                    }



                    $output['code'] = 200;
                    $output['msg'] = $user_details;
                    echo json_encode($output);
                    die();

                }else{


                    $output['code'] = 201;
                    $output['msg'] = "open registration screen";
                    echo json_encode($output);
                    die();

                }
            }


            if(isset($data['social']) && isset($data['dob'])){
                $social = $data['social'];
                $auth_token = $data['auth_token'];
                $user['social_id'] = $data['social_id'];
                $user['social'] = $social;
                $user['dob'] = $data['dob'];

                if(isset($data['gender'])){

                    $user['gender'] = $data['gender'];
                }

                if (isset($data['profile_pic'])) {


                    $user['profile_pic'] = $data['profile_pic'];
                }
                $user['email'] = $data['email'];
                /* $username_count = $this->User->isUsernameAlreadyExist($username);
                 if($username_count > 0){

                     $output['code'] = 201;
                     $output['msg'] = "This username isn't available";
                     echo json_encode($output);
                     die();
                 }*/




                if($social == "facebook") {

                    $verify = Utility::getFacebookUserInfo($auth_token);
                    $verify = true;
                    if (!$verify) {


                        $output['code'] = 201;
                        $output['msg'] = "invalid token";
                        echo json_encode($output);
                        die();

                    }
                }

                if($social == "google") {

                    $verify = Utility::getGoogleUserInfo($auth_token);
                    $verify = true;
                    if (!$verify) {


                        $output['code'] = 201;
                        $output['msg'] = "invalid token";
                        echo json_encode($output);
                        die();

                    }
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

            if(!isset($data['social']) && isset($data['email'])){

                $session_token = Utility::generateSessionToken();
                $user['dob'] = $data['dob'];
                $user['auth_token'] = $session_token;
                $user['username'] = $username;
                $user['password'] = $data['password'];
                $user['email'] = $data['email'];

                if(isset($data['gender'])){

                    $user['gender'] = $data['gender'];
                }

                if (isset($data['image'])) {


                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $user['image'] = $filePath;
                }



                $email_count = $this->User->isEmailAlreadyExist($data['email']);
                if($email_count > 0){

                    $user_details  = $this->User->getUserDetailsAgainstEmail($data['email']);
                    $active = $user_details['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    $output['code'] = 201;
                    $output['msg'] = "The account already exist with this email";
                    echo json_encode($output);
                    die();
                }
                $username_count = $this->User->isUsernameAlreadyExist($data['username']);
                if($username_count > 0){

                    $user_details  = $this->User->getUserDetailsAgainstUsername($data['username']);
                    $active = $user_details['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    /* $output['code'] = 201;
                     $output['msg'] = "This username isn't available";
                     echo json_encode($output);
                     die();*/
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


            if(isset($data['phone']) && !isset($data['dob'])) {
                //login

                $user['phone'] = $data['phone'];


                $phone_exist = $this->User->isphoneNoAlreadyExist($data['phone']);

                if (count($phone_exist) > 0) {


                    $active = $phone_exist['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    if (isset($data['profile_pic'])) {


                        $image = $data['profile_pic'];
                        $folder_url = image;

                        $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                        $user['image'] = $filePath;
                    }
                    $session_token = Utility::generateSessionToken();
                    $user['auth_token'] = $session_token;
                    $this->User->id = $phone_exist['User']['id'];




                    $this->User->save($user);
                    $userDetails = $this->User->getUserDetailsFromID($phone_exist['User']['id']);



                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);
                    die();
                } else {

                    $output['code'] = 201;
                    $output['msg'] = "open register screen";
                    echo json_encode($output);
                    die();

                }

            }else  if(isset($data['phone']) && isset($data['dob'])){

                //register
                $session_token = Utility::generateSessionToken();
                $user['phone'] = $data['phone'];
                $user['auth_token'] = $session_token;

                $user['username'] = $username;
                $user['dob'] = $data['dob'];

                if(isset($data['gender'])){

                    $user['gender'] = $data['gender'];
                }

                if(isset($data['first_name'])){

                    $user['first_name'] = $data['first_name'];
                    $user['last_name'] = $data['last_name'];
                }

                $phone_exist = $this->User->isphoneNoAlreadyExist($data['phone']);

                if (count($phone_exist) > 0) {

                    $output['code'] = 200;
                    $output['msg'] = "Phone already exist";
                    echo json_encode($output);
                    die();
                }

                $username_count = $this->User->isUsernameAlreadyExist($data['username']);
                /*if($username_count > 0){

                    $output['code'] = 201;
                    $output['msg'] = "This username isn't available";
                    echo json_encode($output);
                    die();
                }*/
                if (isset($data['image'])) {


                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $user['image'] = $filePath;
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
    public function registerUserold()
    {


        $this->loadModel('User');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(count($data) == 1 && isset($data['email'])){

                $email_count = $this->User->isEmailAlreadyExist($data['email']);
                if($email_count > 0){



                    $output['code'] = 200;
                    $output['msg'] = "email already existed. Go to Login Screen";
                    echo json_encode($output);
                    die();

                }else{

                    $output['code'] = 201;
                    $output['msg'] = "open registration screen";
                    echo json_encode($output);
                    die();

                }

            }

            $user['created'] = date('Y-m-d H:i:s', time());

            if(isset($data['role'])) {

                $user['role'] = $data['role'];
            }

            if(isset($data['username'])) {

                $user['username'] = $data['username'];
            }

            if(isset($data['country_id'])) {

                $user['country_id'] = $data['country_id'];
            }

            if(isset($data['gender'])){

                $user['gender'] = strtolower($data['gender']);
            }

            if(isset($data['password'])){

                $user['password'] = strtolower($data['password']);
            }
            if(isset($data['phone'])) {

                $user['phone'] = $data['phone'];
            }
            if(isset($data['dob'])){

                $user['dob'] = strtolower($data['dob']);
            }
            if (isset($data['image'])) {


                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $user['image'] = $filePath;
            }



            if(isset($data['social']) && !isset($data['dob'])){
                $social_id = $data['social_id'];
                $auth_token = $data['auth_token'];
                $social = $data['social'];
                $user_details = $this->User->isSocialIDAlreadyExist($social_id);

                if(count($user_details) > 0 ){

                    $active = $user_details['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    if($social == "facebook"){

                        $verify = Utility::getFacebookUserInfo($auth_token);
                        $verify = true;
                        if($verify){

                            //$this->User->id = $user_details['User']['id'];
                            //$this->User->saveField('auth_token',$auth_token);

                            $output['code'] = 200;
                            $output['msg'] = $user_details;
                            echo json_encode($output);
                            die();

                        }else{

                            $output['code'] = 201;
                            $output['msg'] = "token invalid";
                            echo json_encode($output);
                            die();


                        }

                    }

                    if($social == "google"){

                        $verify = Utility::getGoogleUserInfo($auth_token);
                        $verify = true;
                        if($verify){

                            // $this->User->id = $user_details['User']['id'];
                            // $this->User->saveField('auth_token',$auth_token);

                            $output['code'] = 200;
                            $output['msg'] = $user_details;
                            echo json_encode($output);
                            die();

                        }else{

                            $output['code'] = 201;
                            $output['msg'] = "token invalid";
                            echo json_encode($output);
                            die();


                        }

                    }


                    $output['code'] = 200;
                    $output['msg'] = $user_details;
                    echo json_encode($output);
                    die();

                }else{


                    $output['code'] = 201;
                    $output['msg'] = "open registration screen";
                    echo json_encode($output);
                    die();

                }
            }


            if(isset($data['social']) && isset($data['dob'])){
                $social = $data['social'];
                $auth_token = $data['auth_token'];
                $user['social_id'] = $data['social_id'];
                $user['social'] = $social;



                if(isset($data['first_name'])){

                    $user['first_name'] = $data['first_name'];
                    $user['last_name'] = $data['last_name'];
                }
                $user['email'] = $data['email'];




                if($social == "facebook") {

                    $verify = Utility::getFacebookUserInfo($auth_token);
                    $verify = true;
                    if (!$verify) {


                        $output['code'] = 201;
                        $output['msg'] = "invalid token";
                        echo json_encode($output);
                        die();

                    }
                }

                if($social == "google") {

                    $verify = Utility::getGoogleUserInfo($auth_token);
                    $verify = true;
                    if (!$verify) {


                        $output['code'] = 201;
                        $output['msg'] = "invalid token";
                        echo json_encode($output);
                        die();

                    }
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

            if(!isset($data['social']) && !isset($data['phone']) && isset($data['email'])){

                $session_token = Utility::generateSessionToken();
                $user['auth_token'] = $session_token;

                $user['password'] = $data['password'];
                $user['email'] = $data['email'];



                if(isset($data['first_name'])){

                    $user['first_name'] = $data['first_name'];
                    $user['last_name'] = $data['last_name'];
                }



                $email_count = $this->User->isEmailAlreadyExist($data['email']);
                if($email_count > 0){

                    $user_details  = $this->User->getUserDetailsAgainstEmail($data['email']);
                    $active = $user_details['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }

                    $output['code'] = 201;
                    $output['msg'] = "The account already exist with this email";
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


            if(isset($data['phone']) && !isset($data['dob'])) {
                //login

                $user['phone'] = $data['phone'];


                $phone_exist = $this->User->isphoneNoAlreadyExist($data['phone']);

                if (count($phone_exist) > 0) {


                    $active = $phone_exist['User']['active'];

                    if($active > 1){


                        $output['code'] = 201;
                        $output['msg'] = "You have been blocked by the admin. Contact support";
                        echo json_encode($output);
                        die();

                    }
                    $session_token = Utility::generateSessionToken();
                    $user['auth_token'] = $session_token;
                    $this->User->id = $phone_exist['User']['id'];




                    $this->User->save($user);
                    $userDetails = $this->User->getUserDetailsFromID($phone_exist['User']['id']);


                    $output['code'] = 200;
                    $output['msg'] = $userDetails;
                    echo json_encode($output);
                    die();
                } else {

                    $output['code'] = 201;
                    $output['msg'] = "open register screen";
                    echo json_encode($output);
                    die();

                }

            }else  if(isset($data['phone']) && isset($data['dob'])){

                //register
                $session_token = Utility::generateSessionToken();
                $user['phone'] = $data['phone'];
                $user['auth_token'] = $session_token;




                if(isset($data['first_name'])){

                    $user['first_name'] = $data['first_name'];
                    $user['last_name'] = $data['last_name'];
                }

                if(isset($data['email'])){

                    $email_count = $this->User->isEmailAlreadyExist($data['email']);
                    if($email_count > 0){



                        $output['code'] = 201;
                        $output['msg'] = "email already existed";
                        echo json_encode($output);
                        die();

                    }

                    $user['email'] = $data['email'];

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


    public function verifyPhoneNo($phone_no = null,$user_id = null,$verify = null)
    {

        $this->loadModel('PhoneNoVerification');
        $this->loadModel('User');



        $json = file_get_contents('php://input');

        $data = json_decode($json, TRUE);


        if (!empty($phone_no)) {
            $phone_no = $phone_no;
            $verify = $verify;

        }else{

            $phone_no =  $data['phone'];
            $verify =  $data['verify'];
            // $code =  $data['code'];

            if(isset($data['user_id'])) {
                $user_id = $data['user_id'];

                $phone_exist = $this->User->editisphoneNoAlreadyExist($phone_no,$user_id);




                if ($phone_exist > 0) {

                    $result['code'] = 201;
                    $result['msg'] = "This phone has already been registered";
                    echo json_encode($result);
                    die();
                }
            }
        }


        $code     = Utility::randomNumber(4);

        if(APP_STATUS =="demo"){
            $code     = 1234;
        }


        $created                  = date('Y-m-d H:i:s', time() - 60 * 60 * 4);
        $phone_verify['phone_no'] = $phone_no;
        $phone_verify['code']     = $code;
        $phone_verify['created']  = $created;


        if ($verify == 0) {

            if(APP_STATUS =="demo"){
                $response['sid']= "";
            }else{

                $response = Utility::sendSmsVerificationCurl($phone_no, VERIFICATION_PHONENO_MESSAGE . ' ' . $code);

            }





            if (array_key_exists('code', $response)){


                $output['code'] = 201;
                $output['msg']  = $response['message'];



            }else{



                if (array_key_exists('sid', $response)){



                    $this->PhoneNoVerification->save($phone_verify);


                    $output['code'] = 200;

                    $output['msg']  = "code has been generated and sent to user's phone number";



                }

            }





        } else {
            $code_user = $data['code'];
            if ($this->PhoneNoVerification->verifyCode($phone_no, $code_user) > 0) {

                if (!empty($user_id)) {


                    $this->User->id = $user_id;
                    $this->User->saveField('phone',$phone_no);
                }
                $output['code'] = 200;
                $output['msg']  = "successfully code matched";
                /*$this->PhoneNoVerification->deleteAll(array(
                    'phone_no' => $phone_no
                ), false);*/



            } else {

                $output['code'] = 201;
                $output['msg']  = "invalid code";



            }

        }

        if (!empty($phone)) {


            return $output;
        }else{


            //it means post request from app
            echo json_encode($output);
            die();

        }

    }


    public function assignOrderToRiderAutomatically($order_id,$pickup_lat,$pickup_long,$type)
    {

        $this->loadModel("RiderOrder");
        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("User");
        $this->loadModel("Vehicle");









        $created = date('Y-m-d H:i:s', time());

        $food_order_id = 0;
        $parcel_order_id = 0;

        if($type == "food"){


            $this->FoodOrder->id = $order_id;
            $delivery = $this->FoodOrder->field('delivery');
            $food_order_id = $order_id;

        }else if($type == "parcel"){

            $delivery = 1;
            $parcel_order_id = $order_id;
        }

        if($delivery == 0){


            $output['code'] = 201;

            $output['msg'] = "You can't assign this order to any rider because user will himself pickup the food from the restaurant ";
            return $output;
        }




        $rider_order['food_order_id'] = $food_order_id;
        $rider_order['parcel_order_id'] = $parcel_order_id;
        $rider_order['assign_date_time'] = $created;








        if($food_order_id > 0) {

            $notification_type = "food_order";
            $if_order_assigned = $this->RiderOrder->ifFoodOrderHasAlreadyBeenAssigned($food_order_id);

        }else  if($parcel_order_id > 0) {

            $notification_type = "parcel_order";
            $if_order_assigned = $this->RiderOrder->ifParcelOrderHasAlreadyBeenAssigned($parcel_order_id);


        }


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

        }else {



            $drivers = $this->Vehicle->getNearByDriversWhoHasNotRejectedTheOrder($pickup_lat,$pickup_long,1000000);

            if(count($drivers) > 0){






                $rider_user_id = $drivers['Vehicle']['driver_id'];
                $rider_order['rider_user_id'] = $rider_user_id;
                $rider_order['assign_date_time'] = $created;
                $rider_order['created'] = $created;

                $this->RiderOrder->save($rider_order);

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
                Utility::sendPushNotificationToMobileDevice(json_encode($notification));



                $output['code'] = 200;

                $output['msg'] = $details;

                return $output;


            }

        }






    }
    public function verifyEmail(){

        $this->loadModel('User');
        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');

            $data = json_decode($json, TRUE);







            $email_count = $this->User->isEmailAlreadyExist($data['email']);

            if($email_count > 0) {


                $output['code'] = 200;
                $output['msg'] = "show login screen";
                echo json_encode($output);
                die();

            }else{

                $output['code'] = 201;
                $output['msg'] = "show register screen";
                echo json_encode($output);
                die();

            }
        }
    }
    public function login()
    {
        $this->loadModel('User');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');

            $data = json_decode($json, TRUE);






            $password = $data['password'];
            $role = strtolower($data['role']);






            if (isset($data['email'])) {

                $email = strtolower($data['email']);
                $userData = $this->User->verify($email, $password,$role);
            } else if (isset($data['phone_no'])) {

                $phone_no = $data['phone_no'];
                $userData = $this->User->verifyPhoneNoAndPassword($phone_no, $password);
            }


            if (($userData)) {
                $user_id = $userData[0]['User']['id'];
                if (isset($data['device_token'])) {

                    $device_token = $data['device_token'];


                    $this->User->id = $user_id;
                    $this->User->saveField('device_token', $device_token);
                }
                $output = array();
                $userDetails = $this->User->getUserDetailsFromID($user_id);

                //CustomEmail::welcomeStudentEmail($email);
                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);


            } else {
                echo Message::INVALIDDETAILS();
                die();

            }


        }
    }
    public function logout()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);




            $user_id = $data['user_id'];
            $user['device_token'] = "";
            $user['online'] = 0;
            $user['auth_token'] = "";




            $userDetails = $this->User->getUserDetailsFromID($user_id);
            if(count($userDetails) > 0) {

                $this->User->id = $user_id;
                $this->User->save($user);


                $output = array();
                $userDetails = $this->User->getUserDetailsFromID($user_id);


                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);
            }else{


                Message::EMPTYDATA();
                die();


            }

        }
    }

    public function showFoodDeliveryOrders(){

        $this->loadModel('FoodOrder');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $starting_point = $data['starting_point'];


            $user_id = $data['user_id'];
            $order_details = $this->FoodOrder->getAllOrders($user_id, $starting_point);


            if (count($order_details) > 0) {




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

    public function showParcelOrders(){

        $this->loadModel('ParcelOrder');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $starting_point = $data['starting_point'];


            $user_id = $data['user_id'];
            $order_details = $this->ParcelOrder->getUserOrders($user_id, $starting_point);


            if (count($order_details) > 0) {




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



    public function showTripsHistory(){

        $this->loadModel('Trip');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $starting_point = 0;
            if(isset($data['starting_point'])){

                $starting_point = $data['starting_point'];
            }

            if(isset($data['user_id'])) {

                $user_id = $data['user_id'];
                $user_places = $this->Trip->getUserCompletedTrips($user_id,$starting_point);
            }else{

                $user_id = $data['driver_id'];

                $user_places = $this->Trip->getDriverCompletedTrips($user_id,$starting_point);
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

    public function showRestaurants()
    {

        $this->loadModel("Restaurant");
        $this->loadModel("Order");
        $this->loadModel("RiderOrder");
        $this->loadModel("RestaurantRating");
        $this->loadModel("RiderTrackOrder");
        $this->loadModel("RestaurantFavourite");
        $this->loadModel("RestaurantTiming");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $lat  = $data['lat'];
            $long = $data['long'];
            $time = date('H:i:s', time());
            $datetime = date('Y-m-d H:i:s', time());
            $day = date('l', strtotime($datetime));









            $user_id = null;
            if (isset($data['user_id'])) {

                $user_id          = $data['user_id'];


            }




            $restaurants = $this->Restaurant->getNearByRestaurants($lat, $long, $user_id,RADIUS);



            if(count($restaurants) > 0) {


                foreach ($restaurants as $key => $restaurant) {
                    $ratings = $this->RestaurantRating->getAvgRatings($restaurant['Restaurant']['id']);
                    $restaurants[$key]['Restaurant']['favourite'] = 0;
                    $restaurants[$key]['Restaurant']['open'] = 0;
                    if (count($ratings) > 0) {
                        $restaurants[$key]['Restaurant']['TotalRatings']["avg"] = $ratings[0]['average'];
                        $restaurants[$key]['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                    }



                    $if_open = $this->RestaurantTiming->isRestaurantOpen($day,$time,$restaurant['Restaurant']['id']);




                    if(count($if_open) > 0) {

                        $opening_time = $if_open['RestaurantTiming']['opening_time'];
                        $closing_time = $if_open['RestaurantTiming']['closing_time'];



                        if ($time >= $opening_time && $time <= $closing_time) {

                            $restaurants[$key]['Restaurant']['open'] = "1";
                        }
                    }



                    if(isset($data['user_id'])){

                        $fav_restaurant = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($data['user_id'],$restaurant['Restaurant']['id']);

                        if(count($fav_restaurant) > 0){

                            $restaurants[$key]['Restaurant']['favourite'] = 1;
                        }

                    }
                }
            }

            $promoted_restaurants = $this->Restaurant->getPromotedRestaurants($lat, $long, $user_id,RADIUS);


            if(count($promoted_restaurants) > 0) {


                foreach ($promoted_restaurants as $key => $restaurant) {
                    $ratings = $this->RestaurantRating->getAvgRatings($restaurant['Restaurant']['id']);

                    if (count($ratings) > 0) {
                        $promoted_restaurants[$key]['Restaurant']['TotalRatings']["avg"] = $ratings[0]['average'];
                        $promoted_restaurants[$key]['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                    }
                }
            }
            $output['code'] = 200;

            $output['msg']=  $restaurants;
            $output['promoted'] =  $promoted_restaurants;
            echo json_encode($output);


            die();
        }
    }

    public function addFavouriteRestaurant()
    {

        $this->loadModel("RestaurantFavourite");

        if ($this->request->isPost()) {
            $json          = file_get_contents('php://input');
            $data          = json_decode($json, TRUE);

            $user_id       = $data['user_id'];
            $restaurant_id = $data['restaurant_id'];


            $favourite_rest['user_id']       = $user_id;
            $favourite_rest['restaurant_id'] = $restaurant_id;


            $fav_rest = $this->RestaurantFavourite->getFavouriteRestaurant($user_id, $restaurant_id);


            if (count($fav_rest) > 0) {

                $id = $fav_rest[0]['RestaurantFavourite']['id'];


                if ($this->RestaurantFavourite->delete($id)) {
                    Message::DELETEDSUCCESSFULLY();
                    die();

                } else {

                    Message::ERROR();
                    die();

                }


            } else {

                $this->RestaurantFavourite->save($favourite_rest);
                $id     = $this->RestaurantFavourite->getLastInsertId();
                $result = $this->RestaurantFavourite->getFavouriteRestaurantDetail($id);

                $output['code'] = 200;

                $output['msg'] = $result;
                echo json_encode($output);


                die();
            }


        }
    }
    public function showFavouriteRestaurants()
    {

        $this->loadModel("RestaurantFavourite");
        $this->loadModel("RestaurantRating");
        $this->loadModel("RestaurantTiming");

        if ($this->request->isPost()) {
            $json    = file_get_contents('php://input');
            $data    = json_decode($json, TRUE);
            $user_id = $data['user_id'];

            $time = date('H:i:s', time());
            $datetime = date('Y-m-d H:i:s', time());
            $day = date('l', strtotime($datetime));



            $results = $this->RestaurantFavourite->getFavouritesRestaurant($user_id);

            if(count($results) > 0) {
                foreach ($results as $key => $val) {

                    $ratings = $this->RestaurantRating->getAvgRatings($val['Restaurant']['id']);
                    $results[$key]['Restaurant']['open'] = 0;
                    if (count($ratings) > 0) {
                        $results[$key]['TotalRatings']["avg"] = $ratings[0]['average'];
                        $results[$key]['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                    }
                    if ($val['Restaurant']['User']['active'] == 0) {

                        unset($results[$key]);
                    }

                    $if_open = $this->RestaurantTiming->isRestaurantOpen($day,$time,$val['Restaurant']['id']);

                    if(count($if_open) > 0){

                        $results[$key]['Restaurant']['open'] = 1;

                    }


                }

                $output['code'] = 200;

                $output['msg'] = $results;
                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }
        }
    }


    public function showRestaurantDetail()
    {

        $this->loadModel("Restaurant");
        $this->loadModel("RestaurantRating");
        $this->loadModel("RestaurantTiming");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $restaurant_id = $data['id'];

            $time = date('H:i:s', time());
            $datetime = date('Y-m-d H:i:s', time());
            $day = date('l', strtotime($datetime));


            $details = $this->Restaurant->getDetails($restaurant_id);

            if(count($details) > 0){


                $ratings = $this->RestaurantRating->getAvgRatings($details['Restaurant']['id']);
                $details['Restaurant']['favourite'] = 0;
                $details['Restaurant']['open'] = 0;
                if (count($ratings) > 0) {
                    $details['Restaurant']['TotalRatings']["avg"]          = $ratings[0]['average'];
                    $details['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                }

                $if_open = $this->RestaurantTiming->isRestaurantOpen($day,$time,$details['Restaurant']['id']);

                if(count($if_open) > 0){

                    $details['Restaurant']['open'] = 1;

                }

                if(isset($data['user_id'])){

                    $fav_restaurant = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($data['user_id'],$details['Restaurant']['id']);

                    if(count($fav_restaurant) > 0){

                        $details['Restaurant']['favourite'] = 1;
                    }

                }
            }


            $output['code'] = 200;

            $output['msg'] = $details;
            echo json_encode($output);


            die();
        }
    }

    public function showRestaurantMenu()
    {

        $this->loadModel("Restaurant");
        $this->loadModel("RestaurantMenu");
        //$this->loadModel("RestaurantTiming");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $restaurant_id = $data['id'];


            $details = $this->Restaurant->getDetails($restaurant_id);

            if(count($details) > 0){


                $ratings = $this->RestaurantRating->getAvgRatings($details['Restaurant']['id']);

                if (count($ratings) > 0) {
                    $details['Restaurant']['TotalRatings']["avg"]          = $ratings[0]['average'];
                    $details['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                }
            }


            $output['code'] = 200;

            $output['msg'] = $details;
            echo json_encode($output);


            die();
        }
    }


    public function showRestaurantMenuItemDetail()
    {


        $this->loadModel("RestaurantMenuItem");
        //$this->loadModel("RestaurantTiming");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];


            $details = $this->RestaurantMenuItem->getDetails($id);

            if (count($details) > 0) {


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

    public function addUserPlace(){


        $this->loadModel('UserPlace');
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =
            $user_id =  $data['user_id'];

            $user_place['lat'] = $data['lat'];
            $user_place['user_id'] = $data['user_id'];
            $user_place['long'] = $data['long'];
            $user_place['name'] = $data['name'];
            $user_place['additonal_address_information'] = $data['additonal_address_information'];
            $user_place['flat'] = $data['flat'];
            $user_place['building_name'] = $data['building_name'];
            $user_place['address_label'] = $data['address_label'];
            $user_place['location_string'] = $data['location_string'];
            $user_place['instruction'] = $data['instruction'];
            if(isset($data['google_place_id'])) {
                $user_place['google_place_id'] = $data['google_place_id'];
            }


            $user_details =  $this->User->getUserDetailsFromID($user_id);


            if(count($user_details) > 0) {

                if(isset($data['id'])){


                    $this->UserPlace->id = $data['id'];
                    $this->UserPlace->save($user_place);

                    $place_details =  $this->UserPlace->getDetails($data['id']);

                    $output['code'] = 200;

                    $output['msg'] = $place_details;


                    echo json_encode($output);


                    die();

                }
                $user_place['created']=date('Y-m-d H:i:s', time());

                $this->UserPlace->save($user_place);
                $id = $this->UserPlace->getInsertID();
                $place_details =  $this->UserPlace->getDetails($id);

                $output['code'] = 200;

                $output['msg'] = $place_details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }

        }




    }


    public function deleteUserPlace(){


        $this->loadModel('UserPlace');
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =

            $id =  $data['id'];

            $place_details =  $this->UserPlace->getDetails($id);


            if(count($place_details) > 0) {




                $this->UserPlace->id = $id;
                $this->UserPlace->delete();




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





    public function showRecentLocations(){

        $this->loadModel('RecentLocation');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];


            $user_places = $this->RecentLocation->getUserLocations($user_id);


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

    public function addRecentLocation(){


        $this->loadModel('RecentLocation');
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =
            $user_id =  $data['user_id'];

            $user_place['lat'] = $data['lat'];
            $user_place['user_id'] = $data['user_id'];
            $user_place['long'] = $data['long'];
            $user_place['short_name'] = $data['short_name'];
            $user_place['location_string'] = $data['location_string'];



            $user_details =  $this->User->getUserDetailsFromID($user_id);


            if(count($user_details) > 0) {

                if(isset($data['id'])){


                    $this->RecentLocation->id = $data['id'];
                    $this->RecentLocation->save($user_place);

                    $place_details =  $this->RecentLocation->getDetails($data['id']);

                    $output['code'] = 200;

                    $output['msg'] = $place_details;


                    echo json_encode($output);


                    die();

                }
                $user_place['created']=date('Y-m-d H:i:s', time());

                $this->RecentLocation->save($user_place);
                $id = $this->RecentLocation->getInsertID();
                $place_details =  $this->RecentLocation->getDetails($id);

                $output['code'] = 200;

                $output['msg'] = $place_details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }

        }




    }

    public function placeParcelOrderold(){


        $this->loadModel('ParcelOrder');
        $this->loadModel('User');
        $this->loadModel("CouponUsed");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $order['user_id'] =  $data['user_id'];
            $order['good_type_id'] =  $data['good_type_id'];
            $order['ride_type_id'] =  $data['ride_type_id'];
            $order['payment_card_id'] =  $data['payment_card_id'];
            $order['schedule'] =  $data['schedule'];
            $order['coupon_id'] =  $data['coupon_id'];
            $order['cod'] =  $data['cod'];
            //$payment_id = $data['payment_id'];
            $order['discount'] =  $data['discount'];
            $order['price'] =  $data['price'];
            $order['total'] =  $data['total'];
            $order['pickup_datetime'] =  $data['pickup_datetime'];
            $order['item_title'] =  $data['item_title'];
            $order['item_description'] =  $data['item_description'];
            $order['sender_name'] =  $data['sender_name'];
            $order['sender_email'] =  $data['sender_email'];
            $order['sender_phone'] =  $data['sender_phone'];
            $order['receiver_name'] =  $data['receiver_name'];
            $order['receiver_email'] =  $data['receiver_email'];
            $order['receiver_phone'] =  $data['receiver_phone'];
            $order['delivery_instruction'] =  $data['delivery_instruction'];
            $order['sender_note_driver'] =  $data['sender_note_driver'];
            $order['receiver_note_driver'] =  $data['receiver_note_driver'];



            $order['sender_location_lat'] = $data['sender_location_lat'];
            $order['sender_location_long'] = $data['sender_location_long'];
            $order['sender_location_string'] = $data['sender_location_string'];
            $order['sender_address_detail'] =  $data['sender_address_detail'];
            $order['receiver_location_lat'] = $data['receiver_location_lat'];
            $order['receiver_location_long'] = $data['receiver_location_long'];
            $order['receiver_location_string'] = $data['receiver_location_string'];
            $order['receiver_address_detail'] =  $data['receiver_address_detail'];


            $filepath = $this->makeTripMapParcel($data['sender_location_lat'],$data['sender_location_long'],$data['receiver_location_lat'],$data['receiver_location_long'],$data['user_id']);

            if(!$filepath){

                $output['code'] = 201;

                $output['msg'] = "Please fix your google maps key. There are some issues with the permission";


                echo json_encode($output);


                die();
            }

            $order['map'] =  $filepath;
            if(isset($data['package_size_id'])){

                $order['package_size_id'] =  $data['package_size_id'];

            }



            $user_details =  $this->User->getUserDetailsFromID($data['user_id']);


            if(count($user_details) > 0) {

                if(isset($data['id'])){

                    $this->ParcelOrder->id = $data['id'];
                    $this->ParcelOrder->save($order);

                    $details =  $this->ParcelOrder->getDetails($data['id']);

                    $output['code'] = 200;

                    $output['msg'] = $details;


                    echo json_encode($output);


                    die();

                }
                $order['created'] = date('Y-m-d H:i:s', time());


                $this->ParcelOrder->save($order);
                $id = $this->ParcelOrder->getInsertID();

                if ($data['coupon_id'] > 0) {
                    $coupon['coupon_id'] = $data['coupon_id'];
                    $coupon['order_id'] = $id;
                    $coupon['created'] = $order['created'];
                    $this->CouponUsed->save($coupon);
                }

                if ($data['payment_card_id'] > 0) {
                    $stripe_charge = $this->deductPayment($data['payment_card_id'], round($data['total']));
                    $order['stripe_charge'] = $stripe_charge;
                }

                if (isset($data['transaction'])) {


                    $transaction = $data['transaction'];

                    if(count($transaction) > 0){

                        $order_transaction['type'] = $transaction['type'];

                        if($transaction['type'] == "stripe"){

                            $order_transaction['value'] = $order['stripe_charge'];
                        }

                        $order_transaction['value'] = $transaction['value'];

                        $order_transaction['order_id'] = $id;
                        $order_transaction['created'] = $order['created'];

                        $this->OrderTransaction->save($order_transaction);


                    }
                }

                if(AUTOMATIC_ASSIGN_PARCEL_DELIVERY_ORDER == "YES") {

                    $this->assignOrderToRiderAutomatically($id, $data['sender_location_lat'], $data['sender_location_long'], "parcel");

                }
                $details =  $this->ParcelOrder->getDetails($id);

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




    public function placeParcelOrder(){


        $this->loadModel('ParcelOrder');
        $this->loadModel('User');
        $this->loadModel("CouponUsed");
        $this->loadModel("ParcelOrderMultiStop");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $order['user_id'] =  $data['user_id'];
            // $order['good_type_id'] =  $data['good_type_id'];
            $order['ride_type_id'] =  $data['ride_type_id'];
            $order['payment_card_id'] =  $data['payment_card_id'];
            $order['schedule'] =  $data['schedule'];
            $order['coupon_id'] =  $data['coupon_id'];
            $order['cod'] =  $data['cod'];
            //$payment_id = $data['payment_id'];
            $order['discount'] =  $data['discount'];
            $order['price'] =  $data['price'];
            $order['total'] =  $data['total'];
            $order['pickup_datetime'] =  $data['pickup_datetime'];

            $order['sender_name'] =  $data['sender_name'];
            $order['sender_email'] =  $data['sender_email'];
            $order['sender_phone'] =  $data['sender_phone'];
            $recipients =  $data['recipients'];

            $order['sender_note_driver'] =  $data['sender_note_driver'];




            $order['sender_location_lat'] = $data['sender_location_lat'];
            $order['sender_location_long'] = $data['sender_location_long'];
            $order['sender_location_string'] = $data['sender_location_string'];
            $order['sender_address_detail'] =  $data['sender_address_detail'];



            /*$filepath = $this->makeTripMapParcel($data['sender_location_lat'],$data['sender_location_long'],$data['receiver_location_lat'],$data['receiver_location_long'],$data['user_id']);

            if(!$filepath){

                $output['code'] = 201;

                $output['msg'] = "Please fix your google maps key. There are some issues with the permission";


                echo json_encode($output);


                die();
            }

            $order['map'] =  $filepath;*/







            $user_details =  $this->User->getUserDetailsFromID($data['user_id']);




            if(count($user_details) > 0) {

                /* if(isset($data['id'])){

                     $this->ParcelOrder->id = $data['id'];
                     $this->ParcelOrder->save($order);

                     $details =  $this->ParcelOrder->getDetails($data['id']);

                     $output['code'] = 200;

                     $output['msg'] = $details;


                     echo json_encode($output);


                     die();

                 }*/
                $order['created'] = date('Y-m-d H:i:s', time());
                $this->ParcelOrder->save($order);
                $this->ParcelOrder->clear();
                $id = $this->ParcelOrder->getInsertID();

                if(count($recipients) > 0){

                    //$total_count = count($recipients);
                    $latlong = "";
                    $multi_stop = array();
                    foreach($recipients as $key=> $recipient){

                        $multi_stop[$key]['receiver_name'] =  $recipient['receiver_name'];
                        $multi_stop[$key]['receiver_email'] =  $recipient['receiver_email'];
                        $multi_stop[$key]['receiver_phone'] =  $recipient['receiver_phone'];
                        $multi_stop[$key]['delivery_instruction'] =  $recipient['delivery_instruction'];

                        $multi_stop[$key]['receiver_location_lat'] = $recipient['receiver_location_lat'];
                        $multi_stop[$key]['receiver_location_long'] = $recipient['receiver_location_long'];
                        $multi_stop[$key]['receiver_location_string'] = $recipient['receiver_location_string'];
                        $multi_stop[$key]['receiver_address_detail'] =  $recipient['receiver_address_detail'];
                        $multi_stop[$key]['receiver_note_driver'] =  $recipient['receiver_note_driver'];
                        $multi_stop[$key]['item_title'] =  $recipient['item_title'];
                        $multi_stop[$key]['item_description'] =  $recipient['item_description'];
                        $multi_stop[$key]['good_type_id'] =  $recipient['good_type_id'];
                        $multi_stop[$key]['package_size_id'] =  $recipient['package_size_id'];
                        $multi_stop[$key]['parcel_order_id'] =  $id;

                        $latlong .= $recipient['receiver_location_lat'] . "," . $recipient['receiver_location_long'] . "|";




                    }
                    $latlong = rtrim($latlong, '|');

                    $url = "https://maps.googleapis.com/maps/api/staticmap?&size=280x280&key=" . GOOGLE_MAPS_KEY . "&markers=color:green|label:P|" . $data['sender_location_lat'] . "," . $data['sender_location_long'] . "&markers=color:red|label:D|" . $latlong;


                    $folder_url = UPLOADS_FOLDER_URI;

                    $file_path = Utility::uploadMapImageintoFolder($data['user_id'], $url, $folder_url);


                    $this->ParcelOrder->id = $id;
                    $this->ParcelOrder->saveField('map',$file_path);

                    $this->ParcelOrderMultiStop->saveAll($multi_stop);

                }




                if ($data['coupon_id'] > 0) {
                    $coupon['coupon_id'] = $data['coupon_id'];
                    $coupon['order_id'] = $id;
                    $coupon['created'] = $order['created'];
                    $this->CouponUsed->save($coupon);
                }

                if ($data['payment_card_id'] > 0) {
                    $stripe_charge = $this->deductPayment($data['payment_card_id'], round($data['total']));
                    $order['stripe_charge'] = $stripe_charge;
                }

                if (isset($data['transaction'])) {


                    $transaction = $data['transaction'];

                    if(count($transaction) > 0){

                        $order_transaction['type'] = $transaction['type'];

                        if($transaction['type'] == "stripe"){

                            $order_transaction['value'] = $order['stripe_charge'];
                        }

                        $order_transaction['value'] = $transaction['value'];

                        $order_transaction['order_id'] = $id;
                        $order_transaction['created'] = $order['created'];

                        $this->OrderTransaction->save($order_transaction);


                    }
                }

                if(AUTOMATIC_ASSIGN_PARCEL_DELIVERY_ORDER == "YES") {

                    $this->assignOrderToRiderAutomatically($id, $data['sender_location_lat'], $data['sender_location_long'], "parcel");

                }
                $details =  $this->ParcelOrder->getDetails($id);

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

    public function deleteRecentLocation(){


        $this->loadModel('RecentLocation');
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =

            $id =  $data['id'];

            $place_details =  $this->RecentLocation->getDetails($id);


            if(count($place_details) > 0) {




                $this->RecentLocation->id = $id;
                $this->RecentLocation->delete();




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
    public function showRideTypesold(){

        $this->loadModel('RideType');
        $this->loadModel('RideSection');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $rideTypes = $this->RideType->getAll();
            $ride_sections = $this->RideSection->getAll();

            // pr($ride_sections);

            if (count($ride_sections) > 0) {

                foreach($ride_sections as $key1=>$ride_section){



                    if(isset($data['pickup_lat'])) {
                        $pickup_lat = $data['pickup_lat'];
                        $pickup_long = $data['pickup_long'];
                        $destination_lat = $data['dropoff_lat'];
                        $destination_long = $data['dropoff_long'];




                        $distance = Utility::getDurationTimeBetweenTwoDistances($pickup_lat, $pickup_long, $destination_lat, $destination_long);
                        $ride_distance_in_meters = $distance['rows']['0']['elements'][0]['distance']['value'];
                        $ride_duration_in_seconds = $distance['rows']['0']['elements'][0]['duration']['value'];




                        foreach ($ride_section['RideType'] as $key2 => $val) {


                            $base_fare = $val['base_fare'];
                            $cost_per_minute = $val['cost_per_minute'];
                            $cost_per_distance = $val['cost_per_distance'];
                            $estimated = Utility::calculateFare($base_fare, $cost_per_minute, $cost_per_distance, $ride_duration_in_seconds, $ride_distance_in_meters, "0", DISTANCE_UNIT);
                            $ride_sections[$key1]['RideType'][$key2]['estimated_fare'] = $estimated['fare'];
                            $ride_sections[$key1]['RideType'][$key2]['time'] = $estimated['time'];

                        }
                    }

                }

                $output['code'] = 200;

                $output['msg'] = $ride_sections;


                echo json_encode($output);


                die();
            }else{

                Message::EMPTYDATA();
                die();
            }



        }
    }



    public function showRideTypes(){

        $this->loadModel('RideType');
        $this->loadModel('RideSection');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            
            //$rideTypes = $this->RideType->getAll();
            $ride_sections = $this->RideSection->getAll();

            // pr($ride_sections);

            if (count($ride_sections) > 0) {

                foreach($ride_sections as $key1=>$ride_section){



                    if(isset($data['pickup_lat'])) {
                        $pickup_lat = $data['pickup_lat'];
                        $pickup_long = $data['pickup_long'];
                        $dropoff_lat = $data['dropoff_lat'];
                        $dropoff_long = $data['dropoff_long'];


                        $waypoints_locations = "";
                        if(isset($data['waypoints'])) {

                            $waypoints = $data['waypoints'];

                            if (count($waypoints) > 0) {

                                $ride_distance_in_meters = 0;
                                $ride_duration_in_seconds = 0;

                                $locations = "";
                                foreach ($waypoints as $drop_off) {
                                    $destination_lat = $drop_off['dropoff_lat'];
                                    $destination_long = $drop_off['dropoff_long'];


                                    $locations .= $destination_lat . "," . $destination_long . "|";

                                }


                                $waypoints_locations = rtrim($locations, "|");

                            }
                        }



      $distance = Utility::getDurationTimeAndDistanceBetweenMultipleDistances($pickup_lat, $pickup_long, $dropoff_lat, $dropoff_long, $waypoints_locations);


                            if ($distance) {
                                if (count($distance['routes'][0]['legs']) > 0) {


                                    $ride_distance_in_meters = 0;
                                    $ride_duration_in_seconds = 0;
                                    foreach ($distance['routes'][0]['legs'] as $leg) {


                                        $ride_distance_in_meters_loc = $leg['distance']['value'];
                                        $ride_duration_in_seconds_loc = $leg['duration']['value'];

                                        $ride_distance_in_meters = $ride_distance_in_meters_loc + $ride_distance_in_meters . '<br>';
                                        $ride_duration_in_seconds = $ride_duration_in_seconds_loc + $ride_duration_in_seconds . '<br>';


                                    }


                                }


                                foreach ($ride_section['RideType'] as $key2 => $val) {


                                    $base_fare = $val['base_fare'];
                                    $cost_per_minute = $val['cost_per_minute'];
                                    $cost_per_distance = $val['cost_per_distance'];
                                    $estimated = Utility::calculateFare($base_fare, $cost_per_minute, $cost_per_distance, $ride_duration_in_seconds, $ride_distance_in_meters, "0", DISTANCE_UNIT);
                                    $ride_sections[$key1]['RideType'][$key2]['estimated_fare'] = $estimated['fare'];
                                    $ride_sections[$key1]['RideType'][$key2]['time'] = $estimated['time'];


                                }
                            } else {

                                $output['code'] = 201;

                                $output['msg'] = "invalid locations";


                                echo json_encode($output);


                                die();


                            }

                        }







                    }

                $output['code'] = 200;

                $output['msg'] = $ride_sections;


                echo json_encode($output);


                die();


            }else{

                Message::EMPTYDATA();
                die();
            }





        }
    }
    public function deleteRequest()
    {

        $this->loadModel("Request");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $this->Request->deleteAll(array('Request.id >' => 0), false);

            $output['code'] = 200;

            $output['msg'] = "successfully deleted";



            echo json_encode($output);


            die();
        }
    }
    public function rideCancelled(){

        $this->loadModel('Request');
        $this->loadModel('Notification');
        $this->loadModel('Vehicle');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $request_id = $data['request_id'];
            $request_details = $this->Request->getRequestWhichHasNotCancelledByAnyOne($request_id);



            $response['status'] =  1;
            if (count($request_details) > 0) {
                if (isset($data['driver_id'])) {


                    $response['driver_ride_response'] = 1;
                    $response['reason'] =  $data['reason'];

                    $this->Request->id = $request_id;
                    $this->Request->save($response);

                    $device_token = $request_details['User']['device_token'];
                    $first_name = $request_details['Driver']['first_name'];
                    $last_name = $request_details['Driver']['last_name'];
                    $user_id = $request_details['User']['id'];
                    $body = $first_name." ".$last_name." has cancelled the ride";
                    $notification['data']['type'] = "ride_cancel";


                } else if (isset($data['user_id'])) {


                    $response['user_ride_response'] = 1;
                    $response['reason'] =  $data['reason'];
                    $this->Request->id = $request_id;
                    $this->Request->save($response);



                    $device_token = $request_details['Driver']['device_token'];
                    $first_name = $request_details['User']['first_name'];
                    $last_name = $request_details['User']['last_name'];
                    $user_id = $request_details['Driver']['id'];
                    $body = $first_name." ".$last_name." has cancelled the ride";
                    $notification['data']['type'] = "ride_cancel";
                }

                $vehicle_id = $request_details['Request']['vehicle_id'];
                $this->Vehicle->id  = $vehicle_id;
                $this->Vehicle->saveField('available',1);

                $notification['to'] = $device_token;
                $notification['notification']['title'] = $body;
                $notification['notification']['body'] = "";

                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";

                $notification['data']['title'] = $body;
                $notification['data']['body'] = "";
                $notification['data']['icon'] = "";
                $notification['data']['badge'] = "1";
                $notification['data']['sound'] = "default";

                Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                $notification_data['user_id'] = $user_id;
                $notification_data['text'] = $notification['data']['title'];
                $this->Notification->save($notification_data);

                $request_details = $this->Request->getDetails($request_id);

                $output['code'] = 200;

                $output['msg'] = $request_details;


                echo json_encode($output);


                die();


            }else{


                $output['code'] = 200;

                $output['msg'] = "This ride has already been cancelled";


                echo json_encode($output);


                die();
            }


        }




    }

    public function cancelFoodOrder(){


        $this->loadModel('FoodOrder');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $id = $data['id'];
            $current_time = date('Y-m-d H:i:s', time());

            $details =  $this->FoodOrder->getDetails($id);

            if(count($details) > 0){


                $seconds =  Utility::time_difference($details['FoodOrder']['created'],$current_time);
                if($seconds <= FOOD_ORDER_CANCEL_AFTER){


                    $this->FoodOrder->id = $id;
                    $this->FoodOrder->saveField('status',3);

                    $output['code'] = 200;

                    $output['msg'] = $details;


                    echo json_encode($output);


                    die();
                }else{


                    $output['code'] = 201;

                    $output['msg'] = "You cannot cancel an order now";


                    echo json_encode($output);


                    die();
                }






            }else{




            }






        }




    }
    public function driverResponseAgainstRequest(){

        $this->loadModel('Request');
        $this->loadModel('Vehicle');
        $this->loadModel('Notification');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $request_id = $data['request_id'];
            $request['driver_id'] = $data['driver_id'];
            $request_save['driver_response_datetime']=date('Y-m-d H:i:s', time());

            $request_save['request'] = $data['request'];


            if($data['request'] < 1 ){ //no response

                $request_save['driver_ride_response'] = 0;

            }else if($data['request'] > 1 ){ //its rejected

                $request_save['driver_ride_response'] = 1;

            }


            $notification_type = "taxi_order";




            $request_details = $this->Request->getDetails($request_id);

            if(count($request_details) > 0){
                $customer_device_token =  $request_details['User']['device_token'];
                $customer_user_id =  $request_details['User']['id'];


                $make =  $request_details['Vehicle']['make'];
                $model =  $request_details['Vehicle']['model'];
                $license_plate =  $request_details['Vehicle']['license_plate'];
                $year =  $request_details['Vehicle']['year'];




                $this->Request->id = $request_id;
                $this->Request->save($request_save);
                $this->Request->clear();
                $request_details = $this->Request->getDetails($request_id);


                if ($data['request'] == 1) {



                    $vehicle_id = $request_details['Request']['vehicle_id'];
                    $this->Vehicle->id  = $vehicle_id;
                    $this->Vehicle->saveField('available',2);




                    $notification['to'] = $customer_device_token;
                    $notification['notification']['title'] = "driver is arriving to your location";
                    $notification['notification']['body'] = $make . " " . $model . " " . $license_plate . " is coming to you";
                    $notification['notification']['type'] = "request_accepted";
                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";


                    $notification['data']['title'] = "driver is arriving to your location";
                    $notification['data']['body'] = $make . " " . $model . " " . $license_plate . " is arriving.";
                    $notification['data']['icon'] = "";
                    $notification['data']['badge'] = "1";
                    $notification['data']['type'] = "request_accepted";
                    $notification['data']['sound'] = "default";

                    Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                    $output['code'] = 200;

                    $output['msg'] = $request_details;


                    echo json_encode($output);


                    die();

                } else {


                    $vehicle_id = $request_details['Request']['vehicle_id'];
                    $this->Vehicle->id  = $vehicle_id;
                    $this->Vehicle->saveField('available',1);

                    /* $notification['to'] = $customer_device_token;
                     $notification['notification']['title'] = "Ride cancelled";
                     $notification['notification']['type'] = "request_rejected";
                     $notification['notification']['body'] = "Driver has rejected your request. we are trying to find another one";
                     $notification['notification']['badge'] = "1";
                     $notification['notification']['sound'] = "default";
                     $notification['notification']['icon'] = "";

                     $notification['data']['title'] = "Ride cancelled";
                     $notification['data']['body'] = "Driver has rejected your request. we are trying to find another one";
                     $notification['data']['type'] = "request_rejected";
                     $notification['data']['icon'] = "";
                     $notification['data']['badge'] = "1";
                     $notification['data']['sound'] = "default";

                     Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                     $notification_data['user_id'] = $customer_user_id;
                     $notification_data['text'] = $notification['data']['title'];
                     $this->Notification->save($notification_data);*/


                    $output['code'] = 201;

                    $output['msg'] = "Your request has been rejected";


                    echo json_encode($output);


                    die();




                    $pickup_lat = $request_details['Request']['pickup_lat'];
                    $pickup_long = $request_details['Request']['pickup_long'];
                    $destination_lat = $request_details['Request']['dropoff_lat'];
                    $destination_long = $request_details['Request']['dropoff_long'];
                    $ride_type = $request_details['Vehicle']['ride_type_id'];
                    $user_id = $request_details['Request']['user_id'];
                    $estimated_fare = $request_details['Request']['estimated_fare'];
                    // $wallet_pay = $request_details['Request']['wallet_pay'];
                    $payment_type = $request_details['Request']['payment_type'];
                    $payment_method_id = $request_details['Request']['payment_method_id'];

                    $request_new['user_id'] = $user_id;
                    $request_new['pickup_lat'] = $pickup_lat;
                    $request_new['pickup_long'] = $pickup_long;
                    $request_new['dropoff_lat'] = $destination_lat;
                    $request_new['dropoff_long'] = $destination_long;

                    $request_new['estimated_fare'] = $estimated_fare;
                    // $request_new['wallet_pay'] = $wallet_pay;
                    $request_new['payment_type'] = $payment_type;
                    $request_new['payment_method_id'] = $payment_method_id;
                    $request_new['created'] = date('Y-m-d H:i:s', time());

                    $vehicles = $this->Vehicle->getNearestVehicle($pickup_lat, $pickup_long, $ride_type, DISTANCE_DRIVER_IN_KM, $user_id);


                    if (count($vehicles) > 0) {

                        foreach ($vehicles as $key => $val) {

                            $vehicle_id = $val['Vehicle']['id'];

                            $request_detail = $this->Request->getRequestDetail($vehicle_id, $user_id);


                            if (count($request_detail) > 0) {

                                $output['code'] = 201;

                                $output['msg'] = "you cannot send a multiple request";


                                echo json_encode($output);


                                die();

                            }
                        }
                    }
                    if (count($vehicles) > 0) {

                        $driver_device_token = $vehicles[0]['Driver']['device_token'];

                        $driver_user_id = $vehicles[0]['Driver']['id'];

                        $first_name = $vehicles[0]['User']['first_name'];
                        $last_name = $vehicles[0]['User']['last_name'];
                        $full_name = $first_name . " " . $last_name;
                        $user_image = $vehicles[0]['User']['image'];


                        $request_new['vehicle_id'] = $vehicles[0]['Vehicle']['id'];
                        $request_new['driver_id'] = $vehicles[0]['Vehicle']['driver_id'];


                        $this->Request->save($request_new);
                        $request_id = $this->Request->getInsertID();

                        $request_detail = $this->Request->getDetails($request_id);


                        $vehicle_details = $this->Vehicle->getDetails($vehicles[0]['Vehicle']['id']);


                        $notification['to'] = $driver_device_token;
                        $notification['notification']['title'] = "new ride request";
                        $notification['notification']['body'] ="You have received the ride request from " . $full_name;
                        $notification['notification']['badge'] = "1";
                        $notification['notification']['sound'] = "default";
                        $notification['notification']['icon'] = "";
                        $notification['notification']['request_receive'] = "1";
                        $notification['notification']['pickup_lat'] = $pickup_lat;
                        $notification['notification']['pickup_long'] = $pickup_long;
                        $notification['notification']['dropoff_lat'] = $destination_lat;
                        $notification['notification']['dropoff_long'] = $destination_long;
                        $notification['notification']['pickup_lat'] = $pickup_lat;
                        $notification['notification']['full_name'] = $full_name;
                        $notification['notification']['image'] = $user_image;
                        $notification['notification']['User']['id'] = $request_detail['User']['id'];
                        $notification['notification']['User']['first_name'] = $request_detail['User']['first_name'];
                        $notification['notification']['User']['last_name'] = $request_detail['User']['last_name'];
                        $notification['notification']['User']['image'] = $request_detail['User']['image'];
                        $notification['notification']['Driver']['id'] = $request_detail['Driver']['id'];
                        $notification['notification']['Driver']['first_name'] = $request_detail['Driver']['first_name'];
                        $notification['notification']['Driver']['last_name'] = $request_detail['Driver']['last_name'];
                        $notification['notification']['Driver']['image'] = $request_detail['Driver']['image'];


                        $notification['data']['title'] = "new ride request";
                        $notification['data']['body'] = "You have received the ride request from " . $full_name;
                        $notification['data']['pickup_lat'] = $pickup_lat;
                        $notification['data']['pickup_long'] = $pickup_long;
                        $notification['data']['dropoff_lat'] = $destination_lat;
                        $notification['data']['dropoff_long'] = $destination_long;
                        $notification['data']['pickup_lat'] = $pickup_lat;
                        $notification['data']['full_name'] = $full_name;
                        $notification['data']['image'] = $user_image;
                        // $notification['data']['request_detail'] = $request_detail;
                        $notification['data']['icon'] = "";
                        $notification['data']['type'] = "request_vehicle";
                        $notification['data']['badge'] = "1";
                        $notification['data']['sound'] = "default";
                        $notification['data']['User']['id'] = $request_detail['User']['id'];
                        $notification['data']['User']['first_name'] = $request_detail['User']['first_name'];
                        $notification['data']['User']['last_name'] = $request_detail['User']['last_name'];
                        $notification['data']['User']['image'] = $request_detail['User']['image'];
                        $notification['data']['Driver']['id'] = $request_detail['Driver']['id'];
                        $notification['data']['Driver']['first_name'] = $request_detail['Driver']['first_name'];
                        $notification['data']['Driver']['last_name'] = $request_detail['Driver']['last_name'];
                        $notification['data']['Driver']['image'] = $request_detail['Driver']['image'];


                        $result = Utility::sendPushNotificationToMobileDevice(json_encode($notification));


                        $notification_data['user_id'] = $driver_user_id;
                        $notification_data['text'] = $notification['data']['title'];
                        $this->Notification->save($notification_data);


                        $output['code'] = 201;

                        $output['msg'] = "Your request has been rejected";


                        echo json_encode($output);


                        die();


                    } else {

                        $notification['to'] = $customer_device_token;
                        $notification['notification']['title'] = "No available rider found";
                        $notification['notification']['type'] = "no_driver_found";
                        $notification['notification']['body'] = "";
                        $notification['notification']['badge'] = "1";
                        $notification['notification']['sound'] = "default";
                        $notification['notification']['icon'] = "";

                        $notification['data']['title'] = "No available rider found";
                        $notification['data']['body'] = "";
                        $notification['data']['type'] = "no_driver_found";
                        $notification['data']['icon'] = "";
                        $notification['data']['badge'] = "1";
                        $notification['data']['sound'] = "default";

                        $result = Utility::sendPushNotificationToMobileDevice(json_encode($notification));


                        $output['code'] = 201;

                        $output['msg'] = "Your request has been rejected";


                        echo json_encode($output);


                        die();


                    }


                }


            }else{

                Message::EMPTYDATA();
                die();
            }


        }




    }

    public function requestVehicle(){

        $this->loadModel('Vehicle');
        $this->loadModel('Request');
        // $this->loadModel('Notification');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];
            $ride_type_id = $data['ride_type_id'];
            $pickup_lat = $data['pickup_lat'];
            $pickup_long = $data['pickup_long'];
            $destination_lat = $data['dropoff_lat'];
            $destination_long = $data['dropoff_long'];
            $pickup_location_short_string = $data['pickup_location_short_string'];
            $dropoff_location_short_string = $data['dropoff_location_short_string'];
            $estimated_fare = $data['estimated_fare'];
            $payment_type = $data['payment_type'];
            $payment_method_id = $data['payment_method_id'];
            $note = $data['note'];
            $coupon_id = $data['coupon_id'];
            $schedule = 0;
            $schedule_datetime = "0000-00-00 00:00:00";
            if(isset($data['schedule'])){

                $schedule = $data['schedule'];
                $schedule_datetime= $data['schedule_datetime'];
            }




            $pickup_location_array = Utility::getCountryCityProvinceFromLatLong($pickup_lat,$pickup_long);
            $destination_location_array = Utility::getCountryCityProvinceFromLatLong($destination_lat,$destination_long);

            if(strlen($pickup_location_array['location_string']) > 2){

                $request['pickup_location'] = $pickup_location_array['location_string'];


            }else{

                if(isset($data['pickup_location'])){

                    $request['pickup_location'] = $data['pickup_location'];
                    $request['dropoff_location'] = $data['dropoff_location'];
                }

            }

            if(strlen($pickup_location_array['location_string']) > 2){

                $request['dropoff_location'] = $destination_location_array['location_string'];


            }




            $request['user_id'] = $user_id;
            $request['schedule'] = $schedule;
            $request['schedule_datetime'] = $schedule_datetime;
            $request['pickup_lat'] = $pickup_lat;
            $request['pickup_long'] = $pickup_long;
            $request['dropoff_lat'] = $destination_lat;
            $request['dropoff_long'] = $destination_long;
            $request['note'] = $note;
            $request['coupon_id'] = $coupon_id;
            $request['pickup_location_short_string'] = $pickup_location_short_string;
            $request['dropoff_location_short_string'] = $dropoff_location_short_string;

            $request['estimated_fare'] = $estimated_fare;
            // $request['wallet_pay'] = $wallet_pay;
            $request['payment_type'] = $payment_type;
            $request['payment_method_id'] = $payment_method_id;
            $request['created'] = date('Y-m-d H:i:s', time());



            if($schedule > 0){

                $this->Request->save($request);

                $request_id = $this->Request->getInsertID();
                $request_detail = $this->Request->getDetails($request_id);
                $output['code'] = 200;


                $output['msg'] = $request_detail;


                echo json_encode($output);


                die();

            }
            $vehicles = $this->Vehicle->getNearestVehicle($pickup_lat, $pickup_long, $ride_type_id, DISTANCE_DRIVER_IN_KM,$user_id);









            if (count($vehicles) > 0) {

                foreach ($vehicles as $key => $val) {

                    $vehicle_id = $val['Vehicle']['id'];
                    $current_date = date('Y-m-d', time());
                    $request_detail = $this->Request->getRequestDetail($vehicle_id, $user_id);


                    if (count($request_detail) > 0) {

                        $output['code'] = 201;

                        $output['msg'] = "you cannot send a multiple request";


                        echo json_encode($output);


                        die();

                    }


                    $driver_device_token = $val['Driver']['device_token'];

                    $driver_user_id = $val['Driver']['id'];

                    $first_name = $val['User']['first_name'];
                    $last_name = $val['User']['last_name'];
                    $full_name = $first_name. " ".$last_name;
                    $user_image = $val['User']['image'];


                    $request['vehicle_id'] = $val['Vehicle']['id'];
                    $request['driver_id'] = $val['Vehicle']['driver_id'];


                    $this->Request->save($request);

                    $request_id = $this->Request->getInsertID();
                    $request_detail = $this->Request->getDetails($request_id);

                    $vehicle_details = $this->Vehicle->getDetails($val['Vehicle']['id']);



                    $notification['to'] = $driver_device_token;
                    $notification['notification']['title'] = "new ride request";
                    $notification['notification']['body'] = "You have received the ride request from ".$full_name;
                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";
                    $notification['notification']['request_receive'] = "1";
                    $notification['notification']['pickup_lat'] = $pickup_lat;
                    $notification['notification']['pickup_long'] = $pickup_long;
                    $notification['notification']['dropoff_lat'] = $destination_lat;
                    $notification['notification']['dropoff_long'] = $destination_long;
                    $notification['notification']['pickup_lat'] = $pickup_lat;
                    $notification['notification']['full_name'] = $full_name;
                    $notification['notification']['image'] = $user_image;
                    $notification['notification']['User']['id'] = $request_detail['User']['id'];
                    $notification['notification']['User']['first_name'] = $request_detail['User']['first_name'];
                    $notification['notification']['User']['last_name'] = $request_detail['User']['last_name'];
                    $notification['notification']['User']['image'] = $request_detail['User']['image'];
                    $notification['notification']['Driver']['id'] = $request_detail['Driver']['id'];
                    $notification['notification']['Driver']['first_name'] = $request_detail['Driver']['first_name'];
                    $notification['notification']['Driver']['last_name'] = $request_detail['Driver']['last_name'];
                    $notification['notification']['Driver']['image'] = $request_detail['Driver']['image'];



                    $notification['data']['title'] = "new ride request";
                    $notification['data']['body'] = "You have received the ride request from ".$full_name;
                    $notification['data']['pickup_lat'] = $pickup_lat;
                    $notification['data']['pickup_long'] = $pickup_long;
                    $notification['data']['dropoff_lat'] = $destination_lat;
                    $notification['data']['dropoff_long'] = $destination_long;
                    $notification['data']['pickup_lat'] = $pickup_lat;
                    $notification['data']['full_name'] = $full_name;
                    $notification['data']['image'] = $user_image;
                    //$notification['data']['request_detail'] = $request_detail;
                    $notification['data']['icon'] = "";
                    $notification['data']['type'] = "request_vehicle";
                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $notification['data']['User']['id'] = $request_detail['User']['id'];
                    $notification['data']['User']['first_name'] = $request_detail['User']['first_name'];
                    $notification['data']['User']['last_name'] = $request_detail['User']['last_name'];
                    $notification['data']['User']['image'] = $request_detail['User']['image'];
                    $notification['data']['Driver']['id'] = $request_detail['Driver']['id'];
                    $notification['data']['Driver']['first_name'] = $request_detail['Driver']['first_name'];
                    $notification['data']['Driver']['last_name'] = $request_detail['Driver']['last_name'];
                    $notification['data']['Driver']['image'] = $request_detail['Driver']['image'];




                    $result = Utility::sendPushNotificationToMobileDevice(json_encode($notification));








                    $output['code'] = 200;

                    $output['msg'] = $vehicle_details;
                    $output['msg']['Request'] = $request_detail['Request'];


                    echo json_encode($output);


                    die();

                }
            }




            Message::EMPTYDATA();
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


            if(APP_STATUS == "demo"){

                $output['code'] = 201;
                $output['msg'] = "You cannot add a store in demo mode. contact the administrator";
                echo json_encode($output);
                die();

            }
            $cat= array();
            $store_location = array();

            if(isset($data['user_id'])){

                $cat['user_id'] =  $data['user_id'];
            }


            if(isset($data['name'])){

                $cat['name'] =  $data['name'];
            }

            if(isset($data['about'])){

                $cat['about'] =  $data['about'];
            }

            if(isset($data['shipping_base_fee'])){

                $cat['shipping_base_fee'] =  $data['shipping_base_fee'];
            }

            if(isset($data['shipping_fee_per_distance'])){

                $cat['shipping_fee_per_distance'] =  $data['shipping_fee_per_distance'];
            }


            if(isset($data['distance_unit'])){

                $cat['distance_unit'] =  $data['distance_unit'];
            }

            if(isset($data['lat'])){

                $store_location['lat'] = $data['lat'];
                $store_location['long'] = $data['long'];
                $store_location['street'] = $data['street'];
                $store_location['city'] = $data['city'];
                $store_location['state'] = $data['state'];
                $store_location['country_id'] = $data['country_id'];
                $store_location['zip_code'] = $data['zip_code'];
            }









            if(isset($data['id'])){

                $id = $data['id'];

                $store_location_details = $this->StoreLocation->getStoreLocation($id);
                if(count($store_location_details) > 0 && count($store_location) > 0 ){

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




                if(count($cat) > 0) {

                    $this->Store->id = $id;
                    $this->Store->save($cat);


                }

                $details =  $this->Store->getDetails($id);

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


    public function updateStoreStatus(){



        $this->loadModel('Store');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $active = $data['active'];

            $store_id = $data['store_id'];

            $details = $this->Store->getDetails($store_id);

            if(APP_STATUS == "demo"){

                $output['code'] = 201;
                $output['msg'] = "You cannot change the status of the store in demo mode. contact the administrator";
                echo json_encode($output);
                die();

            }

            if(count($details) > 0 ){

                $this->Store->id = $store_id;
                $this->Store->saveField('active',$active);
            }







            $details = $this->Store->getDetails($store_id);





            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();
        }
    }

    public function editProfile()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];


            $userDetails = $this->User->getUserDetailsFromID($user_id);


            if (count($userDetails) > 0) {
                if (isset($data['first_name'])) {


                    $user['first_name'] = $data['first_name'];
                }
                if (isset($data['last_name'])) {


                    $user['last_name'] = $data['last_name'];
                }
                if (isset($data['bio'])) {


                    $user['bio'] = $data['bio'];
                }

                if (isset($data['dob'])) {


                    $user['dob'] = $data['dob'];
                }
                if (isset($data['country_id'])) {


                    $user['country_id'] = $data['country_id'];
                }

                if (isset($data['phone'])) {


                    $user['phone'] = $data['phone'];
                }

                if (isset($data['gender'])) {


                    $user['gender'] = $data['gender'];
                }
                /*  if (isset($data['username'])) {


                      $user['username'] = $data['username'];

                      $username_exist = $this->User->editIsUsernameAlreadyExist($data['username'], $user_id);
                      //$email_exist = $this->User->editIsEmailAlreadyExist($data['email'], $user_id);

                      if ($username_exist > 0) {

                          $output['code'] = 201;
                          $output['msg'] = "username already exist";
                          echo json_encode($output);
                          die();
                      }
                  }*/
                if (isset($data['image'])) {


                    $image_db = $userDetails['User']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $user['image'] = $filePath;
                    if (isset($data['gender'])) {

                        $user['gender'] = $data['gender'];

                    }
                }
                if (isset($data['email'])) {

                    $user['email'] = $data['email'];

                }

                // $phone = $this->User->editIsphoneNoAlreadyExist($data['phone'], $user_id);


                $this->User->id = $user_id;
                $this->User->save($user);


                $output = array();
                $userDetails = $this->User->getUserDetailsFromID($user_id);


                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);
            } else {

                Message::EMPTYDATA();
                die();
            }


        }
    }

    public function showStoreProducts()
    {

        $this->loadModel("Product");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $store_id = $data['store_id'];
            $starting_point = 0;
            if(isset($data['starting_point'])){

                $starting_point = $data['starting_point'];
            }

            $store_products = $this->Product->getProductsAgainstStore($store_id,$starting_point);


            if(count($store_products) > 0){



                $output['code'] = 200;

                $output['msg'] = $store_products;
                echo json_encode($output);


                die();
            }else{
                Message::EMPTYDATA();
                die();
            }
        }
    }

    public function showRequestDetails()
    {

        $this->loadModel("Request");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $request_id = $data['request_id'];


            $details = $this->Request->getDetails($request_id);


            if(count($details) > 0){



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


    public function showUserNotifications()
    {

        $this->loadModel("Notification");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $user_id = $data['user_id'];
            $starting_point = $data['starting_point'];


            $details = $this->Notification->getUserNotifications($user_id,$starting_point);


            if(count($details) > 0){



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


    public function showFoodCategory()
    {

        $this->loadModel("FoodCategory");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $images = $this->FoodCategory->getAll();


            $output['code'] = 200;

            $output['msg'] = $images;
            echo json_encode($output);


            die();
        }
    }

    public function showRestaurantsAgainstCategory()
    {

        $this->loadModel("RestaurantCategory");
        $this->loadModel("RestaurantRating");
        $this->loadModel("RestaurantFavourite");
        $this->loadModel("RestaurantTiming");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $time = date('H:i:s', time());
            $datetime = date('Y-m-d H:i:s', time());
            $day = date('l', strtotime($datetime));


            $id = $data['food_category_id'];

            $restaurants = $this->RestaurantCategory->getRestaurantsAgainstCategory($id);
            if(count($restaurants) > 0) {


                foreach ($restaurants as $key => $restaurant) {
                    $ratings = $this->RestaurantRating->getAvgRatings($restaurant['Restaurant']['id']);
                    $restaurants[$key]['Restaurant']['favourite'] = 0;
                    $restaurants[$key]['Restaurant']['open'] = 0;
                    if (count($ratings) > 0) {
                        $restaurants[$key]['Restaurant']['TotalRatings']["avg"] = $ratings[0]['average'];
                        $restaurants[$key]['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                    }

                    $if_open = $this->RestaurantTiming->isRestaurantOpen($day,$time,$restaurant['Restaurant']['id']);

                    if(count($if_open) > 0){

                        $restaurants[$key]['Restaurant']['open'] = 1;

                    }

                    if(isset($data['user_id'])){

                        $fav_restaurant = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($data['user_id'],$restaurant['Restaurant']['id']);

                        if(count($fav_restaurant) > 0){

                            $restaurants[$key]['Restaurant']['favourite'] = 1;
                        }

                    }
                }
            }

            $output['code'] = 200;

            $output['msg'] = $restaurants;
            echo json_encode($output);


            die();
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


    public function test1(){
        $this->loadModel("OrderSession");
        $id = 1;

        $details = $this->OrderSession->getDetails($id);
        if(count($details) > 0) {

            $string = $details['OrderSession']['string'];
            $details= json_decode($string, TRUE);

            pr($details);

            $id_to_find = 1;
            $data =  $this->checkStoreIDExist($details,$id_to_find);

            if($data){
                $index = $data['index'];
                $store_product_count = $data['store_product_count'];
                $details['store'][$index]['store_product'][$store_product_count]['product_title'] ="new";
            }else{

                echo "no exist";
                die();
            }


            pr($details)
            ;


        }
    }


    function checkStoreIDExist($data,$id){

        foreach($data['store'] as $key=>$st){


            $store_id = $st['store_id'];
            $store_product = $st['store_product'];

            if($store_id == $id){

                $index = $key;
                $store_product_count =  count($store_product);
                $output['index'] = $index;
                $output['store_product_count'] = $store_product_count;
                return $output;

            }else{

                return false;
            }

        }

    }
    public function showFilters()
    {

        $this->loadModel("Store");
        $this->loadModel("Category");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $brands = $this->Store->getAll();
            $categories = $this->Category->getAll();
            $sort = array();
            $sort[0]['Sort']['name'] = "Online Display Name(ascending)";
            $sort[0]['Sort']['id'] = "asc";
            $sort[1]['Sort']['name'] = "Online Display Name(ascending)";
            $sort[1]['Sort']['id'] = "desc";
            $sort[2]['Sort']['name'] = "Price: Lowest Price First";
            $sort[2]['Sort']['id'] = "lowest_price";

            $sort[3]['Sort']['name'] = "Price: Highest Price First";
            $sort[3]['Sort']['id'] = "highest_price";


            $output['code'] = 200;
            $output['msg']['Category'] = $categories;
            $output['msg']['Store'] = $brands;
            $output['msg']['Sort'] =$sort;


            echo json_encode($output);


            die();
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

                $countries = $this->Country->getAll();

            }



            $output['code'] = 200;

            $output['msg'] = $countries;


            echo json_encode($output);


            die();


        }


    }



    public function showCurrency()
    {

        $this->loadModel("Country");


        if ($this->request->isPost()) {




            $currency = $this->Country->getDefaultCurrency();






            $output['code'] = 200;

            $output['msg']    = $currency;

            echo json_encode($output);


            die();
        }
    }



    public function showActiveRequest(){

        $this->loadModel('Request');
        $this->loadModel('DriverRating');
        $this->loadModel('Trip');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $trip_detail = $this->Request->getActiveRequest($user_id);


            if(count($trip_detail) > 0){

                $avg_ratings = $this->DriverRating->getAvgRatings($trip_detail['Driver']['id']);
                $trip_details = $this->Trip->getTripAgainstRequest($trip_detail['Request']['id']);
                if (count($trip_details) > 0){

                    $trip_detail['Trip'] = $trip_details['Trip'];

                }
                //$trip_detail['Request']['final_fare'] = 40;
                if(count($avg_ratings) > 0) {
                    $trip_detail['Driver']['avg_ratings'] = number_format((float)$avg_ratings[0]['average'], 2, '.', '');
                }
                $output['code'] = 200;

                $output['msg'] = $trip_detail;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function showScheduleTrips(){

        $this->loadModel('Request');
        $this->loadModel('DriverRating');
        $this->loadModel('Trip');






        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $trip_detail = $this->Request->getScheduleTrips($user_id);


            if(count($trip_detail) > 0){

                $avg_ratings = $this->DriverRating->getAvgRatings($trip_detail['Driver']['id']);
                $trip_details = $this->Trip->getTripAgainstRequest($trip_detail['Request']['id']);
                if (count($trip_details) > 0){

                    $trip_detail['Trip'] = $trip_details['Trip'];

                }
                //$trip_detail['Request']['final_fare'] = 40;
                if(count($avg_ratings) > 0) {
                    $trip_detail['Driver']['avg_ratings'] = number_format((float)$avg_ratings[0]['average'], 2, '.', '');
                }
                $output['code'] = 200;

                $output['msg'] = $trip_detail;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }

        }


    }
    public function showActiveOrCompletedOrders()
    {

        $this->loadModel("Order");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];


            if(isset($data['status'])){
                $status = $data['status'];

                $output['code'] = 200;
                $orders = $this->Order->getUserOrders($user_id,$status);

                $output['code'] = 200;
                $output['msg']    = $orders;
                echo json_encode($output);


                die();
            }else{

                $active_orders = $this->Order->getUserOrders($user_id,1);
                $completed_orders = $this->Order->getUserOrders($user_id,2);
                $pending_orders = $this->Order->getUserOrders($user_id,0);

                $output['code'] = 200;

                $output['msg']['active']    = $active_orders;
                $output['msg']['completed_orders']    = $completed_orders;
                $output['msg']['pending_orders']    = $pending_orders;

                echo json_encode($output);


                die();

            }








        }
    }

    public function showOrderDetail()
    {

        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("RiderOrder");
        $this->loadModel("Vehicle");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['food_order_id'])){

                $order_details = $this->FoodOrder->getDetails($data['food_order_id']);
                $rider_order_detail = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($data['food_order_id']);

            }else{


                $order_details = $this->ParcelOrder->getDetails($data['parcel_order_id']);
                $rider_order_detail = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

            }








            if(count($rider_order_detail) > 0){

                $order_details['RiderOrder'] = $rider_order_detail;

                $vehicle_detail =  $this->Vehicle->getUserVehicle($rider_order_detail['RiderOrder']['rider_user_id']);
                $order_details['RiderOrder']['Rider']['Vehicle'] = $vehicle_detail['Vehicle'];
            }



            $output['code'] = 200;

            $output['msg']    = $order_details;


            echo json_encode($output);


            die();
        }
    }


    public function showProductDetail()
    {

        $this->loadModel("Product");
        $this->loadModel("Favourite");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $product_id = $data['product_id'];


            $product_details = $this->Product->getDetails($product_id);


            if(count($product_details) > 0) {

                if (isset($data['user_id'])) {


                    $favourite = $this->Favourite->ifProductFavourite($data['user_id'], $product_details['Product']['id']);
                    if (count($favourite) > 0) {

                        $product_details['Product']['favourite'] = "1";

                    } else {

                        $product_details['Product']['favourite'] = "0";

                    }


                }


                $output['code'] = 200;

                $output['msg'] = $product_details;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();
            }
        }
    }

    public function addStoreCoupon()
    {

        $this->loadModel("StoreCoupon");
        //$this->loadModel("Restaurant");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $coupon_code   = $data['coupon_code'];
            $limit_users   = $data['limit_users'];
            $discount      = $data['discount'];
            $expiry_date   = $data['expiry_date'];
            $store_id = $data['store_id'];
            $created = date('Y-m-d H:i:s', time());






            $coupon['coupon_code']   = $coupon_code;
            $coupon['limit_users']   = $limit_users;
            $coupon['discount']      = $discount;
            $coupon['expiry_date']   = $expiry_date;

            $coupon['store_id']   = $store_id;
            $coupon['created']   = $created;
            //$id        = $this->Restaurant->getRestaurantID($user_id);

            if(isset($data['id'])){

                $this->StoreCoupon->id = $data['id'];
                $this->StoreCoupon->save($coupon);
                $coupon_detail = $this->StoreCoupon->getDetails($data['id']);


                $output['code'] = 200;

                $output['msg'] = $coupon_detail;
                echo json_encode($output);


                die();

            }else{


                if ($this->StoreCoupon->isDuplicateRecord($store_id, $coupon_code) == 0) {
                    if ($this->StoreCoupon->save($coupon)) {
                        $id = $this->StoreCoupon->getInsertID();
                        $coupon_detail = $this->StoreCoupon->getDetails($id);


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


    public function showStoreCoupons()
    {

        $this->loadModel("StoreCoupon");


        if ($this->request->isPost()) {



            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);




            if(isset($data['store_coupon_id'])){

                $coupons = $this->StoreCoupon->getDetails($data['store_coupon_id']);


            }elseif(isset($data['store_id'])){


                $coupons = $this->StoreCoupon->getStoreCoupons($data['store_id']);
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


    public function updateOrderStatus()
    {


        $this->loadModel('Order');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $order['status'] = $data['status'];




            $order_id = $data['order_id'];




            $this->Order->id = $order_id;
            $this->Order->save($order);


            $order_details = $this->Order->getDetails($order_id);
            $device_token =  $order_details['User']['device_token'];

            if ($data['status'] == 1 ){

                $msg = "Order has been accepted by the ".$order_details['Store']['name'] ;
            }else{


                $msg = "Order has been rejected by the  ".$order_details['Store']['name'] ;
            }

            $notification['to'] = $device_token;
            $notification['notification']['title'] = $msg;
            $notification['notification']['body'] = "";
            $notification['notification']['badge'] = "1";
            $notification['notification']['sound'] = "default";
            $notification['notification']['icon'] = "";
            $notification['notification']['type'] = "";
            $notification['data']['title'] = $msg;
            $notification['data']['body'] = '';
            $notification['data']['icon'] = "";
            $notification['data']['badge'] = "1";
            $notification['data']['sound'] = "default";
            $notification['data']['type'] = "";
            $push = Utility::sendPushNotificationToMobileDevice(json_encode($notification));


            $output = array();
            $userDetails = $this->Order->getDetails($order);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


        }
    }


    public function deleteStoreCoupon()
    {

        $this->loadModel("StoreCoupon");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $coupon_id = $data['coupon_id'];
            $coupon_detail = $this->StoreCoupon->getDetails($coupon_id);

            if (count($coupon_detail) > 0) {


                $this->StoreCoupon->id = $coupon_id;

                if ($this->StoreCoupon->delete()) {

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
    public function addUserLatLong(){


        $this->loadModel('User');
        $this->loadModel('Vehicle');
        $this->loadModel('TripHistory');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =

            $loc['lat'] = $data['lat'];
            $loc['long'] = $data['long'];
            $loc['created']=date('Y-m-d H:i:s', time());


            if(isset($data['user_id'])) {

                $user_id =  $data['user_id'];
                $details = $this->User->getUserDetailsFromID($user_id);
                $vehicle_details = $this->Vehicle->getDriverVehicle($user_id);
                if(count($vehicle_details) > 0){
                    $id =  $vehicle_details['Vehicle']['id'];
                    $this->Vehicle->id = $id;
                    $this->Vehicle->save($loc);


                }
                if(count($details) > 0) {
                    $this->User->id = $user_id;
                    $this->User->save($loc);
                    $user_details =  $this->User->getUserDetailsFromID($user_id);

                    $output['code'] = 200;

                    $output['msg'] = $user_details;


                    echo json_encode($output);


                    die();

                }else{

                    Message::EMPTYDATA();
                    die();
                }


            }else  if(isset($data['trip_id'])) {


                $loc['trip_id'] = $data['trip_id'];



                $this->TripHistory->save($loc);


                $output['code'] = 200;

                $output['msg'] = "success";


                echo json_encode($output);


                die();

            }

        }




    }



    public function addVehicle(){


        $this->loadModel('Vehicle');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user['user_id'] = $data['user_id'];
            $user['driver_id'] = $data['user_id'];
            $user['vehicle_type_id'] = $data['vehicle_type_id'];
            $user['make'] = $data['make'];
            $user['model'] = $data['model'];
            $user['year'] = $data['year'];
            $user['ride_type_id'] = $data['ride_type_id'];
            $user['license_plate'] = $data['license_plate'];
            $user['color'] = $data['color'];


            $vehicle_details = $this->Vehicle->getUserVehicle($data['user_id']);

            if (count($vehicle_details) > 0) {

                if (isset($data['image'])) {




                    $image_db = $vehicle_details['Vehicle']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $user['image'] = $filePath;

                }

                $user['updated'] = date('Y-m-d H:i:s', time());
                $this->Vehicle->id = $vehicle_details['Vehicle']['id'];
                if (!$this->Vehicle->save($user)) {
                    echo Message::DATASAVEERROR();
                    die();
                }


                $vehicle_details = $this->Vehicle->getDetails($vehicle_details['Vehicle']['id']);


            }else{

                $user['created'] = date('Y-m-d H:i:s', time());

                $this->Vehicle->save($user);
                $id = $this->Vehicle->getInsertID();
                $vehicle_details = $this->Vehicle->getDetails($id);

            }

            $output['code'] = 200;

            $output['msg'] = $vehicle_details;


            echo json_encode($output);


            die();


        }




    }

    public function showVehicle(){

        $this->loadModel('Vehicle');





        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];

            $vehicles = $this->Vehicle->getUserVehicle($user_id);











            $output['code'] = 200;

            $output['msg'] = $vehicles;


            echo json_encode($output);


            die();


        }


    }

    public function showVehicleTypes(){

        $this->loadModel('VehicleType');





        if ($this->request->isPost()) {



            $types = $this->VehicleType->getAll();











            $output['code'] = 200;

            $output['msg'] = $types;


            echo json_encode($output);


            die();


        }


    }

    public function online()
    {


        $this->loadModel('User');
        $this->loadModel('Vehicle');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user['online'] = $data['online'];




            $user_id = $data['user_id'];


            $this->User->id = $user_id;
            $this->User->save($user);

            $vehicle_details = $this->Vehicle->getUserVehicle($user_id);
            if(count($vehicle_details) > 0){

                $this->Vehicle->id = $vehicle_details['Vehicle']['id'];
                $this->Vehicle->saveField('online',$data['online']);

            }
            $output = array();
            $userDetails = $this->User->getUserDetailsFromID($user_id);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


        }
    }




    public function addDocument(){


        $this->loadModel('UserDocument');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];
            $extension = $data['extension'];
            $type = $data['type'];
            $document['user_id'] = $data['user_id'];
            $document['type'] = $data['type'];


            $details = $this->UserDocument->getUserDocumentAgainstType($user_id,$type);

            if (count($details) > 0) {
                $document['status'] = 0;
                if (isset($data['attachment'])) {


                    $image_db = $details['UserDocument']['attachment'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['attachment'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url, $extension);
                    $document['attachment'] = $filePath;


                    $document['updated'] = date('Y-m-d H:i:s', time());
                    $this->UserDocument->id = $details['UserDocument']['id'];
                    if (!$this->UserDocument->save($document)) {
                        echo Message::DATASAVEERROR();
                        die();
                    }


                    $details = $this->UserDocument->getDetails($details['UserDocument']['id']);

                    $output['code'] = 200;

                    $output['msg'] = $details;


                    echo json_encode($output);


                    die();
                }else{



                    $output['code'] = 201;

                    $output['msg'] = "missing attachment";


                    echo json_encode($output);


                    die();
                }
            }else {


                if (isset($data['attachment'])) {


                    $image = $data['attachment'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url, $extension);
                    $document['attachment'] = $filePath;


                    $document['created'] = date('Y-m-d H:i:s', time());


                    $this->UserDocument->save($document);
                    $id = $this->UserDocument->getInsertID();
                    $details = $this->UserDocument->getDetails($id);


                    $output['code'] = 200;

                    $output['msg'] = $details;


                    echo json_encode($output);


                    die();
                }else{

                    $output['code'] = 201;

                    $output['msg'] = "missing attachment";


                    echo json_encode($output);


                    die();
                }
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


    public function filterProducts()
    {

        $this->loadModel("Product");
        $this->loadModel("Favourite");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $min_price = 0;
            $max_price = 1000000;
            $keyword = null;
            $category_id = null;

            if(isset($data['min_price'])){

                $min_price = $data['min_price'];
                $max_price = $data['max_price'];
            }

            if(isset($data['keyword'])){

                $keyword = $data['keyword'];

            }

            $products = $this->Product->filterProducts($min_price,$max_price,$keyword);

            if(isset($data['category_id']) && !isset($data['store_id']) && !isset($data['sort_id'])){




            }

            if(isset($data['category_id']) && !isset($data['store_id']) && !isset($data['sort_id'])){

                $category_id = $data['category_id'];

                $products = $this->Product->filterProductsWithCategory($min_price,$max_price,$keyword,$category_id);


            }
            if(!isset($data['category_id']) && isset($data['store_id']) && !isset($data['sort_id'])){

                $store_id = $data['store_id'];

                $products = $this->Product->filterProductsWithStore($min_price,$max_price,$store_id);


            }

            if(!isset($data['category_id']) && !isset($data['store_id']) && isset($data['sort_id'])){

                $sort_id = $data['sort_id'];


                if($sort_id =="highest_price") {

                    $products = $this->Product->filterProductsWithHighestPrice($min_price, $max_price, $keyword, $sort_id);
                }else{
                    $products = $this->Product->filterProductsWithLowestPrice($min_price, $max_price, $keyword, $sort_id);


                }

            }



            if(count($products) > 0) {

                if(isset($data['user_id'])) {
                    foreach ($products as $key => $product) {

                        $favourite = $this->Favourite->ifProductFavourite($data['user_id'], $product['Product']['id']);
                        if (count($favourite) > 0) {

                            $products[$key]['Product']['favourite'] = "1";

                        } else {

                            $products[$key]['Product']['favourite'] = "0";

                        }

                    }
                }


                $output['code'] = 200;

                $output['msg'] = $products;


                echo json_encode($output);


                die();

            }else{

                Message::EMPTYDATA();
                die();

            }
        }
    }
    public function addUserImage()
    {


        $this->loadModel('User');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $userDetails = $this->User->getUserDetailsFromID($user_id);


            if (isset($data['image'])) {


                $image_db = $userDetails['User']['image'];
                if (strlen($image_db) > 5) {
                    @unlink($image_db);

                }

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                $user['image'] = $filePath;


                $this->User->id = $user_id;
                if (!$this->User->save($user)) {
                    echo Message::DATASAVEERROR();
                    die();
                }


                $output = array();
                $userDetails = $this->User->getUserDetailsFromID($user_id);


                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);


            }else{

                $output['code'] = 201;
                $output['msg'] = "please send the correct image";
                echo json_encode($output);
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

    public function showCategories(){

        $this->loadModel('Category');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            if(isset($data['store_id'])) {


                $categories = $this->Category->getAllAgainstStoreID($data['store_id']);
            }else{

                $categories = $this->Category->getAll();
            }











            $output['code'] = 200;

            $output['msg'] = $categories;


            echo json_encode($output);


            die();


        }


    }


    public function showStores(){

        $this->loadModel('Store');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);






            $categories = $this->Store->getAll();








            $output['code'] = 200;

            $output['msg'] = $categories;


            echo json_encode($output);


            die();


        }


    }

    public function showUserStores(){

        $this->loadModel('Store');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];




            $stores = $this->Store->getUserStores($user_id);








            $output['code'] = 200;

            $output['msg'] = $stores;


            echo json_encode($output);


            die();


        }


    }

    public function showStoreDetail(){

        $this->loadModel('Store');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $store_id = $data['store_id'];




            $store_detail = $this->Store->getDetails($store_id);








            $output['code'] = 200;

            $output['msg'] = $store_detail;


            echo json_encode($output);


            die();


        }


    }


    public function showCategoriesBasedOnStores(){

        $this->loadModel('Category');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $store_id = $data['store_id'];



            $categories = $this->Category->getCategoriesAgainstStore($store_id);








            $output['code'] = 200;

            $output['msg'] = $categories;


            echo json_encode($output);


            die();


        }


    }
    public function showProductsAgainstCategory(){

        $this->loadModel('Product');
        $this->loadModel('Favourite');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $category_id = $data['category_id'];



            $products = $this->Product->getProductsAgainstCategory($category_id);
            if(count($products) > 0) {

                if(isset($data['user_id'])){


                    foreach ($products as $key => $product) {

                        $favourite = $this->Favourite->ifProductFavourite($data['user_id'], $product['Product']['id']);
                        if (count($favourite) > 0) {

                            $products[$key]['Product']['favourite'] = "1";

                        } else {

                            $products[$key]['Product']['favourite'] = "0";

                        }


                    }
                }

                $output['code'] = 200;

                $output['msg'] = $products;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function searchRestaurant(){

        $this->loadModel('Restaurant');
        $this->loadModel('RestaurantFavourite');
        $this->loadModel('RestaurantRating');
        $this->loadModel('RestaurantTiming');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $keyword = $data['keyword'];
            $time = date('H:i:s', time());
            $datetime = date('Y-m-d H:i:s', time());
            $day = date('l', strtotime($datetime));

            $user_id = 0;
            if(isset($data['user_id'])) {

                $user_id = $data['user_id'];
            }

            $restaurants = $this->Restaurant->searchRestaurant($keyword);
            if(count($restaurants) > 0) {


                foreach ($restaurants as $key => $restaurant) {
                    $restaurants[$key]['Restaurant']['favourite'] = 0;
                    $restaurants[$key]['Restaurant']['open'] = 0;
                    $favourite = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($user_id, $restaurant['Restaurant']['id']);
                    if (count($favourite) > 0) {

                        $restaurants[$key]['Restaurant']['favourite'] = "1";

                    } else {

                        $restaurants[$key]['Restaurant']['favourite'] = "0";

                    }


                    $ratings = $this->RestaurantRating->getAvgRatings($restaurant['Restaurant']['id']);
                    $restaurants[$key]['Restaurant']['favourite'] = 0;
                    $restaurants[$key]['Restaurant']['open'] = 0;
                    if (count($ratings) > 0) {
                        $restaurants[$key]['Restaurant']['TotalRatings']["avg"] = $ratings[0]['average'];
                        $restaurants[$key]['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                    }


                    $if_open = $this->RestaurantTiming->isRestaurantOpen($day,$time,$restaurant['Restaurant']['id']);

                    if(count($if_open) > 0){

                        $restaurants[$key]['Restaurant']['open'] = 1;

                    }
                    if(isset($data['user_id'])){

                        $fav_restaurant = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($user_id,$restaurant['Restaurant']['id']);

                        if(count($fav_restaurant) > 0){

                            $restaurants[$key]['Restaurant']['favourite'] = 1;
                        }

                    }
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


    }
    public function showEarningsAndRecentTrips(){

        $this->loadModel('Trip');
        $this->loadModel('TripPayment');
        $this->loadModel('RiderOrder');
        $this->loadModel('ServiceCharge');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $food_order_earnings = 0;
            $parcel_order_earnings = 0;
            $parcel_orders_count = 0;
            $food_orders_count = 0;

            $param_data['module'] = "food_delivery";

            $food_delivery_details = $this->ServiceCharge->checkDuplicate($param_data);


            $param_data['module'] = "ride_hailing";
            $ride_hailing_details = $this->ServiceCharge->checkDuplicate($param_data);

            $param_data['module'] = "parcel_delivery";
            $parcel_delivery_details = $this->ServiceCharge->checkDuplicate($param_data);
            if (isset($data['user_id'])) {

                $user_id = $data['user_id'];
                $trips = $this->Trip->getUserCompletedTrips($user_id);

            } else if (isset($data['driver_id'])) {

                $driver_id = $data['driver_id'];
                $user_details= $this->User->getUserDetailsFromID($data['driver_id']);
                $rider_fee_per_order = $user_details['User']['rider_fee_food_parcel'];
                $rider_comission = $user_details['User']['rider_commission_ride_hailing'];
                //$trips = $this->Trip->getDriverCompletedTrips($driver_id);
                $food_orders_count = $this->RiderOrder->getCompletedFoodOrdersCount($driver_id);
                $food_orders_total_amount = $this->RiderOrder->getCompletedFoodOrdersPriceSUM($driver_id);

                $parcel_orders_count = $this->RiderOrder->getCompletedParcelOrdersCount($driver_id);
                $parcel_orders_total_amount = $this->RiderOrder->getCompletedParcelOrdersPriceSum($driver_id);


                $ride_hailing_orders_count = $this->Trip->getTotalDriverCompletedTrips($driver_id);
                $ride_hailing_completed_total_amount = $this->Trip->getTotalDriverCompletedTripsSumPrice($driver_id);

                if(count($food_delivery_details) > 0){


                    $type = $food_delivery_details['ServiceCharge']['type'];
                    $value = $food_delivery_details['ServiceCharge']['value'];

                    if($type > 1){

                        $food_order_earnings = $food_orders_count * $value;

                    }else{


                        $food_order_earnings = $value/100 * $food_orders_total_amount[0]['total_amount'];

                    }
                }

                if(count($ride_hailing_details) > 0){


                    $type = $ride_hailing_details['ServiceCharge']['type'];
                    $value = $ride_hailing_details['ServiceCharge']['value'];

                    if($type > 1){

                        $parcel_order_earnings = $parcel_orders_count * $value;

                    }else{


                        $parcel_order_earnings = $value/100 * $parcel_orders_total_amount[0]['total_amount'];

                    }
                }

                if(count($parcel_delivery_details) > 0){


                    $type = $parcel_delivery_details['ServiceCharge']['type'];
                    $value = $parcel_delivery_details['ServiceCharge']['value'];

                    if($type > 1){

                        $ride_hailing_order_earnings = $ride_hailing_orders_count * $value;

                    }else{


                        $ride_hailing_order_earnings = $value/100 * $ride_hailing_completed_total_amount[0]['total_amount'];

                    }
                }



            }



            /*foreach ($trips as $key=>$val) {


                $trip_id = $val['Trip']['id'];
                $trip_payment_details = $this->TripPayment->checkIfTripExist($trip_id);
                if (count($trip_payment_details) > 0) {
                    $trips[$key]['Trip']['TripPayment'] = $trip_payment_details['TripPayment'];
                } else {

                    $trips[$key]['Trip']['TripPayment'] = array();

                }


            }*/


            $output['code'] = 200;

            // $output['msg']['recent_trips'] = $trips;
            $output['msg']['FoodOrder']['earnings'] = $food_order_earnings;
            $output['msg']['FoodOrder']['completed_orders'] = $food_orders_count;
            $output['msg']['ParcelOrder']['earnings'] = $parcel_order_earnings;
            $output['msg']['ParcelOrder']['completed_orders'] = $parcel_orders_count;
            $output['msg']['RideHailing']['earnings'] = $ride_hailing_order_earnings;
            $output['msg']['RideHailing']['completed_orders'] = $ride_hailing_orders_count;


            echo json_encode($output);


            die();

        }




    }
    public function filterRestaurant(){

        $this->loadModel('Restaurant');
        $this->loadModel('RestaurantFavourite');
        $this->loadModel('RestaurantRating');
        $this->loadModel('RestaurantTiming');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $sort = $data['sort'];
            $min_price = $data['min_price'];
            $max_price = $data['max_price'];

            $time = date('H:i:s', time());
            $datetime = date('Y-m-d H:i:s', time());
            $day = date('l', strtotime($datetime));

            $user_id = 0;
            if(isset($data['user_id'])) {

                $user_id = $data['user_id'];
            }

            $restaurants = $this->Restaurant->filterRestaurant($sort,$min_price,$max_price);
            if(count($restaurants) > 0) {


                foreach ($restaurants as $key => $restaurant) {
                    $restaurants[$key]['Restaurant']['favourite'] = 0;
                    $restaurants[$key]['Restaurant']['open'] = 0;
                    $favourite = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($user_id, $restaurant['Restaurant']['id']);
                    if (count($favourite) > 0) {

                        $restaurants[$key]['Restaurant']['favourite'] = "1";

                    } else {

                        $restaurants[$key]['Restaurant']['favourite'] = "0";

                    }


                    $ratings = $this->RestaurantRating->getAvgRatings($restaurant['Restaurant']['id']);
                    $restaurants[$key]['Restaurant']['favourite'] = 0;
                    $restaurants[$key]['Restaurant']['open'] = 0;
                    if (count($ratings) > 0) {
                        $restaurants[$key]['Restaurant']['TotalRatings']["avg"] = $ratings[0]['average'];
                        $restaurants[$key]['Restaurant']['TotalRatings']["totalRatings"] = $ratings[0]['total_ratings'];
                    }


                    $if_open = $this->RestaurantTiming->isRestaurantOpen($day,$time,$restaurant['Restaurant']['id']);

                    if(count($if_open) > 0){

                        $restaurants[$key]['Restaurant']['open'] = 1;

                    }
                    if(isset($data['user_id'])){

                        $fav_restaurant = $this->RestaurantFavourite->ifUserHasFavouritedRestaurant($user_id,$restaurant['Restaurant']['id']);

                        if(count($fav_restaurant) > 0){

                            $restaurants[$key]['Restaurant']['favourite'] = 1;
                        }

                    }
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


    }

    public function searchRestaurantMenu(){

        $this->loadModel('RestaurantMenuItem');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $keyword = $data['keyword'];
            $restaurant_id = $data['restaurant_id'];



            $products = $this->RestaurantMenuItem->getSearchResults($keyword,$restaurant_id);
            if(count($products) > 0) {


                $output['code'] = 200;

                $output['msg'] = $products;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function searchProduct(){

        $this->loadModel('Product');
        $this->loadModel('Favourite');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $keyword = $data['keyword'];



            $products = $this->Product->searchProduct($keyword);
            if(count($products) > 0) {

                if(isset($data['user_id'])){


                    foreach ($products as $key => $product) {

                        $favourite = $this->Favourite->ifProductFavourite($data['user_id'], $product['Product']['id']);
                        if (count($favourite) > 0) {

                            $products[$key]['Product']['favourite'] = "1";

                        } else {

                            $products[$key]['Product']['favourite'] = "0";

                        }


                    }
                }

                $output['code'] = 200;

                $output['msg'] = $products;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function showAllProducts(){

        $this->loadModel('Product');
        $this->loadModel("Favourite");




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $products = $this->Product->getAll();

            if(isset($data['store_id'])){


                $products = $this->Product->getProductsAgainstStore($data['store_id']);
            }






            if(count($products) > 0) {
                if(isset($data['user_id'])){
                    foreach ($products as $key => $product) {

                        $favourite = $this->Favourite->ifProductFavourite($data['user_id'], $product['Product']['id']);
                        if (count($favourite) > 0) {

                            $products[$key]['Product']['favourite'] = "1";

                        } else {

                            $products[$key]['Product']['favourite'] = "0";

                        }
                    }

                }


                $output['code'] = 200;

                $output['msg'] = $products;


                echo json_encode($output);


                die();
            }else{


                Message::EMPTYDATA();
                die();
            }

        }


    }



    public function addFavourite()
    {


        $this->loadModel('Favourite');
        $this->loadModel('Product');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $favourite['user_id'] = $data['user_id'];
            $favourite['product_id'] = $data['product_id'];



            $favourite['created'] = date('Y-m-d H:i:s', time());
            $details = $this->Product->getDetails($data['product_id']);
            if(count($details) > 0) {

                $if_favourite =  $this->Favourite->ifProductFavourite($data['user_id'], $data['product_id']);
                if(count($if_favourite) < 1) {
                    //$favourite['favourite'] = $data['favourite'];
                    $this->Favourite->save($favourite);

                    $id = $this->Favourite->getInsertID();

                    $output = array();
                    $details = $this->Favourite->getDetails($id);


                    $output['code'] = 200;
                    $output['msg'] = $details;
                    echo json_encode($output);
                }else{

                    $this->Favourite->deleteFavourite($data['user_id'], $data['product_id']);

                    $output['code'] = 200;
                    $output['msg'] = "deleted";
                    echo json_encode($output);
                    die();

                }


            }else{

                $output['code'] = 201;
                $output['msg'] = "Product do not exist";
                echo json_encode($output);

            }

        }
    }


    public function showUserFavouriteProducts()
    {

        $this->loadModel("Favourite");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $fav_posts = $this->Favourite->getUserFavouriteProducts($data['user_id']);


            if(count($fav_posts) > 0) {
                $output['code'] = 200;

                $output['msg'] = $fav_posts;


                echo json_encode($output);


                die();

            }else{
                Message::EMPTYDATA();
                die();


            }
        }
    }

    public function showFeaturedCategories()
    {

        $this->loadModel('Favourite');
        $this->loadModel('Category');



        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            if(isset($data['store_id'])) {


                $category_products = $this->Category->getFeaturedCategoriesAgainstStore($data['store_id']);
            }else{

                $category_products = $this->Category->getFeaturedCategories();
            }



            if(count($category_products) > 0) {
                if (isset($data['user_id'])) {
                    foreach ($category_products as $key1 => $category_product) {


                        foreach ($category_product['Product']  as $key2 => $product) {

                            $favourite = $this->Favourite->ifProductFavourite($data['user_id'], $product['id']);
                            if (count($favourite) > 0) {

                                $category_products[$key1]['Product'][$key2]['favourite'] = "1";

                            } else {

                                $category_products[$key1]['Product'][$key2]['favourite'] = "0";

                            }
                        }
                    }
                }

                $output['code'] = 200;
                $output['msg'] = $category_products;

                echo json_encode($output);
                die();
            }else{

                Message::EmptyDATA();
                die();

            }

        }

    }

    public function addDeliveryAddress()
    {


        $this->loadModel("DeliveryAddress");
        $this->loadModel("User");



        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);




            $user_id     = $data['user_id'];
            $street      = $data['street'];
            $lat         = $data['lat'];
            $long        = $data['long'];
            $apartment   = $data['apartment'];
            $city        = $data['city'];
            $state       = $data['state'];
            $zip         = $data['zip'];
            $country     = $data['country'];







            $address['user_id']      = $user_id;
            $address['lat']          = $lat;
            $address['long']         = $long;
            $address['street']       = $street;
            $address['apartment']    = $apartment;
            $address['city']         = $city;
            $address['state']        = $state;
            $address['zip']          = $zip;
            $address['country']      = $country;


            //update
            if (isset($data['id'])) {

                $id                = $data['id'];
                $this->DeliveryAddress->id = $id;
                $this->DeliveryAddress->save($address);

                $details    = $this->DeliveryAddress->getDetails($id);
                $output['code'] = 200;
                $output['msg']  = $details;
                echo json_encode($output);


                die();
            } else if ($this->DeliveryAddress->isDuplicateRecord($user_id, $street, $city, $apartment, $state, $country) == 0) {
                if ($this->DeliveryAddress->save($address)) {


                    $id = $this->DeliveryAddress->getInsertID();


                    $details = $this->DeliveryAddress->getDetails($id);

                    //CustomEmail::welcomeStudentEmail($email);
                    $output['code'] = 200;

                    $output['msg'] = $details;
                    echo json_encode($output);

                    die();

                } else {


                    echo Message::DATASAVEERROR();
                    die();
                }
            } else {

                echo Message::DUPLICATEDATE();
                die();
            }

        }


    }

    public function riderOrderResponse()
    {

        $this->loadModel("RiderOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("FoodOrder");

        if ($this->request->isPost()) {
            $json     = file_get_contents('php://input');
            $data     = json_decode($json, TRUE);

            $rider_order['rider_response']   = $data['rider_response'];
            $rider_order['rider_response_datetime'] = date('Y-m-d H:i:s', time());

            if(isset($data['parcel_order_id'])){

                $rider_details = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

                if(count($rider_details) > 0) {
                    $id = $rider_details['RiderOrder']['id'];


                    if($data['rider_response'] == 1){

                        $this->ParcelOrder->id = $data['parcel_order_id'];
                        $this->ParcelOrder->saveField('status',1);

                        $msg = "Order has been accepted by the rider";

                    }else{


                        $msg = "Order has been rejected by the rider";
                    }


                    $notification['to'] = $rider_details['ParcelOrder']['User']['device_token'];
                    $notification['notification']['title'] = $msg;
                    $notification['notification']['body'] = "";
                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";
                    $notification['notification']['type'] = "";
                    $notification['data']['title'] = $msg;
                    $notification['data']['body'] = '';
                    $notification['data']['icon'] = "";
                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $notification['data']['type'] = "";
                    Utility::sendPushNotificationToMobileDevice(json_encode($notification));



                    $this->RiderOrder->id = $id;


                    if ($this->RiderOrder->save($rider_order)) {

                        $rider_details = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

                        $output['code'] = 200;

                        $output['msg'] = $rider_details;


                        echo json_encode($output);


                        die();

                    } else {

                        echo Message::DATASAVEERROR();
                        die();
                    }
                }else{

                    Message::EMPTYDATA();
                    die();

                }
            }else{


                $rider_details = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($data['food_order_id']);

                if(count($rider_details) > 0) {
                    $id = $rider_details['RiderOrder']['id'];


                    if($data['rider_response'] == 1){

                        $this->FoodOrder->id = $data['food_order_id'];
                        $this->FoodOrder->saveField('status',1);

                        $msg = "Order has been accepted by the rider";

                    }else{


                        $msg = "Order has been rejected by the rider";
                    }


                    $notification['to'] = $rider_details['FoodOrder']['User']['device_token'];
                    $notification['notification']['title'] = $msg;
                    $notification['notification']['body'] = "";
                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";
                    $notification['notification']['type'] = "";
                    $notification['data']['title'] = $msg;
                    $notification['data']['body'] = '';
                    $notification['data']['icon'] = "";
                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $notification['data']['type'] = "";
                    Utility::sendPushNotificationToMobileDevice(json_encode($notification));



                    $this->RiderOrder->id = $id;


                    if ($this->RiderOrder->save($rider_order)) {

                        $rider_details = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($data['food_order_id']);

                        $output['code'] = 200;

                        $output['msg'] = $rider_details;


                        echo json_encode($output);


                        die();

                    } else {

                        echo Message::DATASAVEERROR();
                        die();
                    }
                }else{

                    Message::EMPTYDATA();
                    die();

                }
            }


        }
    }



    public function showRiderOrderDetails()
    {

        $this->loadModel("RiderOrder");
        $this->loadModel("Vehicle");

        $this->loadModel("OrderTransaction");



        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);




            if(isset($data['parcel_order_id'])){

                $rider_order = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

                $cart_details = $this->OrderTransaction->getTransactionAgainstParcelOrderID($data['parcel_order_id']);
                if(count($cart_details) > 0) {
                    $type =  $cart_details['OrderTransaction']['type'];
                    if($type =="paypal"){

                        $cart_details['OrderTransaction']['type'] = "paypal";
                    }if($type =="cod"){


                        $cart_details['OrderTransaction']['type'] = "Cash on delivery";
                    }else{


                        $cart_details['OrderTransaction']['type'] = "Card";
                    }
                    $rider_order['ParcelOrder']['OrderTransaction'] = $cart_details['OrderTransaction'];
                }else{


                    // $rider_order['ParcelOrder']['OrderTransaction'] = array();

                }

            }else{

                $rider_order = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($data['food_order_id']);

                $cart_details = $this->OrderTransaction->getTransactionAgainstFoodOrderID($data['food_order_id']);
                if(count($cart_details) > 0) {
                    $type =  $cart_details['OrderTransaction']['type'];
                    if($type =="paypal"){

                        $cart_details['OrderTransaction']['type'] = "paypal";
                    }if($type =="cod"){


                        $cart_details['OrderTransaction']['type'] = "Cash on delivery";
                    }else{


                        $cart_details['OrderTransaction']['type'] = "Card";
                    }
                    $rider_order['FoodOrder']['OrderTransaction'] = $cart_details['OrderTransaction'];
                }else{


                    // $rider_order['FoodOrder']['OrderTransaction'] = array();

                }
            }





            if(count($rider_order) > 0) {




                $user_id = $rider_order['Rider']['id'];
                $vehicle = $this->Vehicle->getUserVehicle($user_id);

                if(count($vehicle) > 0) {

                    $rider_order['Rider']['Vehicle'] = $vehicle['Vehicle'];


                    $output['code'] = 200;

                    $output['msg'] = $rider_order;


                    echo json_encode($output);

                    die();
                }else{


                    Message::EmptyDATA();
                    die();

                }
            }else{

                Message::EmptyDATA();
                die();

            }











        }
    }

    public function updateRiderOrderStatus()
    {


        $this->loadModel("RiderOrder");
        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("Notification");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$order_id = $data['order_id'];

            $created = date('Y-m-d H:i:s', time());
            if(isset($data['food_order_id'])){


                $order_detail = $this->RiderOrder->getRiderFoodOrderAgainstOrderID($data['food_order_id']);
                $device_token = $order_detail['FoodOrder']['User']['device_token'];
                $receiver_id = $order_detail['FoodOrder']['User']['id'];
                $order_id =  $order_detail['FoodOrder']['id'];
                $status =  $order_detail['FoodOrder']['status'];

                if($status !=1){

                    $output['code'] = 201;
                    $output['msg'] = "This order has been either completed or cancelled by the administrator";

                    echo json_encode($output);

                    die();
                }

            }else{

                $order_detail = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

                $device_token = $order_detail['ParcelOrder']['User']['device_token'];
                $receiver_id = $order_detail['ParcelOrder']['User']['id'];
                $order_id =  $order_detail['ParcelOrder']['id'];

            }



            // $order_detail = $this->RiderOrder->getRiderOrderAgainstOrderID($order_id);
            if(count($order_detail) > 0) {
                if (isset($data['on_the_way_to_pickup'])) {


                    $rider_order['on_the_way_to_pickup'] = $data['on_the_way_to_pickup'];

                    $msg = "The rider is on their way to pickup the order";

                    $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                    $this->RiderOrder->saveField('on_the_way_to_pickup', $data['on_the_way_to_pickup']);
                    /************notification**********/





                }
                if (isset($data['pickup_datetime'])) {


                    $rider_order['pickup_datetime'] = $data['pickup_datetime'];

                    $msg = "The order has been collected";

                    $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                    $this->RiderOrder->saveField('pickup_datetime', $data['pickup_datetime']);
                    /************notification**********/



                }
                if (isset($data['on_the_way_to_dropoff'])) {


                    $rider_order['on_the_way_to_dropoff'] = $data['on_the_way_to_dropoff'];

                    $msg = "The rider is on their way to deliver the order";

                    $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                    $this->RiderOrder->saveField('on_the_way_to_dropoff', $data['on_the_way_to_dropoff']);
                    /************notification**********/



                }
                if (isset($data['delivered'])) {


                    $rider_order['delivered'] = $data['delivered'];

                    $msg = "The rider has delivered the order";

                    $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                    $this->RiderOrder->saveField('delivered', $data['delivered']);
                    /************notification**********/

                    if(isset($data['food_order_id'])){


                        $this->FoodOrder->id = $data['food_order_id'];
                        $food_order_data['status_datetime'] = date('Y-m-d H:i:s', time());
                        $food_order_data['status'] = 2;
                        $this->FoodOrder->save($food_order_data);


                    }else{


                        $this->ParcelOrder->id = $data['parcel_order_id'];
                        $this->ParcelOrder->saveField('status',2);

                    }



                }
                /************notification**********/


                $notification_data['receiver_id'] = $receiver_id;
                $notification_data['title'] = $msg;
                $notification_data['created'] = $created;

                $this->Notification->save($notification_data);

                $notification['to'] = $device_token;
                $notification['notification']['title'] = $msg;
                $notification['notification']['body'] = "";
                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";
                $notification['notification']['type'] = "";
                $notification['notification']['order_id'] = $order_id;
                $notification['data']['title'] = $msg;
                $notification['data']['body'] = '';
                $notification['data']['icon'] = "";
                $notification['data']['badge'] = "1";
                $notification['data']['sound'] = "default";
                $notification['data']['type'] = "";
                $notification['data']['order_id'] = $order_id;
                Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                $order_detail = $this->RiderOrder->getDetails( $order_detail['RiderOrder']['id']);

                $output['code'] = 200;
                $output['msg'] = $order_detail;

                echo json_encode($output);

                die();


            }else{

                Message::EMPTYDATA();
                die();
            }



        }
    }

    public function updateRiderOrderParcelOrderStatus()
    {


        $this->loadModel("RiderOrder");
        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("Notification");
        $this->loadModel("RiderOrderMultiStop");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$order_id = $data['order_id'];

            $created = date('Y-m-d H:i:s', time());


                $order_detail = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

                $device_token = $order_detail['ParcelOrder']['User']['device_token'];
                $receiver_id = $order_detail['ParcelOrder']['User']['id'];
                $order_id =  $order_detail['ParcelOrder']['id'];





            // $order_detail = $this->RiderOrder->getRiderOrderAgainstOrderID($order_id);
            if(count($order_detail) > 0) {
                if (isset($data['on_the_way_to_pickup'])) {


                    $rider_order['on_the_way_to_pickup'] = $data['on_the_way_to_pickup'];

                    $msg = "The rider is on their way to pickup the order";

                    $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                    $this->RiderOrder->saveField('on_the_way_to_pickup', $data['on_the_way_to_pickup']);
                    /************notification**********/





                }
                if (isset($data['pickup_datetime'])) {


                    $rider_order['pickup_datetime'] = $data['pickup_datetime'];

                    $msg = "The order has been collected";

                    $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                    $this->RiderOrder->saveField('pickup_datetime', $data['pickup_datetime']);
                    /************notification**********/



                }
                if (isset($data['on_the_way_to_dropoff'])) {


                    $rider_order['rider_order_id'] = $order_detail['RiderOrder']['id'];
                    $rider_order['on_the_way_to_dropoff'] = $data['on_the_way_to_dropoff'];

                    $msg = "The rider is on their way to deliver the order";

                    //$this->RiderOrderMultiStop->id =$if_status_available['RiderOrderMultiStop']['id'];

                    $this->RiderOrderMultiStop->save($rider_order);

                    /************notification**********/



                }
                if (isset($data['delivered'])) {

                    $if_status_available = $this->RiderOrderMultiStop->checkOrderStatus($order_detail['RiderOrder']['id'],"delivered");

                    if(count($if_status_available) > 0) {
                        $rider_order['rider_order_id'] = $order_detail['RiderOrder']['id'];
                        $rider_order['delivered'] = $data['delivered'];

                        $msg = "The rider has delivered the order";

                        $this->RiderOrderMultiStop->id = $if_status_available['RiderOrderMultiStop']['id'];
                        $this->RiderOrderMultiStop->saveField('delivered', $data['delivered']);
                        $this->RiderOrderMultiStop->clear();
                        /************notification**********/
                    }else{

                        $output['code'] = 201;
                        $output['msg'] = "already delivered";

                        echo json_encode($output);

                        die();

                    }



                    if(isset($data['completed'])){

                        $this->ParcelOrder->id = $data['parcel_order_id'];
                        $this->ParcelOrder->saveField('status',2);
                        $this->ParcelOrder->clear();

                        $this->RiderOrder->id = $order_detail['RiderOrder']['id'];
                        $this->RiderOrder->saveField('delivered',  $data['delivered']);

                    }


                }
                /************notification**********/


                $notification_data['receiver_id'] = $receiver_id;
                $notification_data['title'] = $msg;
                $notification_data['created'] = $created;

                $this->Notification->save($notification_data);

                $notification['to'] = $device_token;
                $notification['notification']['title'] = $msg;
                $notification['notification']['body'] = "";
                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";
                $notification['notification']['type'] = "";
                $notification['notification']['order_id'] = $order_id;
                $notification['data']['title'] = $msg;
                $notification['data']['body'] = '';
                $notification['data']['icon'] = "";
                $notification['data']['badge'] = "1";
                $notification['data']['sound'] = "default";
                $notification['data']['type'] = "";
                $notification['data']['order_id'] = $order_id;
                Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                $order_detail = $this->RiderOrder->getDetails( $order_detail['RiderOrder']['id']);

                $output['code'] = 200;
                $output['msg'] = $order_detail;

                echo json_encode($output);

                die();


            }else{

                Message::EMPTYDATA();
                die();
            }



        }
    }

  public function updateRiderOrderParcelOrderStatusold()
    {


        $this->loadModel("RiderOrder");
        $this->loadModel("FoodOrder");
        $this->loadModel("ParcelOrder");
        $this->loadModel("ParcelOrderMultiStop");
        $this->loadModel("RiderOrderMultiStop");
        $this->loadModel("Notification");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$order_id = $data['order_id'];

            $created = date('Y-m-d H:i:s', time());


            $order_detail = $this->RiderOrder->getRiderParcelOrderAgainstOrderID($data['parcel_order_id']);

            $device_token = $order_detail['ParcelOrder']['User']['device_token'];
            $receiver_id = $order_detail['ParcelOrder']['User']['id'];
            $order_id =  $order_detail['ParcelOrder']['id'];





            // $order_detail = $this->RiderOrder->getRiderOrderAgainstOrderID($order_id);
            if(count($order_detail) > 0) {

                if (isset($data['on_the_way_to_pickup'])) {

                    $if_status_available = $this->RiderOrderMultiStop->checkOrderStatus($order_detail['RiderOrder']['id'],"on_the_way_to_dropoff");


                    $rider_order['on_the_way_to_pickup'] = $data['on_the_way_to_pickup'];

                    $msg = "The rider is on their way to pickup the order";

                    //$this->ParcelOrderMultiStop->id = $order_detail['RiderOrder']['id'];

                    $multi_post_data['rider_order_id'] = $order_detail['RiderOrder']['id'];
                    $multi_post_data['on_the_way_to_pickup'] = $data['on_the_way_to_pickup'];

                    if(count($if_status_available) < 1) {

                        $this->RiderOrderMultiStop->save($multi_post_data);

                    }else{

                        $this->RiderOrderMultiStop->id = $if_status_available['RiderOrderMultiStop']['id'];
                        $this->RiderOrderMultiStop->save($multi_post_data);

                    }
                    /************notification**********/
                    //$multi_order_detail = $this->RiderOrderMultiStop->getDetailsAgainsRiderOrder($order_detail['RiderOrder']['id']);

                    //if(count($multi_order_detail) > 0){
                }

                //$if_status_available = $this->RiderOrderMultiStop->checkOrderStatus($order_detail['RiderOrder']['id'],"on_the_way_to_pickup");



                $if_status_available = $this->RiderOrderMultiStop->checkOrderStatus($order_detail['RiderOrder']['id'],"pickup_datetime");

                if (isset($data['pickup_datetime']) && count($if_status_available) > 0) {

                    $msg = "The order has been collected";
                    $this->RiderOrderMultiStop->id =$if_status_available['RiderOrderMultiStop']['id'];

                    $this->RiderOrderMultiStop->saveField('pickup_datetime',$data['pickup_datetime']);



                }

                $if_status_available = $this->RiderOrderMultiStop->checkOrderStatus($order_detail['RiderOrder']['id'],"on_the_way_to_dropoff");

                if (isset($data['on_the_way_to_dropoff']) && count($if_status_available) > 0) {


                    $msg = "The rider is on their way to deliver the order";
                    $this->RiderOrderMultiStop->id =$if_status_available['RiderOrderMultiStop']['id'];

                    $this->RiderOrderMultiStop->saveField('on_the_way_to_dropoff',$data['on_the_way_to_dropoff']);



                }


                $if_status_available = $this->RiderOrderMultiStop->checkOrderStatus($order_detail['RiderOrder']['id'],"delivered");

                if (isset($data['delivered']) && count($if_status_available) > 0) {


                    $msg = "The rider has delivered the order";
                    $this->RiderOrderMultiStop->id =$if_status_available['RiderOrderMultiStop']['id'];

                    $this->RiderOrderMultiStop->saveField('delivered',$data['delivered']);

                    //  $this->ParcelOrder->id = $data['parcel_order_id'];
                    // $this->ParcelOrder->saveField('status',2);

                }



                //}




                /************notification**********/


                $notification_data['receiver_id'] = $receiver_id;
                $notification_data['title'] = $msg;
                $notification_data['created'] = $created;

                $this->Notification->save($notification_data);

                $notification['to'] = $device_token;
                $notification['notification']['title'] = $msg;
                $notification['notification']['body'] = "";
                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";
                $notification['notification']['type'] = "";
                $notification['notification']['order_id'] = $order_id;
                $notification['data']['title'] = $msg;
                $notification['data']['body'] = '';
                $notification['data']['icon'] = "";
                $notification['data']['badge'] = "1";
                $notification['data']['sound'] = "default";
                $notification['data']['type'] = "";
                $notification['data']['order_id'] = $order_id;
                Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                $order_detail = $this->RiderOrder->getDetails( $order_detail['RiderOrder']['id']);

                $output['code'] = 200;
                $output['msg'] = $order_detail;

                echo json_encode($output);

                die();


            }else{

                Message::EMPTYDATA();
                die();
            }



        }
    }


    public function showCompletedRideSharingPastTrips(){

        $this->loadModel('Trip');
        $this->loadModel('TripPayment');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $starting_point = $data['starting_point'];
            if(isset($data['user_id'])){

                $user_id = $data['user_id'];
                $trips = $this->Trip->getUserCompletedTrips($user_id,$starting_point);

            }else  if(isset($data['driver_id'])){

                $driver_id = $data['driver_id'];
                $trips = $this->Trip->getDriverCompletedTrips($driver_id,$starting_point);
            }







            if(count($trips) > 0) {

                foreach ($trips as $key=>$val) {


                    $trip_id = $val['Trip']['id'];
                    $trip_payment_details = $this->TripPayment->checkIfTripExist($trip_id);
                    if (count($trip_payment_details) > 0) {
                        $trips[$key]['Trip']['TripPayment'] = $trip_payment_details['TripPayment'];
                    } else {

                        $trips[$key]['Trip']['TripPayment'] = array();

                    }


                }



                $output['code'] = 200;

                $output['msg'] = $trips;


                echo json_encode($output);


                die();

            }else{



                Message::EMPTYDATA();
                die();
            }

        }


    }

    public function showCompletedParcelOrders(){


        $this->loadModel('RiderOrder');
        $this->loadModel('ParcelOrder');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $starting_point = $data['starting_point'];
            if(isset($data['user_id'])){

                $user_id = $data['user_id'];
                // $trips = $this->Trip->getUserCompletedTrips($user_id,$starting_point);

            }else  if(isset($data['driver_id'])){

                $driver_id = $data['driver_id'];
                $details = $this->RiderOrder->getCompletedParcelOrders($driver_id,$starting_point);
            }







            if(count($details) > 0) {

                /*foreach ($trips as $key=>$val) {


                    $trip_id = $val['Trip']['id'];
                    $trip_payment_details = $this->TripPayment->checkIfTripExist($trip_id);
                    if (count($trip_payment_details) > 0) {
                        $trips[$key]['Trip']['TripPayment'] = $trip_payment_details['TripPayment'];
                    } else {

                        $trips[$key]['Trip']['TripPayment'] = array();

                    }


                }*/



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

    public function showCompletedFoodOrders(){


        $this->loadModel('RiderOrder');
        $this->loadModel('FoodOrder');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $starting_point = $data['starting_point'];
            if(isset($data['user_id'])){

                $user_id = $data['user_id'];
                // $trips = $this->Trip->getUserCompletedTrips($user_id,$starting_point);

            }else  if(isset($data['driver_id'])){

                $driver_id = $data['driver_id'];
                $details = $this->RiderOrder->getCompletedFoodOrders($driver_id,$starting_point = null);
            }







            if(count($details) > 0) {

                /*foreach ($trips as $key=>$val) {


                    $trip_id = $val['Trip']['id'];
                    $trip_payment_details = $this->TripPayment->checkIfTripExist($trip_id);
                    if (count($trip_payment_details) > 0) {
                        $trips[$key]['Trip']['TripPayment'] = $trip_payment_details['TripPayment'];
                    } else {

                        $trips[$key]['Trip']['TripPayment'] = array();

                    }


                }*/



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
    public function showGoodTypes()
    {

        $this->loadModel("GoodType");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $types = $this->GoodType->getAll();


            if(count($types) > 0) {
                $output['code'] = 200;

                $output['msg'] = $types;


                echo json_encode($output);


                die();

            }else{
                Message::EMPTYDATA();
                die();


            }
        }
    }

    public function showDeliveryTypes()
    {

        $this->loadModel("DeliveryType");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $types = $this->DeliveryType->getAll();


            if(count($types) > 0) {
                $output['code'] = 200;

                $output['msg'] = $types;


                echo json_encode($output);


                die();

            }else{
                Message::EMPTYDATA();
                die();


            }
        }
    }

    public function showDeliveryAddresses()
    {

        $this->loadModel('DeliveryAddress');



        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id   = $data['user_id'];
            $addresses = $this->DeliveryAddress->getUserDeliveryAddresses($user_id);


            $output['code'] = 200;
            $output['msg']  = $addresses;

            echo json_encode($output);
            die();


        }

    }

    public function deleteDeliveryAddress()
    {

        $this->loadModel('DeliveryAddress');
        // $this->loadModel("RestaurantRating");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id      = $data['id'];
            $user_id = $data['user_id'];
            $this->DeliveryAddress->query('SET FOREIGN_KEY_CHECKS=0');
            $this->DeliveryAddress->id = $id;
            if ($this->DeliveryAddress->delete()) {


                $addresses = $this->DeliveryAddress->getUserDeliveryAddresses($user_id);


                $output['code'] = 200;
                $output['msg']  = $addresses;
                echo json_encode($output);
                die();
                //$this->RiderTiming->deleteAll(array('upvote_question_id' => $upvote_question_id), false);
            } else {

                Message::ALREADYDELETED();
                die();


            }
        }
    }
    public function deleteAllRequest(){

        $this->loadModel('Request');

        $this->Request->deleteAllRequests();
    }
    public function showRiderOrders()
    {

        $this->loadModel("RiderOrder");

        $this->loadModel("User");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];
            $starting_point = $data['starting_point'];
            $completed_orders_count = $this->RiderOrder->getCountCompletedOrders($user_id);
            if(isset($data['type'])) {
                $type = $data['type'];

                if ($type == "active") {
                    $orders = $this->RiderOrder->getActiveOrders($user_id,$starting_point);

                } else if ($type == "pending") {

                    $orders = $this->RiderOrder->getPendingOrders($user_id,$starting_point);

                } else if ($type == "completed") {
                    $orders = $this->RiderOrder->getCompletedOrders($user_id,$starting_point);
                }

                $output['msg'] = $orders;
                // $output['stats']['completed_orders_count']  = $completed_orders_count;
                // $output['stats']['total_earning']  = 25;
            }else{

                $active_orders = $this->RiderOrder->getActiveOrders($user_id,$starting_point);
                $pending_orders = $this->RiderOrder->getPendingOrders($user_id,$starting_point);
                $completed_orders = $this->RiderOrder->getCompletedOrders($user_id,$starting_point);

                $output['PendingOrders'] = $pending_orders;
                $output['CompletedOrders'] = $completed_orders;
                $output['ActiveOrders']  = $active_orders;
                $output['stats']['completed_orders_count']  = $completed_orders_count;
                $output['stats']['total_earning']  = 25;
            }
















            $output['code'] = 200;




            echo json_encode($output);

            die();












        }
    }




    public function showStoreOrders()
    {



        $this->loadModel("Order");
        $this->loadModel("OrderTransaction");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $starting_id = 0;

            if(isset($data['starting_id'])){

                $starting_id = $data['starting_id'];
            }

            if(isset($data['user_id'])) {

                $user_id = $data['user_id'];
                if(isset($data['type'])) {
                    $type = $data['type'];

                    if ($type == "active") {

                        $orders = $this->Order->getStoreUserOrdersAccordingToStatus(1, $user_id, $starting_id);
                    }else

                        if ($type == "pending") {

                            $orders = $this->Order->getStoreUserOrdersAccordingToStatus(0, $user_id, $starting_id);

                        }else  if ($type == "completed") {

                            $orders = $this->Order->getStoreUserOrdersAccordingToStatus(2, $user_id, $starting_id);


                        }
                }
            }else if(isset($data['store_id'])) {

                $store_id = $data['store_id'];

                if(isset($data['type'])) {
                    $type = $data['type'];
                    if ($type == "active") {
                        $orders = $this->Order->getStoreOrdersAccordingToStatus(1, $store_id, $starting_id);

                    }else

                        if ($type == "pending") {
                            $orders = $this->Order->getStoreOrdersAccordingToStatus(0, $store_id, $starting_id);

                        }else {

                            $orders = $this->Order->getStoreOrdersAccordingToStatus(2, $store_id, $starting_id);
                        }
                }
            }


            foreach($orders as $key=>$order){

                $cart_random_id = $order['Order']['cart_random_id'];
                $payment_details = $this->OrderTransaction->getTransactionAgainstCartID($cart_random_id);

                if(count($payment_details) > 0) {
                    $orders[$key]['Order']['OrderTransaction'] = $payment_details['OrderTransaction'];
                }else{

                    $orders[$key]['Order']['OrderTransaction'] = array();
                }
            }




            $output['code'] = 200;

            $output['msg'] = $orders;

            //$output['stats']['completed_orders_count']  = $completed_orders_count;
            //$output['stats']['total_earning']  = 25;


            echo json_encode($output);

            die();












        }
    }




    public function showRiderOrderHistory()
    {

        $this->loadModel("RiderOrder");

        $this->loadModel("User");
        // $this->loadModel("OrderTransaction");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];
            $starting_point = $data['starting_point'];






            $orders = $this->RiderOrder->getCompletedOrders($user_id,$starting_point);
            $completed_orders_count = $this->RiderOrder->getCountCompletedOrders($user_id);


            /*foreach ($orders as $key=>$order_id){

                $cart_details = $this->OrderTransaction->getTransactionAgainstCartID($order_id['Order']['cart_random_id']);
                if(count($cart_details) > 0) {
                   $type =  $cart_details['OrderTransaction']['type'];
                   if($type =="paypal"){

                       $cart_details['OrderTransaction']['type'] = "paypal";
                   }if($type =="cod"){


                        $cart_details['OrderTransaction']['type'] = "Cash on delivery";
                   }else{


                        $cart_details['OrderTransaction']['type'] = "Card";
                    }
                    $orders[$key]['Order']['OrderTransaction'] = $cart_details['OrderTransaction'];
                }else{


                    $orders[$key]['Order']['OrderTransaction'] = array();

                }

            }*/
            $output['code'] = 200;

            $output['orders'] = $orders;

            $output['stats']['completed_orders_count']  = $completed_orders_count;
            $output['stats']['total_earning']  = 25;


            echo json_encode($output);

            die();












        }
    }



    public function showStoreUserOrderHistory()
    {

        $this->loadModel("Order");

        $this->loadModel("User");
        $this->loadModel("OrderTransaction");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];
            $starting_id =  0;


            if(isset($data['starting_point'])){


                $starting_id =  $data['starting_point'];
            }






            $orders = $this->Order->getStoreUserOrdersAccordingToStatus(2,$user_id,$starting_id);
            $pending_orders_count = $this->Order->getCountStoreUserOrdersAccordingToStatus(0,$user_id);
            $active_orders_count = $this->Order->getCountStoreUserOrdersAccordingToStatus(1,$user_id);
            $completed_orders_count = $this->Order->getCountStoreUserOrdersAccordingToStatus(2,$user_id);


            foreach ($orders as $key=>$order_id){

                $cart_details = $this->OrderTransaction->getTransactionAgainstCartID($order_id['Order']['cart_random_id']);
                if(count($cart_details) > 0) {
                    $type =  $cart_details['OrderTransaction']['type'];
                    if($type =="paypal"){

                        $cart_details['OrderTransaction']['type'] = "paypal";
                    }if($type =="cod"){


                        $cart_details['OrderTransaction']['type'] = "Cash on delivery";
                    }else{


                        $cart_details['OrderTransaction']['type'] = "Card";
                    }
                    $orders[$key]['Order']['OrderTransaction'] = $cart_details['OrderTransaction'];
                }else{


                    $orders[$key]['Order']['OrderTransaction'] = array();

                }

            }
            $output['code'] = 200;

            $output['orders'] = $orders;
            $output['stats']['pending_orders_count']  = $pending_orders_count;
            $output['stats']['active_orders_count']  = $active_orders_count;
            $output['stats']['completed_orders_count']  = $completed_orders_count;


            $output['stats']['total_earning']  = 25;


            echo json_encode($output);

            die();












        }
    }


    public function placeFoodOrder()
    {


        $this->loadModel("FoodOrder");
        $this->loadModel("User");


        $this->loadModel("FoodOrderMenuItem");
        $this->loadModel("FoodOrderMenuExtraItem");
        $this->loadModel("CouponUsed");

        $this->loadModel("Restaurant");
        $this->loadModel("DeliveryAddress");
        $this->loadModel("PaymentCard");





        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);




            $user_id       = $data['user_id'];

            $quantity      = $data['quantity'];
            $payment_id    = $data['payment_id'];
            $delivery_address_id    = $data['address_id'];
            $restaurant_id = $data['restaurant_id'];
            $cod           = $data['cod'];
            $tax           = $data['tax'];
            $sub_total     = $data['sub_total'];


            if(isset($data['rider_instruction'])) {

                $rider_instruction = $data['rider_instruction'];
                $restaurant_instruction = $data['restaurant_instruction'];
                $order['rider_instruction'] = $rider_instruction;
                $order['restaurant_instruction'] = $restaurant_instruction;
            }
            $coupon_id     = $data['coupon_id'];
            $status        = 0;
            $device        = @$data['device'];
            $version     =   @$data['version'];


            $delivery_fee  = $data['delivery_fee'];
            $delivery      = $data['delivery'];
            $rider_tip     = $data['rider_tip'];

            $created   = $data['order_time'];
            $menu_item = $data['menu_item'];

            $discount = 0;
            if(isset($data['discount'])){

                $discount = $data['discount'];
            }
            if (count($menu_item) < 1) {

                echo Message::ERROR();
                die();
            }



            if($sub_total < 1){
                echo Message::ERROR();
                die();
            }




            $price = $delivery_fee + $rider_tip + $tax + $sub_total - $discount;




            $user_details_check = $this->User->getUserDetailsFromID($user_id);
            $restaurant_detail = $this->Restaurant->getDetails($restaurant_id);

            if(count($user_details_check) > 0 && count($restaurant_detail) > 0) {


                $order['user_id'] = $user_id;
                $order['price'] = $price;
                $order['status'] = $status;
                $order['created'] = $created;
                $order['quantity'] = $quantity;
                $order['discount'] = $discount;
                $order['payment_card_id'] = $payment_id;
                $order['cod'] = $cod;
                $order['version'] = $version;

                $order['user_place_id'] = $delivery_address_id;
                $order['sub_total'] = $sub_total;
                $order['tax'] = $tax;
                $order['device'] = $device;
                $order['delivery'] = $delivery;
                $order['rider_tip'] = $rider_tip;
                $order['restaurant_id'] = $restaurant_id;

                $order['delivery_fee'] = $delivery_fee;

                if (isset($data['phone_no'])) {


                    $order['phone_no'] = $data['phone_no'];
                }

                if (isset($data['delivery_date_time'])) {


                    $order['delivery_date_time'] = $data['delivery_date_time'];
                }







                $address_detail = $this->DeliveryAddress->getDetails($delivery_address_id);


                $if_order_exist = $this->FoodOrder->isOrderExist($order);


                if (count($if_order_exist) > 0) {

                    $time_diff = Utility::time_difference($if_order_exist['FoodOrder']['created'], $created);


                    if (count($if_order_exist) > 0 && $time_diff <= 60) {

                        $output['code'] = 200;
                        $output['msg'] = "Your order has already been placed.";
                        echo json_encode($output);
                        die();

                    }
                }


                if ($payment_id > 0) {
                    $stripe_charge = $this->deductPayment($payment_id, round($price));
                    $order['stripe_charge'] = $stripe_charge;
                }


                if ($this->FoodOrder->save($order)) {
                    $order_id = $this->FoodOrder->getLastInsertId();



                    $device_token = $restaurant_detail['User']['device_token'];


                    //Firebase::placeOrder($order_id, $restaurant_user_id, $delivery);


                    if ($coupon_id > 0) {
                        $coupon['coupon_id'] = $coupon_id;
                        $coupon['order_id'] = $order_id;
                        $coupon['created'] = $created;
                        $this->CouponUsed->save($coupon);
                    }

                    /* if (isset($data['transaction'])) {


                         $transaction = $data['transaction'];

                         if(count($transaction) > 0){

                             $order_transaction['type'] = $transaction['type'];

                             if($transaction['type'] == "stripe"){

                                 $order_transaction['value'] = $order['stripe_charge'];
                             }

                             $order_transaction['value'] = $transaction['value'];

                             $order_transaction['order_id'] = $order_id;
                             $order_transaction['created'] = $created;

                             $this->OrderTransaction->save($order_transaction);


                         }
                     }*/

                    for ($i = 0; $i < count($menu_item); $i++) {

                        $order_menu_item[$i]['name'] = $menu_item[$i]['menu_item_name'];
                        $order_menu_item[$i]['quantity'] = $menu_item[$i]['menu_item_quantity'];
                        $order_menu_item[$i]['price'] = $menu_item[$i]['menu_item_price'];
                        $order_menu_item[$i]['instruction'] = $menu_item[$i]['instruction'];

                        $order_menu_item[$i]['order_id'] = $order_id;
                        $this->FoodOrderMenuItem->saveAll($order_menu_item[$i]);
                        $order_menu_item_id = $this->FoodOrderMenuItem->getLastInsertId();
                        if (array_key_exists('menu_extra_item', $menu_item[$i])) {

                            if (count($menu_item[$i]['menu_extra_item']) > 0 && $menu_item[$i]['menu_extra_item'] != "") {
                                for ($j = 0; $j < count($menu_item[$i]['menu_extra_item']); $j++) {


                                    $order_menu_extra_item[$j]['name'] = $menu_item[$i]['menu_extra_item'][$j]['menu_extra_item_name'];
                                    $order_menu_extra_item[$j]['quantity'] = $menu_item[$i]['menu_extra_item'][$j]['menu_extra_item_quantity'];
                                    $order_menu_extra_item[$j]['price'] = $menu_item[$i]['menu_extra_item'][$j]['menu_extra_item_price'];
                                    $order_menu_extra_item[$j]['order_menu_item_id'] = $order_menu_item_id;
                                    $this->FoodOrderMenuExtraItem->saveAll($order_menu_extra_item[$j]);
                                }
                            }
                        }
                    }
                    $order_detail = $this->FoodOrder->getDetails($order_id);

                    if(AUTOMATIC_ASSIGN_FOOD_DELIVERY_ORDER == "YES") {

                        $this->assignOrderToRiderAutomatically($order_id, $restaurant_detail['Restaurant']['lat'], $restaurant_detail['Restaurant']['long'], "food");

                    }
                    /************notification*************/


                    $notification['to'] = $device_token;
                    $notification['notification']['title'] = "You have placed a new order";
                    $notification['notification']['body'] = 'Order #' . $order_detail['FoodOrder']['id'] . ' ' . $order_detail['FoodOrderMenuItem'][0]['name'];
                    $notification['notification']['order_id'] = $order_detail['FoodOrder']['id'];
                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";
                    $notification['notification']['type'] = "new_order";
                    $notification['data']['title'] = "You have placed a new order";
                    $notification['data']['body'] = 'Order #' . $order_detail['FoodOrder']['id'] . ' ' . $order_detail['FoodOrderMenuItem'][0]['name'];
                    $notification['data']['order_id'] = $order_detail['FoodOrder']['id'];
                    $notification['data']['icon'] = "";
                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $notification['data']['type'] = "new_order";

                    $result =  Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                    /* $notification['headings']['en'] = "You have received a new order";
                     $notification['include_player_ids'] = array($device_token);
                     $notification['content_available'] = true;
                     $notification['contents']['en'] = 'Order #' . $order_detail['FoodOrder']['id'] . ' ' . $order_detail['OrderMenuItem'][0]['name'];
                    */
                    //$r = $pushnotification->sendPushNotificationToMobileDevice($notification);




                    /********end notification***************/


                }




                $output['code'] = 200;

                $output['msg'] = $order_detail;
                echo json_encode($output);
                die();
            }else{

                $output['code'] = 201;

                $output['msg'] = "user id or restaurant id do not exist";
                echo json_encode($output);
                die();


            }





        }
    }
    public function addOrderSession()
    {

        $this->loadModel("OrderSession");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $string = $json;

            $created = date('Y-m-d H:i:s', time());


            if(isset( $data['string'])){

                $string = $data['string'];
            }



            $session['user_id'] = $user_id;
            $session['string']     = $string;
            $session['created']    = $created;


            $details = $this->OrderSession->getAll();
            if(count($details) > 0){

                foreach($details as $detail) {

                    $datetime1 = new DateTime($created);
                    $datetime2 = new DateTime($detail['OrderSession']['created']);
                    $interval = $datetime1->diff($datetime2);
                    $minutes = $interval->format('%i');
                    $id = $detail['OrderSession']['id'];
                    if ($minutes > 60) {

                        $this->OrderSession->delete($id);

                    }
                }

            }


            $this->OrderSession->save($session);
            $id = $this->OrderSession->getInsertID();
            $details =   $this->OrderSession->getDetails($id);

            $output['code'] = 200;

            $output['msg'] = $details;
            echo json_encode($output);

            die();


        }
    }
    public function startTrip(){


        $this->loadModel('Trip');
        $this->loadModel('TripHistory');
        $this->loadModel('Request');
        $this->loadModel('Notification');
        $this->loadModel('Setting');
        $this->loadModel('Vehicle');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $request_id =  $data['request_id'];
            $status = $data['status'];
            $current_datetime = date('Y-m-d H:i:s', time());

            $request_details = $this->Request->getRequestWhichHasNotCancelledByAnyOne($request_id);


            if(count($request_details) > 0){

                $device_token = $request_details['User']['device_token'];
                $first_name = $request_details['Driver']['first_name'];
                $last_name = $request_details['Driver']['last_name'];
                $user_id = $request_details['Request']['user_id'];

                $wallet = $request_details['User']['wallet'];
                $vehicle_id = $request_details['Request']['vehicle_id'];

                $code = 200;
                $message = "success";

                if ($status == "on_the_way") {
                    if ($request_details['Request']['on_the_way'] == 0) {
                        $body = $first_name." ".$last_name." is on your way";
                        $title = "on the way";

                        $this->Request->id = $request_id;
                        $this->Request->saveField('on_the_way', 1);
                    } else {
                        $body = "";
                        $code = 201;
                        $message = "you have already pressed on the way button";
                    }

                } else if ($status == "arrive_on_location") {
                    if ($request_details['Request']['arrive_on_location'] == 0) {
                        $body =   $body = $first_name." ".$last_name." is at your location waiting";
                        $title = "vehicle arrived";
                        $request_data['arrive_on_location'] = 1;
                        $request_data['arrive_on_location_datetime'] = $current_datetime;
                        $notification['data']['type'] = "arrive_on_location";
                        $this->Request->id = $request_id;
                        $this->Request->save($request_data);


                    } else {
                        $title = "";
                        $body = "";
                        $code = 201;
                        $message = "you have already pressed arrive_on_location button";
                    }
                } else if ($status == "start_ride") {


                    if ($request_details['Request']['start_ride'] == 0) {
                        $body = "Driver has started the ride ";
                        $title = "Ride has started";

                        $notification['data']['type'] = "start_ride";
                        $request_data['start_ride'] = 1;
                        $request_data['start_ride_datetime'] = date('Y-m-d H:i:s', time());

                        $this->Request->id = $request_id;
                        $this->Request->save($request_data);
                        $trip['vehicle_id'] = $vehicle_id;
                        $trip['request_id'] = $request_id;
                        $trip['user_id'] = $request_details['Request']['user_id'];
                        $trip['driver_id'] = $request_details['Request']['driver_id'];
                        $trip['pickup_location'] = $data['pickup_location'];
                        $trip['pickup_lat'] = $data['pickup_lat'];
                        $trip['pickup_long'] = $data['pickup_long'];
                        $trip['pickup_datetime'] = date('Y-m-d H:i:s', time());
                        $trip['created'] = date('Y-m-d H:i:s', time());


                        $this->Trip->save($trip);
                        $id = $this->Trip->getInsertID();

                        $trip_details = $this->Trip->getDetails($id);
                        $code = 200;
                        $message = $trip_details;
                    } else {
                        $body = "";
                        $code = 201;
                        $message = "ride has been already started";

                    }


                } else if ($status == "end_ride") {
                    if ($request_details['Request']['end_ride'] == 0) {
                        $title = "Ride has ended";
                        $body = "Driver has ended the ride";
                        $ride_distance_in_meters = $data['total_distance'];
                        $notification['data']['type'] = "end_ride";
                        $request_data['end_ride'] = 1;
                        $request_data['status'] = 1;
                        $request_data['end_ride_datetime'] = date('Y-m-d H:i:s', time());

                        $this->Request->id = $request_id;
                        $this->Request->save($request_data);
                        $request_details = $this->Request->getDetails($request_id);


                        $vehicle_id = $request_details['Request']['vehicle_id'];
                        $this->Vehicle->id  = $vehicle_id;
                        $this->Vehicle->saveField('available',1);


                        $trip_detail = $this->Trip->getTripAgainstRequest($request_id);

                        $trip['request_id'] = $request_id;
                        $trip['dropoff_location'] = $data['dropoff_location'];
                        $trip['dropoff_lat'] = $data['dropoff_lat'];
                        $trip['vehicle_id'] = $vehicle_id;
                        $trip['completed'] = 1;

                        $trip['dropoff_long'] = $data['dropoff_long'];
                        $trip['dropoff_datetime'] = date('Y-m-d H:i:s', time());



                        /**********calculateFare****************/





                        /***********end ***/
                        $history =  $this->TripHistory->getTripHistory($trip_detail['Trip']['id']);

                        $base_fare = $trip_detail['Vehicle']['RideType']['base_fare'];
                        $cost_per_minute = $trip_detail['Vehicle']['RideType']['cost_per_minute'];
                        $cost_per_distance = $trip_detail['Vehicle']['RideType']['cost_per_distance'];
                        $distance_unit = $trip_detail['Vehicle']['RideType']['distance_unit'];
                        $ride_duration_in_seconds = Utility::getDateTimeDifferenceInSeconds($trip_detail['Request']['start_ride_datetime'],$trip_detail['Request']['end_ride_datetime']);
                        $waiting_time_in_seconds = Utility::getDateTimeDifferenceInSeconds($trip_detail['Request']['arrive_on_location_datetime'],$trip_detail['Request']['end_ride_datetime']);
                        $initial_waiting_time_price = 0;
                        if($waiting_time_in_seconds > 60) {
                            $price_per_sec = $cost_per_minute / 60;
                            $initial_waiting_time_price =  $price_per_sec * $waiting_time_in_seconds;
                        }

                        // $setting_details = $this->Setting->getSingleSettingsAgainstType("distance_unit");
                        //$distance_unit = $setting_details['Setting']['value'];

                        $fare = Utility::calculateFare($base_fare, $cost_per_minute, $cost_per_distance, $ride_duration_in_seconds, $ride_distance_in_meters, "0", $distance_unit);




                        $trip['trip_fare'] = $fare['fare'];

                        $trip['initial_waiting_time_price'] = $initial_waiting_time_price;
                        $trip['ride_fare'] = $fare['fare'] + $initial_waiting_time_price;



                        if($request_details['Request']['coupon_id'] > 0){

                            $discount =  $request_details['Coupon']['discount'];

                            $ride_fare_without_discount =  $fare['fare'] + $initial_waiting_time_price;

                            $final_ride_fare = $ride_fare_without_discount/100*$discount;
                            $trip['ride_fare'] = $final_ride_fare;
                        }


                        $file_path =  $this->makeTripMap($history,$user_id);

                        if(strlen($file_path) > 3){

                            $trip['map'] = $file_path;
                        }
                        $this->Trip->id = $trip_detail['Trip']['id'];
                        $this->Trip->save($trip);


                        $trip_details = $this->Trip->getDetails($trip_detail['Trip']['id']);

                        $url = "https://maps.googleapis.com/maps/api/staticmap?path=color:0x0000ff|weight:5|40.737102,-73.990318|40.749825,-73.987963|40.752946,-73.987384|40.755823,-73.986397&size=512x512&&key=".GOOGLE_MAPS_KEY;
                        $code = 200;
                        $message = $trip_details;
                    } else {
                        $title = "";
                        $body = "";
                        $code = 201;
                        $message = "ride has already been ended";

                    }
                } else if ($status == "collect_payment") {
                    if ($request_details['Request']['collect_payment'] == 0) {

                        $body = "Ride has ended and payment has been collected";
                        $title = "Thank you for the ride";

                        $notification['data']['type'] = "collect_payment";
                        $this->Request->id = $request_id;
                        $this->Request->saveField('collect_payment', 1);
                        $trip_detail = $this->Trip->getTripAgainstRequest($request_id);
                        $payment_type = $request_details['Request']['payment_type'];
                        $payment_method_id = $request_details['Request']['payment_method_id'];
                        $wallet_amount = $data['wallet_amount'];
                        $wallet_debit = $data['wallet_debit'];
                        $debit_credit_amount = $data['debit_credit_amount'];
                        $user_wallet = $data['user_wallet'];
                        $collected_amount = $data['collected_amount'];
                        //if($request_details['Request']['payment_type'] == "cash"){

                        // $trip['collected_amount'] = $data['collected_amount'];

                        //}

                        $trip_detail = $this->Trip->getTripAgainstRequest($request_id);


                        $trip['completed'] = 2;

                        //$trip['created']=date('Y-m-d H:i:s', time());

                        $this->Trip->id = $trip_detail['Trip']['id'];
                        $this->Trip->save($trip);

                        $this->placeOrder($trip_detail,$payment_type,$payment_method_id,$wallet_amount,$debit_credit_amount,$collected_amount,$wallet_debit,$user_wallet);

                        $trip_details = $this->Trip->getDetails($trip_detail['Trip']['id']);

                        $code = 200;
                        $message = $trip_details;
                    } else {
                        $title = "";
                        $body = "";
                        $code = 201;
                        $message = "payment already has been collected";

                    }
                }


                if (strlen($body) > 3) {
                    $notification['to'] = $device_token;
                    $notification['notification']['title'] = $title;
                    $notification['notification']['body'] = $body;

                    $notification['notification']['badge'] = "1";
                    $notification['notification']['sound'] = "default";
                    $notification['notification']['icon'] = "";

                    $notification['data']['title'] = $title;
                    $notification['data']['body'] = $body;
                    $notification['data']['icon'] = "";

                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $result =  Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                    $notification_data['user_id'] = $user_id;
                    $notification_data['text'] = $notification['data']['title'];
                    $this->Notification->save($notification_data);

                }

            }else{

                $code = 201;
                $message = "It seems like user has cancelled the ride";


            }








            $output['code'] = $code;

            $output['msg'] = $message;


            echo json_encode($output);


            die();



        }




    }

    function placeOrder($trip_detail,$payment_type,$payment_method_id,$wallet_amount,$debit_credit_amount,$collected_amount,$wallet_debit,$user_wallet){

        $this->loadModel('TripPayment');
        $this->loadModel('Trip');
        $this->loadModel('User');





        $wallet = $trip_detail['User']['wallet'];

        $fare = $trip_detail['Trip']['ride_fare'];

        $trip_payment['wallet_debit'] = $wallet_debit;
        $trip_payment['debit_credit_amount'] = $debit_credit_amount;
        $trip_payment['payment_collect_from_wallet'] = $wallet_amount;


        /*if($wallet <= $fare   && $wallet > 0 ){

            $final_fare =  $fare - $wallet;
            $trip_payment['payment_collect_from_wallet'] = $wallet;

            if($final_fare < 1){

                $wallet_amount = 0;
                $left_amount = 0;
            }

        }else if($wallet > $fare && $wallet > 0 ) {

            $final_fare =  $wallet - $fare;
            $trip_payment['payment_collect_from_wallet'] = $fare;
            $wallet_amount = $final_fare;
            $left_amount = 0;

        }else{

            $final_fare =   $fare;
            $trip_payment['payment_collect_from_wallet'] = 0;
            $wallet_amount = 0;
            $left_amount = $final_fare;


        }*/





        $trip_payment['trip_id'] = $trip_detail['Trip']['id'];
        $trip_payment['payment_type'] = $payment_type;



        $trip_payment['payment_method_id'] = $payment_method_id;
        $trip_payment['created'] = date('Y-m-d H:i:s', time());

        $trip_exist = $this->TripPayment->checkIfTripExist($trip_detail['Trip']['id']);


        if(count($trip_exist) < 1) {




            if ($payment_type == "card" && $collected_amount > 0) {

                if ($payment_method_id > 0) {

                    $stripe_charge = $this->deductPayment($payment_method_id, round($collected_amount));

                    if ($stripe_charge['code'] < 201) {
                        $trip_payment['stripe_charge'] = $stripe_charge['msg'];
                        $trip_payment['payment_collect_from_card'] = $collected_amount;


                    } else {


                        $output['code'] = 201;

                        $output['msg'] = $stripe_charge['msg'];


                        echo json_encode($output);


                        die();



                    }
                }else{

                    $output['code'] = 201;

                    $output['msg'] = "Please add a card first";


                    echo json_encode($output);


                    die();
                }
            }else{


                $trip_payment['payment_collect_from_cash'] = $collected_amount;
            }



            $this->TripPayment->save($trip_payment);

            $id = $this->TripPayment->getInsertID();
            $trip_details = $this->TripPayment->getDetails($id);

            $this->User->id = $trip_detail['User']['id'];
            $this->User->saveField("wallet",$user_wallet);
            $output['code'] = 200;

            $output['msg'] = $trip_details;


            return $output;
        }else{

            $output['code'] = 201;

            $output['msg'] = "Payment has already been completed";


            echo json_encode($output);


            die();

        }




    }


    function deductPayment($payment_id,$total)
    {
        $this->loadModel('Order');
        $this->loadModel('PaymentCard');
        $this->loadModel('StripeCharge');





        $this->PaymentCard->id = $payment_id;
        $stripe_cust_id  = $this->PaymentCard->field('stripe');


        if (strlen($stripe_cust_id) > 1) {



            $a = array(
                'customer' => $stripe_cust_id,
                'currency' => STRIPE_CURRENCY,

                'amount' => $total * 100
            );



            $result = $this->StripeCharge->save($a);
            if (!$result) {

                $error          = $this->StripeCharge->getStripeError();
                $output['code'] = 201;

                $output['msg'] = $error;
                return $output;
                die();
            } else {
                return $result['StripeCharge']['id'];
            }


        } else {
            $output['code'] = 201;

            $output['msg'] = "Please add a card first";
            return $output;
            die();


        }

    }


    function makeTripMapParcel($pickup_lat,$pickup_long,$destination_lat,$destination_long,$user_id){





        $url = "https://maps.googleapis.com/maps/api/staticmap?path=color:black|weight:5|&size=280x280&key=" . GOOGLE_MAPS_KEY . "&markers=color:green|label:S|" . $pickup_lat . "," . $pickup_long . "&markers=color:red|label:E|" . $destination_lat . "," . $destination_long;

        $folder_url = UPLOADS_FOLDER_URI;

        $file_path = Utility::uploadMapImageintoFolder($user_id, $url, $folder_url);



        return $file_path;


    }

    function makeTripMap($trip_history,$user_id){

        $latlong = "";
        $total_count = count($trip_history);

        if($total_count > 0) {
            foreach ($trip_history as $hist) {


                $latlong .= $hist['TripHistory']['lat'] . "," . $hist['TripHistory']['long'] . "|";
            }

            $latlong = rtrim($latlong, '|');



            $start_lat = $trip_history[0]['TripHistory']['lat'];
            $start_long = $trip_history[0]['TripHistory']['long'];
            $end_lat = $trip_history[$total_count - 1]['TripHistory']['lat'];
            $end_long = $trip_history[$total_count - 1]['TripHistory']['long'];
            $url = "https://maps.googleapis.com/maps/api/staticmap?path=color:black|weight:5|" . $latlong . "&size=280x280&key=" . GOOGLE_MAPS_KEY . "&markers=color:green|label:S|" . $start_lat . "," . $start_long . "&markers=color:red|label:E|" . $end_lat . "," . $end_long;

            $folder_url = UPLOADS_FOLDER_URI;

            $file_path = Utility::uploadMapImageintoFolder($user_id, $url, $folder_url);


            return $file_path;
        }else{

            return "";

        }
    }


    public function stopTrip(){


        $this->loadModel('Trip');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =
            $id =  $data['trip_id'];
            $trip['dropoff_location'] = $data['dropoff_location'];
            $trip['dropoff_lat'] = $data['dropoff_lat'];
            $trip['dropoff_long'] = $data['dropoff_long'];
            $trip['completed'] = 1;
            $trip['dropoff_datetime'] = date('Y-m-d H:i:s', time());

            $trip['created']=date('Y-m-d H:i:s', time());


            $this->Trip->id = $id;
            $this->Trip->save($trip);

            $trip_details = $this->Trip->getDetails($id);
            $output['code'] = 200;

            $output['msg'] = $trip_details;


            echo json_encode($output);


            die();



        }




    }


    public function changeDropoffLocation(){


        $this->loadModel('Request');
        $this->loadModel('Notification');
        $this->loadModel('Trip');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            //$trip['trip_id'] =
            $request_id =  $data['request_id'];

            $request['dropoff_long'] = $data['dropoff_long'];
            $request['dropoff_lat'] = $data['dropoff_lat'];
            $request['dropoff_location_short_string'] = $data['dropoff_location_short_string'];


            $destination_location_array = Utility::getCountryCityProvinceFromLatLong($data['dropoff_lat'],$data['dropoff_long']);

            if(strlen($destination_location_array['location_string']) > 2){

                $request['dropoff_location'] = $destination_location_array['location_string'];


            }



            $request['created']=date('Y-m-d H:i:s', time());

            $details = $this->Request->getActiveTripDetail($request_id);

            if(count($details) > 0) {

                $active_trip = $this->Trip->getTripAgainstRequest($request_id);

                if(count($active_trip) > 0){

                    $output['code'] = 201;

                    $output['msg'] = "the Trip has been completed";


                    echo json_encode($output);


                    die();

                }

                $notification['to'] = $details['Driver']['device_token'];
                $notification['notification']['title'] = "destination location changed ";
                $notification['notification']['body'] = "Customer has changed the destination location";

                $notification['notification']['badge'] = "1";
                $notification['notification']['sound'] = "default";
                $notification['notification']['icon'] = "";
                $notification['notification']['type'] = "destination_location_change";

                $notification['data']['title'] = "destination location changed ";
                $notification['data']['body'] = "Customer has changed the destination location";
                $notification['data']['icon'] = "";
                $notification['data']['type'] = "destination_location_change";

                $notification['data']['badge'] = "1";
                $notification['data']['sound'] = "default";
                $result =  Utility::sendPushNotificationToMobileDevice(json_encode($notification));

                $notification_data['user_id'] = $details['Driver']['id'];
                $notification_data['text'] = $notification['data']['title'];
                $this->Notification->save($notification_data);


                $this->Request->id = $request_id;
                $this->Request->save($request);

                $details = $this->Request->getDetails($request_id);
                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();
            }else{

                $output['code'] = 201;

                $output['msg'] = "the Trip has been completed or cancelled";


                echo json_encode($output);


                die();


            }


        }




    }





    public function giveRatingsToDriver(){


        $this->loadModel('DriverRating');
        $this->loadModel('Trip');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            //$trip['trip_id'] =
            // =  $data['trip_id'];

            $request_id = $data['request_id'];
            $rating['driver_id'] = $data['driver_id'];
            $rating['user_id'] = $data['user_id'];
            $rating['star'] = $data['star'];
            $rating['comment'] = $data['comment'];
            $rating['created']=date('Y-m-d H:i:s', time());

            $trip_detail = $this->Trip->getTripAgainstRequest($request_id);
            $rating['trip_id'] = $trip_detail['Trip']['id'];
            $rating_exist = $this->DriverRating->ifRatingExist($trip_detail['Trip']['id']);
            if($rating_exist < 1) {

                $this->DriverRating->save($rating);
                $id = $this->DriverRating->getInsertID();
                $rating_details = $this->DriverRating->getDetails($id);
                $output['code'] = 200;

                $output['msg'] = $rating_details;


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "the rating has already been submitted";


                echo json_encode($output);


                die();

            }

        }




    }


    public function giveRatingsToRestaurant(){


        $this->loadModel('RestaurantRating');
        $this->loadModel('FoodOrder');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $order_id = $data['order_id'];

            $rating['restaurant_id'] = $data['restaurant_id'];
            $rating['food_order_id'] = $data['order_id'];
            $rating['user_id'] = $data['user_id'];
            $rating['star'] = $data['star'];
            $rating['comment'] = $data['comment'];
            $rating['created']=date('Y-m-d H:i:s', time());
            $rating_exist = $this->RestaurantRating->getDetailsAgainstOrder($order_id);

            if(count($rating_exist) < 1) {

                $this->RestaurantRating->save($rating);
                $id = $this->RestaurantRating->getInsertID();
                $rating_details = $this->RestaurantRating->getDetails($id);
                $output['code'] = 200;

                $output['msg'] = $rating_details;


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "the rating has already been submitted";


                echo json_encode($output);


                die();
            }

        }




    }
    public function giveRatingsToUser(){


        $this->loadModel('UserRating');
        $this->loadModel('Trip');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $request_id = $data['request_id'];

            $rating['driver_id'] = $data['driver_id'];
            $rating['user_id'] = $data['user_id'];
            $rating['star'] = $data['star'];
            $rating['comment'] = $data['comment'];
            $rating['created']=date('Y-m-d H:i:s', time());
            $trip_detail = $this->Trip->getTripAgainstRequest($request_id);
            $rating['trip_id'] = $trip_detail['Trip']['id'];
            $rating_exist = $this->UserRating->ifRatingExist( $trip_detail['Trip']['id']);
            if($rating_exist < 1) {

                $this->UserRating->save($rating);
                $id = $this->UserRating->getInsertID();
                $rating_details = $this->UserRating->getDetails($id);
                $output['code'] = 200;

                $output['msg'] = $rating_details;


                echo json_encode($output);


                die();

            }else{

                $output['code'] = 201;

                $output['msg'] = "the rating has already been submitted";


                echo json_encode($output);


                die();
            }

        }




    }
    public function addTempCart()
    {

        $this->loadModel("TempCart");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $string = $json;

            $created = date('Y-m-d H:i:s', time());






            $session['user_id'] = $user_id;
            $session['string']     = $string;
            $session['created']    = $created;


            /*$cart_details = $this->TempCart->getCartSessionAgainstUserID($user_id);

            if(count($cart_details) > 0){

                $this->TempCart->id = $cart_details['TempCart']['id'];
                $this->TempCart->delete();


            }*/


            $this->TempCart->save($session);
            $id = $this->TempCart->getInsertID();
            $details =   $this->TempCart->getDetails($id);

            $output['code'] = 200;

            $output['msg'] = $details;
            echo json_encode($output);

            die();


        }
    }

    public function showTempCart()
    {

        $this->loadModel("TempCart");
        $this->loadModel("Product");
        $this->loadModel("Currency");
        $this->loadModel("User");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];

            $details = $this->TempCart->getCartSessionAgainstUserID($user_id);
            $user_details =  $this->User->getUserDetailsFromID($user_id);



            if(count($details) > 0) {



                foreach($details as $key=>$detail){
                    $string_json = $detail['TempCart']['string'];
                    $string_details =  json_decode($string_json,true);
                    $product_details = $this->Product->getDetails($string_details['product_id']);
                    $details[$key]['TempCart']['product_details'] = $product_details;

                }

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

    public function deleteTempCart()
    {

        $this->loadModel("TempCart");


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->TempCart->getDetails($id);

            if (count($details) > 0) {


                $this->TempCart->id = $id;
                $this->TempCart->delete();


                $output['code'] = 200;

                $output['msg'] = "deleted successfully";
                echo json_encode($output);

                die();

            } else {

                Message::EmptyDATA();
                die();

            }


        }
    }
    public function addSignature()
    {


        $this->loadModel('ParcelOrder');
        $this->loadModel('FoodOrder');


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $signature_person_name = $data['signature_person_name'];
            $user['signature_person_name'] = $signature_person_name;

            if(isset($data['parcel_order_id'])){

                $parcel_order_id = $data['parcel_order_id'];
                $orderDetails = $this->ParcelOrder->getDetails($parcel_order_id);

                if(count($orderDetails) > 0) {
                    if (isset($data['signature'])) {


                        $image = $data['signature'];
                        $folder_url = UPLOADS_FOLDER_URI;

                        $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                        $user['signature'] = $filePath;


                        $this->ParcelOrder->id = $parcel_order_id;
                        if (!$this->ParcelOrder->save($user)) {
                            echo Message::DATASAVEERROR();
                            die();
                        }


                        $output = array();
                        $orderDetails = $this->ParcelOrder->getDetails($parcel_order_id);


                        $output['code'] = 200;
                        $output['msg'] = $orderDetails;
                        echo json_encode($output);


                    } else {

                        $output['code'] = 201;
                        $output['msg'] = "please send the correct image";
                        echo json_encode($output);
                    }
                }else{

                    Message::EmptyDATA();
                    die();

                }
            }else{


                $food_order_id = $data['food_order_id'];
                $orderDetails = $this->FoodOrder->getDetails($food_order_id);

                if(count($orderDetails) > 0) {
                    if (isset($data['signature'])) {


                        $image = $data['signature'];
                        $folder_url = UPLOADS_FOLDER_URI;

                        $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                        $user['signature'] = $filePath;


                        $this->FoodOrder->id = $food_order_id;
                        if (!$this->FoodOrder->save($user)) {
                            echo Message::DATASAVEERROR();
                            die();
                        }


                        $output = array();
                        $orderDetails = $this->FoodOrder->getDetails($food_order_id);


                        $output['code'] = 200;
                        $output['msg'] = $orderDetails;
                        echo json_encode($output);


                    } else {

                        $output['code'] = 201;
                        $output['msg'] = "please send the correct image";
                        echo json_encode($output);
                    }
                }else{

                    Message::EmptyDATA();
                    die();

                }

            }










        }
    }



    public function addSignatureParcelOrder()
    {


        $this->loadModel('RiderOrderMultiStop');



        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $signature_person_name = $data['signature_person_name'];
            $user['signature_person_name'] = $signature_person_name;



            $rider_order_multi_stop_id = $data['rider_order_multi_stop_id'];
            $orderDetails = $this->RiderOrderMultiStop->getDetails($rider_order_multi_stop_id);

            if(count($orderDetails) > 0) {
                if (isset($data['signature'])) {


                    $image = $data['signature'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($image, $folder_url);
                    $user['signature'] = $filePath;


                    $this->RiderOrderMultiStop->id = $rider_order_multi_stop_id;
                    if (!$this->RiderOrderMultiStop->save($user)) {
                        echo Message::DATASAVEERROR();
                        die();
                    }


                    $output = array();
                    $orderDetails = $this->RiderOrderMultiStop->getDetails($rider_order_multi_stop_id);


                    $output['code'] = 200;
                    $output['msg'] = $orderDetails;
                    echo json_encode($output);


                } else {

                    $output['code'] = 201;
                    $output['msg'] = "please send the correct image";
                    echo json_encode($output);
                }
            }else{

                Message::EmptyDATA();
                die();

            }



        }
    }
    public function sendMessageNotification()
    {
        $this->loadModel("User");
        $this->loadModel("Order");
        $this->loadModel("Store");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $sender_id = $data['sender_id'];
            $receiver_id = $data['receiver_id'];
            $message = $data['message'];
            $title = $data['title'];
            $request_id = $data['request_id'];
            $type = "chat";





            $receiver_details =  $this->User->getUserDetailsFromID($receiver_id);
            $sender_details =  $this->User->getUserDetailsFromID($sender_id);





            /*********************************START NOTIFICATION******************************/

            $notification['to'] = $receiver_details['User']['device_token'];




            $notification['notification']['title'] = $title;
            $notification['notification']['body'] = $message;
            $notification['notification']['sender'] = $sender_details['User'];
            $notification['notification']['receiver'] = $receiver_details['User'];
            //$notification['notification']['image'] = $sender_details['User']['profile_pic'];
            // $notification['notification']['name'] = $sender_details['User']['username'];
            $notification['notification']['badge'] = "1";
            $notification['notification']['sound'] = "default";
            $notification['notification']['icon'] = "";
            $notification['notification']['type'] = $type;
            $notification['notification']['request_id'] = $request_id;


            $notification['data']['title'] = $title;
            // $notification['data']['name'] = $sender_details['User']['username'];
            $notification['data']['body'] = $message;
            $notification['data']['icon'] = "";
            $notification['data']['badge'] = "1";
            $notification['data']['sound'] = "default";
            $notification['data']['type'] = $type;
            $notification['data']['sender'] = $sender_details['User'];
            $notification['data']['receiver'] = $receiver_details['User'];
            $notification['data']['request_id'] = $request_id;

            if(isset($data['order_id'])) {

                $order_id = $data['order_id'];

                $order_details = $this->Order->getDetails($order_id);
                if(count($order_details) > 0){

                    $notification['notification']['order'] = $order_details['Order'];
                    $notification['data']['order'] = $order_details['Order'];
                }

            }

            if(isset($data['store_id'])) {

                $store_id = $data['store_id'];

                $store_details = $this->Store->getDetails($store_id);
                if(count($store_details) > 0){

                    $notification['notification']['id'] = $store_details['Store']['id'];
                    $notification['notification']['name'] = $store_details['Store']['name'];
                    $notification['notification']['logo'] = $store_details['Store']['logo'];
                    $notification['data']['store']['id'] = $store_details['Store']['id'];
                    $notification['data']['store']['name'] = $store_details['Store']['name'];
                    $notification['data']['store']['logo'] = $store_details['Store']['logo'];
                }

            }
            $result = Utility::sendPushNotificationToMobileDevice(json_encode($notification));


            /*********************************END NOTIFICATION******************************/







            $output['code'] = 200;
            $output['msg'] = json_decode($result,true);
            echo json_encode($output);


            die();
        }

    }


    public function contactUs()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];
            $message = $data['message'];



            $user_id = $data['user_id'];

            $filePath = "";
            $userDetails = $this->User->getUserDetailsFromID($user_id);
            if(count($userDetails) > 0) {


                if (isset($data['image'])) {


                    $attachment = $data['attachment'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolderDir($attachment, $folder_url);

                }

                $email_data['to'] = $userDetails['User']['email'];
                $email_data['name'] = $userDetails['User']['first_name'];
                $email_data['subject'] = CONTACT_US_SUBJECT;
                $email_data['message'] = $message;
                if(strlen($filePath) > 4){

                    $email_data['message'] =  $message."<br><strong>attachment: </strong>".BASE_URL.$filePath;
                }



                if(APP_STATUS == "live"){

                    $response = Utility::sendMail($email_data);
                }




                $output['code'] = 200;
                $output['msg'] = "message has been sent to user's email address";
                echo json_encode($output);
            }else{


                Message::EMPTYDATA();
                die();


            }

        }
    }
    public function addDeviceData()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user['device_token'] = $data['device_token'];
            $user['ip'] = $data['ip'];
            $user['device'] = $data['device'];
            $user['version'] = $data['version'];



            $user_id = $data['user_id'];


            $userDetails = $this->User->getUserDetailsFromID($user_id);
            if(count($userDetails) > 0) {

                $this->User->id = $user_id;
                $this->User->save($user);

                $output = array();
                $userDetails = $this->User->getUserDetailsFromID($user_id);


                $output['code'] = 200;
                $output['msg'] = $userDetails;
                echo json_encode($output);
            }else{


                Message::EMPTYDATA();
                die();


            }

        }
    }

    public function showOrderSession()
    {

        $this->loadModel("OrderSession");
        $this->loadModel("User");
        $this->loadModel("PaymentCard");
        $this->loadModel("StripeCustomer");
        $this->loadModel("Currency");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $details = $this->OrderSession->getDetails($id);
            if(count($details) > 0) {

                $user_id = $details['OrderSession']['user_id'];

                $userDetail = $this->User->getUserDetailsFromID($user_id);

                $currency = $this->Currency->getCurrency();





                $count = $this->PaymentCard->isUserStripeCustIDExist($user_id);

                if ($count > 0) {

                    $cards = $this->PaymentCard->getUserCards($user_id);




                    $j = 0;
                    if(count($cards) > 0) {

                        foreach ($cards as $card) {

                            $response[$j]['Stripe'] = $this->StripeCustomer->getCardDetails($card['PaymentCard']['stripe']);
                            $response[$j]['PaymentCard']['id'] = $card['PaymentCard']['id'];
                            $j++;
                        }


                        $i = 0;
                        foreach ($response as $re) {

                            $stripeCustomer = $re['Stripe'][0]['StripeCustomer']['sources']['data'][0];
                            /* $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                            $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                            $stripData[$i]['CardDetails']['last4'] = $stripeCustomer['last4'];
                            $stripData[$i]['CardDetails']['name'] = $stripeCustomer['name'];*/
                            $stripData[$i]['brand'] = $stripeCustomer['brand'];
                            $stripData[$i]['brand'] = $stripeCustomer['brand'];
                            $stripData[$i]['last4'] = $stripeCustomer['last4'];
                            $stripData[$i]['name'] = $stripeCustomer['name'];
                            $stripData[$i]['exp_month'] = $stripeCustomer['exp_month'];
                            $stripData[$i]['exp_year'] = $stripeCustomer['exp_year'];
                            $stripData[$i]['PaymentCard']['id'] = $re['PaymentCard']['id'];

                            $i++;
                        }

                    }else{

                        $output['code'] = 201;

                        $output['msg'] = "error";
                        echo json_encode($output);


                        die();

                    }

                }else{



                    $output['code'] = 200;

                    $output['msg'] = $userDetail;
                    $output['msg']['OrderSession'] = $details['OrderSession'];
                    $output['msg']['Currency'] = $currency['Currency'];
                    echo json_encode($output);
                    die();

                }



                $userDetail['User']['Cards'] = $stripData;





                $output['code'] = 200;

                $output['msg']['OrderSession'] = $details['OrderSession'];
                $output['msg']['UserDetail'] = $userDetail;
                $output['msg']['Currency'] = $currency['Currency'];
                echo json_encode($output);


                die();
            }else{

                Message::EmptyDATA();
                die();

            }

        }
    }

    public function verifyStoreCoupon()
    {

        $this->loadModel("StoreCoupon");
        $this->loadModel("StoreCouponUsed");
        // $this->loadModel("RestaurantRating");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id       = $data['user_id'];
            $store_id  = $data['store_id'];
            $coupon_code   = $data['coupon_code'];


            $coupon_exist  = $this->StoreCoupon->getCouponDetailsAgainstStoreID($coupon_code,$store_id);

            if(count($coupon_exist) > 0) {


                $coupon_id = $coupon_exist['StoreCoupon']['id'];
                $user_limit = $coupon_exist['StoreCoupon']['limit_users'];
                $count_coupon_used = $this->StoreCouponUsed->countCouponUsed($coupon_id);



                $coupon_user_used = $this->StoreCouponUsed->ifCouponCodeUsedByUser($coupon_id, $user_id);


                if (count($coupon_exist) > 0 && $coupon_user_used == 1) {

                    $output['code'] = 201;


                    $output['msg'] = "invalid coupon code";

                    echo json_encode($output);

                    die();

                } else if (count($coupon_exist)> 0 && $coupon_user_used == 0 && $count_coupon_used < $user_limit) {

                    $coupon = $this->StoreCoupon->getDetails($coupon_id);


                    $output['code'] = 200;


                    $output['msg'] = $coupon;

                    echo json_encode($output);

                    die();


                }else{



                    $output['code'] = 201;


                    $output['msg'] = "invalid coupon code";

                    echo json_encode($output);

                    die();
                }


            }else{


                $output['code'] = 201;


                $output['msg'] = "invalid coupon code";

                echo json_encode($output);

                die();

            }








        }
    }
    public function verifyCoupon()
    {

        $this->loadModel("Coupon");
        $this->loadModel("CouponUsed");
        // $this->loadModel("RestaurantRating");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id       = $data['user_id'];
            $coupon_code   = $data['coupon_code'];


            $coupon_exist  = $this->Coupon->getCouponDetails($coupon_code);


            if(count($coupon_exist) > 0) {


                $coupon_id = $coupon_exist['Coupon']['id'];
                $user_limit = $coupon_exist['Coupon']['limit_users'];
                $count_coupon_used = $this->CouponUsed->countCouponUsed($coupon_id);



                $coupon_user_used = $this->CouponUsed->ifCouponCodeUsedByUser($coupon_id, $user_id);


                if (count($coupon_exist) > 0 && $coupon_user_used == 1) {

                    $output['code'] = 201;


                    $output['msg'] = "invalid coupon code";

                    echo json_encode($output);

                    die();

                } else if (count($coupon_exist)> 0 && $coupon_user_used == 0 && $count_coupon_used < $user_limit) {

                    $coupon = $this->Coupon->getDetails($coupon_id);


                    $output['code'] = 200;


                    $output['msg'] = $coupon;

                    echo json_encode($output);

                    die();


                }else{



                    $output['code'] = 201;


                    $output['msg'] = "invalid coupon code";

                    echo json_encode($output);

                    die();
                }


            }else{


                $output['code'] = 201;


                $output['msg'] = "invalid coupon code";

                echo json_encode($output);

                die();

            }








        }
    }


    public function showUserDetail()
    {

        $this->loadModel("User");
        $this->loadModel("PaymentCard");
        $this->loadModel("StripeCustomer");
        $this->loadModel("Currency");




        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user_id = $data['user_id'];


            $userDetail = $this->User->getUserDetailsFromID($user_id);

            //$currency = $this->Currency->getCurrency();





            $count = $this->PaymentCard->isUserStripeCustIDExist($user_id);

            if ($count > 0) {

                $cards = $this->PaymentCard->getUserCards($user_id);




                $j = 0;
                if(count($cards) > 0) {

                    foreach ($cards as $card) {

                        $response[$j]['Stripe'] = $this->StripeCustomer->getCardDetails($card['PaymentCard']['stripe']);
                        $response[$j]['PaymentCard']['id'] = $card['PaymentCard']['id'];
                        $j++;
                    }


                    $i = 0;
                    foreach ($response as $re) {

                        $stripeCustomer = $re['Stripe'][0]['StripeCustomer']['sources']['data'][0];
                        /* $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['CardDetails']['last4'] = $stripeCustomer['last4'];
                        $stripData[$i]['CardDetails']['name'] = $stripeCustomer['name'];*/

                        $stripData[$i]['PaymentCard']['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['PaymentCard']['last4'] = $stripeCustomer['last4'];
                        $stripData[$i]['PaymentCard']['name'] = $stripeCustomer['name'];
                        $stripData[$i]['PaymentCard']['exp_month'] = $stripeCustomer['exp_month'];
                        $stripData[$i]['PaymentCard']['exp_year'] = $stripeCustomer['exp_year'];
                        $stripData[$i]['PaymentCard']['id'] = $re['PaymentCard']['id'];

                        $i++;
                    }

                }else{

                    $output['code'] = 201;

                    $output['msg'] = "error";
                    echo json_encode($output);


                    die();

                }

            }else{



                $output['code'] = 200;

                $output['msg'] = $userDetail;
                echo json_encode($output);
                die();

            }



            $userDetail['User']['Cards'] = $stripData;



            $output['code'] = 200;

            $output['msg'] = $userDetail;
            //$output['msg']['Currency'] = $currency['Currency'];
            echo json_encode($output);


            die();
        }
    }
    public function addPaymentCard()
    {

        $this->loadModel('StripeCustomer');
        $this->loadModel('PaymentCard');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $user_id = $data['user_id'];
            $default = $data['default'];





            $name      = $data['name'];
            $card      = $data['card'];
            $cvc       = $data['cvc'];
            $exp_month = $data['exp_month'];
            $exp_year  = $data['exp_year'];

            if ($card != null && $cvc != null) {

                $a      = array(

                    // 'email' => $email,
                    'card' => array(
                        //'name' => $first_name . " " . $last_name,
                        'number' => $card,
                        'cvc' => $cvc,
                        'exp_month' => $exp_month,
                        'exp_year' => $exp_year,
                        'name' => $name


                    )
                );
                $stripe = $this->StripeCustomer->save($a);



                if ($stripe) {





                    $payment['stripe']  = $stripe['StripeCustomer']['id'];
                    $payment['user_id'] = $user_id;
                    $payment['default'] = $default;
                    $result             = $this->PaymentCard->save($payment);
                    $count              = $this->PaymentCard->isUserStripeCustIDExist($user_id);
                    if ($count > 0) {

                        $cards = $this->PaymentCard->getUserCards($user_id);


                        foreach ($cards as $card) {

                            $response[] = $this->StripeCustomer->getCardDetails($card['PaymentCard']['stripe']);

                        }



                        $i = 0;
                        foreach ($response as $re) {

                            $stripeCustomer                        = $re[0]['StripeCustomer']['sources']['data'][0];
                            $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                            $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                            $stripData[$i]['CardDetails']['last4'] = $stripeCustomer['last4'];
                            $stripData[$i]['CardDetails']['name']  = $stripeCustomer['name'];

                            $i++;
                        }


                        $output['code'] = 200;
                        $output['msg']  = $stripData;
                        echo json_encode($output);
                        die();
                    } else {
                        Message::EmptyDATA();
                        die();
                    }




                } else {
                    $error['code'] = 400;
                    $error['msg']  = $this->StripeCustomer->getStripeError();
                    echo json_encode($error);
                }
            } else {
                echo Message::ERROR();



            }

        }

    }


    public function showUserCards()
    {



        $this->loadModel('StripeCustomer');
        $this->loadModel('PaymentCard');


        if ($this->request->isPost()) {
            //$json = file_get_contents('php://input');
            $json    = file_get_contents('php://input');
            $data    = json_decode($json, TRUE);
            $user_id = $data['user_id'];
            if ($user_id != null) {

                $count = $this->PaymentCard->isUserStripeCustIDExist($user_id);

                if ($count > 0) {

                    $cards = $this->PaymentCard->getUserCards($user_id);

                    $j = 0;
                    foreach ($cards as $card) {

                        $response[$j]['Stripe']              = $this->StripeCustomer->getCardDetails($card['PaymentCard']['stripe']);
                        $response[$j]['PaymentCard']['id'] = $card['PaymentCard']['id'];
                        $j++;
                    }


                    $i = 0;
                    foreach ($response as $re) {

                        $stripeCustomer                       = $re['Stripe'][0]['StripeCustomer']['sources']['data'][0];

                        $stripData[$i]['brand']               = $stripeCustomer['brand'];
                        $stripData[$i]['brand']               = $stripeCustomer['brand'];
                        $stripData[$i]['last4']               = $stripeCustomer['last4'];
                        $stripData[$i]['name']                = $stripeCustomer['name'];
                        $stripData[$i]['exp_month']           = $stripeCustomer['exp_month'];
                        $stripData[$i]['exp_year']            = $stripeCustomer['exp_year'];
                        $stripData[$i]['PaymentCard']['id'] = $re['PaymentCard']['id'];

                        $i++;
                    }


                    $output['code'] = 200;
                    $output['msg']  = $stripData;
                    echo json_encode($output);
                    die();
                } else {
                    Message::EmptyDATA();
                    die();
                }

            } else {
                echo Message::ERROR();
            }
        }
    }







    public function deletePaymentCard()
    {

        $this->loadModel("PaymentCard");
        $this->loadModel("StripeCustomer");
        // $this->loadModel("RestaurantRating");

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id      = $data['id'];
            $user_id = $data['user_id'];
            $this->PaymentCard->query('SET FOREIGN_KEY_CHECKS=0');
            if ($this->PaymentCard->delete($id)) {



                $count = $this->PaymentCard->isUserStripeCustIDExist($user_id);

                if ($count > 0) {

                    $cards = $this->PaymentCard->getUserCards($user_id);


                    foreach ($cards as $card) {

                        $response[] = $this->StripeCustomer->getCardDetails($card['PaymentCard']['stripe']);

                    }



                    $i = 0;
                    foreach ($response as $re) {

                        $stripeCustomer         = $re[0]['StripeCustomer']['sources']['data'][0];
                        /* $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['CardDetails']['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['CardDetails']['last4'] = $stripeCustomer['last4'];
                        $stripData[$i]['CardDetails']['name'] = $stripeCustomer['name'];*/
                        $stripData[$i]['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['brand'] = $stripeCustomer['brand'];
                        $stripData[$i]['last4'] = $stripeCustomer['last4'];
                        $stripData[$i]['name']  = $stripeCustomer['name'];

                        $i++;
                    }


                    $output['code'] = 200;
                    $output['msg']  = $stripData;
                    echo json_encode($output);
                    die();
                } else {
                    Message::EmptyDATA();
                    die();
                }
            } else {

                Message::ALREADYDELETED();
                die();

            }



        }
    }

    function forgotPassword()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $result = array();
            $json   = file_get_contents('php://input');

            $data = json_decode($json, TRUE);


            $email     = $data['email'];



            $code     = Utility::randomNumber(4);
            $user_info = $this->User->getUserDetailsAgainstEmail($email);

            if(APP_STATUS == "demo"){

                $code = 1234;
                $response['code'] = 200;
            }
            if (count($user_info) > 0) {



                $user_id = $user_info['User']['id'];
                $email   = $user_info['User']['email'];
                $first_name   = $user_info['User']['first_name'];
                $last_name   = $user_info['User']['last_name'];
                $full_name   = $first_name. ' '.$last_name;

                $email_data['to'] = $email;
                $email_data['name'] = $full_name;
                $email_data['subject'] = "reset your password";
                $email_data['message'] = "You recently requested to reset your password for your ".APP_NAME." account  with the e-mail address (".$email."). 
Please enter this verification code to reset your password.<br><br>Confirmation code: <b></b>".$code."<b>";

                if(APP_STATUS == "live"){

                    $response = Utility::sendMail($email_data);
                }




                //  $response['ErrorCode']  = 0;
                if ($response['code'] == 200) {

                    $this->User->id = $user_id;

                    $savedField     = $this->User->saveField('token', $code);
                    $result['code'] = 200;
                    $result['msg']  = "An email has been sent to " . $email . ". You should receive it shortly.";
                } else {

                    $result['code'] = 201;
                    $result['msg']  = $response['msg'];


                }

            } else {

                $result['code'] = 201;
                $result['msg']  = "Email doesn't exist";
            }



            echo json_encode($result);
            die();
        }


    }



    public function verifyForgotPasswordCode()
    {
        $this->loadModel('User');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');

            $data = json_decode($json, TRUE);
            $code = $data['code'];
            $email = $data['email'];

            $code_verify = $this->User->verifyToken($code,$email);
            $user_info = $this->User->getUserDetailsFromEmail($email);
            if (!empty($code_verify)) {
                $this->User->id = $user_info['User']['id'];
                $this->User->saveField('token',0);

                $user_info = $this->User->getUserDetailsFromEmail($email);
                $result['code'] = 200;
                $result['msg']  = $user_info;
                echo json_encode($result);
                die();
            } else {
                $result['code'] = 201;
                $result['msg']  = "invalid code";
                echo json_encode($result);
                die();
            }
        }
    }

    public function changeEmailAddress()
    {
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);


            $user_id        = $data['user_id'];
            $email        = $data['email'];


            $email_exist = $this->User->editIsEmailAlreadyExist($email, $user_id);

            $user_details = $this->User->getUserDetailsFromID($user_id);
            if(count($user_details) > 0) {

                $db_email = $user_details['User']['email'];

                if ($db_email == $email) {


                    $result['code'] = 200;
                    $result['msg'] = $user_details;
                    echo json_encode($result);
                    die();
                }

                if ($email_exist > 0) {

                    $result['code'] = 201;
                    $result['msg'] = "This email has already been registered";
                    echo json_encode($result);
                    die();
                }
                $code = Utility::randomNumber(4);

                if(APP_STATUS == "demo"){

                    $code = 1234;
                    $response['code'] = 200;
                }


                $user_id = $user_details['User']['id'];
                $first_name = $user_details['User']['first_name'];
                $last_name = $user_details['User']['last_name'];
                $full_name = $first_name . ' ' . $last_name;

                $email_data['to'] = $email;
                $email_data['name'] = $full_name;
                $email_data['subject'] = "change your email address";
                $email_data['message'] = "You recently requested to update your email for your " . APP_NAME . " account. 
Please enter this verification code to reset your email.<br><br>Confirmation code: <b></b>" . $code . "<b>";
                if(APP_STATUS == "live"){

                    $response = Utility::sendMail($email_data);
                }



                //  $response['ErrorCode']  = 0;
                if ($response['code'] == 200) {

                    $this->User->id = $user_id;

                    $savedField = $this->User->saveField('token', $code);
                    $result['code'] = 200;
                    $result['msg'] = "An email has been sent to " . $email . ". You should receive it shortly.";
                } else {

                    $result['code'] = 201;
                    $result['msg'] = $response['msg'];


                }

                echo json_encode($result);
                die();
            }

        }

    }



    public function changePhoneNo()
    {
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);


            $user_id        = $data['user_id'];
            $phone        = $data['phone'];


            $phone_exist = $this->User->editIsphoneNoAlreadyExist($phone, $user_id);


            $user_details = $this->User->getUserDetailsFromID($user_id);
            if(count($user_details) > 0) {

                $db_phone = $user_details['User']['phone'];

                if ($db_phone == $phone) {


                    $result['code'] = 200;
                    $result['msg'] = $user_details;
                    echo json_encode($result);
                    die();
                }

                if ($phone_exist > 0) {

                    $result['code'] = 201;
                    $result['msg'] = "This phone has already been registered";
                    echo json_encode($result);
                    die();
                }



                $response =  $this->verifyPhoneNo($phone,$user_id,0);


                echo json_encode($response);
                die();
            }

        }

    }


    public function verifyChangeEmailCode()
    {
        $this->loadModel('User');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');

            $data = json_decode($json, TRUE);
            $code = $data['code'];
            $email = $data['new_email'];
            $user_id = $data['user_id'];
            $user_details = $this->User->getUserDetailsFromID($user_id);
            if(count($user_details) > 0) {

                $db_email = $user_details['User']['email'];
                $code_verify = $this->User->verifyToken($code, $db_email);
                // $user_details = $this->User->getUserDetailsFromEmail($email);
                if (!empty($code_verify) && $code > 0) {
                    $email_change['email'] = $email;
                    $email_change['token'] = 0;
                    $this->User->id = $user_id;
                    $this->User->save($email_change);

                    $user_details = $this->User->getUserDetailsFromEmail($email);
                    $result['code'] = 200;
                    $result['msg'] = $user_details;
                    echo json_encode($result);
                    die();
                } else {
                    $result['code'] = 201;
                    $result['msg'] = "invalid code";
                    echo json_encode($result);
                    die();
                }
            }else{

                Message::EMPTYDATA();
                die();

            }
        }
    }

    public function changePassword()
    {
        $this->loadModel('User');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);

            if(APP_STATUS == "demo") {

                $result['code'] = 201;
                $result['msg']  = "You cannot change demo account password";
                echo json_encode($result);
                die();
            }
            $user_id        = $data['user_id'];
            $this->User->id = $user_id;
            $email          = $this->User->field('email');

            $old_password   = $data['old_password'];
            $new_password   = $data['new_password'];


            if ($this->User->verifyPassword($email, $old_password)) {

                $this->request->data['password'] = $new_password;
                $this->User->id                  = $user_id;


                if ($this->User->save($this->request->data)) {

                    echo Message::DATASUCCESSFULLYSAVED();

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



    public function changePasswordForgot()
    {
        $this->loadModel('User');


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            //$json = $this->request->data('json');
            $data = json_decode($json, TRUE);


            $email        = $data['email'];

            $new_password   = $data['password'];




            $this->request->data['password'] = $new_password;

            $email_details = $this->User->getUserDetailsAgainstEmail($email);


            $user_id = $email_details['User']['id'];
            $this->User->id = $user_id;
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









}







?>