<?php


class ProductImage extends AppModel
{
    public $useTable = 'product_image';

    public $belongsTo = array(
        'Product' => array(
            'className' => 'Product',
            'foreignKey' => 'product_id',

        ),


    );





    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('ProductImage.id' => $id)
        ));

    }



    public function getAll()
    {

        return $this->find('all',array(


            'order' => array('ProductImage.id DESC'),
        ));

    }

    public function getProductImageAgainstProductID($product_id)
    {

        return $this->find('all',array(


            'conditions' => array('ProductImage.product_id' => $product_id)
        ));

    }













}

?>