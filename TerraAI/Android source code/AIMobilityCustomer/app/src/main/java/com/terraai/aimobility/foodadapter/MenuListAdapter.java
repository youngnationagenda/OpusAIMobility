package com.terraai.aimobility.foodadapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.food.RestaurantMenuFragment;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.MenuModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.ItemRecipemenuListBinding;

import java.util.ArrayList;

public class MenuListAdapter extends RecyclerView.Adapter<MenuListAdapter.ViewHolder> {
    ItemRecipemenuListBinding binding;
    Context context;
    ArrayList<MenuModel> recipeMenuDetailsModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;

    public MenuListAdapter(Context context, ArrayList<MenuModel> recipeMenuDetailsModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.recipeMenuDetailsModelArrayList = recipeMenuDetailsModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemRecipemenuListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final MenuModel item = recipeMenuDetailsModelArrayList.get(position);
        holder.itemView.tvRecipeName.setText(Functions.decodeString(item.getMenuName()));

        if (RestaurantMenuFragment.selectedPosition == position) {
            holder.itemView.tvRecipeName.setTextColor(ContextCompat.getColor(context,R.color.white));
            holder.itemView.bgLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.d_round_black));
        } else {
            holder.itemView.tvRecipeName.setTextColor(ContextCompat.getColor(context,R.color.black));
            holder.itemView.bgLayout.setBackgroundColor(ContextCompat.getColor(context, R.color.transparent));
        }

        holder.bind(position, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return recipeMenuDetailsModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemRecipemenuListBinding itemView;
        public ViewHolder(@NonNull ItemRecipemenuListBinding itemView) {
            super(itemView.getRoot());
            this.itemView = itemView;

        }

        public void bind(final int pos, final MenuModel item, final AdapterClickListener adapter_clickListener) {
            itemView.bgLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });
        }
    }
}
