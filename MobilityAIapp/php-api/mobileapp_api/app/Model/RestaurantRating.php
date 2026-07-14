
<?php 

class RestaurantRating extends AppModel
{
    public $useTable = 'restaurant_rating';

    public $belongsTo = array(

        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',


        ),

        'Order' => array(
            'className' => 'FoodOrder',
            'foreignKey' => 'food_order_id',


        ),

    );

    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(
                'RestaurantRating.id' => $id,


            ),



        ));


    }

    public function getDetailsAgainstOrder($order_id)
    {

      
        return $this->find('first', array(





            'conditions' => array(


                'RestaurantRating.food_order_id'=> $order_id,




            ),


            'recursive' => 0

        ));


    }


    public function getAvgRatings($restaurant_id)
    {
        return $this->find('first', array(
            'conditions' => array(
                'RestaurantRating.restaurant_id' => $restaurant_id,


            ),

            'fields'    => array(
                'AVG( RestaurantRating.star ) AS average',
                'COUNT(RestaurantRating.id) AS total_ratings'


            ),
    'group' => 'RestaurantRating.restaurant_id'
            ));


    }

    public function getComments($restaurant_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(
                'RestaurantRating.restaurant_id' => $restaurant_id,


            ),


            'fields'    => array(
                'RestaurantRating.*',

                'UserInfo.*',

               

            ),

        ));


    }

    public function getLastInsertedRow($id)
    {
        return $this->find('all', array(
            'conditions' => array(
                'RestaurantRating.id' => $id,


            ),



        ));


    }

}



?>