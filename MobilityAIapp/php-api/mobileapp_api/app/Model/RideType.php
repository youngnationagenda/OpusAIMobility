<?php


class RideType extends AppModel
{
    public $useTable = 'ride_type';


    public $belongsTo = array(
        'RideSection' => array(
            'className' => 'RideSection',
            'foreignKey' => 'ride_section_id',
           
        ),
    );

    public $hasMany = array(
        'Vehicle' => array(
            'className' => 'Vehicle',
            'foreignKey' => 'ride_type_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );



    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('RideType.id' => $id),
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