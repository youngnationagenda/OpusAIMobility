<?php

App::uses('Lib', 'Utility');

class RiderOrder extends AppModel
{

    public $useTable = 'rider_order';

    public $belongsTo = array(
        'Rider' => array(
            'className' => 'User',
            'foreignKey' => 'rider_user_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),

        'FoodOrder' => array(
            'className' => 'FoodOrder',
            'foreignKey' => 'food_order_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),

        'ParcelOrder' => array(
            'className' => 'ParcelOrder',
            'foreignKey' => 'parcel_order_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),



    );

    public $hasMany = array(
        'RiderOrderMultiStop' => array(
            'className' => 'RiderOrderMultiStop',
            'foreignKey' => 'rider_order_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );

    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.id' => $id,



            )
        ));
    }

    public function ifFoodOrderHasAlreadyBeenAssigned($order_id)
    {
        $this->Behaviors->attach('Containable');


        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.food_order_id' => $order_id,




            ),
            'order' => 'RiderOrder.id DESC',

        ));
    }

    public function ifParcelOrderHasAlreadyBeenAssigned($order_id)
    {
        $this->Behaviors->attach('Containable');


        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.parcel_order_id' => $order_id,




            ),
            'order' => 'RiderOrder.id DESC',

        ));
    }

    public function getFoodLogAgainstOrderID($order_id)
    {
        $this->Behaviors->attach('Containable');


        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.food_order_id' => $order_id,




            ),
            'contain'=>array('Rider'),
            'order' => 'RiderOrder.id DESC',

        ));
    }

    public function getParcelLogAgainstOrderID($order_id)
    {
        $this->Behaviors->attach('Containable');


        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.parcel_order_id' => $order_id,




            ),
            'contain'=>array('Rider'),
            'order' => 'RiderOrder.id DESC',

        ));
    }


    public function getRiderFoodOrderAgainstOrderID($order_id)
    {
        $this->Behaviors->attach('Containable');


        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.food_order_id' => $order_id,
                'RiderOrder.rider_response !=' => 2,



            ),
            'contain'=>array('FoodOrder.User','FoodOrder.Restaurant','FoodOrder.UserPlace','FoodOrder.PaymentCard','FoodOrder.FoodOrderMenuItem.FoodOrderMenuExtraItem','Rider'),
           // 'order' => ' .id DESC',

        ));
    }

    public function getRiderParcelOrderAgainstOrderID($order_id)
    {
        $this->Behaviors->attach('Containable');


        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.parcel_order_id' => $order_id,
                'RiderOrder.rider_response !=' => 2,



            ),
            'contain'=>array('RiderOrderMultiStop','ParcelOrder.User','ParcelOrder.PaymentCard','ParcelOrder.PackageSize','Rider'),


        ));
    }

    public function isEmptyOnTheWayToPickeupTime($order_id)
    {
        return $this->find('count', array(
            'conditions' => array(


                'RiderOrder.order_id'=> $order_id,
                'RiderOrder.on_the_way_to_pickup'=> "0000-00-00 00:00:00"

            )
        ));
    }
    public function isEmptyPickUpTime($order_id)
    {
        return $this->find('count', array(
            'conditions' => array(


                'RiderTrackOrder.order_id'=> $order_id,
                array('not' => array(
                    'RiderTrackOrder.pickup_time'=> "0000-00-00 00:00:00"

                ))
            )
        ));
    }

    public function isEmptyOnMyWayToUserTime($order_id)
    {
        return $this->find('count', array(
            'conditions' => array(


                'RiderTrackOrder.order_id'=> $order_id,
                array('not' => array(
                    'RiderTrackOrder.on_my_way_to_user_time'=> "0000-00-00 00:00:00"

                ))
            )
        ));
    }
    public function isEmptyDeliveryTime($order_id)
    {
        return $this->find('count', array(
            'conditions' => array(


                'RiderTrackOrder.order_id'=> $order_id,
                array('not' => array(
                    'RiderTrackOrder.delivery_time'=> "0000-00-00 00:00:00"

                ))
            )
        ));
    }


    public function getCompletedParcelOrders($rider_user_id,$starting_point = null)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.parcel_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),
            'contain'=>array('FoodOrder.User','FoodOrder.Restaurant','FoodOrder.UserPlace','ParcelOrder.User','Rider','ParcelOrder.ParcelOrderMultiStop'),

            // 'contain'=>array('Order.User','Order.DeliveryAddress','Order.Store.StoreLocation','Rider'),
            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => 'RiderOrder.id DESC',
        ));
    }

    public function getCompletedFoodOrders($rider_user_id,$starting_point = null)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.food_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),
            'contain'=>array('FoodOrder.User','FoodOrder.Restaurant','FoodOrder.UserPlace','ParcelOrder.User','Rider'),

            // 'contain'=>array('Order.User','Order.DeliveryAddress','Order.Store.StoreLocation','Rider'),
            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => 'RiderOrder.id DESC',
        ));
    }

    public function getCompletedFoodOrdersCount($rider_user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('count', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.food_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),

        ));
    }
    public function getCompletedFoodOrdersPriceSUM($rider_user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.food_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),

            'fields'=>array('SUM(FoodOrder.price) as total_amount')

        ));
    }

    public function getCompletedParcelOrdersCount($rider_user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('count', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.parcel_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),

        ));
    }

    public function getCompletedParcelOrdersPriceSum($rider_user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.parcel_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),

            'fields'=>array('SUM(ParcelOrder.price) as total_amount')

        ));
    }


    public function getCompletedOrders($rider_user_id,$starting_point = null)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
               // 'RiderOrder.food_order_id >' => 0,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            ),
            'contain'=>array('ParcelOrder.ParcelOrderMultiStop.GoodType','ParcelOrder.ParcelOrderMultiStop.PackageSize','FoodOrder.User','FoodOrder.Restaurant','FoodOrder.UserPlace','ParcelOrder.User','Rider'),

            // 'contain'=>array('Order.User','Order.DeliveryAddress','Order.Store.StoreLocation','Rider'),
            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => 'RiderOrder.id DESC',
        ));
    }

    public function getCountCompletedOrders($rider_user_id)
    {
        return $this->find('count', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                'RiderOrder.delivered >' => "0000-00-00 00:00:00",



            )
        ));
    }

    public function getPendingOrders($rider_user_id,$starting_point = null)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 0,




            ),
            'contain'=>array('ParcelOrder.ParcelOrderMultiStop.GoodType','ParcelOrder.ParcelOrderMultiStop.PackageSize','FoodOrder.User','FoodOrder.Restaurant','FoodOrder.UserPlace','ParcelOrder.User','Rider'),

            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => 'RiderOrder.id DESC',
        ));
    }

    public function getActiveOrders($rider_user_id,$starting_point = null)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.rider_response' => 1,
                //'FoodOrder.status' => 1,
                'RiderOrder.delivered' => "0000-00-00 00:00:00",
                //'RiderOrder.on_the_way_to_pickup >' => "0000-00-00 00:00:00",




            ),
            'contain'=>array('ParcelOrder.ParcelOrderMultiStop.GoodType','ParcelOrder.ParcelOrderMultiStop.PackageSize','FoodOrder.User','FoodOrder.Restaurant','FoodOrder.UserPlace','ParcelOrder.User','Rider'),
            // 'contain'=>array('FoodOrder.User','FoodOrder.DeliveryAddress','Order.Store.StoreLocation','Rider'),
            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => 'RiderOrder.id DESC',
        ));
    }
    public function isDuplicateRecordParcel($rider_user_id, $order_id)
    {
        return $this->find('count', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.parcel_order_id' => $order_id


            )
        ));
    }

    public function isDuplicateRecordFoodOrParcel($rider_user_id, $order_id,$type)
    {
        if($type == "parcel") {

            return $this->find('count', array(
                'conditions' => array(

                    'RiderOrder.rider_user_id' => $rider_user_id,
                    'RiderOrder.parcel_order_id' => $order_id


                )
            ));

        }else{

            return $this->find('count', array(
                'conditions' => array(

                    'RiderOrder.rider_user_id' => $rider_user_id,
                    'RiderOrder.parcel_order_id' => $order_id
                )));

        }
    }

    public function isDuplicateRecordFood($rider_user_id, $order_id)
    {
        return $this->find('count', array(
            'conditions' => array(

                'RiderOrder.rider_user_id' => $rider_user_id,
                'RiderOrder.food_order_id' => $order_id


            )
        ));
    }








}


?>