<?php


class GiftSend extends AppModel
{

    public $useTable = 'gift_send';



    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'GiftSend.id'=> $id,




            )
        ));
    }

    


    public function getAll()
    {
        return $this->find('all');
    }







}
?>