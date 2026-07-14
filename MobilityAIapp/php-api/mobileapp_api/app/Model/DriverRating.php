<?php


class DriverRating extends AppModel
{
    public $useTable = 'driver_rating';

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

        'Trip' => array(
            'className' => 'Trip',
            'foreignKey' => 'trip_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );

    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('DriverRating.id' => $id)
        ));

    }

    public function ifRatingExist($trip_id)
    {

        return $this->find('count', array(
            'conditions' => array(
                'DriverRating.trip_id' => $trip_id,
                'DriverRating.star >' => 0)
        ));

    }

    public function getAllRatings($driver_id)
    {

        return $this->find('all', array(
            'conditions' => array('DriverRating.driver_id' => $driver_id,
                'DriverRating.star >' => 0)
        ));

    }


    public function getAvgRatings($driver_id)
    {
        return $this->find('first', array(
            'conditions' => array(
                'DriverRating.driver_id' => $driver_id,


            ),

            'fields'    => array(
                'AVG( DriverRating.star ) AS average',
                'COUNT(DriverRating.id) AS total_ratings'


            ),
            'group' => 'DriverRating.driver_id'
        ));


    }





}

?>