<?php 
@session_start();

@ini_set('session.gc_maxlifetime',12*60*60);
@ini_set('session.cookie_lifetime',12*60*60);
error_reporting(0);
ini_set('display_errors', 0);
date_default_timezone_set('Africa/Nairobi');
define('PRE_FIX' , "aimobilityRestaurant_");

// ─── Live AWS API Configuration ──────────────────────────────────────────────
$baseurl = "https://pg4ulam66a.execute-api.us-east-1.amazonaws.com/prod/";
define('API_KEY', 'terraai-mobility-key-2024');

// dont change any thing here
$imagebaseurl = $baseurl;
$baseurl = $baseurl . "api/";

if(isset($_GET['p']))
{
    $pageTitle = ucWords($_GET['p']);
}

function curl_request($data, $url)
{
    $headers = [
        "Accept: application/json",
        "Content-Type: application/json",
        "api-key: " . API_KEY
    ];
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    $return     = curl_exec($ch);
    $json_data  = json_decode($return, true);
    $curl_error = curl_error($ch);
    curl_close($ch);
    return $json_data;
}

function replacedateformate($date){
    $newDate = date("Y-m-d");
    return $newDate;
}

function checkImageExist($external_link)
{
    if (!empty($external_link) && filter_var($external_link, FILTER_VALIDATE_URL)) {
        return $external_link;
    } else {
        return "assets/img/noProfile.png";
    }
}
?>
