<?php


class Notification extends AppModel
{

    public $useTable = 'notification';



    public $belongsTo = array(
        

        'Receiver' => array(
            'className' => 'User',
            'foreignKey' => 'receiver_id',


        ),


        'Admin' => array(
            'className' => 'Admin',
            'foreignKey' => 'admin_id',


        ),
    );
    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'Notification.id'=> $id,




            )
        ));
    }



    public function getAll()
    {
        return $this->find('all');
    }


    public function getUserNotifications($user_id,$starting_point)
    {

        return $this->find('all', array(
            'conditions' => array(

                'Notification.receiver_id' => $user_id


            ),

            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => 'Notification.id DESC',
        ));

    }





}
?>