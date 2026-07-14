<?php



class TempCart extends AppModel
{
    public $useTable = 'temp_cart';

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

                'TempCart.id' => $id





            )
        ));
    }

    public function getAll()
    {
        return $this->find('all');





    }



    public function getCartSessionAgainstUserID($user_id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'TempCart.user_id' => $user_id





            )
        ));

    }








}