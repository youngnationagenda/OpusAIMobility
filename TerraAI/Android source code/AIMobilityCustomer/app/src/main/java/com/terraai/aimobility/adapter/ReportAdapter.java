package com.terraai.aimobility.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.databinding.FCountryItemListBinding;
import com.terraai.aimobility.databinding.ItemReportLayoutBinding;

import java.util.ArrayList;
import java.util.List;


public class ReportAdapter extends RecyclerView.Adapter<ReportAdapter.ViewHolder> {
    ItemReportLayoutBinding binding;
    private List<String> modelList;
    private AdapterClickListener click;

    public ReportAdapter(Context context, List<String> modelList, AdapterClickListener click) {
        this.modelList = new ArrayList<String>(modelList);
        this.click = click;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        binding = ItemReportLayoutBinding.inflate(LayoutInflater.from(parent.getContext()),parent, false);

        return new ViewHolder(binding);
    }


    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        holder.binding.titleTxt.setText(modelList.get(position));

        holder.bind(position, modelList.get(position), click);
    }

    @Override
    public int getItemCount() {
        return modelList.size();
    }


    class ViewHolder extends RecyclerView.ViewHolder {

        ItemReportLayoutBinding binding;
        ViewHolder(@NonNull ItemReportLayoutBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }


        public void bind(final int item, final String model,
                         final AdapterClickListener listener) {
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