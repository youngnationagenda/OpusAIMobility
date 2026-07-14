<?php


class Favourite extends AppModel
{
    public $useTable = 'favourite';


    public $belongsTo = array(
        'Product' => array(
            'className' => 'Product',
            'foreignKey' => 'product_id',

        ),

        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',

        )
    );


    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('Favourite.id' => $id)
        ));

    }

    public function ifProductFavourite($user_id,$product_id)
    {

        return $this->find('first', array(
            'conditions' => array(
                'Favourite.product_id' => $product_id,
                'Favourite.user_id' => $user_id


            )
        ));

    }


    public function getUserFavouriteProducts($user_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(
            'contain'=>array('Product.ProductImage','User','Product.Store.StoreLocation.Country'),
            'conditions' => array(


                'Favourite.user_id' => $user_id

            )
        ));

    }


    public function deleteFavourite($user_id,$product_id){


        $this->deleteAll(
            [
                'Favourite.user_id' => $user_id,
                'Favourite.product_id' => $product_id
            ],
            false # <- single delete statement please
        );
    }




}

?>