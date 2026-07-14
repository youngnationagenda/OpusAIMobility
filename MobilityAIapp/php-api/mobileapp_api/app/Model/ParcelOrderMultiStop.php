<?php


class ParcelOrderMultiStop extends AppModel
{
    public $useTable = 'parcel_order_multi_stop';


    public $belongsTo = array(

     

        'GoodType' => array(
            'className' => 'GoodType',
            'foreignKey' => 'good_type_id',

        ),

        'PackageSize' => array(
            'className' => 'PackageSize',
            'foreignKey' => 'package_size_id',

        ),
    );

    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('ParcelOrderMultiStop.id' => $id)
        ));

    }






    public function getAll()
    {

        return $this->find('all');

    }

    public function ifExist($data)
    {

        return $this->find('first', array(
            'conditions' => array('PackageSize.title' => $data['title'])
        ));

    }




}

?>