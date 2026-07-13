package com.terraai.aimobility.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Filter;
import android.widget.Filterable;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.CategoriesModel;
import com.yna.opusaimobilityapp.databinding.ItemTopCategoriesListBinding;

import java.util.ArrayList;

public class TopCategoriesAdapter extends RecyclerView.Adapter<TopCategoriesAdapter.ViewHolder> implements Filterable {
    ItemTopCategoriesListBinding binding;
    Context context;
    ArrayList<CategoriesModel> modelList;
    ArrayList<CategoriesModel> filtermodelList;
    AdapterClickListener adapterClickListener;

    private Filter filter = new Filter() {
        @Override
        protected FilterResults performFiltering(CharSequence constraint) {
            ArrayList<CategoriesModel> filteredList = new ArrayList<>();
            if (constraint == null || constraint.length() == 0) {
                filteredList.addAll(filtermodelList);
            } else {
                String filterPattern = constraint.toString().toLowerCase().trim();
                for (CategoriesModel item : filtermodelList) {
                    if (item.getCategoryName().toLowerCase().contains(filterPattern)) {
                        filteredList.add(item);
                    }
                }
            }
            FilterResults results = new FilterResults();
            results.values = filteredList;
            return results;
        }

        @Override
        protected void publishResults(CharSequence constraint, FilterResults results) {
            modelList.clear();
            modelList.addAll((ArrayList) results.values);
            notifyDataSetChanged();
        }
    };
    public TopCategoriesAdapter(Context context, ArrayList<CategoriesModel> modelList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.modelList = modelList;
        this.filtermodelList = new ArrayList<>(modelList);
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemTopCategoriesListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        final CategoriesModel item = modelList.get(position);
        holder.itemView.foodName.setText(item.getCategoryName());
        String image = item.getCategoryImage();
        if (image != null && !image.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + image);
            holder.itemView.menuImage.setImageURI(uri);
        }

        holder.bind(position, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return modelList.size();
    }

    @Override
    public Filter getFilter() {
        return filter;
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemTopCategoriesListBinding itemView;

        public ViewHolder(@NonNull ItemTopCategoriesListBinding itemView) {
            super(itemView.getRoot());
            this.itemView = itemView;


        }

        public void bind(final int pos, final CategoriesModel item, final AdapterClickListener adapter_clickListener) {

            itemView.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });
        }

    }
}
