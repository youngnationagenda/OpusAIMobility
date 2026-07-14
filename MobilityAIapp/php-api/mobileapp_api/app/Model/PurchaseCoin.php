<?php


class PurchaseCoin extends AppModel
{

    public $useTable = 'purchase_coin';

    public $belongsTo = array(

        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',


        ),
    );

    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'PurchaseCoin.id'=> $id,




            )
        ));
    }




    public function getAll()
    {
        return $this->find('all');
    }







}
?>