<?php


class Store extends AppModel
{
    public $useTable = 'store';

    public $belongsTo = array(


        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',

        ),


    );

    public $hasOne = array(


        'StoreLocation' => array(
            'className' => 'StoreLocation',
            'foreignKey' => 'store_id',

        ),


    );





    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('Store.id' => $id),
          
        ));

    }



    public function getAll()
    {

        return $this->find('all',array(

            'conditions' => array('Store.active !=' => 3),
            'order' => array('Store.id DESC'),

           
        ));

    }

    public function getUserStores($user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'conditions' => array(
                'Store.user_id'=> $user_id,

            ),
            'contain' => array('User','StoreLocation.Country'),
            'order' => array('Store.id DESC'),


        ));

    }


    public function getFeaturedStores()
    {

        return $this->find('all',array(
            'conditions' => array(
                'Store.featured' => 1,
                'Store.active' => 1),


            'order' => array('Store.id ASC'),
        ));

    }















}

?>