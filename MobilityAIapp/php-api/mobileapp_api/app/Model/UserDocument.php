<?php


class UserDocument extends AppModel
{
    public $useTable = 'user_document';

    public $belongsTo = array(
        'User' => array(
            'className' => 'User',
            'foreignKey' => 'user_id',
            //'fields' => array('User.id','User.email','User.username','User.image','User.device_token')

        ),


    );


    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('UserDocument.id' => $id)
        ));

    }

    public function getUserDocument($user_id)
    {

        return $this->find('all', array(
            'conditions' => array('UserDocument.user_id' => $user_id),
            'recursive'=>-1
        ));

    }

    public function getUserDocumentAgainstType($user_id,$type)
    {

        return $this->find('first', array(
            'conditions' => array(
                'UserDocument.user_id' => $user_id,
                'UserDocument.type' => $type

            ),
            'recursive'=>-1
        ));

    }







    public function getAll()
    {

        return $this->find('all');

    }





}

?>