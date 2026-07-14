package com.yna.opusaimobilityapp.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.CategoriesModel;
import com.yna.opusaimobilityapp.databinding.ItemCategoriesListBinding;

import java.util.ArrayList;

public class CategoriesHomeAdapter extends RecyclerView.Adapter<CategoriesHomeAdapter.ViewHolder> {
    ItemCategoriesListBinding binding;
    Context context;
    ArrayList<CategoriesModel> categoriesModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;

    public CategoriesHomeAdapter(Context context, ArrayList<CategoriesModel> categoriesModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.categoriesModelArrayList = categoriesModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemCategoriesListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);

        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final CategoriesModel item = categoriesModelArrayList.get(position);
        holder.binding.itemName.setText(item.getCategoryName());
        String image = item.getIcon();

        if (image != null && !image.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + image);
            holder.binding.groceryImage.setImageURI(uri);
        }

        holder.bind(position, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return categoriesModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {



        ItemCategoriesListBinding binding;
        public ViewHolder(@NonNull ItemCategoriesListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;


        }

        public void bind(final int pos, final CategoriesModel item, final AdapterClickListener adapter_clickListener) {

            binding.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });
        }

    }
}
