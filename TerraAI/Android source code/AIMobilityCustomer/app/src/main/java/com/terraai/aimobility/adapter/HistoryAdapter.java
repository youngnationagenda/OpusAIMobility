package com.terraai.aimobility.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.R;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.HistoryModel;
import com.terraai.aimobility.databinding.ItemHistoryListBinding;

import java.util.ArrayList;

public class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.ViewHolder> {
    String currencyUnit;
    Context context;
    ArrayList<HistoryModel> historyModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    boolean schedule;
    ItemHistoryListBinding binding;
    public HistoryAdapter(Context context, ArrayList<HistoryModel> historyModelArrayList, AdapterClickListener adapterClickListener , boolean schedule) {
        this.context = context;
        this.historyModelArrayList = historyModelArrayList;
        this.adapterClickListener = adapterClickListener;
        this.schedule = schedule;

    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemHistoryListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new HistoryAdapter.ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final HistoryModel item = historyModelArrayList.get(position);

        currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        holder.itemBinding.tvDayTime.setText(holder.itemView.getContext().getString(R.string.order_no)+" "+item.getDayTime());

        holder.itemBinding.tvAmount.setText(currencyUnit + item.finalFare);
        holder.itemBinding.tvPickUp.setText(item.pickupLocation);
        holder.itemBinding.tvDroopOff.setText(item.destinationLocation);
        if(schedule){
            holder.itemBinding.tvCancel.setVisibility(View.VISIBLE);
        }

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

        public void bind(final int item, final HistoryModel model,
                         final AdapterClickListener listener) {
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
