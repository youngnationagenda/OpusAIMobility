<?php


class RideSection extends AppModel
{
    public $useTable = 'ride_section';




    public $hasMany = array(
        'RideType' => array(
            'className' => 'RideType',
            'foreignKey' => 'ride_section_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );



    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('RideSection.id' => $id),
            'recursive'=>-1

        ));

    }

    public function getAll()
    {

        return $this->find('all');

    }









}

?>