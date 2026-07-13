package com.yna.opusaimobilityapp;

import org.junit.Test;

import static org.junit.Assert.*;

/**
 * Example local unit test — executes on the development machine (JVM host).
 *
 * Package : com.yna.opusaimobilityapp
 * Matches : applicationId / namespace declared in app/build.gradle
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {

    /** Baseline arithmetic sanity check. */
    @Test
    public void addition_isCorrect() {
        assertEquals(4, 2 + 2);
    }

    /**
     * Verify Constants.BASE_URL is set to the OpusAIMobility CloudFront endpoint.
     * This is a compile-time constant — no network call is made.
     */
    @Test
    public void constants_baseUrl_isCloudFront() {
        assertEquals(
            "BASE_URL must point to the CloudFront WAF proxy",
            "https://opusaimobility.yna.co.ke/",
            com.yna.opusaimobilityapp.Constants.BASE_URL
        );
    }

    /** Verify the default currency is KSh (Kenya Shilling). */
    @Test
    public void constants_defaultCurrency_isKSh() {
        assertEquals("KSh", com.yna.opusaimobilityapp.Constants.defaultCurrency);
    }

    /** Verify the default country defaults are Kenya. */
    @Test
    public void constants_defaultCountry_isKenya() {
        assertEquals("KENYA", com.yna.opusaimobilityapp.Constants.defaultCountryName);
        assertEquals("+254",  com.yna.opusaimobilityapp.Constants.defaultCountryCode);
        assertEquals("KE",    com.yna.opusaimobilityapp.Constants.defaultCountryISOCode);
    }
}
