<?php


class UserPlace extends AppModel
{
    public $useTable = 'user_place';




    public $belongsTo = array(
        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );



    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('UserPlace.id' => $id),

        ));

    }


    public function getAll()
    {

        return $this->find('all');

    }


    public function getUserPlaces($user_id)
    {

        return $this->find('all', array(
            'conditions' => array(
                'UserPlace.user_id' => $user_id,

            )
        ));

    }

    public function getUserActiveTrips($user_id)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Trip.user_id' => $user_id,
                'Trip.completed'=>0
            )
        ));

    }


    public function getDriverCompletedTrips($driver_id)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Trip.driver_id' => $driver_id,
                'Trip.completed'=>1
            )
        ));

    }




}

?>