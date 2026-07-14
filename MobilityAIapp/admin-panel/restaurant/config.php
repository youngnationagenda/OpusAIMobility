<?php 
@session_start();

@ini_set('session.gc_maxlifetime',12*60*60);
@ini_set('session.cookie_lifetime',12*60*60);
error_reporting(E_ALL);
ini_set('display_errors', 1);
date_default_timezone_set('Asia/Karachi');
define('PRE_FIX' , "gograbRestaurant_");


//API host link api url should be  https://domain.com/  OR http://domain.com/ other wise it will be your configration error
$baseurl = "";
define('API_KEY', '');

//dont change any thing here
$imagebaseurl= $baseurl;
$baseurl = $baseurl."admin/";


if(isset($_GET['p']))
{
    $pageTitle = ucWords($_GET['p']);
}

function curl_request($data,$url)
{
    $headers = [
        "Accept: application/json",
        "Content-Type: application/json",
        "api-key: ".API_KEY." "
    ];
    $data = $data;
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $return = curl_exec($ch);
    $json_data = json_decode($return, true);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);   
    return $json_data;
}
function replacedateformate($date){
    $newDate = date("Y-m-d");
    return $newDate;
}
function checkImageExist($external_link)
{
    if (@getimagesize($external_link)) 
    {
        return $external_link;
    } 
    else 
    {
        return "assets/img/noProfile.png";
    }
}
?>
