package com.yna.opusaimobilityapp.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.Interface.AdapterLongClickListener;
import com.yna.opusaimobilityapp.model.NearbyModelClass;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.ShowLocationItemviewBinding;

import java.util.ArrayList;

public class ShowLocationsAdapter extends RecyclerView.Adapter<ShowLocationsAdapter.ViewHolder> {

    ShowLocationItemviewBinding showLocationItemviewBinding;
    Context context;
    boolean showHeart;
    ArrayList<NearbyModelClass> list;
    AdapterClickListener adapterClickListener;
    AdapterLongClickListener adapterLongClickListener;
    boolean showEdit = false;

    public ShowLocationsAdapter(Context context, boolean showHeart, ArrayList<NearbyModelClass> list, AdapterClickListener adapterClickListener, AdapterLongClickListener adapterLongClickListener ,  boolean showEdit ) {
        this.context = context;
        this.list = list;
        this.showHeart = showHeart;
        this.adapterClickListener = adapterClickListener;
        this.adapterLongClickListener = adapterLongClickListener;
        this.showEdit = showEdit;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {

        showLocationItemviewBinding = ShowLocationItemviewBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(showLocationItemviewBinding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        NearbyModelClass model = list.get(position);
        holder.showLocationItemviewBinding.textViewTitle.setText(model.title);
        holder.showLocationItemviewBinding.textViewAddress.setText(model.address);

        if(showEdit){
            holder.showLocationItemviewBinding.icEdit.setVisibility(View.VISIBLE);
        }else{
            if (showHeart) {
                holder.showLocationItemviewBinding.savedLocationIcon.setImageResource(R.drawable.ic_filled_heart);
            } else {
                holder.showLocationItemviewBinding.savedLocationIcon.setVisibility(View.GONE);
            }
        }
        holder.bind(position, model, adapterClickListener, adapterLongClickListener);
    }

    @Override
    public int getItemCount() {
        return list.size();
    }


    public class ViewHolder extends RecyclerView.ViewHolder {

        private ShowLocationItemviewBinding showLocationItemviewBinding;
        public ViewHolder(@NonNull ShowLocationItemviewBinding itemView) {

            super(itemView.getRoot());
            this.showLocationItemviewBinding = itemView;

        }

        public void bind(int position, NearbyModelClass model, AdapterClickListener adapterClickListener, AdapterLongClickListener adapterLongClickListener) {
            showLocationItemviewBinding.savedLocationIcon.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    adapterClickListener.onItemClickListener(position, model, view);
                }
            });

            showLocationItemviewBinding.locationLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    adapterClickListener.onItemClickListener(position, model, view);
                }
            });

            showLocationItemviewBinding.icEdit.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    adapterClickListener.onItemClickListener(position, model, view);
                }
            });

            showLocationItemviewBinding.locationLayout.setOnLongClickListener(new View.OnLongClickListener() {
                @Override
                public boolean onLongClick(View v) {
                    adapterLongClickListener.onLongItemClick(position, model, v);
                    return false;
                }
            });
        }
    }
}
