<?php


class TripPayment extends AppModel
{
    public $useTable = 'trip_payment';

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
            'conditions' => array('TripPayment.id' => $id),

        ));

    }

    public function getUserPayments($user_id)
    {

        return $this->find('all', array(
            'conditions' => array('TripPayment.user_id' => $user_id),

        ));

    }

    public function checkIfTripExist($trip_id)
    {

        return $this->find('first', array(
            'conditions' => array('TripPayment.trip_id' => $trip_id),

        ));

    }






    public function showCurrentWeekEarnings($driver_id,$start_date,$end_date)
    {

        return $this->find('all', array(
            'conditions' => array(

                'TripPayment.driver_id' => $driver_id,
                'TripPayment.created >=' => $start_date,
                'TripPayment.created <=' => $end_date,



            ),

            'fields' => array(


                'DAYNAME(TripPayment.created) AS day_name',
                'DAY(TripPayment.created) AS day',
                'COUNT(TripPayment.id) AS total_trips',

                'sum(TripPayment.final_fare)   AS total_earning',

            ),

            'group' => array('DAY(TripPayment.created)'),

        ));

    }

}

?>