<?php

App::uses('Utility', 'Lib');
App::uses('Message', 'Lib');
class VendorController extends AppController
{

    //public $components = array('Email');

    public $autoRender = false;
    public $layout = false;


    public function beforeFilter()
    {

        $json = file_get_contents('php://input');
        $json_error = Utility::isJsonError($json);

        if ($json_error == "false") {




            return true;


        } else {

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

    public function showUsers(){

        $this->loadModel('User');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            if(isset($data['role'])) {
                $role =  $data['role'];
                $users = $this->User->getUsers($role);

            }else{


                $users = $this->User->getAllUsersExceptAdmin();
            }



            $output['code'] = 200;

            $output['msg'] = $users;


            echo json_encode($output);


            die();


        }


    }


    public function showOrders(){

        $this->loadModel("Order");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $status = $data['status'];
            $store_id = $data['store_id'];


            $orders = $this->Order->getStoreOrdersAccordingToStatusStorePortal($status,$store_id);







            $output['code'] = 200;

            $output['msg']    = $orders;


            echo json_encode($output);


            die();
        }
    }


    public function showOrderDetail()
    {

        $this->loadModel("Order");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $order_id = $data['order_id'];


            $order_details = $this->Order->getDetails($order_id);







            $output['code'] = 200;

            $output['msg']    = $order_details;


            echo json_encode($output);


            die();
        }
    }



    public function editUser()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $user['first_name'] = $data['first_name'];
            $user['last_name'] = $data['last_name'];
            $user['phone'] = $data['phone'];
            $user['email'] = $data['email'];
            $user['role'] = $data['role'];
            $user['admin_per_order_commission'] = $data['admin_per_order_commission'];
            $user['rider_fee_per_order'] = $data['rider_fee_per_order'];


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



    public function showUserDetail()
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

    public function addAppSliderImage()
    {


        $this->loadModel('AppSlider');
        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $image = $data['image'];
            $user_id = $data['user_id'];

            if (isset($data['image']) && $data['image'] != " ") {

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolder($user_id, $image, $folder_url);
                $image['image'] = $filePath;
            }


            if (isset($data['id'])) {
                $id = $data['id'];
                $app_slider = $this->AppSlider->getImageDetail($id);
                $image_path = $app_slider[0]['AppSlider']['image'];

                @unlink($image_path);

                $this->AppSlider->id = $id;
                $this->AppSlider->save($image);
                echo Message::DATASUCCESSFULLYSAVED();

                die();

            } else if ($this->AppSlider->save($image)) {

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

        $this->loadModel("AppSlider");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $app_slider = $this->AppSlider->getImageDetail($id);
            if (count($app_slider) > 0) {
                $image_path = $app_slider[0]['AppSlider']['image'];

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
        $this->loadModel("Order");
        $this->loadModel("User");


        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $rider_user_id = $data['rider_user_id'];

            $order_id = $data['order_id'];
            $created = date('Y-m-d H:i:s', time());



            if(isset($data['id'])){

                $this->RiderOrder->delete($data['id']);

            }

            $rider_order['rider_user_id'] = $rider_user_id;

            $rider_order['order_id'] = $order_id;
            $rider_order['assign_date_time'] = $created;




            if ($this->RiderOrder->isDuplicateRecord($rider_user_id, $order_id) <= 0) {

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
                    $notification['notification']['type'] = "";
                    $notification['data']['title'] = $msg;
                    $notification['data']['body'] = '';
                    $notification['data']['icon'] = "";
                    $notification['data']['badge'] = "1";
                    $notification['data']['sound'] = "default";
                    $notification['data']['type'] = "";
                    Utility::sendPushNotificationToMobileDevice(json_encode($notification));




                    $output['code'] = 200;

                    $output['msg'] = $details;
                    echo json_encode($output);


                    die();

                } else {


                    echo Message::DUPLICATEDATE();
                    die();
                }

            }else{

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
            $country['country'] =  $data['country'];
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

            }
        }


    }


    public function showAllProducts(){

        $this->loadModel('Product');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);





            if(isset($data['store_id'])){

                $products = $this->Product->getProductsAgainstStore($data['store_id']);

            }else   if(isset($data['category_id'])){


                $products = $this->Product->getProductsAgainstCategory($data['category_id']);
            } else   if(isset($data['id'])){


                $products = $this->Product->getDetails($data['id']);


            }  else{

                $products = $this->Product->getAll();

            }


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

    public function addOrderDeliveryTime()
    {


        $this->loadModel('Order');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $order['delivery_datetime'] = $data['delivery_datetime'];




            $order_id = $data['order_id'];


            $this->Order->id = $order_id;
            $this->Order->save($order);


            $output = array();
            $userDetails = $this->Order->getDetails($order);


            $output['code'] = 200;
            $output['msg'] = $userDetails;
            echo json_encode($output);


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


                            $filePath = Utility::uploadFileintoFolder($product_id, $v['image'], $folder_url);

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




                            $filePath = Utility::uploadFileintoFolder($product_id, $v['image'], $folder_url);

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
                $user['admin_per_order_commission'] = $data['admin_per_order_commission'];
                $user['rider_fee_per_order'] = $data['rider_fee_per_order'];
                $user['last_name'] = $last_name;
                $user['role'] = $role;
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

                    $filePath = Utility::uploadFileintoFolder($id, $image, $folder_url);
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

                    $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
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

                    $filePath = Utility::uploadFileintoFolder($id, $image, $folder_url);
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

                    $filePath = Utility::uploadFileintoFolder($id, $image, $folder_url);
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

                    $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
                    $cat['logo'] = $filePath;


                }

                if (isset($data['cover'])) {

                    $image = $data['cover'];
                    $folder_url = UPLOADS_FOLDER_STORE_URI;

                    $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
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

                $filePath = Utility::uploadFileintoFolder($store_id, $image, $folder_url);
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

                $filePath = Utility::uploadFileintoFolder($store_id, $image, $folder_url);
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

            if(isset($data['user_id'])){

                $stores = $this->Store->getUserStores($data['user_id']);
            }






            $output['code'] = 200;

            $output['msg'] = $stores;



            echo json_encode($output);


            die();


        }


    }


    public function addAdmin()
    {


        $this->loadModel('User');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $email = $data['email'];
            $password = $data['password'];
            $full_name = $data['full_name'];
            $role = $data['role'];


            $created = date('Y-m-d H:i:s', time());


            if ($email != null && $password != null) {


                //$ip  = $data['ip'];

                $user['email'] = $email;

                $user['password'] = $password;
                $user['full_name'] = $full_name;
                $user['role'] = $role;




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


    public function addMainCategory()
    {



        $this->loadModel('MainCategory');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $cat['name'] =  $data['name'];
            $cat['label'] =  $data['label'];
            $cat['order'] = $data['order'];

            if(isset($data['id'])){

                $id = $data['id'];



                if (isset($data['image'])) {

                    $details =  $this->MainCategory->getDetails($id);
                    $image_db = $details['MainCategory']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
                    $cat['image'] = $filePath;



                }

                /* $order_existed = $this->MainCategory->checkIfOrderExistedInOtherCategories($data['order'],$id);

               if(count($order_existed) > 0){


                    $this->MainCategory->id = $order_existed['MainCategory']['id'];
                    $this->MainCategory->saveField('order',0);

                }*/


                $this->MainCategory->id = $id;
                $this->MainCategory->save($cat);
                $details =  $this->MainCategory->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }

            if (isset($data['image'])) {

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
                $cat['image'] = $filePath;



            }

            /* $order_existed = $this->MainCategory->checkIfOrderExisted($data['order']);

             if(count($order_existed) > 0){


                 $this->MainCategory->id = $order_existed['MainCategory']['id'];
                 $this->MainCategory->saveField('order',0);

             }*/







            $this->MainCategory->save($cat);
            $id = $this->MainCategory->getInsertID();
            $details =  $this->MainCategory->getDetails($id);

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();




        }




    }


    public function addSubCategory()
    {



        $this->loadModel('SubCategory');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $cat['name'] =  $data['name'];
            $cat['label'] =  $data['label'];
            $cat['order'] = $data['order'];
            $cat['main_category_id'] =  $data['main_category_id'];


            if(isset($data['id'])){

                $id = $data['id'];



                if (isset($data['image'])) {

                    $details =  $this->SubCategory->getDetails($id);
                    $image_db = $details['SubCategory']['image'];
                    if (strlen($image_db) > 5) {
                        @unlink($image_db);

                    }

                    $image = $data['image'];
                    $folder_url = UPLOADS_FOLDER_URI;

                    $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
                    $cat['image'] = $filePath;



                }


                /* $order_existed = $this->SubCategory->checkIfOrderExistedInOtherCategories($data['order'],$id,$data['main_category_id']);

                 if(count($order_existed) > 0){


                     $this->SubCategory->id = $order_existed['SubCategory']['id'];
                     $this->SubCategory->saveField('order',0);

                 }*/


                $this->SubCategory->id = $id;
                $this->SubCategory->save($cat);

                $details =  $this->SubCategory->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }


            if (isset($data['image'])) {

                $image = $data['image'];
                $folder_url = UPLOADS_FOLDER_URI;

                $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
                $cat['image'] = $filePath;



            }


            /* $order_existed = $this->SubCategory->checkIfOrderExisted($data['order'],$data['main_category_id']);

             if(count($order_existed) > 0){


                 $this->SubCategory->id = $order_existed['SubCategory']['id'];
                 $this->SubCategory->saveField('order',0);

             }*/

            $this->SubCategory->save($cat);
            $id = $this->SubCategory->getInsertID();
            $details =  $this->SubCategory->getDetails($id);

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

    public function deleteMainCategory(){

        $this->loadModel('MainCategory');
        $this->loadModel('FeaturedCategory');
        $this->loadModel('SubCategory');
        $this->loadModel('Form');
        $this->loadModel('Option');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];



            //  $forms =  $this->Form->getFormAgainstCategoryID($id);
            $sub_categories = $this->SubCategory->getSubCategories($id);
            foreach ($sub_categories as $sub_category){


                $sub_category_id = $sub_category['SubCategory']['id'];
                $this->FeaturedCategory->deleteFeaturedSubCategory($sub_category_id);

                $forms =  $this->Form->getFormAgainstCategoryID($id);
                foreach ($forms as $form) {


                    $form_id = $form['Form']['id'];
                    $this->Option->deleteAllOptions($form_id);

                }

                $this->Form->deleteAllFields($sub_category_id);


            }

            $this->SubCategory->deleteAllSubCategories($id);
            $this->MainCategory->delete($id);
            $this->FeaturedCategory->deleteFeaturedMainCategory($id);





            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }
    public function showMainCategoryDetails(){

        $this->loadModel('MainCategory');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $category = $this->MainCategory->getDetails($id);





            $output['code'] = 200;

            $output['msg'] = $category;


            echo json_encode($output);


            die();


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

                    $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
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

                $filePath = Utility::uploadFileintoFolder(1, $image, $folder_url);
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




    public function showSettingsAgainstType()
    {


        $this->loadModel("Setting");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $types = $data['types'];






            if(count($types) > 0) {

                $type = array();
                foreach ($types as $key_fr => $val) {


                    $type[$key_fr] = $val['type'];


                }


                $setting_details = $this->Setting->getSettingsAgainstType($type);



                $output['code'] = 200;

                $output['msg'] = $setting_details;


                echo json_encode($output);


                die();

            }
        }
    }




    public function showSettingsAgainstCategoryAndType()
    {


        $this->loadModel("Setting");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $type = $data['type'];
            $category = $data['category'];









            $setting_details = $this->Setting->getSettingsAgainstCategoryAndType($category,$type);



            $output['code'] = 200;

            $output['msg'] = $setting_details;


            echo json_encode($output);


            die();

        }

    }






    public function showSubCategoryDetails(){

        $this->loadModel('SubCategory');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $category = $this->SubCategory->getDetails($id);





            $output['code'] = 200;

            $output['msg'] = $category;


            echo json_encode($output);


            die();


        }


    }

    public function showAllPosts()
    {


        $this->loadModel("Post");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            if(isset($data['status'])){

                $status = $data['status'];
                $post = $this->Post->getPostAgainstStatus($status);

            }else {
                $post = $this->Post->getAll();
            }

            $output['code'] = 200;

            $output['msg'] = $post;


            echo json_encode($output);


            die();


        }
    }


    public function showPostDetail()
    {


        $this->loadModel("Post");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            $post_id = $data['id'];



            $post_details = $this->Post->getDetails($post_id);



            $output['code'] = 200;

            $output['msg'] = $post_details;


            echo json_encode($output);


            die();


        }
    }
    public function postStatusUpdate()
    {


        $this->loadModel("Post");


        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $status = $data['status'];
            $id = $data['id'];

            $this->Post->id = $id;
            $this->Post->saveField('status',$status);

            $details = $this->Post->getDetails($id);



            $output['code'] = 200;

            $output['msg'] = $details;


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

    public function showSubCategories(){

        $this->loadModel('SubCategory');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $main_cat_id = $data['main_cat_id'];
            $categories = $this->SubCategory->getSubCategories($main_cat_id);





            $output['code'] = 200;

            $output['msg'] = $categories;


            echo json_encode($output);


            die();


        }


    }


    public function showOptions(){

        $this->loadModel('Option');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $form_id = $data['form_id'];
            // $name =  $data['name'];
            $options = $this->Option->getAgainstFormID($form_id);





            $output['code'] = 200;

            $output['msg'] = $options;


            echo json_encode($output);


            die();


        }


    }



    public function addForm()
    {



        $this->loadModel('Form');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);


            $form['sub_category_id'] =  $data['sub_category_id'];
            $form['name'] =  $data['name'];
            $form['required'] =  $data['required'];
            $form['type'] =  $data['type'];
            $form['field_type'] =  $data['field_type'];
            $form['order'] =  $data['order'];


            if(isset($data['id'])){

                $id = $data['id'];

                /*$order_existed = $this->Form->checkIfOrderExistedInOtherForm($data['order'],$id,$data['sub_category_id']);

                if(count($order_existed) > 0){


                    $this->Form->id = $order_existed['Form']['id'];
                    $this->Form->saveField('order',0);

                }*/


                $this->Form->id = $id;
                $this->Form->save($form);

                $details =  $this->Form->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }

            /*  $order_existed = $this->Form->checkIfOrderExisted($data['order'],$data['sub_category_id']);

              if(count($order_existed) > 0){


                  $this->Form->id = $order_existed['Form']['id'];
                  $this->Form->saveField('order',0);

              }*/


            $this->Form->save($form);
            $id = $this->Form->getInsertID();
            $details =  $this->Form->getDetails($id);

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();




        }




    }
    public function showForm(){

        $this->loadModel('Form');
        $this->loadModel('Option');



        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $sub_category_id = $data['sub_category_id'];

            $form = $this->Form->getFormAgainstCategoryID($sub_category_id);

            foreach ($form as $key => $value) {
                $id = $value['Form']['id'];
                $options =  $this->Option->getAgainstFormID($id);


                $form[$key]['Form']['select'] = $options;

            }



            $output['code'] = 200;

            $output['msg'] = $form;


            echo json_encode($output);


            die();


        }


    }



    public function addOption()
    {



        $this->loadModel('Option');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $option['name'] =  $data['name'];
            $option['form_id'] =  $data['form_id'];


            if(isset($data['id'])){

                $id = $data['id'];
                $this->Option->id = $id;
                $this->Option->save($option);

                $details =  $this->Option->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }



            $this->Option->save($option);
            $id = $this->Option->getInsertID();
            $details =  $this->Option->getDetails($id);

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();




        }




    }



    public function admob(){

        $this->loadModel('Admob');

        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $admob['publisher_id'] = $data['publisher_id'];
            $admob['application_id'] = $data['application_id'];
            $admob['banner_ad'] = $data['banner_ad'];
            $admob['banner_id']= $data['banner_id'];
            $admob['interstitial_ad']= $data['interstitial_ad'];
            $admob['interstitial_id']= $data['interstitial_id'];
            $admob['interstitial_click'] = $data['interstitial_click'];
            $admob['phone'] = $data['phone'];
            $admob['created'] =  date('Y-m-d H:i:s', time());

            $ifExist =  $this->Admob->ifExist();
            if(count($ifExist) > 0){

                $this->Admob->id = $ifExist['Admob']['id'];
                $this->Admob->save($admob);
                $details = $this->Admob->getDetails($ifExist['Admob']['id']);

                $output['code'] = 200;

                $output['msg'] = $details;


                echo json_encode($output);


                die();



            }




            $this->Admob->save($admob);
            $id = $this->Admob->getInsertID();


            $details = $this->Admob-> getDetails($id);

            $output['code'] = 200;

            $output['msg'] = $details;


            echo json_encode($output);


            die();


        }

    }



    public function showAdmob()
    {

        $this->loadModel("Admob");



        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);
            // $section_id = $data['section_id'];

            $all = $this->Admob->ifExist();



            $output['code'] = 200;

            $output['msg'] = $all;


            echo json_encode($output);


            die();


        }
    }





    public function showOptionDetails(){

        $this->loadModel('Option');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $category = $this->Option->getDetails($id);





            $output['code'] = 200;

            $output['msg'] = $category;


            echo json_encode($output);


            die();


        }


    }


    public function deleteOption(){

        $this->loadModel('Option');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $this->Option->delete($id);





            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }

    public function showFormDetails(){

        $this->loadModel('Form');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $category = $this->Form->getDetails($id);





            $output['code'] = 200;

            $output['msg'] = $category;


            echo json_encode($output);


            die();


        }


    }

    public function deleteForm(){

        $this->loadModel('Form');
        $this->loadModel('Option');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $this->Form->delete($id);

            $this->Option->deleteAllOptions($id);



            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }


    public function addFeaturedCategory()
    {



        $this->loadModel('FeaturedCategory');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $cat['main_cat_id'] =  $data['main_cat_id'];
            $cat['sub_cat_id'] =  $data['sub_cat_id'];
            $cat['featured'] =  $data['featured'];
            $cat['created'] = date('Y-m-d H:i:s', time());

            if($data['main_cat_id'] > 0 && $data['sub_cat_id'] > 0){

                $output['code'] = 201;
                $output['msg'] = "Error: You are sending both categories id greater then 0";
                echo json_encode($output);
                die();

            }

            if(isset($data['id'])){

                $id = $data['id'];
                $this->FeaturedCategory->id = $id;
                $this->FeaturedCategory->save($cat);

                $details =  $this->FeaturedCategory->getDetails($id);

                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();

            }

            $count =  $this->FeaturedCategory->checkDuplicate($cat);
            if($count > 0 ){

                echo $count;
                $output['code'] = 201;
                $output['msg'] = "This category has already been featured";
                echo json_encode($output);
                die();

            }

            if($data['featured'] == 0){


                $this->FeaturedCategory->deleteFeaturedCategory($data);
                $output['code'] = 200;
                $output['msg'] = "The category has been unfeatured";
                echo json_encode($output);
                die();
            }





            $this->FeaturedCategory->save($cat);
            $id = $this->FeaturedCategory->getInsertID();
            $details =  $this->FeaturedCategory->getDetails($id);

            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);
            die();




        }




    }


    public function showFeaturedCategories(){

        $this->loadModel('FeaturedCategory');




        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);



            $category = $this->FeaturedCategory->getAll();





            $output['code'] = 200;

            $output['msg'] = $category;


            echo json_encode($output);


            die();


        }


    }


    public function addSection()
    {


        $this->loadModel('Section');
        //$this->loadModel('Post');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $section['name'] = $data['name'];
            $section['order'] = $data['order'];


            if(isset($data['id'])){
                $id =  $data['id'];


                /*  $order_existed = $this->Section->checkIfOrderExistedInOthers($data['order'],$id);

                  if(count($order_existed) > 0){


                      $this->Section->id = $order_existed['Section']['id'];
                      $this->Section->saveField('order',0);

                  }
  */

                $this->Section->id = $id;
                $this->Section->save($section);
                $output = array();
                $details = $this->Section->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }

            /*$order_existed = $this->Section->checkIfOrderExisted($data['order']);


            if(count($order_existed) > 0){
                $this->Section->setOrderZero($order_existed['Section']['id']);


            }*/




            $this->Section->save($section);
            $id = $this->Section->getInsertID();

            $output = array();
            $details = $this->Section->getDetails($id);


            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);





        }
    }


    public function addSectionPost()
    {


        $this->loadModel('SectionPost');
        //$this->loadModel('Post');

        if ($this->request->isPost()) {


            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $section['section_id'] = $data['section_id'];
            $section['post_id'] = $data['post_id'];
            $section['order'] = $data['order'];
            $section['created'] = date('Y-m-d H:i:s', time());


            if(isset($data['id'])){
                $id =  $data['id'];


                $order_existed = $this->SectionPost->checkIfOrderExistedInOthers($data['order'],$id,$data['section_id']);

                if(count($order_existed) > 0){



                    $this->SectionPost->updateToZero($order_existed['SectionPost']['id']);

                }


                $this->SectionPost->id = $id;
                $this->SectionPost->save($section);
                $output = array();
                $details = $this->SectionPost->getDetails($id);


                $output['code'] = 200;
                $output['msg'] = $details;
                echo json_encode($output);
                die();


            }


            $order_existed = $this->SectionPost->checkIfOrderExisted($data['order'],$data['section_id']);

            if(count($order_existed) > 0){


                $this->SectionPost->updateToZero($order_existed['SectionPost']['id']);

            }
            $this->SectionPost->save($section);
            $id = $this->SectionPost->getInsertID();

            $output = array();
            $details = $this->SectionPost->getDetails($id);


            $output['code'] = 200;
            $output['msg'] = $details;
            echo json_encode($output);





        }
    }


    public function deleteSection(){

        $this->loadModel('Section');
        $this->loadModel('SectionPost');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];

            $this->SectionPost->deleteAllSectionPosts($id);

            $this->Section->id = $id;
            $this->Section->delete();






            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }

    public function deleteSectionPost(){


        $this->loadModel('SectionPost');





        if ($this->request->isPost()) {
            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];



            $this->SectionPost->id = $id;
            $this->SectionPost->delete();






            $output['code'] = 200;

            $output['msg'] = "deleted";


            echo json_encode($output);


            die();


        }


    }


    public function showSections()
    {

        $this->loadModel("Section");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $sections = $this->Section->getAllSections();


            if(count($sections) > 0) {
                $output['code'] = 200;

                $output['msg'] = $sections;


                echo json_encode($output);


                die();

            }else{
                Message::EMPTYDATA();
                die();


            }
        }
    }

    public function showSectionDetails()
    {

        $this->loadModel("Section");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];
            $details = $this->Section->getDetails($id);




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


    public function showSectionPostDetails()
    {

        $this->loadModel("Section");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $id = $data['id'];
            $details = $this->SectionPost->getDetails($id);




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


    public function showSectionPosts()
    {

        $this->loadModel("SectionPost");


        if ($this->request->isPost()) {

            $json = file_get_contents('php://input');
            $data = json_decode($json, TRUE);

            $section_id = $data['section_id'];
            $sections = $this->SectionPost->getSectionPost($section_id);


            if(count($sections) > 0) {
                $output['code'] = 200;

                $output['msg'] = $sections;


                echo json_encode($output);


                die();

            }else{
                Message::EMPTYDATA();
                die();


            }
        }
    }





}