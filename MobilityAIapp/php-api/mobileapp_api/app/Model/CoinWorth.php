<?php


class CoinWorth extends AppModel
{

    public $useTable = 'coin_worth';



    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'CoinWorth.id'=> $id,




            )
        ));
    }



    public function getAll()
    {
        return $this->find('first');
    }







}
?>