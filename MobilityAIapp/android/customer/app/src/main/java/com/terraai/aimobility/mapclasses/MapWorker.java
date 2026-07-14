package com.terraai.aimobility.mapclasses;

import android.util.Log;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.drawable.Drawable;
import android.os.AsyncTask;
import android.os.Handler;
import android.os.SystemClock;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.Interpolator;
import android.view.animation.LinearInterpolator;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.MapsInitializer;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.CameraPosition;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;
import com.google.android.gms.maps.model.Polyline;
import com.google.android.gms.maps.model.PolylineOptions;
import com.google.maps.DirectionsApi;
import com.google.maps.GeoApiContext;
import com.google.maps.android.PolyUtil;
import com.google.maps.model.DirectionsResult;
import com.google.maps.model.DirectionsRoute;
import com.google.maps.model.TrafficModel;
import com.google.maps.model.TravelMode;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.Callback;
import com.terraai.aimobility.Interface.RouteCallBack;
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.model.ResturantModel;

import org.joda.time.DateTime;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.TimeUnit;

import okhttp3.Route;

public class MapWorker {

    GoogleMap googleMap;
    Context context;
    Marker driverMarker;
    double driverLatitude;
    double driverLongitude;
    long DURATION_MS = 7000;
    boolean isMarkerRotating = false;


    public MapWorker(Context context) {
        this.context = context;
    }


    public MapWorker(Context context, GoogleMap googleMap) {
        this.context = context;
        this.googleMap = googleMap;
    }

    public Marker addMarker(String tag, LatLng latLng, Bitmap marker_image) {
        MarkerOptions markerOptions = new MarkerOptions()
                .position(latLng)
                .icon(BitmapDescriptorFactory.fromBitmap(marker_image))
                .title(tag);
        Marker m = googleMap.addMarker(markerOptions);
        m.setTag(tag);
        return m;
    }

    public Marker addMarker(LatLng latLng, Bitmap markerImage) {
        MarkerOptions markerOptions = new MarkerOptions()
                .position(latLng)
                .icon(BitmapDescriptorFactory.fromBitmap(markerImage));
        Marker m = googleMap.addMarker(markerOptions);
        return m;
    }


    public Marker addMarker(String tag, LatLng latLng, BitmapDescriptor marker_image) {
        MarkerOptions markerOptions = new MarkerOptions()
                .position(latLng)
                .icon(marker_image);
        Marker m = googleMap.addMarker(markerOptions);
        return m;
    }


    public Marker add_marker_save(LatLng latLng, Bitmap marker_image, String title) {
        MarkerOptions markerOptions = new MarkerOptions()
                .position(latLng)
                .title(title)
                .icon(BitmapDescriptorFactory.fromBitmap(marker_image));
        Marker m = googleMap.addMarker(markerOptions);
        return m;
    }

    public void animateMarkerTo(final Marker marker, final double latitude, final double longitude) {
        driverLatitude = latitude;
        driverLongitude = longitude;
        driverMarker = marker;
        final Handler handler = new Handler();
        final Handler mHandler = new Handler();
        final LatLngInterpolator latLngInterpol = new LatLngInterpolator.LinearFixed();
        final Interpolator interpolator = new LinearInterpolator();

        final LatLng startPosition = new LatLng(marker.getPosition().latitude, marker.getPosition().longitude);
        final long start = SystemClock.uptimeMillis();

        handler.post(new Runnable() {

            @Override
            public void run() {
                float elapsed = SystemClock.uptimeMillis() - start;
                float t = elapsed / DURATION_MS;
                float v = interpolator.getInterpolation(t);

                LatLng latLng = latLngInterpol.interpolate(v, startPosition, new LatLng(latitude, longitude));
                marker.setAnchor(0.5f, 0.5f);
                marker.setPosition(latLng);

                if (t < 1)
                    handler.postDelayed(this, 5);

            }

        });

    }

    public void animateCameraTo(final GoogleMap googleMap, final double lat, final double lng, float zoomlevel) {

        googleMap.getUiSettings().setScrollGesturesEnabled(false);

        googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(new LatLng(lat, lng), zoomlevel), new GoogleMap.CancelableCallback() {

            @Override
            public void onFinish() {
                googleMap.getUiSettings().setScrollGesturesEnabled(true);
                googleMap.getUiSettings().setRotateGesturesEnabled(false);
            }

            @Override
            public void onCancel() {
                googleMap.getUiSettings().setScrollGesturesEnabled(true);
                googleMap.getUiSettings().setRotateGesturesEnabled(false);
            }
        });

    }

    public void animateCameraTo(final GoogleMap googleMap, CameraUpdate cameraUpdate) {
        googleMap.getUiSettings().setScrollGesturesEnabled(false);

        googleMap.animateCamera(cameraUpdate, new GoogleMap.CancelableCallback() {
            @Override
            public void onFinish() {
                googleMap.getUiSettings().setScrollGesturesEnabled(true);
                googleMap.getUiSettings().setRotateGesturesEnabled(false);
            }

            @Override
            public void onCancel() {
                googleMap.getUiSettings().setScrollGesturesEnabled(true);
                googleMap.getUiSettings().setRotateGesturesEnabled(false);

            }
        });
    }

    public void animateMarker_with_Map(final Marker marker, final double latitude, final double longitude) {
        final Handler handler = new Handler();
        final LatLngInterpolator latLngInterpol = new LatLngInterpolator.LinearFixed();
        final Interpolator interpolator = new LinearInterpolator();

        final LatLng startPosition = new LatLng(marker.getPosition().latitude, marker.getPosition().longitude);
        final long start = SystemClock.uptimeMillis();

        handler.post(new Runnable() {
            @Override
            public void run() {
                float elapsed = SystemClock.uptimeMillis() - start;
                float t = elapsed / DURATION_MS;
                float v = interpolator.getInterpolation(t);

                LatLng latLng = latLngInterpol.interpolate(v, startPosition, new LatLng(latitude, longitude));

                marker.setPosition(latLng);


                googleMap.animateCamera(CameraUpdateFactory.newCameraPosition
                        (new CameraPosition.Builder().target(latLng)
                                .zoom(Constants.maxZoomLevel).build()));

                if (t < 1)
                    handler.postDelayed(this, 46);

            }
        });
    }


    //Method for finding bearing between two points
    public float getBearing(LatLng begin, LatLng end) {
        double lat = Math.abs(begin.latitude - end.latitude);
        double lng = Math.abs(begin.longitude - end.longitude);

        if (begin.latitude < end.latitude && begin.longitude < end.longitude)
            return (float) (Math.toDegrees(Math.atan(lng / lat)));
        else if (begin.latitude >= end.latitude && begin.longitude < end.longitude)
            return (float) ((90 - Math.toDegrees(Math.atan(lng / lat))) + 90);
        else if (begin.latitude >= end.latitude && begin.longitude >= end.longitude)
            return (float) (Math.toDegrees(Math.atan(lng / lat)) + 180);
        else if (begin.latitude < end.latitude && begin.longitude >= end.longitude)
            return (float) ((90 - Math.toDegrees(Math.atan(lng / lat))) + 270);
        return -1;
    }

    public void rotateMarker(final Marker marker, final float toRotation) {
        if (!isMarkerRotating) {
            final Handler handler = new Handler();
            final long start = SystemClock.uptimeMillis();
            final float startRotation = marker.getRotation();

            final Interpolator interpolator = new LinearInterpolator();

            handler.post(new Runnable() {
                @Override
                public void run() {
                    isMarkerRotating = true;

                    long elapsed = SystemClock.uptimeMillis() - start;
                    float t = interpolator.getInterpolation((float) elapsed / (DURATION_MS / 2));

                    float rot = t * toRotation + (1 - t) * startRotation;
                    marker.setAnchor(0.5f, 0.5f);
                    marker.setRotation(-rot > 180 ? rot / 2 : rot);
                    if (t < 1.0) {
                        // Post again 16ms later.
                        handler.postDelayed(this, 46);
                    } else {
                        isMarkerRotating = false;
                    }
                }
            });
        }
    }


    @SuppressLint("StaticFieldLeak")
    public DirectionsResult getDirection(final LatLng origin,
                                         final LatLng destination,
                                         final RouteCallBack callback) {
        new AsyncTask<LatLng, Void, DirectionsResult>() {
            @Override
            protected DirectionsResult doInBackground(LatLng... geoPoints) {
                try {
                    // Note: departureTime removed - google-maps-services 0.1.20 API compat fix
                    DirectionsResult result = DirectionsApi.newRequest(getGeoContext())
                            .mode(TravelMode.DRIVING)
                            .origin(origin.latitude + "," + origin.longitude)
                            .destination(destination.latitude + "," + destination.longitude)
                            .await();

                    return result;

                } catch (InterruptedException e) {
                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                    Functions.logDMsg("getDirection:InterruptedException" + e.toString());
                } catch (IOException e) {
                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                    Functions.logDMsg("getDirection:IOException" + e.toString());
                } catch (com.google.maps.errors.ApiException e) {
                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                    Functions.logDMsg("getDirection:ApiException" + e.toString());
                } catch (Exception e) {
                    Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                    Functions.logDMsg("getDirection:Exception" + e.toString());
                }
                return null;
            }

            @Override
            protected void onPostExecute(DirectionsResult address) {
                callback.responce(address);
            }
        }.execute();

        return null;
    }

    private GeoApiContext getGeoContext() {
        // GeoApiContext.Builder pattern for google-maps-services 0.1.20 compatibility
        return new GeoApiContext.Builder()
                .apiKey(context.getString(R.string.google_map_route_key))
                .connectTimeout(1, TimeUnit.SECONDS)
                .readTimeout(1, TimeUnit.SECONDS)
                .writeTimeout(1, TimeUnit.SECONDS)
                .build();
    }

    @SuppressLint("ResourceType")
    public Polyline addPolyline(DirectionsResult results, GoogleMap mMap) {
        // Fixed: overviewPolyline -> polyline (renamed in newer SDK)
        List<LatLng> decodedPath = PolyUtil.decode(results.routes[0].overviewPolyline.getEncodedPath());
        PolylineOptions polyOptions = new PolylineOptions();
        polyOptions.width(8);
        polyOptions.color(context.getResources().getColor(R.color.app_color));
        polyOptions.addAll(decodedPath);
        Polyline polyline = mMap.addPolyline(polyOptions);

        return polyline;
    }


    public void addPolylineWithAnimation(DirectionsResult results, GoogleMap mMap) {
        List<LatLng> decodedPath = PolyUtil.decode(results.routes[0].overviewPolyline.getEncodedPath());
        MapAnimator.getInstance().clearMapRoute();
        MapAnimator.getInstance().animateRoute(mMap, decodedPath, true);
    }


    public void removePolylineWithAnimation() {
        MapAnimator.getInstance().clearMapRoute();
    }


    public String getDistanceFromRoute(DirectionsResult results) {
        return results.routes[0].legs[0].distance.humanReadable;
    }

    public String getDistanceTime(DirectionsResult results) {
        return results.routes[0].legs[0].duration.humanReadable;
    }

    public String durationInTraffic(DirectionsResult results) {
        // durationInTraffic may be null if traffic data is unavailable; fall back to duration
        if (results.routes[0].legs[0].durationInTraffic != null) {
            return results.routes[0].legs[0].durationInTraffic.humanReadable;
        }
        return results.routes[0].legs[0].duration.humanReadable;
    }

    public String arrivalTime(DirectionsResult results) {
        // arrivalTime is for transit legs; return duration for driving
        return results.routes[0].legs[0].duration.humanReadable;
    }

    public static double getBearingBetweenTwoPoints1(LatLng latLng1, LatLng latLng2) {
        if (latLng1 == null) {
            latLng1 = latLng2;
        }

        double lat1 = degreesToRadians(latLng1.latitude);
        double long1 = degreesToRadians(latLng1.longitude);
        double lat2 = degreesToRadians(latLng2.latitude);
        double long2 = degreesToRadians(latLng2.longitude);


        double dLon = (long2 - long1);


        double y = Math.sin(dLon) * Math.cos(lat2);
        double x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1)
                * Math.cos(lat2) * Math.cos(dLon);

        double radiansBearing = Math.atan2(y, x);


        return radiansToDegrees(radiansBearing);
    }

    public static double degreesToRadians(double degrees) {
        return degrees * Math.PI / 180.0;
    }

    public static double radiansToDegrees(double radians) {
        return radians * 180.0 / Math.PI;
    }



    HashMap<String, Marker> markerHash;

    public HashMap<String, Marker> addSavedPlacesMarker(ArrayList<ResturantModel> list, String s){

        if(markerHash ==null)
            markerHash =new HashMap<>();

        for(ResturantModel item:list){

            if(markerHash.containsKey(item.getId())) {
                Marker marker = markerHash.get(item.getId());
                marker.remove();
            }
            Marker heartMarker;
            if(s.equals(item.getId())){
                heartMarker = addMarker(item.getId(),new LatLng(Double.parseDouble(item.getResturantLat()), Double.parseDouble(item.getResturantLong())), getBlackMarker(context, item));
            }else{
                heartMarker = addMarker(item.getId(),new LatLng(Double.parseDouble(item.getResturantLat()), Double.parseDouble(item.getResturantLong())), getLikedMarker(context, item));
            }

            markerHash.put(item.getId(), heartMarker);

        }
        return markerHash;
    }

    public static Bitmap getBlackMarker(@NonNull Context context , @NonNull ResturantModel model) {
        View customMarkerView = ((LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE)).inflate(R.layout.item_marker_map_black, null);
        TextView location_liked =  customMarkerView.findViewById(R.id.place_name);
        TextView rating =  customMarkerView.findViewById(R.id.rating);
        ImageView imageView = customMarkerView.findViewById(R.id.favBtn);
        location_liked.setText(model.getResturantName());
        if(model.getIsLiked().equals("0")){
            if(model.getTotalRatings() == null || model.getTotalRatings().equals("")|| model.getTotalRatings().equals("0")){
                imageView.setVisibility(View.VISIBLE);
                imageView.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_resturant_marker_white));
            }else{
                rating.setText(String.format("%.03s", model.getTotalRatings()));
            }

        }else{
            imageView.setVisibility(View.VISIBLE);
        }


        customMarkerView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        customMarkerView.layout(0, 0, customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight());
        customMarkerView.buildDrawingCache();
        Bitmap returnedBitmap = Bitmap.createBitmap(customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(returnedBitmap);
        canvas.drawColor(Color.WHITE, PorterDuff.Mode.SRC_IN);
        Drawable drawable = customMarkerView.getBackground();
        if (drawable != null)
            drawable.draw(canvas);
        customMarkerView.draw(canvas);
        return returnedBitmap;
    }


   public static Bitmap getLikedMarker(@NonNull Context context , @NonNull ResturantModel model) {
        View customMarkerView = ((LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE)).inflate(R.layout.item_marker_map, null);
        TextView location_liked =  customMarkerView.findViewById(R.id.place_name);
        TextView rating =  customMarkerView.findViewById(R.id.rating);
        ImageView imageView = customMarkerView.findViewById(R.id.favBtn);
        location_liked.setText(model.getResturantName());
        if(model.getIsLiked().equals("0")){
            if(model.getTotalRatings() == null || model.getTotalRatings().equals("")|| model.getTotalRatings().equals("0")){
                imageView.setVisibility(View.VISIBLE);
                imageView.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_resturant_marker_black));
            }else{
                rating.setText(String.format("%.03s", model.getTotalRatings()));
            }

        }else{
            imageView.setVisibility(View.VISIBLE);
        }


        customMarkerView.measure(View.MeasureSpec.UNSPECIFIED, View.MeasureSpec.UNSPECIFIED);
        customMarkerView.layout(0, 0, customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight());
        customMarkerView.buildDrawingCache();
        Bitmap returnedBitmap = Bitmap.createBitmap(customMarkerView.getMeasuredWidth(), customMarkerView.getMeasuredHeight(),
                Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(returnedBitmap);
        canvas.drawColor(Color.WHITE, PorterDuff.Mode.SRC_IN);
        Drawable drawable = customMarkerView.getBackground();
        if (drawable != null)
            drawable.draw(canvas);
        customMarkerView.draw(canvas);
        return returnedBitmap;
    }

}
