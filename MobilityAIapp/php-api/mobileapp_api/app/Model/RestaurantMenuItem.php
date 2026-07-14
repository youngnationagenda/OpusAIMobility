<?php



class RestaurantMenuItem extends AppModel
{
    public $useTable = 'restaurant_menu_item';


    public $belongsTo = array(
        'RestaurantMenu' => array(
            'className' => 'RestaurantMenu',
            'foreignKey' => 'restaurant_menu_id',
          



        ),
    );
    public $hasMany = array(
        'RestaurantMenuExtraSection' => array(
            'className' => 'RestaurantMenuExtraSection',
            'foreignKey' => 'restaurant_menu_item_id',
            'dependent'=> true,



        ),
    );

    public function isDuplicateRecord($name, $description, $restaurant_menu_id,$price)
    {
        return $this->find('count', array(
            'conditions' => array(


                'RestaurantMenuItem.name'=> $name,
                'RestaurantMenuItem.description'=> $description,

                'RestaurantMenuItem.restaurant_menu_id'=> $restaurant_menu_id,
                'RestaurantMenuItem.price'=> $price,



            )
        ));
    }

    public function getMenuItems($restaurant_menu_id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'RestaurantMenuItem.restaurant_menu_id'=> $restaurant_menu_id,
                'RestaurantMenuItem.active'=> 1



            )
        ));
    }


    public function getDetails($id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array(

                'RestaurantMenuItem.id'=> $id



            ),
            'contain'=>array('RestaurantMenu.Restaurant','RestaurantMenuExtraSection.RestaurantMenuExtraItem'),
        ));
    }
    public function getSearchResults($keyword,$restaurant_id){

        $this->Behaviors->attach('Containable');

        return $this->find('all', array(

            'conditions' => array(

                'OR' => array(
                    array('RestaurantMenuItem.name Like' => "$keyword%"),
                    array('RestaurantMenuItem.description Like' => "$keyword%"),
                ),


                'RestaurantMenu.restaurant_id' => $restaurant_id

            ),

            'contain'=>array('RestaurantMenu.Restaurant','RestaurantMenuExtraSection.RestaurantMenuExtraItem'),



            'recursive' => 0


        ));

    }



    public function getMenuItemsMobile($restaurant_menu_id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'RestaurantMenuItem.restaurant_menu_id'=> $restaurant_menu_id,
                'RestaurantMenuItem.active'=> 1



            )
        ));
    }
    public function getMenuItemFromID($id)
    {

        return $this->find('all', array(

            'conditions' => array(

                'RestaurantMenuItem.id'=> $id,
                  'RestaurantMenuItem.active'=> 1



            )
        ));
    }

    public function removeMenuItem($restaurant_menu_id,$active){


        return $this->updateAll(
            array('RestaurantMenuItem.active' => $active),
            array('RestaurantMenuItem.restaurant_menu_id' => $restaurant_menu_id)
        );

    }
    public function deleteMenuItem($restaurant_menu_id){


        return $this->deleteAll([
            'RestaurantMenuItem.restaurant_menu_id'=> $restaurant_menu_id
            ]);

    }

    public function deleteMenuItemAgainstID($id){


        return $this->deleteAll([
            'RestaurantMenuItem.id'=> $id
        ],true);

    }




}

