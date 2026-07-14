<?php


class ParcelOrder extends AppModel
{
    public $useTable = 'parcel_order';


    public $belongsTo = array(

        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',

        ),
        'RideType' => array(
            'className' => 'RideType',
            'foreignKey' => 'ride_type_id',

        ),

        'GoodType' => array(
            'className' => 'GoodType',
            'foreignKey' => 'good_type_id',

        ),

        'PackageSize' => array(
            'className' => 'PackageSize',
            'foreignKey' => 'package_size_id',

        ),

        'PaymentCard' => array(
            'className' => 'PaymentCard',
            'foreignKey' => 'payment_card_id',

        ),


    );
   public $hasMany = array(

        'ParcelOrderMultiStop' => array(
            'className' => 'ParcelOrderMultiStop',
            'foreignKey' => 'parcel_order_id',

        ),
    );



    public function getDetails($id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array('ParcelOrder.id' => $id),
            'contain'=>array('User','RideType','ParcelOrderMultiStop.GoodType','ParcelOrderMultiStop.PackageSize')
        ));

    }


    public function getUserOrders($user_id,$starting_point=null)
    {
        $this->Behaviors->attach('Containable');

        return $this->find('all', array(
            'conditions' => array('ParcelOrder.user_id' => $user_id),
            'limit' => 10,
            'offset' => $starting_point*10,
            'contain'=>array('ParcelOrderMultiStop.GoodType','ParcelOrderMultiStop.PackageSize','User','RideType','GoodType','PackageSize','PaymentCard'),
            'order' => 'ParcelOrder.id DESC'
        ));

    }


    public function getUserOrdersAccordingToStatus($user_id,$status,$starting_point)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(
                'Order.user_id' => $user_id,
                'Order.status' => $status,

            ),
            'limit' => 10,
            'offset' => $starting_point*10,
            'contain'=>array('User','DeliveryType','GoodType','PackageSize','OrderNotification' => array('conditions' => array(
                'OrderNotification.receiver_id' => $user_id,
                'OrderNotification.read' => 0,
            ),

            ), ),
            'order' => 'Order.id DESC'
        ));

    }

    public function getOrdersAccordingToStatus($status)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array('ParcelOrder.status' => $status),
            'contain'=>array('User','RideType','GoodType','PackageSize'),
            'order' => 'ParcelOrder.id DESC'
        ));

    }

    public function getTotalOrderPrice()
    {

        $this->Behaviors->attach('Containable');
        return $this->find('first',array(

            'fields' => array('SUM(ParcelOrder.price) as total_sales')
        ));



    }
    public function getOrdersCountAccordingToStatus($status)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('count',array(


            'conditions' => array(

                'ParcelOrder.status' => $status,


            ),
        ));



    }


    public function getAllOrders()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
           // 'conditions' => array('Order.status' => $status),
            'contain'=>array('User','RideType','GoodType','PackageSize'),
            'order' => 'ParcelOrder.id DESC'
        ));

    }

    public function getAllOrdersCount()
    {


        return $this->find('count');



    }




    public function getAll()
    {
        $this->Behaviors->attach('Containable');

        return $this->find('all', array(
            'order' => 'Order.id DESC',
            'contain'=>array('User','DeliveryType','GoodType','RiderOrder' => array('conditions' => array(
                'RiderOrder.rider_response !=' => 2
            ),

            ), 'RiderOrder.Rider')));

    }





}

?>