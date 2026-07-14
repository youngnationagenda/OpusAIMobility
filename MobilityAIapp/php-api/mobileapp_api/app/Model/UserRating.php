<?php


class UserRating extends AppModel
{
    public $useTable = 'user_rating';

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
            'conditions' => array('UserRating.id' => $id)
        ));

    }

    public function getAllRatings($user_id)
    {

        return $this->find('all', array(
            'conditions' => array(
                'UserRating.user_id' => $user_id,
                'UserRating.star >' => 0
            )
        ));

    }
    public function ifRatingExist($trip_id)
    {

        return $this->find('count', array(
            'conditions' => array(
                'UserRating.trip_id' => $trip_id,
                'UserRating.star >' => 0
            )
        ));

    }






}

?>