<?php


class GoodType extends AppModel
{
    public $useTable = 'good_type';




    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('GoodType.id' => $id)
        ));

    }


   



    public function getAll()
    {

        return $this->find('all');

    }

    public function ifExist($data)
    {

        return $this->find('first', array(
            'conditions' => array('GoodType.name' => $data['name'])
        ));

    }




}

?>