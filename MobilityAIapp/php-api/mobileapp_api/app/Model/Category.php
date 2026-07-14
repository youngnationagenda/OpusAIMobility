<?php


class Category extends AppModel
{
    public $useTable = 'category';

    public $hasMany = array(
        'Product' => array(
            'className' => 'Product',
            'foreignKey' => 'category_id',

        ),


    );





    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('Category.id' => $id)
        ));

    }



    public function getAll()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Product.ProductImage','Product.Store.StoreLocation.Country'),
            'order' => array('Category.id DESC'),
            'conditions' => array('Category.active' => 1),
            'recursive' => -1
        ));

    }

    public function getCategoriesAgainstLevel($level)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Product.ProductImage','Product.Store.StoreLocation.Country'),
            'order' => array('Category.id DESC'),
            'conditions' => array(
                'Category.active' => 1,
                'Category.level' => $level

            ),
            'recursive' => -1
        ));

    }

    public function getAllAgainstStoreID($store_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Product.ProductImage','Product.Store.StoreLocation.Country'),
            'order' => array('Category.id DESC'),
            'conditions' => array(
                'Category.active' => 1,
                'Category.store_id' => $store_id),
            'recursive' => -1
        ));

    }


    public function getFeaturedCategories()
    {
        $this->Behaviors->attach('Containable');


        return $this->find('all',array(
            'conditions' => array(
                'Category.featured' => 1,
                'Category.active' => 1),
            'contain' => array('Product.ProductImage','Product.Store.StoreLocation.Country'),
            'order' => array('Category.id ASC'),
        ));

    }

    public function getFeaturedCategoriesAgainstStore($store_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(
            'conditions' => array(
                'Category.featured' => 1,
                'Category.active' => 1,
                'Category.store_id' =>$store_id


                ),
            'contain' => array('Product.ProductImage','Product.Store.StoreLocation.Country'),

            'order' => array('Category.id ASC'),
        ));

    }


    public function getCategoriesAgainstStore($store_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(
            'conditions' => array(
                'Category.store_id' => $store_id,
                'Category.active' => 1

            ),
            'contain' => array('Product.ProductImage','Product.Store.StoreLocation.Country'),
            'order' => array('Category.id ASC'),
        ));

    }













}

?>