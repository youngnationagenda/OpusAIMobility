<?php


class RiderOrderMultiStop extends AppModel
{
    public $useTable = 'rider_order_multi_stop';


    public $belongsTo = array(
        'RiderOrder' => array(
            'className' => 'RiderOrder',
            'foreignKey' => 'ride_order_id',

        ),
    );





    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('RiderOrderMultiStop.id' => $id),
            'recursive'=>-1

        ));

    }

    public function getDetailsAgainsRiderOrder($rider_order_id)
    {

        return $this->find('first', array(
            'conditions' => array('RiderOrderMultiStop.rider_order_id' => $rider_order_id),
            'recursive'=>-1

        ));

    }

    public function checkOrderStatus($rider_order_id,$column)
    {

        return $this->find('first', array(
            'conditions' => array(

                'RiderOrderMultiStop.rider_order_id' => $rider_order_id,
                'RiderOrderMultiStop.'.$column => "0000-00-00 00:00:00",



            ),
            'order'=>'RiderOrderMultiStop.id DESC',
            'recursive'=>-1

        ));

    }


    public function getAll()
    {

        return $this->find('all',array(

            'recursive'=>-1
        ));

    }


    public function ifExist($data)
    {

        return $this->find('first', array(
            'conditions' => array('RideType.name' => $data['name'])
        ));

    }




}

?>