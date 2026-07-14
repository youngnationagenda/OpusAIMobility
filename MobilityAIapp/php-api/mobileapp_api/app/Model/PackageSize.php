<?php


class PackageSize extends AppModel
{
    public $useTable = 'package_size';




    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('PackageSize.id' => $id)
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