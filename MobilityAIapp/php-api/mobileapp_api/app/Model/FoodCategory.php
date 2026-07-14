<?php


class FoodCategory extends AppModel
{
    public $useTable = 'food_category';







    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('FoodCategory.id' => $id)
        ));

    }



    public function getAll()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(


            'recursive' => -1
        ));

    }

    












}

?>