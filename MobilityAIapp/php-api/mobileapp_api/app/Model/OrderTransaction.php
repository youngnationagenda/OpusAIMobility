<?php



class OrderTransaction extends AppModel
{
    public $useTable = 'order_transaction';

   
    public function getDetails($id)
    {
        return $this->find('first', array(
            'conditions' => array(

                'OrderTransaction.id' => $id





            )
        ));
    }


    public function getTransactionAgainstParcelOrderID($order_id)
    {
        return $this->find('first', array(
            'conditions' => array(

                'OrderTransaction.parcel_order_id' => $order_id





            )
        ));

    }




    public function getTransactionAgainstFoodOrderID($order_id)
    {
        return $this->find('first', array(
            'conditions' => array(

                'OrderTransaction.food_order_id' => $order_id





            )
        ));

    }


}