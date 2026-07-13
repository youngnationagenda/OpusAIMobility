package com.terraai.aimobility.parcel.adapter;

import android.content.Context;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.codeclasses.Variables;
import com.yna.opusaimobilityapp.databinding.ItemDropoffListBinding;
import com.yna.opusaimobilityapp.databinding.ItemRecipientListBinding;
import com.terraai.aimobility.parcel.model.RecipientModel;
import com.terraai.aimobility.parcel.model.RiderOrderMultiStop;

import java.util.ArrayList;

public class DropOffAdapter extends RecyclerView.Adapter<DropOffAdapter.ViewHolder> {
    Context context;
    ArrayList<RecipientModel> dataList;
    ArrayList<RiderOrderMultiStop> multiStops;
    AdapterClickListener adapterClickListener;
    ItemDropoffListBinding binding;
    public DropOffAdapter(Context context, ArrayList<RecipientModel> dataList,ArrayList<RiderOrderMultiStop> multiStops, AdapterClickListener adapterClickListener ) {
        this.context = context;
        this.dataList = dataList;
        this.multiStops = multiStops;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemDropoffListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new DropOffAdapter.ViewHolder(binding);
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
            holder.itemBinding.tvRecipentInstruction.setText("Instructions: "+item.getDeliveryInstruction());
        }


        holder.itemBinding.tvItemType.setText("Item Type: "+item.getTypeOfItem());
        holder.itemBinding.tvItemSize.setText("Size: "+item.getPackageSize());
        holder.itemBinding.tvTotal.setText("Price: "+ MyPreferences.getSharedPreference(context)
                .getString(MyPreferences.currencyUnit, Constants.defaultCurrency)+" "+item.getPrice());

        if(position == (dataList.size()-1)){
            holder.itemBinding.image3.setVisibility(View.INVISIBLE);
        }else {
            holder.itemBinding.image3.setVisibility(View.VISIBLE);
        }

        if(multiStops!=null) {
            if (position <= (multiStops.size() - 1)) {

                RiderOrderMultiStop multiStop=multiStops.get(position);
                if(!multiStop.delivered.equals(Variables.emptyTime)){
                    holder.itemBinding.statustxt.setText("Delivered");
                    holder.itemBinding.activeImage.setVisibility(View.GONE);
                    holder.itemBinding.statustxt.setBackgroundColor(context.getResources().getColor(R.color.gray));
                    holder.itemBinding.anonymousLayout.setBackground(context.getResources().getDrawable(R.drawable.d_border_gray_line));

                }
                else if(!multiStop.on_the_way_to_dropoff.equals(Variables.emptyTime)){
                    holder.itemBinding.statustxt.setText("On the Way");
                    holder.itemBinding.activeImage.setVisibility(View.VISIBLE);
                    holder.itemBinding.statustxt.setBackgroundColor(context.getResources().getColor(R.color.green));
                    holder.itemBinding.anonymousLayout.setBackground(context.getResources().getDrawable(R.drawable.green_border_bg));
                }

                holder.itemBinding.statustxt.setVisibility(View.VISIBLE);

            }

            else {
                holder.itemBinding.activeImage.setVisibility(View.GONE);
                holder.itemBinding.statustxt.setVisibility(View.GONE);
                holder.itemBinding.anonymousLayout.setBackground(context.getResources().getDrawable(R.drawable.d_border_gray_line));

            }
        }

        holder.bind(position, item, adapterClickListener);
    }

    @Override
    public int getItemCount() {
        return dataList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemDropoffListBinding itemBinding;
        public ViewHolder(@NonNull ItemDropoffListBinding itemView) {
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
