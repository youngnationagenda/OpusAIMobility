<?php



class Order extends AppModel
{
    public $useTable = 'order';



    public $belongsTo = array(

        /*'PaymentMethod' => array(
            'className' => 'PaymentMethod',
            'foreignKey' => 'payment_method_id',


        ),*/

        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',


        ),

        'UserPlace' => array(
            'className' => 'UserPlace',
            'foreignKey' => 'user_place_id',


        ),


        'Store' => array(
            'className' => 'Store',
            'foreignKey' => 'store_id',


        ),


    );
    public $hasMany = array(
        'OrderStoreProduct' => array(
            'className' => 'OrderStoreProduct',
            'foreignKey' => 'order_id',



        ),
    );

    public $hasOne = array(
        'CouponUsed' => array(
            'className' => 'CouponUsed',
            'foreignKey' => 'order_id',



        ),


    );


    public function getDetails($id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('first',array(

            'contain' => array('User','UserPlace','CouponUsed'),
            'conditions' => array(

                'Order.id' => $id

            )

));



    }



    public function getOrdersAccordingToStatus($status)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('User','DeliveryAddress','OrderStoreProduct','CouponUsed','Store.StoreLocation.Country','Store.User'),
            'conditions' => array(

                'Order.status' => $status

            )

        ));



    }





    public function getCountStoreUserOrdersAccordingToStatus($status,$user_id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('count',array(

           // 'contain' => array('User','DeliveryAddress','OrderStoreProduct','CouponUsed','Store.StoreLocation.Country'),
            'conditions' => array(

                'Order.status' => $status,
                'Order.store_user_id' => $user_id


            )

        ));



    }

    public function getStoreUserOrdersAccordingToStatus($status,$user_id,$starting_id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('User','DeliveryAddress','OrderStoreProduct','CouponUsed','Store.StoreLocation.Country','Store.User'),
            'conditions' => array(

                'Order.status' => $status,
                'Order.store_user_id' => $user_id

            ),

            'limit' => 10,
            'offset' => $starting_id*10,
            'order' => 'Order.id DESC',

        ));



    }

    public function getStoreOrdersAccordingToStatus($status,$store_id,$starting_id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('User','DeliveryAddress','OrderStoreProduct','CouponUsed','Store.StoreLocation.Country','Store.User'),
            'conditions' => array(

                'Order.status' => $status,
                'Order.store_id' => $store_id

            ),
            'limit' => 10,
            'offset' => $starting_id*10,

        ));



    }

    public function getStoreOrdersAccordingToStatusStorePortal($status,$store_id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('User','DeliveryAddress','OrderStoreProduct','CouponUsed','Store.StoreLocation.Country','Store.User'),
            'conditions' => array(

                'Order.status' => $status,
                'Order.store_id' => $store_id

            ),


        ));



    }
    public function getUserOrders($user_id,$status)
    {


        return $this->find('all', array(
            'conditions' => array(

                'Order.user_id' =>  $user_id,
                'Order.status' =>  $status,

            )

        ));



    }





}