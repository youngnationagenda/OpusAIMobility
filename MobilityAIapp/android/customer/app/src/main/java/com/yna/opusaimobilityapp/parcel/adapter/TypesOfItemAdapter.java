package com.yna.opusaimobilityapp.parcel.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.TypesOfItemModel;
import com.yna.opusaimobilityapp.databinding.ItemTypeofItemListBinding;

import java.util.ArrayList;

public class TypesOfItemAdapter extends RecyclerView.Adapter<TypesOfItemAdapter.ViewHolder> {

    Boolean isFromItem = true;
    Context context;
    ArrayList<TypesOfItemModel> typesOfItemModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    ItemTypeofItemListBinding binding;
    public TypesOfItemAdapter(Boolean isFromItem, Context context, ArrayList<TypesOfItemModel> typesOfItemModelArrayList, AdapterClickListener adapterClickListener) {
        this.isFromItem = isFromItem;
        this.context = context;
        this.typesOfItemModelArrayList = typesOfItemModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemTypeofItemListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);

        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final TypesOfItemModel item = typesOfItemModelArrayList.get(position);
        holder.itemBinding.itemName.setText(item.getItemName());

        if (position == typesOfItemModelArrayList.size() - 1) {
            holder.itemBinding.viewItem.setVisibility(View.GONE);
        }

        holder.bind(position, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return typesOfItemModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {
        ItemTypeofItemListBinding itemBinding;

        public ViewHolder(@NonNull ItemTypeofItemListBinding itemView) {
            super(itemView.getRoot());
            itemBinding = itemView;

        }
        public void bind(final int pos, final TypesOfItemModel item, final AdapterClickListener adapter_clickListener) {
            itemBinding.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });
        }
    }
}
