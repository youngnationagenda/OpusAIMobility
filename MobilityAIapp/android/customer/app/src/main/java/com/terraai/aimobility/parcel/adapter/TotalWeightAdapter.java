package com.terraai.aimobility.parcel.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.databinding.ItemTotalWeightListBinding;
import com.terraai.aimobility.parcel.model.PackagesSizeSelectionModel;

import java.util.ArrayList;

public class TotalWeightAdapter extends RecyclerView.Adapter<TotalWeightAdapter.ViewHolder> {

    Context context;
    Boolean isFromItemWeight = true;
    ArrayList<PackagesSizeSelectionModel> totalWeightModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    ItemTotalWeightListBinding binding;
    public TotalWeightAdapter(Context context, Boolean isFromItemWeight, ArrayList<PackagesSizeSelectionModel> totalWeightModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.isFromItemWeight = isFromItemWeight;
        this.totalWeightModelArrayList = totalWeightModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemTotalWeightListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final PackagesSizeSelectionModel item = totalWeightModelArrayList.get(position);
        holder.itemBinding.tvWeight.setText(item.getTitle());

        holder.bind(position, item, adapterClickListener);


    }

    @Override
    public int getItemCount() {
        return totalWeightModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemTotalWeightListBinding itemBinding;
        public ViewHolder(@NonNull ItemTotalWeightListBinding itemView) {
            super(itemView.getRoot());
            itemBinding = itemView;
        }

        public void bind(final int pos, final PackagesSizeSelectionModel item, final AdapterClickListener adapter_clickListener) {
            itemBinding.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });
        }
    }
}
