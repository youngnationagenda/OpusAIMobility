package com.terraai.aimobility.Interface;

import androidx.annotation.NonNull;

import com.terraai.aimobility.codeclasses.CreditCardBrand;


public interface CreditCardNumberListener {

    void onChanged(@NonNull String number, @NonNull CreditCardBrand brand);
}
