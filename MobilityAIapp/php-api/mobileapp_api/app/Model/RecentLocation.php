<?php


class RecentLocation extends AppModel
{

    public $useTable = 'recent_location';



    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'RecentLocation.id'=> $id,




            )
        ));
    }

    public function getAll()
    {
        return $this->find('all');
    }




    public function getUserLocations($user_id)
    {

        return $this->find('all', array(
            'conditions' => array(
                'RecentLocation.user_id' => $user_id,

            )
        ));

    }




}
?>