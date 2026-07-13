package com.yna.opusaimobilityapp.firebasenotification;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.NotificationCompat;

import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.ride.activeride.ActiveRideA;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.userschat.ChatA;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Set;

public class Notification_Receive extends FirebaseMessagingService {

    String receiverID;
    String title;
    String message;
    String senderID;
    String type;
    String requestID;
    String image;
    DatabaseReference rootref;
    SharedPreferences sharedPreferences;

    @SuppressLint("WrongThread")
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {

        rootref = FirebaseDatabase.getInstance().getReference();

        if (remoteMessage.getData().size() > 0) {
            sharedPreferences = getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);

            title = remoteMessage.getData().get("title");
            message = remoteMessage.getData().get("body");
            type = remoteMessage.getData().get("type");
            receiverID = remoteMessage.getData().get("user_id");
            senderID = remoteMessage.getData().get("sender_id");
            requestID = remoteMessage.getData().get("request_id");
            image = remoteMessage.getData().get("image");

            try {
            JSONObject json = new JSONObject();
            Set<String> keys = remoteMessage.getData().keySet();
            for (String key : keys) {
                json.put(key, JSONObject.wrap(remoteMessage.getData().get(key)));
                Functions.logDMsg(json.toString());
            }

            if(json.has("sender")){
                JSONObject sender=new JSONObject(json.optString("sender"));
                title=sender.optString("first_name")+" "+sender.optString("last_name") ;
                senderID=sender.optString("id");
                image = sender.optString("image");
            }

            if(json.has("receiver")){
                JSONObject receiver=new JSONObject(json.optString("receiver"));
                receiverID = receiver.optString("id");
            }

            } catch(JSONException e) {

            }


            if((type!=null && type.equalsIgnoreCase("chat"))){
                if(requestID!=null && !requestID.equals(ChatA.requestId))
                    showNotification(this);
            }
            else
                showNotification(this);


            if (type != null && type.equals("request_accepted")) {
                Intent intent1 = new Intent();
                intent1.setAction("request_responce");
                intent1.putExtra("type", type);
                intent1.setPackage(getPackageName());
                sendBroadcast(intent1);
            }

            else if (type != null && type.equals("ride_cancel")) {
                Intent intent1 = new Intent();
                intent1.setAction("request_responce");
                intent1.putExtra("type", type);
                intent1.setPackage(getPackageName());
                sendBroadcast(intent1);
            }

            else if (type != null && type.equalsIgnoreCase("single_message")) {
                Intent intent1 = new Intent();
                intent1.setAction("request_responce");
                intent1.putExtra("type", type);
                intent1.putExtra("receiver", receiverID);
                intent1.putExtra("request_id", requestID);
                intent1.setPackage(getPackageName());
                sendBroadcast(intent1);
            }

            else {
                Intent intent1 = new Intent();
                intent1.setAction("request_responce");
                intent1.putExtra("type", type);
                intent1.setPackage(getPackageName());
                sendBroadcast(intent1);
            }
        }
    }

    @Override
    public void onNewToken(String s) {
        super.onNewToken(s);
        sharedPreferences = getSharedPreferences(MyPreferences.prefName, MODE_PRIVATE);
        if ((s != null || !s.equals("null")) && (!s.equals("") || sharedPreferences.getString(MyPreferences.uToken, "null")
                .equals("null")))
            sharedPreferences.edit().putString(MyPreferences.uToken, s).commit();
    }

    public void showNotification(Context context) {

        final String CHANNEL_ID = "default";
        final String CHANNEL_NAME = "Default";

        Intent myintent;
        if(type!=null && type.equals("chat")){
            Functions.logDMsg("showNotification:"+type);
            myintent = new Intent(context, ChatA.class);
            myintent.putExtra("senderid", receiverID);
            myintent.putExtra("Receiverid", senderID);
            myintent.putExtra("Receiver_name", title);
            myintent.putExtra("Receiver_pic", image);
            myintent.putExtra("request_id", requestID);
        }
        else {
            myintent = new Intent(context, ActiveRideA.class);
            Bundle args = new Bundle();
            args.putString("senderid", MyPreferences.getSharedPreference(context).getString(MyPreferences.USER_ID, ""));
            args.putString("Receiverid", receiverID);
            args.putString("Receiver_name", title);
            args.putString("type", type);
            args.putString("pushnotification", "yes");
            args.putString("image", image);
            args.putString("request_id", requestID);
            args.putString("call", "requestId");
            myintent.putExtras(args);
        }

        myintent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent pendingIntent=null;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntent = PendingIntent.getActivity(getApplicationContext(), 0, myintent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        }
        else {
            pendingIntent = PendingIntent.getActivity(getApplicationContext(), 0, myintent, PendingIntent.FLAG_UPDATE_CURRENT);
        }

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel defaultChannel = new NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
            notificationManager.createNotificationChannel(defaultChannel);
        }



        Uri defaultSoundUri= RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder builder = (NotificationCompat.Builder) new NotificationCompat.Builder(context,CHANNEL_ID)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(title))
                .setStyle(new NotificationCompat.BigTextStyle().bigText(message))
                .setSmallIcon(R.mipmap.ic_launcher)
                .setPriority(Notification.PRIORITY_MAX)
                .setContentTitle(title)
                .setContentText(message)
                .setSound(defaultSoundUri)
                .setContentIntent(pendingIntent);

        Notification notification = builder.build();
        notification.defaults |= Notification.DEFAULT_VIBRATE;
        notificationManager.notify(100, notification);


    }

}
