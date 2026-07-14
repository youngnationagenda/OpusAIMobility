<?php

App::uses('Lib', 'Utility');
App::uses('Firebase', 'Lib');
App::uses('Postmark', 'Utility');
App::uses('Message', 'Utility');
App::uses('Variables', 'Utility');
App::uses('PushNotification', 'Utility');
App::uses('CustomEmail', 'Utility');




class ConfigController extends AppController
{

    //public $components = array('Email');

   // public $autoRender = false;
    public $layout = false;






   /* public function beforeFilter()
    {



        $headers = array();
        foreach ($_SERVER as $key => $value) {
            if (strpos($key, 'HTTP_') === 0) {
                $headers[str_replace(' ', '', ucwords(str_replace('_', ' ', strtolower(substr($key, 5)))))] = $value;
            }
        }
        pr($headers);

    }*/


    public function config(){


        $this->autoRender = true;
    }


}
?>