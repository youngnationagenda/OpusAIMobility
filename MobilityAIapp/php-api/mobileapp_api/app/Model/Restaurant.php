<?php

App::uses('Lib', 'Utility');

class Restaurant extends AppModel
{
    public $useTable = 'restaurant';
    public $primaryKey = 'id';


 public $belongsTo = array(
        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',

        ),






    );


public $hasMany = array(
        'RestaurantTiming' => array(
            'className' => 'RestaurantTiming',
            'foreignKey' => 'restaurant_id',
            'dependent'=> true,



        ),

    'RestaurantMenu' => array(
        'className' => 'RestaurantMenu',
        'foreignKey' => 'restaurant_id',
        'dependent'=> true,



    ),

    'RestaurantRating' => array(
        'className' => 'RestaurantRating',
        'foreignKey' => 'restaurant_id',
        'dependent'=> true,




    ),

    'RestaurantCategory' => array(
        'className' => 'RestaurantCategory',
        'foreignKey' => 'restaurant_id',
        'dependent'=> true,




    ),






    );

    var $contain = array('RestaurantTiming','RestaurantRating.User','User');
    var $contain_with_menu = array('RestaurantTiming','RestaurantMenu.RestaurantMenuItem.RestaurantMenuExtraSection.RestaurantMenuExtraItem','RestaurantRating.User','User','RestaurantCategory.FoodCategory');



    public function isDuplicateRecord($name,$slogan,$phone,$about)
    {
        return $this->find('count', array(
            'conditions' => array(

                //'Restaurant.user_id' => $user_id,
                'Restaurant.name'=> $name,
                'Restaurant.slogan'=> $slogan,

                'Restaurant.phone'=> $phone,





            )
        ));
    }

    public function getDetails($id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(

                'Restaurant.id' => $id,




            ),

          'contain'=> $this->contain_with_menu

        ));

    }



    public function isRestaurantExist($user_id)
    {

        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(

                'Restaurant.user_id' => $user_id,




            ),
            'contain'=> array('User')


        ));

    }

    public function getRestaurantCount()
    {
        return $this->find('count');
    }



    public function getSingleRestaurantDetail()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(

                'Restaurant.single_restaurant' => 1,




            ),
            'contain'=> array('RestaurantTiming','RestaurantLocation','Currency','UserInfo','User','Tax','UserAdmin','RestaurantMenu'),

        ));


    }
    public function getRestaurantOrders()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'contain'=> array('Order'),
            'order' => 'Restaurant.id DESC',

            //'fields'=>array('Order.*'),

        ));


    }

    public function getRestaurantID($user_id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'Restaurant.user_id' => $user_id,




            )

        ));


    }
    public function getRestaurantDetailInfo($id)
    {

        return $this->find('all', array(
            'conditions' => array(

                'Restaurant.id' => $id,




            ),
            'contain'=>$this->contain,
        ));


    }

    public function getRestaurantDetailInfoSuperAdmin($id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'conditions' => array(

                'Restaurant.id' => $id,




            ),
            'contain'=> array('RestaurantTiming','RestaurantLocation','Currency','UserInfo','User','Tax','UserAdmin'),
        ));


    }

    public function getNearByRestaurants($lat,$long,$user_id=null,$radius)

    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,
                    )
                )
            ),

            'conditions' => array(


                'Restaurant.block'=> 0,
                //'Restaurant.promoted <'=> 1,
                'User.active '=> 1,
                'Restaurant.user_id >'=> 0



            ),

            'contain'=>$this->contain,
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( Restaurant.lat ) )
                    * COS( RADIANS(Restaurant.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(Restaurant.lat)))) AS distance','Restaurant.*','User.*','RestaurantFavourite.*'),
            'order' => 'distance ASC',
            /*'group' => array(
                'distance HAVING distance < '.$radius
            ),*/

            'recursive' => 0

        ));


    }





    public function getPromotedRestaurants($lat,$long,$user_id=null,$radius)

    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,
                    )
                )
            ),

            'conditions' => array(


                'Restaurant.block'=> 0,
               // 'Restaurant.promoted >='=> 1,
                'Restaurant.user_id >'=> 0,
                'User.active '=> 1



            ),

            'contain'=>$this->contain,
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( Restaurant.lat ) )
                    * COS( RADIANS(Restaurant.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(Restaurant.lat)))) AS distance','Restaurant.*','User.*','RestaurantFavourite.*'),

            'order' => 'distance ASC',

            'group' => array(
                'distance HAVING distance < '.$radius
            ),
            'recursive' => 0

        ));


    }

    public function getPromotedRestaurantsWeb($user_id = null)

    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,
                    )
                )
            ),

            'conditions' => array(


                'Restaurant.block'=> 0,
               // 'Restaurant.promoted >='=> 1,
                'Restaurant.user_id >'=> 0



            ),

            'contain'=>$this->contain,
           
            'order' => 'Restaurant.promoted DESC',


            'group' => array(
                'distance HAVING distance < '.$radius
            ),
            'recursive' => 0

        ));


    }
    public function getCurrentCityRestaurants($lat,$long,$user_id=null,$city)

    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,

                    )
                ),


            ),
            'conditions' => array(

                'RestaurantLocation.city' => $city,
                'Restaurant.block'=> 0,
                'User.active '=> 1






            ),
            'contain'=>$this->contain,
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( RestaurantLocation.lat ) )
                    * COS( RADIANS(RestaurantLocation.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(RestaurantLocation.lat)))) AS distance','Restaurant.*','UserInfo.*','User.*','RestaurantLocation.*','Currency.*','Tax.*','RestaurantFavourite.*'),

            'order' => array('distance ASC','Restaurant.promoted DESC'),
          

            'recursive' => 0

        ));


    }

    public function getCurrentCityRestaurantsBasedOnPromoted($lat,$long,$user_id=null,$city)

    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,

                    )
                ),


            ),
            'conditions' => array(

                'RestaurantLocation.city' => $city,
                'Restaurant.block'=> 0,
                'Restaurant.promoted'=> 1,
                'User.active '=> 1






            ),
            'contain'=>$this->contain,
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( RestaurantLocation.lat ) )
                    * COS( RADIANS(RestaurantLocation.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(RestaurantLocation.lat)))) AS distance','Restaurant.*','UserInfo.*','User.*','RestaurantLocation.*','Currency.*','Tax.*','RestaurantFavourite.*'),

            'order' => array('Restaurant.promoted DESC'),


            'recursive' => 0

        ));


    }

    public function getCurrentCityRestaurantsBasedOnDistance($lat,$long,$user_id=null,$city)

    {

        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,

                    )
                ),


            ),
            'conditions' => array(

                'RestaurantLocation.city' => $city,
                'Restaurant.block'=> 0,
                'Restaurant.promoted'=> 0,
                'User.active '=> 1






            ),
            'contain'=>$this->contain,
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( RestaurantLocation.lat ) )
                    * COS( RADIANS(RestaurantLocation.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(RestaurantLocation.lat)))) AS distance','Restaurant.*','UserInfo.*','User.*','RestaurantLocation.*','Currency.*','Tax.*','RestaurantFavourite.*'),
            'order' => array('distance ASC'),


            'recursive' => 0

        ));


    }
    public function getAllRestaurants()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(



            'contain'=>array('User','RestaurantCategory.FoodCategory'),




            'recursive' => 0

        ));


    }

    public function getNonActiveRestaurants()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(



            'contain'=>array('User','UserInfo','Currency','Tax'),

            'conditions' => array(


                'Restaurant.block'=> 0,

                'User.active '=> 0






            ),


            'recursive' => 0

        ));


    }

    public function getRestaurantsAgainstSpeciality($speciality,$lat,$long,$user_id=null)
    {



        $this->Behaviors->attach('Containable');
        return $this->find('all', array(

            'joins' => array(
                array(
                    'table' => 'restaurant_favourite',
                    'alias' => 'RestaurantFavourite',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'Restaurant.id = RestaurantFavourite.restaurant_id',
                        'RestaurantFavourite.user_id' => $user_id,
                    )
                )
            ),
            'conditions' => array(

                'Restaurant.speciality' => $speciality,
                'Restaurant.block'=> 0,
                'User.active'=> 1,






            ),

            'contain'=>$this->contain,
            'fields'=>array('( 3959 * ACOS( COS( RADIANS('.$lat.') ) * COS( RADIANS( RestaurantLocation.lat ) )
                    * COS( RADIANS(RestaurantLocation.long) - RADIANS('.$long.')) + SIN(RADIANS('.$lat.'))
                    * SIN( RADIANS(RestaurantLocation.lat)))) AS distance','Restaurant.*','UserInfo.*','RestaurantLocation.*','Currency.*','Tax.*','RestaurantFavourite.*'),
            'order' => 'Restaurant.promoted DESC','distance',


            'recursive' => 0

        ));
       

    }

    public function getRestaurantSpecialities()
    {

        return $this->find('all', array(


            'contain'=>false,

            'fields' => array('DISTINCT Restaurant.speciality'),

            'recursive' => 0,
            'group'=>'Restaurant.speciality'


        ));


    }
    public function searchRestaurant($keyword){

        return $this->find('all', array(

            'conditions' => array(
                'OR' => array(

                    array('Restaurant.name LIKE' => '%'.$keyword.'%'),



                ),




                    'Restaurant.block'=> 0,
                    //'Restaurant.promoted <'=> 1,
                    'User.active '=> 1,
                    'Restaurant.user_id >'=> 0








                ),
                 'contain'=>$this->contain,
        ));

    }

    public function filterRestaurant($sort,$min_price,$max_price){

        if($sort == "popular") {
            return $this->find('all', array(

                'conditions' => array(


                    'Restaurant.block' => 0,
                    'Restaurant.min_food_price >=' => $min_price,
                    'Restaurant.max_food_price <=' => $max_price,

                    //'Restaurant.promoted <'=> 1,
                    'User.active ' => 1,
                    'Restaurant.user_id >' => 0


                ),
                'contain' => $this->contain,
                'order' => 'Restaurant.view DESC',
            ));
        }else

            if($sort == "delivery_time") {
                return $this->find('all', array(

                    'conditions' => array(


                        'Restaurant.block' => 0,
                        //'Restaurant.promoted <'=> 1,
                        'User.active ' => 1,
                        'Restaurant.user_id >' => 0


                    ),
                    'contain' => $this->contain,
                    'order' => 'Restaurant.delivery_max_time ASC',
                ));
            }
            else if($sort == "price") {
            return $this->find('all', array(

                'conditions' => array(


                    'Restaurant.block' => 0,
                    //'Restaurant.promoted <'=> 1,
                    'User.active ' => 1,
                    'Restaurant.user_id >' => 0,
                    //'Restaurant.user_id >' => 0,


                ),
                'contain' => $this->contain,
                'order' => 'Restaurant.price ASC',
            ));
        }
    }
    public function getRestaurantMenusForMobile($restaurant_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(


            'contain'=>array('RestaurantMenu' => array(
        'conditions' => array(
            'RestaurantMenu.has_menu_item' => 1,
            'RestaurantMenu.active' => 1 // <-- Notice this addition
        ), 'order' => 'RestaurantMenu.index ASC',

                ),'RestaurantMenu.RestaurantMenuItem'=> array(
                'conditions' => array(

                    'RestaurantMenuItem.active' => 1 // <-- Notice this addition
                ),

            ),'RestaurantMenu.RestaurantMenuItem.RestaurantMenuExtraSection.RestaurantMenuExtraItem','Currency','Tax'),
            'conditions' => array(

                'Restaurant.id' => $restaurant_id,






            ),



            'recursive' => 0

        ));


    }

    public function getRestaurantMenusForMobiletest($restaurant_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(


            'contain'=>array('RestaurantMenu' => array(
                'conditions' => array(
                    'RestaurantMenu.has_menu_item' => 1,
                    'RestaurantMenu.active' => 1 // <-- Notice this addition
                ), 'order' => 'RestaurantMenu.index ASC',

            ),'Currency','Tax'),
            'conditions' => array(

                'Restaurant.id' => $restaurant_id,






            ),



            'recursive' => 0

        ));


    }
    public function getRestaurantMenusForWeb($restaurant_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(


            'contain'=>array('RestaurantMenu' => array(
                'conditions' => array(

                ), 'order' => 'RestaurantMenu.index ASC',

            ),'RestaurantMenu.RestaurantMenuItem.RestaurantMenuExtraSection.RestaurantMenuExtraItem','Currency','Tax'),
            'conditions' => array(

                'Restaurant.id' => $restaurant_id,






            ),


            'recursive' => 0

        ));


    }


    public function deleteRestaurant($restaurant_id){


        return $this->deleteAll(array(

            'Restaurant.id'=>$restaurant_id),true);

    }

    public function beforeSave($options = array())
    {



        if (isset($this->data[$this->alias]['name']) && isset($this->data[$this->alias]['slogan']) && isset($this->data[$this->alias]['about'])) {
            $name = strtolower($this->data[$this->alias]['name']);
            $slogan = strtolower($this->data[$this->alias]['slogan']);
            $about = strtolower($this->data[$this->alias]['about']);




            //$this->data['Restaurant']['name'] = ucwords($name);
            //$this->data['Restaurant']['slogan'] = ucwords($slogan);
            $this->data['Restaurant']['about'] = ucwords($about);

        }
        return true;
    }








}