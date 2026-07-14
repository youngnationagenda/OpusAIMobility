<?php
App::uses('BlowfishPasswordHasher', 'Controller/Component/Auth');
App::uses('Security', 'Utility');


class UserAdmin extends AppModel
{
    public $useTable = 'user_admin';



    public function getAll(){

        return $this->find('all');


    }

    public function isEmailAlreadyExist($email){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array('email' => $email)
        ));

    }

    public function isUsernameAlreadyExist($username){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array('username' => $username)
        ));

    }

    public function isphoneNoAlreadyExist($phone){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array('phone' => $phone)
        ));

    }


    public function editIsEmailAlreadyExist($email,$user_id){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array(
                'email' => $email,
                'id !='=>$user_id
            )
        ));

    }

    public function getUserStories($user_ids){ /* irfan function*/
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(


            'joins' => array(
                array(
                    'table' => 'story',
                    'alias' => 'Story',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'UserAdmin.id  = Story.user_id'
                    )
                )
            ),

            'conditions' => array(
                'Story.user_id IN' => $user_ids,

            ),

            'group'=>('Story.user_id'),


        ));
        /*
                    'contain' => array('Story'),
                    'conditions' => array(
                        'Story.user_id IN' => $user_ids,

                    ),

                ));
        */

    }

    public function getUserStory($user_id){ /* irfan function*/
        $this->Behaviors->attach('Containable');
        return $this->find('all', array(


            'joins' => array(
                array(
                    'table' => 'story',
                    'alias' => 'Story',
                    'type' => 'LEFT',
                    'conditions' => array(
                        'UserAdmin.id  = Story.user_id'
                    )
                )
            ),


            'conditions' => array(
                'Story.user_id' => $user_id,

            ),




        ));
        /*
                    'contain' => array('Story'),
                    'conditions' => array(
                        'Story.user_id IN' => $user_ids,

                    ),

                ));
        */

    }

    public function editIsUsernameAlreadyExist($username,$user_id){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array(
                'username' => $username,
                'id !='=>$user_id



            )
        ));

    }

    public function editIsphoneNoAlreadyExist($phone,$user_id){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array(
                'phone' => $phone,
                'id !='=>$user_id



            )
        ));

    }


    public function iSUserExist($id){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array('id' => $id)
        ));

    }


    public function getMultipleUsersData($users){





        return $this->find('all', array(
            'conditions' => array('UserAdmin.id IN' => $users)
        ));



    }

    public function getUsersCount($role){ /* irfan function*/

        return $this->find('count', array(
            'conditions' => array(

                'UserAdmin.role' => $role)
        ));

    }

    public function getTotalUsersCount(){ /* irfan function*/

        return $this->find('count');

    }

    public function getUserDetailsFromID($user_id){

        return $this->find('first', array(
            'conditions' => array(
                'UserAdmin.id' => $user_id
            ),

            'recursive' => 0


        ));

    }

    public function getSearchResults($keyword,$user_id){



        return $this->find('all', array(

            'conditions' => array(
                'UserAdmin.username Like' => "$keyword%",
                'UserAdmin.id !=' => $user_id,

            ),






            'recursive' => 0


        ));

    }

    public function verifyPassword($email,$old_password){


        $userData = $this->findByEmail($email, array(
            'id',
            'password',



        ));



        $passwordHash = Security::hash($old_password, 'blowfish', $userData['UserAdmin']['password']);
        // $salt = Security::hash($old_password, 'sha256', true);

        if ($passwordHash == $userData['UserAdmin']['password']) {


            return true;

        }else{
            return false;


        }



    }



    function updatepassword($password)
    {
        $passwordBlowfishHasher = new BlowfishPasswordHasher();
        $user['password'] = $passwordBlowfishHasher->hash($password);

        return $user;
    }


    public function getEmailBasedOnUserID($user_id){

        return $this->find('all', array(
            'conditions' => array(
                'UserAdmin.id' => $user_id

            )
        ));


    }



    public function getAdminDetails(){

        return $this->find('all', array(
            'conditions' => array(
                'UserAdmin.role' => "admin"

            ),

        ));


    }



    public function countAdminUsers(){

        return $this->find('count');


    }
    public function verify($email,$user_password)
    {

        if ($email != "") {
            $userData = $this->find('all', array(
                'conditions' => array(
                    'UserAdmin.email' => $email

                )
            ));


            /*$userData = $this->findByEmail($email, array(
            'user_id',
           'email',
            'password',
            'salt'
           ));*/
            if (empty($userData)) {


                return false;

            }
        }
        $passwordHash = Security::hash($user_password, 'blowfish', $userData[0]['UserAdmin']['password']);
        $salt = Security::hash($user_password, 'sha256', true);

        if ($passwordHash == $userData[0]['UserAdmin']['password'] ) {
            return $userData;
        } else {

            return false;


        }



    }


    public function verifyUsernameAndPassword($username,$user_password)
    {


        $userData = $this->find('all', array(
            'conditions' => array(
                'UserAdmin.username' => $username

            )
        ));


        /*$userData = $this->findByEmail($email, array(
        'user_id',
       'email',
        'password',
        'salt'
       ));*/
        if (empty($userData)) {


            return false;

        }

        $passwordHash = Security::hash($user_password, 'blowfish', $userData[0]['UserAdmin']['password']);
        $salt = Security::hash($user_password, 'sha256', true);

        if ($passwordHash == $userData[0]['UserAdmin']['password'] ) {
            return $userData;
        } else {

            return false;


        }



    }



    public function getUsers($role){

        return $this->find('all', array(

            'conditions' => array(

                'UserAdmin.role' => $role

            ),
            'order' => array('UserAdmin.id DESC'),
        ));

    }


    public function findEmail($email){

        return $this->find('all', array(
            'conditions' => array(

                'UserAdmin.email' => $email

            ),

        ));


    }





    public function beforeSave($options = array())
    {
        $passwordBlowfishHasher = new BlowfishPasswordHasher();


        if (isset($this->data[$this->alias]['password'])) {
            $password = $this->data[$this->alias]['password'];

            $salt = $password;

            $this->data['UserAdmin']['password'] = $passwordBlowfishHasher->hash($password);

        }
        return true;
    }


}?>