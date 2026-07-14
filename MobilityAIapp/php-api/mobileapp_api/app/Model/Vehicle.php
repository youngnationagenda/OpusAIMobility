<?php


class Vehicle extends AppModel
{
    public $useTable = 'vehicle';

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

        'RideType' => array(
            'className' => 'RideType',
            'foreignKey' => 'ride_type_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );


    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('Vehicle.id' => $id)
        ));

    }
    public function getUserVehicle($user_id)
    {
        $this->Behaviors->attach('Containable');

        return $this->find('first', array(
            'conditions' => array('Vehicle.user_id' => $user_id),
            'contain'=>array('User','RideType'),
        ));

    }

    public function ifVehicleExist($user_id,$driver_id)
    {
        $this->Behaviors->attach('Containable');

        return $this->find('first', array(
            'conditions' => array(
                'Vehicle.user_id' => $user_id,
                'Vehicle.driver_id' => $driver_id,
            ),
            'contain'=>array('User','RideType'),
        ));

    }

    public function getDriverVehicle($user_id)
    {
        $this->Behaviors->attach('Containable');

        return $this->find('first', array(
            'conditions' => array('Vehicle.driver_id' => $user_id),
            'contain'=>array('User','RideType'),
        ));

    }

    public function getTotalOnlineOfflineVehicles($online)
    {


        return $this->find('count', array(
            'conditions' => array('Vehicle.online' => $online),

        ));

    }


    public function getNearestVehicle($lat,$long,$ride_type_id,$distance,$user_id)

    {


        $this->Behaviors->attach('Containable');
        return $this->find('all', array(



            'conditions' => array(//'not exists '.

                    //'(SELECT id FROM request as Request WHERE Vehicle.id = Request.vehicle_id AND Request.user_id = '.$user_id.' AND Request.status = 0)',
                    //'(SELECT id FROM request as Request WHERE Vehicle.id = Request.vehicle_id  AND Request.status = 0)',
                'Vehicle.online'=> 1,
                'Vehicle.available'=> 1,
                'Vehicle.ride_type_id'=> $ride_type_id

            ),

            //'contain'=>array('User'),
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( Vehicle.lat ) )
                    * COS( RADIANS(Vehicle.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(Vehicle.lat)))) AS distance','Vehicle.*','User.*','Driver.*'),
            'group' => array(
                'distance HAVING distance <'.$distance
            ),
            'order' => 'distance ASC',


            'recursive' => 0

        ));


    }


    public function getNearByDriversWhoHasNotRejectedTheOrder($lat,$long,$distance)

    {


        $this->Behaviors->attach('Containable');
        return $this->find('first', array(



            'conditions' => array('not exists '.

                '(SELECT * FROM rider_order as RiderOrder WHERE Vehicle.driver_id = RiderOrder.rider_user_id AND RiderOrder.rider_response = 0)',
                //'(SELECT id FROM request as Request WHERE Vehicle.id = Request.vehicle_id  AND Request.status = 0)',
                'Vehicle.online'=> 1,
                'Vehicle.available'=> 1,


            ),

            //'contain'=>array('User'),
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( Vehicle.lat ) )
                    * COS( RADIANS(Vehicle.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(Vehicle.lat)))) AS distance','Vehicle.*','User.*','Driver.*'),
            'group' => array(
                'distance HAVING distance <'.$distance
            ),
            'order' => 'distance ASC',


            'recursive' => 0

        ));


    }






    public function getAll()
    {

        return $this->find('all');

    }





}

?>