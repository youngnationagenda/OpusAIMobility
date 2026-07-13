package com.yna.opusaimobilityapp.codeclasses;

import android.content.Context;
import android.location.Address;
import android.location.Geocoder;

import com.google.android.gms.maps.model.LatLng;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;


public class GeoHelper {
    public static String stAddress;
    private static Geocoder fancyGeocoder = null;

    public static void initGeocoder(Context context) {
        fancyGeocoder = new Geocoder(context, Locale.ENGLISH);
    }

    public static List<Address> getAddressSubString(double LATITUDE, double LONGITUDE) {

        List<Address> addresses = null;
        try {
            addresses = fancyGeocoder.getFromLocation(LATITUDE, LONGITUDE, 1);
        } catch (IOException e) {
            e.printStackTrace();
        }
        return addresses;
    }

    public static List<Address> getAddressesAtPoint(final LatLng location, final int maxResults, int maxAddressLines) {
        List<String> addressList = new ArrayList<String>();
        List<Address> possibleAddresses = new ArrayList<Address>();
        Address address = new Address(Locale.getDefault());
        String addressString = "Could not find the address...";
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Callable<List<Address>> callable = new Callable<List<Address>>() {
            @Override
            public List<Address> call() throws IOException {
                return fancyGeocoder.getFromLocation(location.latitude,
                        location.longitude, maxResults);
            }
        };
        Future<List<Address>> future = executor.submit(callable);
        try {
            possibleAddresses = future.get();
        } catch (InterruptedException e1) {
            possibleAddresses = GeoHelper.getAddressSubString(location.latitude,
                    location.longitude);
        } catch (ExecutionException e1) {
            possibleAddresses = GeoHelper.getAddressSubString(location.latitude,
                    location.longitude);
        }
        executor.shutdown();

        if (possibleAddresses != null && possibleAddresses.size() > 0) {
            stAddress = possibleAddresses.get(0).getFeatureName();
            for (int i = 0; i < possibleAddresses.size(); i++) {
                addressString = "";
                address = possibleAddresses.get(i);
                for (int j = 0; j <= address.getMaxAddressLineIndex() && j <= maxAddressLines; j++) {
                    addressString += address.getAddressLine(j);
                    addressString += "\n";
                }
                addressList.add(addressString.trim());
            }
            Functions.logDMsg("addressList : " + addressList);
            Functions.logDMsg("getFeatureName : " + possibleAddresses.get(0).getFeatureName());

            if (stAddress==null) {
                stAddress = possibleAddresses.get(0).getAddressLine(0);
            }
        }

        return possibleAddresses;
    }
}
