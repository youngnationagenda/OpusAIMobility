<?php


class Product extends AppModel
{
    public $useTable = 'product';

    public $belongsTo = array(
        'Category' => array(
            'className' => 'Category',
            'foreignKey' => 'category_id',

        ),

        'Store' => array(
            'className' => 'Store',
            'foreignKey' => 'store_id',

        ),



       



    );


    public $hasMany = array(
        'ProductImage' => array(
            'className' => 'ProductImage',
            'foreignKey' => 'product_id',
            'dependent'=> true,

        ),


    );





    public function getDetails($id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('first', array(
            'conditions' => array('Product.id' => $id),
            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
        ));

    }



    public function getAll()
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'order' => array('Product.id DESC'),
        ));

    }

    public function getProductsAgainstCategory($category_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array('Product.category_id' => $category_id)
        ));

    }

    public function getProductsAgainstStore($store_id,$starting_point=null)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array('Product.store_id' => $store_id),
            'limit' => 10,
            'offset' => $starting_point*10,
            'order' => array('Product.id DESC'),
        ));

    }

    public function searchProduct($keyword)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),


            'conditions' => array(


                'OR' => array(
                    array('Product.title Like' => "%$keyword%"),
                    array('Product.description Like' => "%$keyword%"),

                ),

            )));

    }


    public function filterProducts($min_price=null,$max_price=null,$keyword=null)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array(
                'Product.price >=' => $min_price,
                'Product.price <=' => $max_price,

                'Product.title LIKE' => '%'.$keyword.'%'
            ),

        ));

    }

    public function filterProductsWithCategory($min_price=null,$max_price=null,$keyword=null,$category_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array(
                'Product.price >=' => $min_price,
                'Product.price <=' => $max_price,
                'Product.category_id ' => $category_id,

                'Product.title LIKE' => '%'.$keyword.'%'
            ),

        ));

    }


    public function filterProductsWithStore($min_price=null,$max_price=null,$store_id)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array(
                'Product.price >=' => $min_price,
                'Product.price <=' => $max_price,
                'Product.store_id ' => $store_id,


            ),

        ));

    }

    public function filterProductsWithHighestPrice($min_price=null,$max_price=null,$keyword,$highest_price)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array(
                'Product.price >=' => $min_price,
                'Product.price <=' => $max_price,
                'Product.title LIKE' => '%'.$keyword.'%'


            ),

            'order' => array('Product.price DESC'),

        ));

    }

    public function filterProductsWithLowestPrice($min_price=null,$max_price=null,$keyword,$lowest_price)
    {
        $this->Behaviors->attach('Containable');
        return $this->find('all',array(

            'contain' => array('Category','ProductImage','Store.StoreLocation.Country'),
            'conditions' => array(
                'Product.price >=' => $min_price,
                'Product.price <=' => $max_price,
                'Product.title LIKE' => '%'.$keyword.'%'


            ),

            'order' => array('Product.price ASC'),

        ));

    }













}

?>