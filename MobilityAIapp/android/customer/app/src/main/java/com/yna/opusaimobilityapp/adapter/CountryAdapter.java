package com.yna.opusaimobilityapp.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Filter;
import android.widget.Filterable;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.ride.loginsignup.CountryF;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.CountryModel;
import com.yna.opusaimobilityapp.databinding.FCountryItemListBinding;

import java.util.ArrayList;
import java.util.List;


public class CountryAdapter extends RecyclerView.Adapter<CountryAdapter.ViewHolder> implements Filterable {
    FCountryItemListBinding binding;
    private List<CountryModel> modelList, tempModelList;
    private AdapterClickListener click;

    public CountryAdapter(Context context, List<CountryModel> modelList, AdapterClickListener click) {
        this.modelList = new ArrayList<>(modelList);
        this.tempModelList = modelList;
        this.click = click;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        binding = FCountryItemListBinding.inflate(LayoutInflater.from(parent.getContext()),parent, false);

        return new ViewHolder(binding);
    }


    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        CountryModel model = tempModelList.get(position);

        holder.binding.tvCountryName.setText(model.countryname);
        if (model.countryId.equals(CountryF.selectedCountryId)) {
            holder.binding.ivTick.setVisibility(View.VISIBLE);
        } else {
            holder.binding.ivTick.setVisibility(View.GONE);
        }


        holder.bind(position, model, click);
    }

    @Override
    public int getItemCount() {
        return tempModelList.size();
    }

    @Override
    public Filter getFilter() {
        return new Filter() {
            @Override
            protected FilterResults performFiltering(CharSequence charSequence) {
                List<CountryModel> filteredList = new ArrayList<>();
                if (charSequence == null || charSequence.length() == 0) {
                    filteredList.addAll(modelList);
                } else {
                    String filterPattern = charSequence.toString().toLowerCase().trim();
                    for (CountryModel item : modelList) {
                        if (item.countryname.toLowerCase().contains(filterPattern)) {
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
                tempModelList.clear();
                tempModelList.addAll((ArrayList) results.values);
                notifyDataSetChanged();
            }
        };
    }

    class ViewHolder extends RecyclerView.ViewHolder {

        FCountryItemListBinding binding;
        ViewHolder(@NonNull FCountryItemListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }


        public void bind(final int item, final CountryModel model,
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