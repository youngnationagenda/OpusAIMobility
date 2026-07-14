<?php


class OrderProduct extends AppModel
{
    public $useTable = 'order_product';

    public $belongsTo = array(
        'Order' => array(
            'className' => 'Order',
            'foreignKey' => 'order_id',

        ),


    );





    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('OrderProduct.id' => $id)
        ));

    }



    public function getAll()
    {

        return $this->find('all',array(


            'order' => array('Product.id DESC'),
        ));

    }

    public function getProductsAgainstCategory($category_id)
    {

        return $this->find('all',array(


            'conditions' => array('Product.category_id' => $category_id)
        ));

    }













}

?>