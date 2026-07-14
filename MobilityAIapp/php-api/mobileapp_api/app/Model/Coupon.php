<?php


class Coupon extends AppModel
{

    public $useTable = 'coupon';

    public $hasMany = array(
        'CouponUsed' => array(
            'className' => 'CouponUsed',
            'foreignKey' => 'coupon_id',



        ),
    );

    public function getDetails($coupon_id)
    {
        return $this->find('first', array(
            'conditions' => array(



                'Coupon.id'=> $coupon_id,




            )
        ));
    }

    
    public function isDuplicateRecord($rest_id,$coupon_code)
    {
        return $this->find('count', array(
            'conditions' => array(



                'Coupon.coupon_code'=> $coupon_code,




            )
        ));
    }




    public function getAll()
    {
        return $this->find('all');
    }

    public function getCouponDetails($coupon_code)
    {
        return $this->find('first', array(
            'conditions' => array(


                'Coupon.coupon_code' => $coupon_code




                /*SELECT * FROM restaurant_coupon rc
                left  join coupon_used cu on cu.coupon_id=rc.id
                left join `order` o on o.id=cu.order_id
                where rc.coupon_code='123cvg' and o.user_id = 2 and rc.restaurant_id = 1;*/

            )
        ));
    }
    public function isCouponCodeExist($coupon_code)
    {
        return $this->find('first', array(
            'conditions' => array(

                'Coupon.coupon_code' => $coupon_code,









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