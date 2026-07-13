package com.terraai.aimobility.userschat.ViewHolders;


import android.view.View;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import android.widget.ImageView; // AWS-MIGRATED: was ImageView (Fresco)
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.userschat.ChatAdapter;
import com.terraai.aimobility.userschat.Chat_GetSet;

public class Chatviewholder extends RecyclerView.ViewHolder {

    public TextView message, datetxt, msgDate, username;
    public View view;
    public ImageView chatImageView;

    public Chatviewholder(View itemView) {
        super(itemView);
        view = itemView;

        this.message = view.findViewById(R.id.messageText);
        this.username = view.findViewById(R.id.username);
        this.datetxt = view.findViewById(R.id.datetxt);
        this.msgDate = view.findViewById(R.id.msg_date);
        this.chatImageView = view.findViewById(R.id.chatImageView);

    }


    public void bind(final Chat_GetSet item,
                     final ChatAdapter.OnLongClickListener long_listener) {
        message.setOnLongClickListener(v -> {
            long_listener.onLongclick(item, v);
            return false;

        });
    }
}

