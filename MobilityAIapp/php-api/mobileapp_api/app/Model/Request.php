<?php


class Request extends AppModel
{
    public $useTable = 'request';


    public $belongsTo = array(
        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',


        ),

        'Vehicle' => array(
            'className' => 'Vehicle',
            'foreignKey' => 'vehicle_id',


        ),

        'Driver' => array(
            'className' => 'User',
            'foreignKey' => 'driver_id',


        ),

        'Coupon' => array(
            'className' => 'Coupon',
            'foreignKey' => 'coupon_id',


        )

        );

    public $hasOne = array(
        'Trip' => array(
            'className' => 'Trip',
            'foreignKey' => 'request_id',


        ),
    );



    public function getDetails($id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array('Request.id' => $id),
            'contain' => array('User','Vehicle.RideType.RideSection','Driver','Coupon','Trip.TripPayment'),
        ));

    }

    public function deleteAllRequests()
    {

        return $this->deleteAll(array('Request.id >' => 0), false);

    }

    public function getAll()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'contain' => array('User','Vehicle','Driver','Vehicle.RideType.RideSection'),
            'order'=>'Request.id DESC'


        ));

    }
    public function getDetailsAgainstStatus($status)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array('Request.request' => $status),
            'contain' => array('User','Vehicle','Driver'),
            'order'=>'Request.id DESC'


        ));

    }

    public function getRequestDetail($vehicle_id,$user_id)
    {

        return $this->find('first', array(
            'conditions' => array(
                'Request.vehicle_id' => $vehicle_id,
                'Request.user_id' => $user_id,
                'Request.request' => 0,
                'Request.driver_ride_response' =>0,
                'Request.user_ride_response' =>0


            )
        ));

    }


    public function getActiveRequest($user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(
                "OR" => array (
                    "Request.user_id" => $user_id,
                    "Request.driver_id" => $user_id,

                ),

                "AND" => array (
                    'Request.request' => array(0, 1),
                    "Request.driver_id >" => 0,
                    'Request.driver_ride_response' =>0,
                    'Request.user_ride_response' =>0,
                    'Request.collect_payment' =>0


                ),






            ),
            'contain' => array('User','Vehicle.RideType','Driver'),
        ));

    }

    public function getScheduleTrips($user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(
                "OR" => array (
                    "Request.user_id" => $user_id,
                    "Request.driver_id" => $user_id,

                ),

                "AND" => array (
                    'Request.request' => array(0, 1),
                    'Request.driver_ride_response' =>0,
                    'Request.user_ride_response' =>0,
                    'Request.collect_payment' =>0,
                    'Request.schedule' =>1,


                ),






            ),
            'contain' => array('User','Vehicle.RideType','Driver'),
        ));

    }




    public function checkDuplicate($data)
    {

        return $this->find('first', array(
            'conditions' => array(
                'Request.vehicle_id' => $data['vehicle_id'],
                'Request.user_id' => $data['user_id'],




            )
        ));

    }


    public function getTotalRequests()
    {

        return $this->find('count', array(
            'conditions' => array('not exists '.
                '(SELECT * FROM trip as Trip WHERE Request.id = Trip.request_id)',



            )
        ));

    }

    public function getTotalOrderPrice()
    {

        return $this->find('first', array(
            'conditions' => array('not exists '.
                '(SELECT * FROM trip as Trip WHERE Request.id = Trip.request_id)',



            ),
            'fields' => array('SUM(Request.estimated_fare) as total_sales')


        ));

    }
    public function getRequestWhichHasNotCancelledByAnyOne($request_id)
    {

        return $this->find('first', array(
            'conditions' => array(
                'Request.id' => $request_id,
                  'Request.user_ride_response' => 0,
                 'Request.driver_ride_response' => 0,


            )
        ));

    }


    public function getActiveTripDetail($request_id)
    {

        return $this->find('first', array(
            'conditions' => array(
                'Request.id' => $request_id,
                'Request.user_ride_response' => 0,
                'Request.driver_ride_response' => 0,
                'Request.end_ride' => 0,
                //'Request.on_the_way' => 1,


            )
        ));

    }







    public function getSettings($type)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.type' => $type


            )
        ));

    }

    public function getSettingsAgainstCategoryAndType($category,$type)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.category' => $category,
                'Setting.type LIKE' => $type.'%',


            )
        ));

    }

    public function getSettingsAgainstCategory($category)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.category' => $category


            )
        ));

    }

   








}

?>