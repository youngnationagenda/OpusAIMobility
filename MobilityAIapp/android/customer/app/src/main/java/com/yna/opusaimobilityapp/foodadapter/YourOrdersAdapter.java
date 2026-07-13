package com.yna.opusaimobilityapp.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.codeclasses.DateOperations;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.YourOrdersModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.ItemYourOrdersListBinding;

import java.util.ArrayList;

public class YourOrdersAdapter extends RecyclerView.Adapter<YourOrdersAdapter.ViewHolder> {
    ItemYourOrdersListBinding binding;
    Context context;
    ArrayList<YourOrdersModel> yourOrdersModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    String currencySymbol;

    public YourOrdersAdapter(Context context, ArrayList<YourOrdersModel> yourOrdersModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.yourOrdersModelArrayList = yourOrdersModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemYourOrdersListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        currencySymbol = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        final YourOrdersModel item = yourOrdersModelArrayList.get(position);
        holder.listBinding.orderId.setText(holder.itemView.getContext().getString(R.string.order_no)+" "+item.getOrderId());
        holder.listBinding.foodName.setText(item.getResturantModel().getResturantName());
        holder.listBinding.tvItem.setText(item.getQuantity() + context.getString(R.string.item));
        holder.listBinding.tvAmount.setText(" - " + currencySymbol + Functions.roundoffDecimal(item.getTotalAmount()));
        holder.listBinding.tvDate.setText(DateOperations.changeDateFormat("yyyy-MM-dd HH:mm:ss", "dd MMM hh:mm a", item.getCreated()));

        String status = item.getStatus();
        if (status.equals("0")) {
            holder.listBinding.tvStatus.setText(" - " + context.getString(R.string.processing));
        } else if (status.equals("1")) {
            holder.listBinding.tvStatus.setText(" - " + context.getString(R.string.active));
        } else if (status.equals("2")) {
            holder.listBinding.tvStatus.setText(" - " + context.getString(R.string.compeleted));
        } else if (status.equals("3")) {
            holder.listBinding.tvStatus.setText(" - " + context.getString(R.string.cancelled));
        }

        if (item.getResturantModel().getResturantImage() != null && !item.getResturantModel().getResturantImage().equals("")) {
            holder.listBinding.foodImage.setImageURI(Constants.BASE_URL + Uri.parse(item.getResturantModel().getResturantImage()));
        }


        holder.bind(position, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return yourOrdersModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        private ItemYourOrdersListBinding listBinding;

        public ViewHolder(@NonNull ItemYourOrdersListBinding binding) {
            super(binding.getRoot());
            this.listBinding = binding;

        }

        public void bind(final int pos, final YourOrdersModel item, final AdapterClickListener adapter_clickListener) {

            listBinding.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });

        }
    }





}
