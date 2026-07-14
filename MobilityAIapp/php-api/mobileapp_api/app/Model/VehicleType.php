<?php


class VehicleType extends AppModel
{
    public $useTable = 'vehicle_type';

    public $hasMany = array(

        'Vehicle' => array(
            'className' => 'Vehicle',
            'foreignKey' => 'ride_type_id',
            'dependent' =>true

        ),

    );



    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('VehicleType.id' => $id)
        ));

    }

    public function ifExist($data)
    {

        return $this->find('first', array(
            'conditions' => array('VehicleType.name' => $data['name'])
        ));

    }

    public function getAll()
    {

        return $this->find('all', array(
                'recursive'=>-1)
        );

    }




}

?>