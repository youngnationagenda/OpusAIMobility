<?php



class Tax extends AppModel
{
    public $useTable = 'tax';

    public $belongsTo = array(
        'Country' => array(
            'className' => 'Country',
            'foreignKey' => 'country_id',

        ),


    );




    public function isDuplicateRecord($city,$state,$country_id)
    {
        return $this->find('count', array(
            'conditions' => array(

                'Tax.city' => $city,
                'Tax.state'=> $state,
                'Tax.country_id'=> $country_id,





            )
        ));
    }

    public function getTaxID($state,$country)
    {
        return $this->find('all', array(
            'conditions' => array(


                'Tax.state LIKE'=> "%".$state."%",
                'Tax.country LIKE'=> "%".$country."%",





            )
        ));
    }

    public function getDetail($id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'Tax.id' => $id,






            )
        ));
    }


    public function getAll()
    {
        return $this->find('all');
    }
    public function getTaxesCount()
    {
        return $this->find('count');
    }

    public function getCities()
    {
        return $this->find('all',array(

            'order' => 'Tax.city ASC',

            'fields' => array('Tax.city'),
            // 'group' => array('Currency.country')

        ));

    }
    public function getCountries()
    {
        return $this->find('all',array(

            'order' => 'country ASC',

            'fields' => array('Tax.country','Tax.country_code'),
            'group' => array('Tax.country')

        ));

    }
    /*  public function getCities()
      {
          return $this->find('all',array(

              'order' => 'city ASC',

              'fields' => array('Tax.city','Tax.state','Tax.country'),
              'group' => array('Tax.city')

          ));

      }*/

    public function getStates()
    {
        return $this->find('all',array(

            'order' => 'state ASC',

            'fields' => array('Tax.state'),
            'group' => array('Tax.state')

        ));

    }


    public function beforeSave($options = array())
    {



        if (isset($this->data[$this->alias]['city'])
            && isset($this->data[$this->alias]['state'])) {


            $city = strtolower($this->data[$this->alias]['city']);

            $state = strtolower($this->data[$this->alias]['state']);







            $this->data['Tax']['city'] = ucwords($city);

            $this->data['Tax']['state'] = ucwords($state);


        }
        return true;
    }

}