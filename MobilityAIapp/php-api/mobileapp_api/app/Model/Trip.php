<?php


class Trip extends AppModel
{
    public $useTable = 'trip';

    public $belongsTo = array(
        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
        'Driver' => array(
            'className' => 'User',
            'foreignKey' => 'driver_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
        'Request' => array(
            'className' => 'Request',
            'foreignKey' => 'request_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),

        'Vehicle' => array(
            'className' => 'Vehicle',
            'foreignKey' => 'vehicle_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );

    public $hasOne = array(
        'TripPayment' => array(
            'className' => 'TripPayment',
            'foreignKey' => 'trip_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ));
    public $hasMany = array(
        'TripHistory' => array(
            'className' => 'TripHistory',
            'foreignKey' => 'trip_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),

        'DriverRating' => array(
            'className' => 'DriverRating',
            'foreignKey' => 'trip_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
        'UserRating' => array(
            'className' => 'UserRating',
            'foreignKey' => 'trip_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),

    );



    public function getDetails($id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array('Trip.id' => $id),
            'contain' => array('TripPayment','User','Request','Driver','Vehicle.RideType.RideSection','TripHistory')

        ));

    }
    public function getTotalOrderPrice()
    {

        $this->Behaviors->attach('Containable');
        return $this->find('first',array(

            'fields' => array('SUM(Trip.ride_fare) as total_sales')
        ));



    }



    public function getAllOrdersCount()
    {

        $this->Behaviors->attach('Containable');
        return $this->find('count');



    }
    public function checkIfUserHasBeenAlreadyAssignedToTheDriverAndifDriverHasRejected($user_id,$driver_id)
    {

        return $this->find('count', array(
            'conditions' => array(
                'Trip.user_id' => $user_id,
                'Trip.driver_id' => $driver_id,
                'Trip.cancelled_by_rider' => 1,
                'Trip.completed'=>1
            )
        ));

    }


    public function getUserCompletedTrips($user_id,$starting_point)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(
                'Trip.user_id' => $user_id,
                'Trip.completed'=>array(1,2)
            ),

            'contain' => array('TripPayment','User','Request','Driver','Vehicle.RideType','DriverRating','UserRating','TripHistory'=> array(

                'order' => 'TripHistory.id DESC')),
            'limit'=>10,
            'offset' => $starting_point*10,
            'order' => 'Trip.id DESC'


        ));

    }

    public function getUserActiveTripDetail($user_id)
    {

        return $this->find('first', array(
            'conditions' => array(

                'OR' => array(
                    array('Trip.user_id' => $user_id),
                    array('Trip.driver_id' => $user_id),
                ),
                
                'Trip.completed'=>0
            )
        ));

    }

    public function getAll()
    {

        return $this->find('all');

    }


    public function getDriverCompletedTrips($driver_id,$starting_point)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(
                'Trip.driver_id' => $driver_id,
                'Trip.completed > '=> 0
            ),

            'contain' => array('TripPayment','User','Request','Driver','Vehicle','Vehicle.RideType','DriverRating','UserRating','TripHistory'=> array(

                'order' => 'TripHistory.id DESC')),
            'limit'=>10,
            'offset' => $starting_point*10,
            'order' => 'Trip.id DESC'


        ));

    }

    public function getTotalDriverCompletedTrips($driver_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('count', array(
            'conditions' => array(
                'Trip.driver_id' => $driver_id,
                'Trip.completed > '=> 0
            ),



        ));

    }

    public function getTotalDriverCompletedTripsSumPrice($driver_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('count', array(
            'conditions' => array(
                'Trip.driver_id' => $driver_id,
                'Trip.completed > '=> 0
            ),

            'fields'=>array('SUM(Trip.ride_fare) as total_amount')



        ));

    }

    public function getUserCompletedTripsWithoutLimit($user_id,$type)
    {
        $this->Behaviors->attach('Containable');

        if($type == "customer") {
            return $this->find('all', array(
                'conditions' => array(
                    'Trip.user_id' => $user_id,
                    'Trip.completed' => array(1, 2)
                ),

                'contain' => array('User','Request','Driver','Vehicle.RideType','UserRating','TripHistory'),


            ));

        }else{

            return $this->find('all', array(
                'conditions' => array(
                    'Trip.driver_id' => $user_id,
                    'Trip.completed > '=> 0
                ),

                'contain' => array('User', 'Request', 'Driver','Vehicle.RideType', 'UserRating', 'TripHistory'),


            ));


        }

    }
    public function getTripAgainstRequest($request_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(
                'Trip.request_id' => $request_id
            ),
            'contain' => array('User','Driver','Request','DriverRating','Vehicle.RideType'),
        ));

    }







}

?>