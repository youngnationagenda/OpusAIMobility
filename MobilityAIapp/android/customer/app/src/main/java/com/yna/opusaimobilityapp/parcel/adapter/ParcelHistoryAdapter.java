package com.yna.opusaimobilityapp.parcel.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.databinding.ItemHistoryListBinding;
import com.yna.opusaimobilityapp.parcel.model.ParcelHistoryModel;

import java.util.ArrayList;

public class ParcelHistoryAdapter extends RecyclerView.Adapter<ParcelHistoryAdapter.ViewHolder> {
    String currencyUnit;
    Context context;
    ArrayList<ParcelHistoryModel> historyModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    boolean schedule;
    ItemHistoryListBinding binding;
    public ParcelHistoryAdapter(Context context, ArrayList<ParcelHistoryModel> historyModelArrayList, AdapterClickListener adapterClickListener , boolean schedule) {
        this.context = context;
        this.historyModelArrayList = historyModelArrayList;
        this.adapterClickListener = adapterClickListener;
        this.schedule = schedule;
        currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);


    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemHistoryListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ParcelHistoryAdapter.ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final ParcelHistoryModel item = historyModelArrayList.get(position);

        try {
            holder.itemBinding.tvDayTime.setText(holder.itemView.getContext().getString(R.string.order_no) + " " + item.getOrderId() + " " + item.getCreated());

            holder.itemBinding.tvAmount.setText(currencyUnit + item.getTotal());
            holder.itemBinding.tvPickUp.setText(item.getSenderLocationString());

            StringBuilder stringBuilder = new StringBuilder();
            for (int i=0;i<item.recipientList.size();i++){
                if(i>0)
                    stringBuilder.append("\n");

                stringBuilder.append(i+1+": ");
                stringBuilder.append(item.recipientList.get(i).getRecipientAddress());
            }

            holder.itemBinding.tvDroopOff.setText(stringBuilder.toString());

            if(item.getStatus().equals("2")){
                holder.itemBinding.statustxt.setText("Completed");
                holder.itemBinding.statustxt.setTextColor(context.getResources().getColor(R.color.green));
            }else {
                holder.itemBinding.statustxt.setText("Pending");
                holder.itemBinding.statustxt.setTextColor(context.getResources().getColor(R.color.orange_color));
            }

            if (schedule) {
                holder.itemBinding.tvCancel.setVisibility(View.VISIBLE);
            }
        }catch (Exception e){}
        holder.bind(position, item, adapterClickListener);
    }

    @Override
    public int getItemCount() {
        return historyModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemHistoryListBinding itemBinding;
        public ViewHolder(@NonNull ItemHistoryListBinding itemView) {
            super(itemView.getRoot());
            this.itemBinding = itemView;
        }

        public void bind(final int item, final ParcelHistoryModel model, final AdapterClickListener listener) {
            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // This is OnClick of any list Item
                    listener.onItemClickListener(item, model, v);
                }

            });

            itemBinding.tvCancel.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // This is OnClick of any list Item
                    listener.onItemClickListener(item, model, v);
                }

            });
        }
    }
}
