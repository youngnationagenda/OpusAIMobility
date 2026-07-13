package com.terraai.aimobility.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.codeclasses.SingleClickListener;
import com.yna.opusaimobilityapp.databinding.RideRentItemviewBinding;
import com.terraai.aimobility.model.NearbyModelClass;

import java.util.ArrayList;

public class RideRentAdapter extends RecyclerView.Adapter<RideRentAdapter.ViewHolder> {

    Context context;
    ArrayList<NearbyModelClass> list = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    RideRentItemviewBinding binding;
    public RideRentAdapter(Context context, ArrayList<NearbyModelClass> list, AdapterClickListener adapterClickListener) {

        this.list = list;
        this.context = context;
        this.adapterClickListener = adapterClickListener;

    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        binding = RideRentItemviewBinding.inflate(LayoutInflater.from(parent.getContext()),parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        NearbyModelClass model = list.get(position);

        holder.itemviewBinding.locationName.setText(model.title);
        holder.itemviewBinding.locationAddressText.setText(model.address);


        holder.bind(position, model, adapterClickListener);
    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        RideRentItemviewBinding itemviewBinding;

        public ViewHolder(@NonNull RideRentItemviewBinding itemView) {
            super(itemView.getRoot());
            itemviewBinding = itemView;
        }

        public void bind(int position, NearbyModelClass model, AdapterClickListener adapterClickListener) {

            itemView.setOnClickListener(new SingleClickListener() {
                @Override
                public void performClick(View view) {
                    adapterClickListener.onItemClickListener(position, model, view);
                }
            });
        }
    }
}
