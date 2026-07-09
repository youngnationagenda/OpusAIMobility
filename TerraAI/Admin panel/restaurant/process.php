<?php
include("config.php");
if (isset($_SESSION[PRE_FIX . 'id'])) 
{
    if (isset($_GET['action']))
    {
        
        if ($_GET['action'] == "addUser") 
        {
            $first_name = htmlspecialchars($_POST['first_name'], ENT_QUOTES);
            $last_name = htmlspecialchars($_POST['last_name'], ENT_QUOTES);
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $password = htmlspecialchars($_POST['password'], ENT_QUOTES);
            $phone = htmlspecialchars($_POST['phone'], ENT_QUOTES);
            $country_id = htmlspecialchars($_POST['country_id'], ENT_QUOTES);
            
            $data = [
                "role" => 'user',
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email,
                "password" => $password,
                "phone" =>$phone,
                "country_id" => $country_id
            ];

            $url = $baseurl . 'addUser';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=users'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=users'</script>";
            }
        }
        
        
        if ($_GET['action'] == "addRider") 
        {
            $first_name = htmlspecialchars($_POST['first_name'], ENT_QUOTES);
            $last_name = htmlspecialchars($_POST['last_name'], ENT_QUOTES);
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $password = htmlspecialchars($_POST['password'], ENT_QUOTES);
            $phone = htmlspecialchars($_POST['phone'], ENT_QUOTES);
            $country_id = htmlspecialchars($_POST['country_id'], ENT_QUOTES);
            
            $data = [
                "role" => 'driver',
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email,
                "password" => $password,
                "phone" =>$phone,
                "country_id" => $country_id
            ];

            $url = $baseurl . 'addUser';
            $json_data = @curl_request($data, $url);
            
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=rider'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=rider'</script>";
            }
        }
        
        if ($_GET['action'] == "editUser") 
        {
            $user_id = htmlspecialchars($_POST['user_id'], ENT_QUOTES);
            $first_name = htmlspecialchars($_POST['first_name'], ENT_QUOTES);
            $last_name = htmlspecialchars($_POST['last_name'], ENT_QUOTES);
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $phone = htmlspecialchars($_POST['phone'], ENT_QUOTES);
            $country_id = htmlspecialchars($_POST['country_id'], ENT_QUOTES);
            
            $data = [
                "role" => 'user',
                "user_id" => $user_id,
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email,
                "phone" =>$phone,
                "country_id" => $country_id
            ];
            $url = $baseurl . 'editUser';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=users'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=users'</script>";
            }
        }
        
        if ($_GET['action'] == "editRider") 
        {
            $user_id = htmlspecialchars($_POST['user_id'], ENT_QUOTES);
            $first_name = htmlspecialchars($_POST['first_name'], ENT_QUOTES);
            $last_name = htmlspecialchars($_POST['last_name'], ENT_QUOTES);
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $phone = htmlspecialchars($_POST['phone'], ENT_QUOTES);
            $country_id = htmlspecialchars($_POST['country_id'], ENT_QUOTES);
            
            $data = [
                "role" => 'driver',
                "user_id" => $user_id,
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email,
                "phone" =>$phone,
                "country_id" => $country_id
            ];
            $url = $baseurl . 'editUser';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=rider'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=rider'</script>";
            }
        }
        
        if ($_GET['action'] == "addAdminUser") 
        {
            $first_name = htmlspecialchars($_POST['first_name'], ENT_QUOTES);
            $last_name = htmlspecialchars($_POST['last_name'], ENT_QUOTES);
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $password = htmlspecialchars($_POST['password'], ENT_QUOTES);
            $data = [
                "role" => "admin",
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email,
                "password" => $password
            ];

            $url = $baseurl . 'addAdminUser';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageAdmin'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageAdmin'</script>";
            }
        }
        if ($_GET['action'] == "editAdminUser") 
        {
            $first_name = htmlspecialchars($_POST['first_name'], ENT_QUOTES);
            $last_name = htmlspecialchars($_POST['last_name'], ENT_QUOTES);
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $admin_id = htmlspecialchars($_POST['admin_id'], ENT_QUOTES);
            $data = [
                "role" => "admin",
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email,
                "id" => $admin_id
            ];
            $url = $baseurl . 'editAdminUser';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageAdmin'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageAdmin'</script>";
            }
        }
        if($_GET['action']=="changeAdminPassword") 
        {
            $new_password = htmlspecialchars($_POST['new_password'], ENT_QUOTES);
            $user_id = htmlspecialchars($_POST['user_id'], ENT_QUOTES);
            $data =[
                "user_id"=>$user_id,
                "password" => $new_password
            ];
            $url=$baseurl . 'changeAdminPassword';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageAdmin'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageAdmin'</script>";
            }
        }
        if($_GET['action']=="currentAdminChangePassword") 
        {
            $previous_password = htmlspecialchars($_POST['old_password'], ENT_QUOTES);
            $new_password = htmlspecialchars($_POST['new_password'], ENT_QUOTES);
            $user_id = htmlspecialchars($_POST['user_id'], ENT_QUOTES);
            $data =[
                "user_id"=>$user_id,
                "old_password" => $previous_password,
                "new_password" => $new_password
            ];
            $url=$baseurl . 'currentAdminChangePassword';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=changePassword'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=changePassword'</script>";
            }
        }
        if ($_GET['action'] == "deleteAdmin") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $data = [
                "user_id" => $id
            ];
            $url = $baseurl . 'deleteAdmin';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=adminUsers'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=adminUsers'</script>";
            }
        }
        if ($_GET['action'] == "addFoodCategory") 
        {
            $title = htmlspecialchars($_POST['title'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
            if(file_exists($_FILES['icon']['tmp_name']) || is_uploaded_file($_FILES['icon']['tmp_name']))
            {
                $icondata = file_get_contents($_FILES['icon']['tmp_name']);
                $icon = base64_encode($icondata);
            }
            else
            {
                $icon ="";
            }
            $data = [
                "title" => $title,
                "image" => $image,
                "icon" => $icon,
            ];
            $url = $baseurl . 'addFoodCategory';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=foodCategory'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=foodCategory'</script>";
            }
        }
        if ($_GET['action'] == "editFoodCategory") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $title = htmlspecialchars($_POST['title'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
            if(file_exists($_FILES['icon']['tmp_name']) || is_uploaded_file($_FILES['icon']['tmp_name']))
            {
                $icondata = file_get_contents($_FILES['icon']['tmp_name']);
                $icon = base64_encode($icondata);
            }
            else
            {
                $icon ="";
            }
            $data = [
                "id" => $id,
                "title" => $title,
                "image" => $image,
                "icon" => $icon,
            ];
            $url = $baseurl . 'addFoodCategory';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=foodCategory'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=foodCategory'</script>";
            }
        }
        if ($_GET['action'] == "deleteFoodCategory") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $data = [
                "id" => $id
            ];
            $url = $baseurl . 'deleteFoodCategory';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=foodCategory'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=foodCategory'</script>";
            }
        }
        if($_GET['action']=="addPackageSize") 
        {
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            $price = htmlspecialchars($_POST['price'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
    
            $data = [
                "title" => $name,
                "description" => $description,
                "price" => $price,
                "image" =>  $image
            ];
            $url=$baseurl . 'addPackageSize';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=packageSize'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=packageSize'</script>";
            }
        }
        if($_GET['action']=="editPackageSize") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            $price = htmlspecialchars($_POST['price'], ENT_QUOTES);
            $imagedata = file_get_contents($_FILES['image']['tmp_name']);
            $image = base64_encode($imagedata);
    
            $data = [
                "id" => $id,
                "title" => $name,
                "description" => $description,
                "price" => $price,
                "image" =>  $image
            ];
            $url=$baseurl . 'addPackageSize';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=packageSize'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=packageSize'</script>";
            }
        }
        if($_GET['action']=="deletePackageSize") 
        {
            $id = $_GET['id'];
            $data = [
                "id" => $id
            ];
                
            $url=$baseurl . 'deletePackageSize';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=packageSize'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=packageSize'</script>";
            }
        }
        if($_GET['action']=="addRideType") 
        {
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            $passenger_capacity = htmlspecialchars($_POST['passenger_capacity'], ENT_QUOTES);
            $base_fare = htmlspecialchars($_POST['base_fare'], ENT_QUOTES);
            $cost_per_minute = htmlspecialchars($_POST['cost_per_minute'], ENT_QUOTES);
            $cost_per_distance = htmlspecialchars($_POST['cost_per_distance'], ENT_QUOTES);
            $distance_type = htmlspecialchars($_POST['distance_type'], ENT_QUOTES);
            
            $data = [
                "name" => $name,
                "description" => $description,
                "passenger_capacity" => $passenger_capacity,
                "base_fare" =>  $base_fare,
                "cost_per_minute" => $cost_per_minute,
                "cost_per_distance" =>  $cost_per_distance,
                "distance_unit" => $distance_type
            ];
            $url=$baseurl . 'addRideType';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=rideTypes'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=rideTypes'</script>";
            }
        }
        if($_GET['action']=="editRideType") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            $passenger_capacity = htmlspecialchars($_POST['passenger_capacity'], ENT_QUOTES);
            $base_fare = htmlspecialchars($_POST['base_fare'], ENT_QUOTES);
            $cost_per_minute = htmlspecialchars($_POST['cost_per_minute'], ENT_QUOTES);
            $cost_per_distance = htmlspecialchars($_POST['cost_per_distance'], ENT_QUOTES);
            $distance_type = htmlspecialchars($_POST['distance_type'], ENT_QUOTES);
            
            $data = [
                "id" => $id,
                "name" => $name,
                "description" => $description,
                "passenger_capacity" => $passenger_capacity,
                "base_fare" =>  $base_fare,
                "cost_per_minute" => $cost_per_minute,
                "cost_per_distance" =>  $cost_per_distance,
                "distance_unit" => $distance_type
            ];
            $url=$baseurl . 'addRideType';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=rideTypes'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=rideTypes'</script>";
            }
        }
        if($_GET['action']=="restaurantOwnerResponse") 
        {
            $order_id = htmlspecialchars($_POST['order_id'], ENT_QUOTES);
            $reason = htmlspecialchars($_POST['reason'], ENT_QUOTES);
            $data = [
                "order_id" => $order_id,
                "response" => "2",
                "reason" =>  $reason
            ];
            $url=$baseurl . 'restaurantOwnerResponse';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=foodOrders'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=foodOrders'</script>";
            }
        }
        
        if($_GET['action']=="changeFoodOrderStatus") 
        {
            $order_id = htmlspecialchars($_POST['order_id'], ENT_QUOTES);
            $status = htmlspecialchars($_POST['status'], ENT_QUOTES);
            
            $data = [
                "food_order_id" => $order_id,
                "status" => $status
            ];
            $url=$baseurl . 'updateOrderStatus';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=foodOrders'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=foodOrders'</script>";
            }
        }
        
        if($_GET['action']=="parcel_changeStatus") 
        {
            $order_id = htmlspecialchars($_POST['order_id'], ENT_QUOTES);
            $status = htmlspecialchars($_POST['status'], ENT_QUOTES);
            
            $data = [
                "parcel_order_id" => $order_id,
                "status" => $status
            ];
            $url=$baseurl . 'updateOrderStatus';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=showParcelOrders'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=showParcelOrders'</script>";
            }
        }
        
        
    
        if($_GET['action']=="assignOrderToRider") 
        {
            $rider_id = htmlspecialchars($_POST['rider_id'], ENT_QUOTES);
            $order_id = htmlspecialchars($_POST['order_id'], ENT_QUOTES);
            $data = [
                "rider_user_id" => $rider_id,
                "food_order_id" => $order_id
            ];
            $url=$baseurl . 'assignOrderToRider';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=foodOrders'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=foodOrders'</script>";
            }
        }
        
        if($_GET['action']=="parcel_assignOrderToRider") 
        {
            $rider_id = htmlspecialchars($_POST['rider_id'], ENT_QUOTES);
            $order_id = htmlspecialchars($_POST['order_id'], ENT_QUOTES);
            $data = [
                "rider_user_id" => $rider_id,
                "parcel_order_id" => $order_id
            ];
            $url=$baseurl . 'assignOrderToRider';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=showParcelOrders'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=showParcelOrders'</script>";
            }
        }
        
        if($_GET['action']=="deleteVehicleType") 
        {
            $id = $_GET['id'];
            $data = [
                "id" => $id
            ];
                
            $url=$baseurl . 'deleteVehicleType';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=vehicleType'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=vehicleType'</script>";
            }
        }
        if(@$_GET['action'] == "defaultProject" ) 
        {
            $id = $_GET['id'];
            $_SESSION[PRE_FIX.'defaultId'] = $id;
            if($id == 1)
            {
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
            else
            if($id == 2)
            {
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
            else
            if($id == 3)
            {
                echo "<script>window.location='dashboard.php?p=manageTrip'</script>";
            }
            
        }
        if($_GET['action']=="addGoodType") 
        {
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
    
            $data = [
                "name" => $name
            ];
            $url=$baseurl . 'addGoodType';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
        }
        if($_GET['action']=="editGoodType") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
    
            $data = [
                "id" => $id,
                "name" => $name
            ];
            $url=$baseurl . 'addGoodType';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
        }
        if($_GET['action']=="deleteGoodType") 
        {
            $id = $_GET['id'];
            $data = [
                "id" => $id
            ];
                
            $url=$baseurl . 'deleteGoodType';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=goodType'</script>";
            }
        }
        if($_GET['action']=="addSliderImage") 
        {
            $url = htmlspecialchars($_POST['url'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
    
            $data = [
                "image" =>  $image,
                "url" => $url
            ];
            $url=$baseurl . 'addAppSliderImage';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=sliderImage'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=sliderImage'</script>";
            }
        }
        if($_GET['action']=="deleteAppSlider") 
        {
            $id = $_GET['id'];
            $data = [
                "id" => $id
            ];
                
            $url=$baseurl . 'deleteAppSliderImage';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=sliderImage'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=sliderImage'</script>";
            }
        }
        if($_GET['action']=="addRestaurant") 
        {
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $min_order_price = htmlspecialchars($_POST['min_order_price'], ENT_QUOTES);
            $lat = htmlspecialchars($_POST['lat'], ENT_QUOTES);
            $long = htmlspecialchars($_POST['long'], ENT_QUOTES);
            $delivery_fee = htmlspecialchars($_POST['delivery_fee'], ENT_QUOTES);
            $delivery_min_time = htmlspecialchars($_POST['delivery_min_time'], ENT_QUOTES);
            $delivery_max_time = htmlspecialchars($_POST['delivery_max_time'], ENT_QUOTES);
            
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
    
            $data = [
                "name" => $name,
                "min_order_price" => $min_order_price,
                "lat" => $lat,
                "long" => $long,
                "delivery_fee" => $delivery_fee,
                "delivery_min_time" => $delivery_min_time,
                "delivery_max_time" => $delivery_max_time,
                "image" =>  $image,
                "user_id" => $_SESSION[PRE_FIX.'id']
            ];
            $url=$baseurl . 'addRestaurant';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
        }
        
        if($_GET['action']=="editRestaurant") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ($_POST['name'], ENT_QUOTES);
            $lat = htmlspecialchars($_POST['lat'], ENT_QUOTES);
            $long = htmlspecialchars($_POST['long'], ENT_QUOTES);
            $delivery_fee = htmlspecialchars($_POST['delivery_fee'], ENT_QUOTES);
            $delivery_min_time = htmlspecialchars($_POST['delivery_min_time'], ENT_QUOTES);
            $delivery_max_time = htmlspecialchars($_POST['delivery_max_time'], ENT_QUOTES);
            $min_order_price  = htmlspecialchars($_POST['min_order_price'], ENT_QUOTES);
            
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
            $data = [
                "id" => $id,
                "name" => $name,
                "min_order_price" => $min_order_price,
                "lat" => $lat,
                "long" => $long,
                "delivery_fee" => $delivery_fee,
                "delivery_min_time" => $delivery_min_time,
                "delivery_max_time" => $delivery_max_time,
                "image" =>  $image,
                "user_id" => $_SESSION[PRE_FIX.'id']
            ];
            
            
            $url=$baseurl . 'addRestaurant';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
        }
        if($_GET['action']=="addRestaurantTiming") 
        {
            $restaurant_id = htmlspecialchars($_POST['restaurant_id'], ENT_QUOTES);
            for ($i = 0; $i < 7; $i++) 
            {
                $opening_time[$i] = $_POST['opening_time'][$i];
                $closing_time[$i] = $_POST['closing_time'][$i];
                $day[$i] = $_POST['day'][$i];
                $restaurant_timings_details[] = array(
                    'opening_time' => $opening_time[$i], 
                    'closing_time' => $closing_time[$i], 
                    'day' => $day[$i]
                );
            }
            $restaurant_timing = $restaurant_timings_details;
    
            $data = [
                "restaurant_id" => $restaurant_id,
                "restaurant_timing" => $restaurant_timing,
            ];
            $url=$baseurl . 'addRestaurantTiming';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
        }
        if($_GET['action']=="addCoupon") 
        {
            
            $coupon_code = htmlspecialchars($_POST['coupon_code'], ENT_QUOTES);
            $limit_users = htmlspecialchars($_POST['limit_users'], ENT_QUOTES);
            $discount = htmlspecialchars($_POST['discount'], ENT_QUOTES);
            $expiry_date = htmlspecialchars($_POST['expiry_date'], ENT_QUOTES);
            $expiry_date = replacedateformate($expiry_date);
            $data = [
                "coupon_code" => $coupon_code,
                "limit_users" => $limit_users,
                "discount" => $discount,
                "expiry_date" => $expiry_date
            ];
            
                
            $url=$baseurl . 'addCoupon';
            
            $json_data=@curl_request($data,$url);
            
        
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageCoupon'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageCoupon'</script>";
            }
        }
        if($_GET['action']=="editCoupon") 
        {
            $coupon_id = htmlspecialchars($_POST['coupon_id'], ENT_QUOTES);
            $coupon_code = htmlspecialchars($_POST['coupon_code'], ENT_QUOTES);
            $limit_users = htmlspecialchars($_POST['limit_users'], ENT_QUOTES);
            $discount = htmlspecialchars($_POST['discount'], ENT_QUOTES);
            $expiry_date = htmlspecialchars($_POST['expiry_date'], ENT_QUOTES);
            $expiry_date = replacedateformate($expiry_date);
            
            $data = [
                "coupon_code" => $coupon_code,
                "limit_users" => $limit_users,
                "discount" => $discount,
                "expiry_date" => $expiry_date,
                "id" => $coupon_id
            ];
                
            $url=$baseurl . 'addCoupon';
            
            $json_data=@curl_request($data,$url);
            
        
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageCoupon'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageCoupon'</script>";
            }
        }
        if ($_GET['action'] == "addReportReason") 
        {
            $title = htmlspecialchars($_POST['title'], ENT_QUOTES);
            $data = [
                "title" => $title
            ];
            $url = $baseurl . 'addReportReason';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageReportReasons'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageReportReasons'</script>";
            }
        }
        if ($_GET['action'] == "editReportReason") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $title = htmlspecialchars($_POST['title'], ENT_QUOTES);
            $data = [
                "title" => $title,
                "id" => $id
            ];
            $url = $baseurl . 'addReportReason';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageReportReasons'</script>";
            } 
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageReportReasons'</script>";
            }
        }
        if ($_GET['action'] == "deleteReportReason") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $data = [
                "id" => $id
            ];
            $url = $baseurl . 'deleteReportReason';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageReportReasons'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageReportReasons'</script>";
            }
        }
        if($_GET['action']=="privacyPolicy") 
        {
            $text = htmlspecialchars($_POST['text'], ENT_QUOTES);
            
            $data = [
                "name" => "privacy_policy",
                "text" => $text,
            ];
                
            $url=$baseurl . 'addHtmlPage';
            
            $json_data=@curl_request($data,$url);
            
        
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=managePolicies'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=managePolicies'</script>";
            }
        }
        if($_GET['action']=="deleteCoupon") 
        {
            $id = $_GET['id'];
            $data = [
                "coupon_id" => $id
            ];    
            $url=$baseurl . 'deleteCoupon';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {   
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageCoupon'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageCoupon'</script>";
            }
        }
        if($_GET['action']=="addMenu") 
        {
            $restaurant_id = htmlspecialchars($_POST['restaurant_id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image = "";
            }
            $data = [
                "restaurant_id" => $restaurant_id,
                "name" => $name,
                "description" => $description,
                "image" =>  $image
            ];
            $url=$baseurl . 'addMenu';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if($_GET['action']=="editMenu") 
        {
            $id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $restaurant_id = htmlspecialchars($_POST['restaurant_id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
            $data = [
                "id" => $id,
                "restaurant_id" => $restaurant_id,
                "name" => $name,
                "description" => $description,
                "image" =>  $image
            ];
            $url=$baseurl . 'addMenu';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if ($_GET['action'] == "deleteMenu") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $restaurant_id = htmlspecialchars($_GET['restaurant_id'], ENT_QUOTES);
            $data = [
                "id" => $id
            ];
            $url = $baseurl . 'deleteMainMenu';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if(@$_GET['action'] == "defaultProject" ) 
        {
            $id = $_GET['id'];
            $_SESSION[PRE_FIX.'defaultId'] = $id;
            echo "<script>window.location='dashboard.php?p=leads'</script>";
        }
        if(@$_GET['action'] == "logout" ) 
        { 
            @session_destroy();
            echo "<script>window.location='index.php'</script>";
        }
        if($_GET['action']=="mainSearch")
        {
            $text = $_POST['search'];
            $output = '';
            $url = $baseurl . 'search';
            $data = array(
                'keyword' => $text
            );
            $json_data=@curl_request($data,$url);
            $output .= '
                <div class="serach-bar-users-container">
                    <div class="search-user-menu">
                        <div class="search-bar-dropdown-container"> 
                            <p>Store Results</p>
                            <div class="dropdown">
                                <button class="serach-bar-dropdown" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                    Include : everything
                                    <i class="fas fa-angle-down"></i>
                                </button>
                                <div class="dropdown-menu" aria-labelledby="dropdownMenuButton">
                                    <a class="dropdown-item" href="#">everything</a>
                                    <a class="dropdown-item" href="#">only product</a>
                                </div>
                            </div>
                        </div>
                        <ul>
            ';
            if(is_array($json_data['msg']) || is_object($json_data['msg'])) 
            {
                foreach($json_data['msg'] as $singleRow){
                    $output .='
                        <li value="'.$singleRow['Client']['id'].'" onclick="selectKeyword(this)">
                            <span>
                                <i class="fas fa-user"></i>
                            </span>
                            <div class="search-user-text">
                                <h6 class="searchtitle">'.ucwords($singleRow['Client']['name']).'</h6>
                                <p>'.$singleRow['Client']['email'].'</p>
                            </div>
                        </li>    
                    ';
                }
            }
            else{
                $output .='<li>Sorry! No result found</li>';  
            }
            echo $output;
        }
        if($_GET['action']=="addMenuItem")  
        {
            $restaurant_id = $_GET['id'];
            $id = htmlspecialchars($_POST['restaurant_menu_id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            $price = htmlspecialchars($_POST['price'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
            $data = [
                "restaurant_menu_id" => $id,
                "name" => $name,
                "description" => $description,
                "price" => $price,
                "image" =>  $image
            ];
            $url=$baseurl . 'addMenuItem';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if($_GET['action']=="editMenuItem")  
        {
            $restaurant_id = $_GET['id'];
            $restaurant_menu_id = htmlspecialchars($_POST['restaurant_menu_id'], ENT_QUOTES);
            $menuid = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $description = htmlspecialchars($_POST['description'], ENT_QUOTES);
            $price = htmlspecialchars($_POST['price'], ENT_QUOTES);
            $outofstock = htmlspecialchars($_POST['outofstock'], ENT_QUOTES);
            if(file_exists($_FILES['image']['tmp_name']) || is_uploaded_file($_FILES['image']['tmp_name']))
            {
                $imagedata = file_get_contents($_FILES['image']['tmp_name']);
                $image = base64_encode($imagedata);
            }
            else
            {
                $image ="";
            }
            $data = [
                "restaurant_menu_id" => $restaurant_menu_id,
                "id" => $menuid,
                "name" => $name,
                "description" => $description,
                "price" => $price,
                "image" =>  $image,
                "outofstock" => $outofstock
            ];
            
            $url=$baseurl . 'addMenuItem';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if ($_GET['action'] == "deleteMenuItem") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $restaurant_id = htmlspecialchars($_GET['restaurant_id'], ENT_QUOTES);
            $data = [
                "id" => $id
            ];
            $url = $baseurl . 'deleteMenuItem';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];   
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if($_GET['action']=="addMenuExtraSection") 
        {
            $restaurant_id = $_GET['id'];
            $restaurant_menu_item_id = htmlspecialchars($_POST['restaurant_menu_item_id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $required = htmlspecialchars($_POST['required'], ENT_QUOTES);
            $data = [
                "restaurant_menu_item_id" => $restaurant_menu_item_id,
                "name" => $name,
                "required" => $required,
                "user_id" =>  $_SESSION[PRE_FIX.'id']
            ];
            $url=$baseurl . 'addMenuExtraSection';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if($_GET['action']=="editMenuExtraSection") 
        {
            $restaurant_id = $_GET['id'];
            $restaurant_menu_item_id = htmlspecialchars($_POST['restaurant_menu_item_id'], ENT_QUOTES);
            $section_id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $required = htmlspecialchars($_POST['required'], ENT_QUOTES);
            $data = [
                "id" => $section_id,
                "restaurant_menu_item_id" => $restaurant_menu_item_id,
                "name" => $name,
                "required" => $required,
                "user_id" =>  $_SESSION[PRE_FIX.'id']
            ];
            $url=$baseurl . 'addMenuExtraSection';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if ($_GET['action'] == "deleteMenuExtraSection") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $restaurant_id = htmlspecialchars($_GET['restaurant_id'], ENT_QUOTES);
            $data = [
                "id" => $id
            ];
            $url = $baseurl . 'deleteMenuExtraSection';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if($_GET['action']=="addMenuExtraItem") 
        {
            $restaurant_id = $_GET['id'];
            $restaurant_menu_extra_section_id = htmlspecialchars($_POST['restaurant_menu_extra_section_id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $price = htmlspecialchars($_POST['price'], ENT_QUOTES);
            $data = [
                "restaurant_menu_extra_section_id" => $restaurant_menu_extra_section_id,
                "name" => $name,
                "price" => $price
            ];
            $url=$baseurl . 'addMenuExtraItem';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if($_GET['action']=="editMenuExtraItem") 
        {
            $restaurant_id = $_GET['id'];
            $restaurant_menu_extra_section_id = htmlspecialchars($_POST['restaurant_menu_extra_section_id'], ENT_QUOTES);
            $extra_item_id = htmlspecialchars($_POST['id'], ENT_QUOTES);
            $name = htmlspecialchars($_POST['name'], ENT_QUOTES);
            $price = htmlspecialchars($_POST['price'], ENT_QUOTES);
            $data = [
                "id" => $extra_item_id,
                "extra_item_id" => $extra_item_id,
                "restaurant_menu_extra_section_id" => $restaurant_menu_extra_section_id,
                "name" => $name,
                "price" => $price
            ];
            $url=$baseurl . 'addMenuExtraItem';
            $json_data=@curl_request($data,$url);
            if($json_data['code'] == "200")
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            }
            else
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        if ($_GET['action'] == "deleteMenuExtraItem") 
        {
            $id = htmlspecialchars($_GET['id'], ENT_QUOTES);
            $restaurant_id = htmlspecialchars($_GET['restaurant_id'], ENT_QUOTES);
            $data = [
                "id" => $id
            ];
            $url = $baseurl . 'deleteMenuExtraItem';
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=success'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurantManageMenu&id=".$restaurant_id."&action=error'</script>";
            }
        }
        
        
        if ($_GET['action'] == "addRestaurantCategory") 
        {
            $categoryId = $_POST['categoryId'];
            $restaurant_id = htmlspecialchars($_POST['restaurant_id'], ENT_QUOTES);
            
            $categoryIdArray=array();
            foreach ($categoryId as $key => $value) 
            {   
                $categoryIdArray[]= array(
                    "food_category_id" => $value
                );
            }
            
            $data = [
                "restaurant_id" => $restaurant_id,
                "food_category_ids" => $categoryIdArray
            ];
            
            $url = $baseurl . 'assignFoodCategoryToRestaurant';
            
            
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=restaurants'</script>";
            }
            
        }
        
        
        if ($_GET['action'] == "editServiceFee") 
        {
            $id = $_POST['id'];
            $Commission = htmlspecialchars($_POST['Commission'], ENT_QUOTES);
            $feeType = htmlspecialchars($_POST['feeType'], ENT_QUOTES);
            
            $data = [
                "id" => $id,
                "value" => $Commission,
                "type" => $feeType
            ];
            
            $url = $baseurl . 'addServiceCharge';
            
            
            $json_data = @curl_request($data, $url);
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'success'] = $json_data['code'];
                echo "<script>window.location='dashboard.php?p=manageServiceFee'</script>";
            } 
            else 
            {
                $_SESSION[PRE_FIX.'error'] = $json_data['msg'];
                echo "<script>window.location='dashboard.php?p=manageServiceFee'</script>";
            }
            
        }
        
        
    }
}
else
{
    if (isset($_GET['action']))
    {
        if(@$_GET['action'] == "login" ) 
        {
            $email = htmlspecialchars($_POST['email'], ENT_QUOTES);
            $password = htmlspecialchars($_POST['password'], ENT_QUOTES);
            $data = [
                "email" => $email,
                "password" => $password
            ];
            
            $url = $baseurl . 'loginVendor';
            $json_data = @curl_request($data, $url);
            $data = $json_data['msg'];
            
            
            if ($json_data['code'] == "200") 
            {
                $_SESSION[PRE_FIX.'id'] = $data['User']['id'];
                $_SESSION[PRE_FIX.'first_name'] = $data['User']['first_name'];
                $_SESSION[PRE_FIX.'last_name'] = $data['User']['last_name'];
                $_SESSION[PRE_FIX.'role'] = $data['User']['role'];
                $_SESSION[PRE_FIX.'User'] = $email;
                
                $_SESSION[PRE_FIX.'countryId'] = $data['Country']['id'];
                $_SESSION[PRE_FIX.'currency_symbol'] = $data['Country']['currency_symbol'];
                
                echo "<script>window.location='dashboard.php?p=users'</script>";
            } 
            else 
            {
                echo "<script>window.location='./'</script>";
            }
        }
    }
}
?>