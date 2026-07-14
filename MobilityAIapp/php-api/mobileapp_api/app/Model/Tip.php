<?php


class Tip extends AppModel
{
    public $useTable = 'tip';

    public $belongsTo = array(
        'TipCategory' => array(
            'className' => 'TipCategory',
            'foreignKey' => 'tip_category_id',

        ),
    );

    public function getDetails($id)
    { /* irfan function*/

        return $this->find('first', array(
            'conditions' => array('Tip.id' => $id)
        ));

    }


    public function getAll()
    {

        return $this->find('all',array(


            'order' => array('Tip.id DESC'),
        ));

    }

    public function getTipsAgainstCategory($tip_category_id)
    {

        return $this->find('all',  array(
            'conditions' => array('Tip.tip_category_id' => $tip_category_id),


            'order'=>'Tip.name ASC',

        ));

    }





}

?>