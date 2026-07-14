<?php

class Currency extends AppModel
{
    public $useTable = 'currency';


    public function getCurrency()
    {


        return $this->find('first');
    }

    public function isDuplicateRecord($data)
    {
        return $this->find('count', array(
            'conditions' => array(

                'Currency.country' => $data['country'],
                'Currency.currency'=> $data['currency'],
                'Currency.code'=> $data['code'],
                'Currency.symbol'=> $data['symbol']





            )
        ));
    }

    public function getCurrencyID($country)
    {
        return $this->find('all', array(
            'conditions' => array(



                'Currency.country LIKE'=> "%".$country."%",





            )
        ));
    }

    public function getCountries()
    {
        return $this->find('all',array(

            'order' => 'country ASC',

            'fields' => array('Currency.country'),
            'group' => array('Currency.country')

        ));

    }
    public function getCurrencyDetail($id)
    {
        return $this->find('all', array(
            'conditions' => array(

                'Currency.id' => $id,






            )
        ));
    }


    public function getCurrencyAgainstCountry($country_id)
    {
        return $this->find('first', array(
            'conditions' => array(

                'Currency.country_id' => $country_id,






            )
        ));
    }


    public function getCurrencies()
    {
        return $this->find('all');
    }

    public function getCurrenciesCount()
    {
        return $this->find('count');
    }



    public function beforeSave($options = array())
    {



        if (isset($this->data[$this->alias]['currency'])
            && isset($this->data[$this->alias]['country']) && isset($this->data[$this->alias]['code'])) {


            $currency = strtolower($this->data[$this->alias]['currency']);

            $country = strtolower($this->data[$this->alias]['country']);







            $this->data['Currency']['city'] = ucwords($currency);


            $this->data['Currency']['country'] = ucwords($country);

        }
        return true;
    }
}
?>