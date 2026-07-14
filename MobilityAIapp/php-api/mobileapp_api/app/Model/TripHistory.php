<?php


class TripHistory extends AppModel
{
    public $useTable = 'trip_history';

    public $belongsTo = array(

        'Trip' => array(
            'className' => 'Trip',
            'foreignKey' => 'trip_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );



    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('TripHistory.id' => $id),

        ));

    }



    public function getTripHistory($trip_id)
    {

        return $this->find('all', array(
            'conditions' => array('TripHistory.trip_id' => $trip_id),

        ));

    }





}

?>