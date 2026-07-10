package com.terraai.aimobility.userschat;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.widget.AbsListView;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.recyclerview.widget.SimpleItemAnimator;

import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;
// AWS-MIGRATED: import com.google.firebase.database.ChildEventListener;
// AWS-MIGRATED: import com.google.firebase.database.DataSnapshot;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseError;
// AWS-MIGRATED: import com.google.firebase.database.DatabaseReference;
// AWS-MIGRATED: import com.google.firebase.database.FirebaseDatabase;
// AWS-MIGRATED: import com.google.firebase.database.Query;
// AWS-MIGRATED: import com.google.firebase.database.ValueEventListener;
import com.terraai.aimobility.R;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.AppCompatLocaleActivity;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.Variables;
import com.terraai.aimobility.databinding.FragmentChatBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import me.everything.android.ui.overscroll.OverScrollDecoratorHelper;


public class ChatA extends AppCompatLocaleActivity {
     public String senderid, receiverid, receiverName, receiverPic;
     FragmentChatBinding binding;
     public static  String requestId = "0";
     String fullName, userPic;
     Intent bundle;
     // [AWS] DatabaseReference rootref replaced — use AWSManager REST API
        Object rootref = null;
     // [AWS] DatabaseReference mchatRefReteriving replaced — use AWSManager REST API
        Object mchatRefReteriving = null;
     // [AWS] DatabaseReference sendTypingIndication replaced — use AWSManager REST API
        Object sendTypingIndication = null;
     // [AWS] DatabaseReference receiveTypingIndication replaced — use AWSManager REST API
        Object receiveTypingIndication = null;
     List<Chat_GetSet> mChats = new ArrayList<>();
     ChatAdapter mAdapter;
     Query queryGetchat;
     BroadcastReceiver downloadReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {

            if (mAdapter != null) {
                mAdapter.notifyDataSetChanged();
            }
        }
    };
     ValueEventListener valueEventListener;
     ChildEventListener eventListener;



    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Functions.setLocale(MyPreferences.getSharedPreference(this).getString(MyPreferences.setlocale, Variables.DEFAULT_LANGUAGE_CODE)
                , this, getClass(),false);
        binding = FragmentChatBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        bundle = getIntent();
        IntentFilter filter = new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE);
        registerReceiver(downloadReceiver, filter);
        rootref = null; // [AWS-MIGRATED] FirebaseDatabase removed
        methodGetBundle();
        methodInitClickListener();


        //get all the privous chat of th user which spacifc user

        final LinearLayoutManager layout = new LinearLayoutManager(this);
        layout.setStackFromEnd(true);
        binding.recyclerView.setLayoutManager(layout);
        binding.recyclerView.setHasFixedSize(false);
        mAdapter = new ChatAdapter(mChats, senderid, this, new ChatAdapter.OnItemClickListener() {
            @Override
            public void onItemClick(int postion, Chat_GetSet item, View v) {

            }

        }, new ChatAdapter.OnLongClickListener() {
            @Override
            public void onLongclick(Chat_GetSet item, View view) {

                if (senderid.equals(item.getSender_id()))
                    deleteMessageDialog(item);

            }
        });

        binding.recyclerView.setAdapter(mAdapter);
        binding.recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {

            boolean userScrolled;
            int scrollOutitems;

            @Override
            public void onScrollStateChanged(@NonNull RecyclerView recyclerView, int newState) {
                super.onScrollStateChanged(recyclerView, newState);
                if (newState == AbsListView.OnScrollListener.SCROLL_STATE_TOUCH_SCROLL) {
                    userScrolled = true;
                }
            }


            @Override
            public void onScrolled(@NonNull RecyclerView recyclerView, int dx, int dy) {
                super.onScrolled(recyclerView, dx, dy);

                scrollOutitems = layout.findFirstCompletelyVisibleItemPosition();

                if (userScrolled && (scrollOutitems == 0 && mChats.size() > 9)) {
                    userScrolled = false;
                    rootref.child("chat").child(requestId).orderByChild("chat_id")
                            .endAt(mChats.get(0).getChat_id()).limitToLast(20)
                            .addListenerForSingleValueEvent(new ValueEventListener() {
                                @Override
                                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                                    ArrayList<Chat_GetSet> arrayList = new ArrayList<>();
                                    for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                                        Chat_GetSet item = snapshot.getValue(Chat_GetSet.class);
                                        arrayList.add(item);
                                    }
                                    for (int i = arrayList.size() - 2; i >= 0; i--) {
                                        mChats.add(0, arrayList.get(i));
                                    }

                                    mAdapter.notifyDataSetChanged();
                                    binding.recyclerView.scrollToPosition(mChats.size()-1);


                                }

                                @Override
                                public void onCancelled(@NonNull DatabaseError databaseError) {
                                    databaseError.getMessage();
                                }
                            });
                }
            }
        });


        receivetypeindication();

        binding.getRoot().setFocusableInTouchMode(true);
        binding.getRoot().requestFocus();
        binding.getRoot().setOnKeyListener(new View.OnKeyListener() {
            @Override
            public boolean onKey(View v, int keyCode, KeyEvent event) {
                if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_UP) {
                    finish();
                    return false;
                }
                return true;
            }
        });


    }


    private void methodInitClickListener() {
        binding.backBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Functions.hideSoftKeyboard(ChatA.this);
                finish();
            }
        });


        binding.typedMessageEdit.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                if (!hasFocus) {
                    sendTypingIndicator(false);
                }
            }
        });

        binding.typedMessageEdit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (s.length() > 0) {
                    sendTypingIndicator(true);
                    binding.sendMessageIcon.setEnabled(true);
                    binding.sendMessageIcon.setBackground(ContextCompat.getDrawable(ChatA.this ,R.drawable.ic_meesage_send_app_color));
                } else {
                    sendTypingIndicator(false);
                    binding.sendMessageIcon.setEnabled(false);
                    binding.sendMessageIcon.setBackground(ContextCompat.getDrawable(ChatA.this  ,R.drawable.ic_meesage_send_grey));
                }
            }

            @Override
            public void afterTextChanged(Editable s) {
            }
        });


        binding.sendMessageIcon.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!TextUtils.isEmpty(binding.typedMessageEdit.getText().toString())) {
                    sendMessage(binding.typedMessageEdit.getText().toString());
                    binding.typedMessageEdit.setText(null);
                }
            }
        });

    }

    private void methodGetBundle() {
        fullName = MyPreferences.getSharedPreference(this).getString(MyPreferences.fname, "") + " " +
                MyPreferences.getSharedPreference(this).getString(MyPreferences.lname, "");
        userPic = MyPreferences.getSharedPreference(this).getString(MyPreferences.image, "");

        // the sender id and reciever id from the back activity to which we come from
        if (bundle != null) {

            senderid = bundle.getStringExtra("senderid");
            receiverid = bundle.getStringExtra("Receiverid");
            receiverName = bundle.getStringExtra("Receiver_name");
            receiverPic = "" + bundle.getStringExtra("Receiver_pic");
            requestId = "" + bundle.getStringExtra("request_id");

            Functions.logDMsg("senderID:" + senderid);
            Functions.logDMsg("receiverid:" + receiverid);
            Functions.logDMsg("receiverName:" + receiverName);
            Functions.logDMsg("receiverPic:" + receiverPic);
            Functions.logDMsg("requestId:" + requestId);



            binding.userName.setText(receiverName);

            MyPreferences.getSharedPreference(this).edit().putString(MyPreferences.chatRecieverId, receiverid).apply();

            rootref.child("Users").child(receiverid).addListenerForSingleValueEvent(new ValueEventListener() {
                @Override
                public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                    if (dataSnapshot.exists()) {
                        receiverPic = dataSnapshot.child("user_pic").getValue().toString();
                        receiverName = dataSnapshot.child("user_name").getValue().toString();
                    }
                }

                @Override
                public void onCancelled(@NonNull DatabaseError databaseError) {
                }
            });
        }

    }


    @Override
    public void onStart() {
        super.onStart();

        mChats.clear();
        mchatRefReteriving = null; // [AWS-MIGRATED] FirebaseDatabase removed
        queryGetchat = mchatRefReteriving.child("chat").child(requestId);


        // this will get all the messages between two users
        eventListener = new ChildEventListener() {
            @Override
            public void onChildAdded(@NonNull DataSnapshot dataSnapshot, String s) {
                try {
                    Chat_GetSet model = dataSnapshot.getValue(Chat_GetSet.class);
                    mChats.add(model);
                    mAdapter.notifyDataSetChanged();
                    binding.recyclerView.scrollToPosition(mChats.size() - 1);
                } catch (Exception ex) {
                    Log.e("", ex.getMessage());
                }
                changeStatus();
            }

            @Override
            public void onChildChanged(@NonNull DataSnapshot dataSnapshot, String s) {

                if (dataSnapshot != null && dataSnapshot.getValue() != null) {
                    try {
                        Chat_GetSet model = dataSnapshot.getValue(Chat_GetSet.class);
                        for (int i = mChats.size() - 1; i >= 0; i--) {
                            if (mChats.get(i).getTimestamp().equals(dataSnapshot.child("timestamp").getValue())) {
                                mChats.remove(i);
                                mChats.add(i, model);
                                break;
                            }
                        }
                        mAdapter.notifyDataSetChanged();
                        binding.recyclerView.scrollToPosition(mChats.size() - 1);
                    } catch (Exception ex) {
                        Log.e("", ex.getMessage());
                    }
                }
            }

            @Override
            public void onChildRemoved(@NonNull DataSnapshot dataSnapshot) {
            }

            @Override
            public void onChildMoved(@NonNull DataSnapshot dataSnapshot, String s) {
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
                Log.d("", databaseError.getMessage());
            }
        };


        //this will check the two user are do chat before or not
        valueEventListener = new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                if (dataSnapshot.hasChild(senderid + "-" + receiverid)) {
                    binding.progressBar.setVisibility(View.GONE);
                    queryGetchat.removeEventListener(valueEventListener);
                } else {
                    binding.progressBar.setVisibility(View.GONE);
                    queryGetchat.removeEventListener(valueEventListener);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {

            }
        };


        queryGetchat.limitToLast(20).addChildEventListener(eventListener);
        mchatRefReteriving.child("chat").addValueEventListener(valueEventListener);
    }

    //this method will change the status to ensure that
    //user is seen all the message or not (in both chat node and Chatinbox node)
    private void changeStatus() {
        final Date c = Calendar.getInstance().getTime();
        final DatabaseReference reference = null; // [AWS-MIGRATED] FirebaseDatabase removed
        final Query query1 = reference.child("chat").child(requestId).orderByChild("status").equalTo("0");

        query1.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                for (DataSnapshot nodeDataSnapshot : dataSnapshot.getChildren()) {
                    if (!nodeDataSnapshot.child("sender_id").getValue().equals(senderid)) {
                        String key = nodeDataSnapshot.getKey(); // this key is `K1NRz9l5PU_0CFDtgXz`
                        String path = "chat" + "/" + dataSnapshot.getKey() + "/" + key;
                        HashMap<String, Object> result = new HashMap<>();
                        result.put("status", "1");
                        result.put("time", Variables.dateFormat1.format(c));
                        reference.child(path).updateChildren(result);
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {

            }
        });

    }

    //this will add the new message in chat node and update the ChatInbox by new message by present date
    private void sendMessage(final String message) {
        Date c = Calendar.getInstance().getTime();
        final String formattedDate = Variables.dateFormat.format(c);

        final String currentUserRef = "chat" + "/" + requestId;

        // [AWS-MIGRATED] DatabaseReference reference = rootref.child("chat").child(requestId).push(); → use AWSManager REST API
        Object reference = null; // [AWS] placeholder — use AWSManager
        final String pushid = reference.getKey();
        final HashMap messageUserMap = new HashMap<>();
        messageUserMap.put("receiver_id", receiverid);
        messageUserMap.put("sender_id", senderid);
        messageUserMap.put("sender_image", userPic);
        messageUserMap.put("chat_id", pushid);
        messageUserMap.put("text", message);
        messageUserMap.put("type", "text");
        messageUserMap.put("pic_url", "");
        messageUserMap.put("status", "0");
        messageUserMap.put("time", "");
        messageUserMap.put("sender_name", fullName);
        messageUserMap.put("timestamp", formattedDate);

        final HashMap userMap = new HashMap<>();
        userMap.put(currentUserRef + "/" + pushid, messageUserMap);

        rootref.updateChildren(userMap, new DatabaseReference.CompletionListener() {
            @Override
            public void onComplete(DatabaseError databaseError, @NonNull DatabaseReference databaseReference) {

                //if first message then set the visibility of whoops layout gone
                HashMap<String, String> sendermap = new HashMap<>();
                sendermap.put("id", senderid);
                sendermap.put("sender_image", userPic);
                sendermap.put("name_f", fullName);
                sendermap.put("message", message);
                sendermap.put("pic", userPic);
                sendermap.put("status", "0");
                sendermap.put("type", "user");
                sendermap.put("timestamp", formattedDate);

                HashMap<String, String> receivermap = new HashMap<>();
                receivermap.put("id", receiverid);
                receivermap.put("sender_image", receiverPic);
                receivermap.put("name_f", receiverName);
                receivermap.put("message", message);
                receivermap.put("pic", receiverPic);
                receivermap.put("status", "0");
                receivermap.put("type", "driver");
                receivermap.put("timestamp", formattedDate);

                sendPushNotification(ChatA.this, message);

            }
        });
    }

    // this is the delete message diloge which will show after long press in chat message
    private void deleteMessageDialog(final Chat_GetSet chatGetset) {
        final CharSequence[] options;
        if (chatGetset.getType().equals("text")) {
            options = new CharSequence[]{getString(R.string.copy), getString(R.string.delete_this_msg), getString(R.string.cancel)};
        } else {

            options = new CharSequence[]{getString(R.string.delete_this_msg), getString(R.string.cancel)};
        }


        AlertDialog.Builder builder = new AlertDialog.Builder(ChatA.this , R.style.AlertDialogCustom);

        builder.setTitle(null);
        builder.setItems(options, new DialogInterface.OnClickListener() {

            @Override

            public void onClick(DialogInterface dialog, int item) {

                if (options[item].equals(getString(R.string.delete_this_msg))) {
                    updateMessage(chatGetset);
                } else if (options[item].equals(getString(R.string.cancel))) {
                    dialog.dismiss();
                } else if (options[item].equals(getString(R.string.copy))) {

                    ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                    ClipData clip = ClipData.newPlainText("text", chatGetset.getText());
                    clipboard.setPrimaryClip(clip);
                }
            }
        });
        builder.show();
    }

    //we will update the previous message means
    //we will tells the other user that we have seen your message
    private void updateMessage(Chat_GetSet item) {
        final String currentUserRef = "chat" + "/" + requestId;
        final HashMap messageUserMap = new HashMap<>();
        messageUserMap.put("receiver_id", item.getReceiver_id());
        messageUserMap.put("sender_id", item.getSender_id());
        messageUserMap.put("chat_id", item.getChat_id());
        messageUserMap.put("text", "Delete this message");
        messageUserMap.put("type", "delete");
        messageUserMap.put("pic_url", "");
        messageUserMap.put("status", "0");
        messageUserMap.put("time", "");
        messageUserMap.put("sender_name", fullName);
        messageUserMap.put("timestamp", item.getTimestamp());

        final HashMap userMap = new HashMap<>();
        userMap.put(currentUserRef + "/" + item.getChat_id(), messageUserMap);

        rootref.updateChildren(userMap, new DatabaseReference.CompletionListener() {
            @Override
            public void onComplete(DatabaseError databaseError, @NonNull DatabaseReference databaseReference) {

            }
        });

    }

    // send the type indicator if the user is typing message
    private void sendTypingIndicator(boolean indicate) {
        // if the type incator is present then we remove it if not then we create the typing indicator
        if (indicate) {
            final HashMap messageUserMap = new HashMap<>();
            messageUserMap.put("receiver_id", receiverid);
            messageUserMap.put("sender_id", senderid);

            sendTypingIndication = null; // [AWS] removed
                    // .getReference().child("typing_indicator"); // [AWS] Firebase removed
            sendTypingIndication.child(senderid + "-" + receiverid).setValue(messageUserMap)
                    .addOnSuccessListener(new OnSuccessListener<Void>() {
                        @Override
                        public void onSuccess(@NonNull Void aVoid) {
                            sendTypingIndication.child(receiverid + "-" + senderid).setValue(messageUserMap)
                                    .addOnSuccessListener(new OnSuccessListener<Void>() {
                                        @Override
                                        public void onSuccess(@NonNull Void aVoid) {
                                        }
                                    });
                        }
                    });
        } else {
            sendTypingIndication = null; // [AWS-MIGRATED] FirebaseDatabase removed
            sendTypingIndication.child(senderid + "-" + receiverid).removeValue().addOnCompleteListener(new OnCompleteListener<Void>() {
                @Override
                public void onComplete(@NonNull Task<Void> task) {

                    sendTypingIndication.child(receiverid + "-" + senderid).removeValue()
                            .addOnCompleteListener(new OnCompleteListener<Void>() {
                                @Override
                                public void onComplete(@NonNull Task<Void> task) {
                                }
                            });

                }
            });
        }
    }

    private void receivetypeindication() {
        receiveTypingIndication = null; // [AWS-MIGRATED] FirebaseDatabase removed
        receiveTypingIndication.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot dataSnapshot) {
                if (dataSnapshot.child(receiverid + "-" + senderid).exists()) {
                    String receiver = String.valueOf(dataSnapshot.child(receiverid + "-" + senderid)
                            .child("sender_id").getValue());
                    if (receiver.equals(receiverid)) {
                        binding.typeindicator.setVisibility(View.VISIBLE);
                    }
                } else {
                    binding.typeindicator.setVisibility(View.GONE);
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError databaseError) {
            }
        });
    }


    //on destory delete the typing indicator
    @Override
    public void onDestroy() {
        requestId="0";
        sendTypingIndicator(false);
        queryGetchat.removeEventListener(eventListener);
        super.onDestroy();
    }


    // on stop delete the typing indicator and remove the value event listener
    @Override
    public void onStop() {
        super.onStop();
        sendTypingIndicator(false);
        queryGetchat.removeEventListener(eventListener);
        MyPreferences.getSharedPreference(this).edit().putString(MyPreferences.chatRecieverId, null).apply();
    }


    private void sendPushNotification(Activity context, String message) {
        JSONObject notimap = new JSONObject();
        try {
            notimap.put("title", receiverName);
            notimap.put("message", message);
            notimap.put("sender_id", senderid);
            notimap.put("receiver_id", receiverid);
            notimap.put("type", "user");

            if (requestId != null && !requestId.equals(""))
                notimap.put("request_id", "" + requestId);


        } catch (JSONException e) {
            e.printStackTrace();
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                notimap.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).sendMessageNotification(notimap.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                        }
                        else
                        {

                        }
                    }
                });
    }

}
