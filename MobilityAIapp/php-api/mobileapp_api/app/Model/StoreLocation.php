<?php


class StoreLocation extends AppModel
{

    public $useTable = 'store_location';


    public $belongsTo = array(
        'Country' => array(
            'className' => 'Country',
            'foreignKey' => 'country_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),
    );

    public function getStoreLocation($store_id)
    {
        return $this->find('first', array(
            'conditions' => array(

                'StoreLocation.store_id' => $store_id,




            ),


        ));


    }



    /*
        public function beforeSave($options = array())
        {



            if (isset($this->data[$this->alias]['city']) && isset($this->data[$this->alias]['state']) && isset($this->data[$this->alias]['country'])) {
                $city = strtolower($this->data[$this->alias]['city']);
                $state = strtolower($this->data[$this->alias]['state']);
                $country = strtolower($this->data[$this->alias]['country']);




                $this->data['RestaurantLocation']['city'] = ucwords($city);
                $this->data['RestaurantLocation']['state'] = ucwords($state);
                $this->data['RestaurantLocation']['country'] = ucwords($country);

            }
            return true;
        }*/

}
?>