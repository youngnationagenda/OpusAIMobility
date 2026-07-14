<?php


class StoreCoupon extends AppModel
{

    public $useTable = 'store_coupon';

    public $hasMany = array(
        'StoreCouponUsed' => array(
            'className' => 'CouponUsed',
            'foreignKey' => 'coupon_id',



        ),
    );

    public function getDetails($coupon_id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'StoreCoupon.id'=> $coupon_id,




            )
        ));
    }

    public function getCouponDetailsAgainstStoreID($coupon_code,$store_id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'StoreCoupon.coupon_code'=> $coupon_code,
                'StoreCoupon.store_id'=> $store_id,





            )
        ));
    }
    public function getCouponDetails($coupon_code)
    {
        return $this->find('first', array(
            'conditions' => array(



                'StoreCoupon.coupon_code'=> $coupon_code,





            )
        ));
    }
    public function isDuplicateRecord($store_id,$coupon_code)
    {
        return $this->find('count', array(
            'conditions' => array(



                'StoreCoupon.coupon_code'=> $coupon_code,
                'StoreCoupon.store_id'=> $store_id,




            )
        ));
    }




    public function getStoreCoupons($store_id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'StoreCoupon.store_id' => $store_id




            )
        ));
    }


    public function isCouponCodeExist($coupon_code)
    {
        return $this->find('first', array(
            'conditions' => array(

                'StoreCoupon.coupon_code' => $coupon_code,









            )
        ));
    }



    public function deleteCoupon($restaurant_id,$coupon_id){


        return $this->deleteAll
        ([
            'Coupon.id'=>$coupon_id]);

    }

    public function ifCouponUsed($user_id,$coupon_code){




        return $this->find('count', array(


                'joins' => array(
                    array(
                        'table' => 'coupon_used',
                        'conditions' => 'coupon_used.coupon_id = RestaurantCoupon.id',

                        'type' => 'LEFT'

                    ),


                    array(
                        'table' => 'order',
                        'conditions' => 'order.id = coupon_used.order_id',

                        'type' => 'LEFT'

                    ),

                ),
                //'contain'=>array('UserInfo.DirectAnswer'),
                'conditions' => array(
                    'order.user_id' => $user_id,
                    'Coupon.coupon_code' => $coupon_code,






                ),
                'fields' => array('order.*','coupon_used.*'),


                // 'group'=> array('direct_question_id')


            )
        );
    }

    /*public function checkCouponIfexistAndNotUsed($user_id,$coupon_code)
    {
        return $this->find('all', array(

            'conditions' => array('not exists '.
                '(select id from coupon_used '.
                'where answers.question_id = '.
                'Question.id)'
            )
        ));
    }*/
}
?>