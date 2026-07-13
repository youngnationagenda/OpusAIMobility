package com.yna.opusaimobilityapp.Interface;

import androidx.annotation.NonNull;

import com.yna.opusaimobilityapp.codeclasses.CreditCardBrand;


public interface CreditCardNumberListener {

    void onChanged(@NonNull String number, @NonNull CreditCardBrand brand);
}
