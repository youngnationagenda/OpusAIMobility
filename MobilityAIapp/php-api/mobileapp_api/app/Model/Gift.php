<?php


class Gift extends AppModel
{

    public $useTable = 'gift';



    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'Gift.id'=> $id,




            )
        ));
    }

    public function ifExist($title)
    {
        return $this->find('first', array(
            'conditions' => array(



                'Gift.title'=> $title,




            )
        ));
    }


    public function getAll()
    {
        return $this->find('all');
    }







}
?>