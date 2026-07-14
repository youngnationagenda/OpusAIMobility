<?php


class RestaurantCategory extends AppModel
{
    public $useTable = 'restaurant_category';


    public $belongsTo = array(
        'FoodCategory' => array(
            'className' => 'FoodCategory',
            'foreignKey' => 'food_category_id',

        ),

        'Restaurant' => array(
            'className' => 'Restaurant',
            'foreignKey' => 'restaurant_id',

        ),
    );




    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('RestaurantCategory.id' => $id)
        ));

    }

    public function checkDuplicate($food_category_id,$restaurant_id)
    {

        return $this->find('first', array(
            'conditions' => array(
                'RestaurantCategory.food_category_id' => $food_category_id,
                'RestaurantCategory.restaurant_id' => $restaurant_id,


            )
        ));

    }

    public function getRestaurantsAgainstCategory($food_category_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array('RestaurantCategory.food_category_id' => $food_category_id),
            'contain' =>array('Restaurant.RestaurantTiming','Restaurant.RestaurantRating.User'),
        ));

    }



    public function getAll()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(


            'recursive' => -1
        ));

    }





public function deleteAllRestaurantCategory($restaurant_id){

    $this->deleteAll(
        [
            'RestaurantCategory.restaurant_id' => $restaurant_id,

        ],
        false
    );


}








}

?>