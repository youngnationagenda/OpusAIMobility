<?php



class FoodOrderMenuExtraItem extends AppModel
{
    public $useTable = 'food_order_menu_extra_item';


    public $belongsTo = array(

        'RestaurantMenuExtraItem' => array(
            'className' => 'RestaurantMenuExtraItem',
            'foreignKey' => 'restaurant_menu_extra_item_id',


        ),

    );


    public function beforeSave($options = array())
    {



        if (isset($this->data[$this->alias]['name'])){

            $name = strtolower($this->data[$this->alias]['name']);


            $this->data['FoodOrderMenuExtraItem']['name'] = ucwords($name);



        }
        return true;
    }


}