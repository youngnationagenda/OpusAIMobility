package com.yna.opusaimobilityapp.parcel.adapter;

import android.content.Context;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.databinding.ItemHistoryListBinding;
import com.yna.opusaimobilityapp.databinding.ItemRecipientListBinding;
import com.yna.opusaimobilityapp.parcel.model.ParcelHistoryModel;
import com.yna.opusaimobilityapp.parcel.model.RecipientModel;

import java.util.ArrayList;

public class RecipientAdapter extends RecyclerView.Adapter<RecipientAdapter.ViewHolder> {
    Context context;
    ArrayList<RecipientModel> dataList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    ItemRecipientListBinding binding;
    public RecipientAdapter(Context context, ArrayList<RecipientModel> dataList, AdapterClickListener adapterClickListener ) {
        this.context = context;
        this.dataList = dataList;
        this.adapterClickListener = adapterClickListener;

    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemRecipientListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new RecipientAdapter.ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final RecipientModel item = dataList.get(position);



        holder.itemBinding.tvRecipentName.setText("Name: "+item.getRecipientName());
        holder.itemBinding.tvRecipentPhone.setText("Phone: "+item.getRecipientNumber());
        holder.itemBinding.tvRecipentAddress.setText("Address: "+item.getRecipientAddress());


        if(TextUtils.isEmpty(item.getRecipientNote())){
            holder.itemBinding.tvRecipentInstruction.setVisibility(View.GONE);
        }else {
            holder.itemBinding.tvRecipentInstruction.setVisibility(View.VISIBLE);
            holder.itemBinding.tvRecipentInstruction.setText("Instructions: "+item.getRecipientName());
        }


        holder.itemBinding.tvItemType.setText("Item Type: "+item.getTypeOfItem());
        holder.itemBinding.tvItemSize.setText("Size: "+item.getPackageSize());
        holder.itemBinding.tvTotal.setText("Price: "+item.getPrice());


        holder.bind(position, item, adapterClickListener);
    }

    @Override
    public int getItemCount() {
        return dataList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemRecipientListBinding itemBinding;
        public ViewHolder(@NonNull ItemRecipientListBinding itemView) {
            super(itemView.getRoot());
            this.itemBinding = itemView;
        }

        public void bind(final int item, final RecipientModel model, final AdapterClickListener listener) {
            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // This is OnClick of any list Item
                    listener.onItemClickListener(item, model, v);
                }

            });

        }
    }
}
