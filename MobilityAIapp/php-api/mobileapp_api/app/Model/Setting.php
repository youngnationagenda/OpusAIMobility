<?php


class Setting extends AppModel
{
    public $useTable = 'setting';





    public function getDetails($id)
    {

        return $this->find('first', array(
            'conditions' => array('Setting.id' => $id)
        ));

    }



    public function getAll()
    {

        return $this->find('all');

    }

    public function checkDuplicate($data)
    {

        return $this->find('count', array(
            'conditions' => array(
                'Setting.name' => $data['name']


            )
        ));

    }

    public function getDefaultTimeZone()
    {

        return $this->find('first', array(
            'conditions' => array(
                'Setting.type' => 'timezone'


            ),
            'fields' => array('Setting.source'),
        ));

    }

    public function getActiveAgainstCategory($category,$active)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.active' => $active,
                'Setting.category' => $category,



            ),

        ));

    }


    public function getSettingsAgainstType($type)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.type IN' => $type


            )
        ));

    }




    public function getSettings($type)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.type' => $type


            )
        ));

    }

    public function getSettingsAgainstCategoryAndType($category,$type)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.category' => $category,
                'Setting.type LIKE' => $type.'%',


            )
        ));

    }

    public function getSettingsAgainstCategory($category)
    {

        return $this->find('all', array(
            'conditions' => array(
                'Setting.category' => $category


            )
        ));

    }

    public function updateSettingsAgainstCategoryAndType($category,$active,$type){


        $this->updateAll(
            array(


                'Setting.active' => $active



            ),
            array(

                'Setting.category' => $category,
                'Setting.type LIKE' => $type.'%',


                )
        );

    }


    public function updateSettingsAgainstCategory($category,$active){


        $this->updateAll(
            array(


                'Setting.active' => $active



            ),
            array(

                'Setting.category' => $category,



            )
        );

    }












}

?>