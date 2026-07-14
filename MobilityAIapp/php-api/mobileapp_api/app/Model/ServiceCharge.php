<?php


class ServiceCharge extends AppModel
{
    public $useTable = 'service_charge';






    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('ServiceCharge.id' => $id),
            'recursive'=>-1

        ));

    }


    public function getAll()
    {

        return $this->find('all',array(

            'recursive'=>-1
        ));

    }


    public function checkDuplicate($data)
    {

        return $this->find('first', array(
            'conditions' => array('ServiceCharge.module' => $data['module'])
        ));

    }




}

?>