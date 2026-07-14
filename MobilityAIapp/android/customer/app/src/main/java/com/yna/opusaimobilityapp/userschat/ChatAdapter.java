package com.yna.opusaimobilityapp.userschat;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.codeclasses.Variables;
import com.yna.opusaimobilityapp.userschat.ViewHolders.Alertviewholder;
import com.yna.opusaimobilityapp.userschat.ViewHolders.Chatviewholder;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.List;


public class ChatAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {
    private static final int mychat = 1;
    private static final int friendchat = 2;
    private static final int alert_message = 7;
    String myID;
    Context context;
    Integer todayDay = 0;
    private List<Chat_GetSet> mDataSet;
    private OnItemClickListener listener;
    private OnLongClickListener longClickListener;


    ChatAdapter(List<Chat_GetSet> dataSet, String id, Context context, OnItemClickListener listener, OnLongClickListener longClickListener) {
        mDataSet = dataSet;
        this.myID = id;
        this.context = context;
        this.listener = listener;
        this.longClickListener = longClickListener;
        Calendar cal = Calendar.getInstance();
        todayDay = cal.get(Calendar.DAY_OF_MONTH);
    }

    // this is the all types of view that is used in the chat
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(ViewGroup viewGroup, int viewtype) {
        View v = null;
        switch (viewtype) {
            // we have 4 type of layout in chat activity text chat of my and other and also
            // image layout of my and other
            case mychat:
                v = LayoutInflater.from(viewGroup.getContext()).inflate(R.layout.item_chat_my, viewGroup, false);
                Chatviewholder mychatHolder = new Chatviewholder(v);
                return mychatHolder;
            case friendchat:
                v = LayoutInflater.from(viewGroup.getContext()).inflate(R.layout.item_chat_other, viewGroup, false);
                Chatviewholder friendchatHolder = new Chatviewholder(v);
                return friendchatHolder;

            case alert_message:
                v = LayoutInflater.from(viewGroup.getContext()).inflate(R.layout.item_chat_alert, viewGroup, false);
                Alertviewholder alertviewholder = new Alertviewholder(v);
                return alertviewholder;

            default:
                return null;
        }
    }

    @Override
    public int getItemCount() {
        return mDataSet.size();
    }

    @Override
    public void onBindViewHolder(RecyclerView.ViewHolder holder, int position) {
        Chat_GetSet chat = mDataSet.get(position);

        if (chat.getType().equals("text")) {
            Chatviewholder chatviewholder = (Chatviewholder) holder;

            // check if the message is from sender or receiver
            chatviewholder.message.setText(chat.getText());
            chatviewholder.msgDate.setText(showMessageTime(chat.getTimestamp()));
            chatviewholder.username.setText(chat.sender_name);
            String image = chat.getSender_image();
            if (image != null && !image.equals("")) {
                final Uri uri;
                if (image.contains("http")) {
                    uri = Uri.parse(image);
                } else {
                    uri = Uri.parse(Constants.BASE_URL + image);
                }
                chatviewholder.chatImageView.setImageURI(uri);
            }else{
                chatviewholder.chatImageView.setActualImageResource(R.drawable.ic_profile_avatar);
            }

            // make the group of message by date set the gap of 1 min
            // means message send with in 1 min will show as a group
            if (position != 0) {
                Chat_GetSet chat2 = mDataSet.get(position - 1);
                if (chat2.getTimestamp().substring(0, 2).equals(chat.getTimestamp().substring(0, 2))) {
                    chatviewholder.datetxt.setVisibility(View.GONE);
                } else {
                    chatviewholder.datetxt.setVisibility(View.VISIBLE);
                    chatviewholder.datetxt.setText(changeDate(chat.getTimestamp()));
                }

            } else {
                chatviewholder.datetxt.setVisibility(View.VISIBLE);
                chatviewholder.datetxt.setText(changeDate(chat.getTimestamp()));
            }

            chatviewholder.bind(chat, longClickListener);

        } else if (chat.getType().equals("delete")) {
            Alertviewholder alertviewholder = (Alertviewholder) holder;
            alertviewholder.message.setTextColor(context.getResources().getColor(R.color.black));
            alertviewholder.message.setBackground(context.getResources().getDrawable(R.drawable.d_border_gray_line));

            alertviewholder.message.setText(R.string.deleted_message);

            if (position != 0) {
                Chat_GetSet chat2 = mDataSet.get(position - 1);
                if (chat2.getTimestamp().substring(11, 13).equals(chat.getTimestamp().substring(11, 13))) {
                    alertviewholder.datetxt.setVisibility(View.GONE);
                } else {
                    alertviewholder.datetxt.setVisibility(View.VISIBLE);
                    alertviewholder.datetxt.setText(changeDate(chat.getTimestamp()));
                }

            } else {
                alertviewholder.datetxt.setVisibility(View.VISIBLE);
                alertviewholder.datetxt.setText(changeDate(chat.getTimestamp()));

            }

        }


    }

    @Override
    public int getItemViewType(int position) {
        // get the type it view ( given message is from sender or receiver)
        if (mDataSet.get(position).getType().equals("text")) {
            if (mDataSet.get(position).sender_id.equals(myID)) {
                return mychat;
            }
            return friendchat;
        } else {
            return alert_message;
        }
    }

    // change the date into (today ,yesterday and date)
    public String changeDate(String date) {
        //current date in millisecond
        long currenttime = System.currentTimeMillis();

        //database date in millisecond
        long databasedate = 0;
        Date d = null;
        try {
            d = Variables.dateFormat.parse(date);
            databasedate = d.getTime();

        } catch (ParseException e) {
            e.printStackTrace();
        }
        long difference = currenttime - databasedate;
        if (difference < 86400000) {
            int chatday = Integer.parseInt(date.substring(0, 2));
            if (todayDay == chatday) {
                return "Today";
            } else if ((todayDay - chatday) == 1) {
                return "Yesterday";
            }
        } else if (difference < 172800000) {
            int chatday = Integer.parseInt(date.substring(0, 2));
            if ((todayDay - chatday) == 1) {
                return "Yesterday";
            }

        }

        SimpleDateFormat sdf = new SimpleDateFormat("MMM-dd-yyyy");

        if (d != null) {
            return sdf.format(d);
        } else {
            return "";
        }
    }

    public String showMessageTime(String date) {

        SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a");

        Date d = null;
        try {
            d = Variables.dateFormat.parse(date);

        } catch (ParseException e) {
            e.printStackTrace();
        }

        if (d != null) {
            return sdf.format(d);
        } else
            return "null";
    }


    public interface OnItemClickListener {
        void onItemClick(int postion, Chat_GetSet item, View view);
    }


    public interface OnLongClickListener {
        void onLongclick(Chat_GetSet item, View view);
    }


}
