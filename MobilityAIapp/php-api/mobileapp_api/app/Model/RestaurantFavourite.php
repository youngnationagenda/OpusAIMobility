<?php



class RestaurantFavourite extends AppModel
{
    public $useTable = 'restaurant_favourite';

    public $belongsTo = array(
        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',


        ),

        'Restaurant' => array(
            'className' => 'Restaurant',
            'foreignKey' => 'restaurant_id',


        ),

    );

    public function getFavouritesRestaurant($user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'contain'=>array('Restaurant.User','Restaurant.RestaurantTiming','Restaurant.RestaurantRating.User'),
            'conditions' => array(


                    'RestaurantFavourite.user_id' => $user_id,





            )

        ));


    }

    public function ifUserHasFavouritedRestaurant($user_id,$restaurant_id)
    {
        return $this->find('first', array(
            'contain'=>array('Restaurant.User'),
            'conditions' => array(


                'RestaurantFavourite.user_id' => $user_id,
                'RestaurantFavourite.restaurant_id' => $restaurant_id,





            ),
            'recursive'=>-1

        ));


    }

    public function getFavouriteRestaurant($user_id,$restaurant_id)
    {
        
        return $this->find('all', array(

            'conditions' => array(


                'RestaurantFavourite.user_id' => $user_id,
                'RestaurantFavourite.restaurant_id' => $restaurant_id,




            ),
            'contain'=>array('Restaurant.User'),

        ));


    }

    public function getFavouriteRestaurantDetail($id)
    {
        $this->recursive = -1;
        return $this->find('all', array(

            'conditions' => array(


                'RestaurantFavourite.id' => $id,





            )

        ));


    }


}