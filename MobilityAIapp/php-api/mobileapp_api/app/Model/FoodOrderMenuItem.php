<?php



class FoodOrderMenuItem extends AppModel
{
    public $useTable = 'food_order_menu_item';

    public $belongsTo = array(

        'RestaurantMenuItem' => array(
            'className' => 'RestaurantMenuItem',
            'foreignKey' => 'restaurant_menu_item_id',


        ),

    );

    public $hasMany = array(
        'FoodOrderMenuExtraItem' => array(
            'className' => 'FoodOrderMenuExtraItem',
            'foreignKey' => 'order_menu_item_id',



        ),
    );


    public function getMenuItem($order_id){
        //$this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(
                'FoodOrderMenuItem.order_id' => $order_id,

            ),
            'contain'=>false,



            'recursive' => -1


        ));

    }


    public function beforeSave($options = array())
    {



        if (isset($this->data[$this->alias]['name'])){

            $name = strtolower($this->data[$this->alias]['name']);


            $this->data['FoodOrderMenuItem']['name'] = ucwords($name);



        }
        return true;
    }
}