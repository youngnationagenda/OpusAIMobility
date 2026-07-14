package com.yna.opusaimobilityapp.foodadapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.CalculationModel;
import com.yna.opusaimobilityapp.databinding.ItemViewBucketBinding;

import java.util.ArrayList;
import java.util.HashMap;

public class ViewBucketAdapter extends RecyclerView.Adapter<ViewBucketAdapter.ViewHolder> {

    Context context;
    ArrayList<CalculationModel> arrayList;
    AdapterClickListener adapterClickListener;
    ArrayList<HashMap<String, String>> extraItem;
    String currencySymbol;
    ItemViewBucketBinding binding;

    public ViewBucketAdapter(Context context, ArrayList<CalculationModel> arrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.arrayList = arrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemViewBucketBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final CalculationModel item = arrayList.get(position);
        currencySymbol = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        holder.binding.tvQuantity.setText(item.getmQuantity());
        holder.binding.itemName.setText(Functions.fixSpecialCharacter(item.getmName()));
        double totalPrice = Double.parseDouble(item.getmQuantity()) * Double.parseDouble(item.getmPrice());
        holder.binding.tvAmount.setText(currencySymbol + Functions.roundoffDecimal(totalPrice));
        extraItem = item.getExtraItem();
        StringBuilder stringBuilder = new StringBuilder();;
        if (extraItem != null && extraItem.size() > 0) {
            for (int b = 0; b < extraItem.size(); b++) {
                String menuExtraItemName = extraItem.get(b).get("menu_extra_item_name");
                String extraItemPrice = extraItem.get(b).get("menu_extra_item_price");
                Functions.logDMsg("menuExtraItemId at viewBucket: " + extraItem.get(b).get("menu_extra_item_id"));
                stringBuilder.append(Functions.fixSpecialCharacter(menuExtraItemName));
                stringBuilder.append(" ");
                stringBuilder.append("(");
                stringBuilder.append(currencySymbol + extraItemPrice);
                stringBuilder.append(")");
                if (b != extraItem.size() - 1) {
                    stringBuilder.append(" ");
                    stringBuilder.append("\u00b7");
                    stringBuilder.append(" ");
                }

            }
        } else {
            stringBuilder.append("");
        }

        holder.binding.extraItem.setText(stringBuilder.toString());
        calculateTotalPrice(item, holder.binding.tvAmount);
        holder.bind(position, item, adapterClickListener);

    }

    private void calculateTotalPrice(CalculationModel item, TextView tvAmount) {
        Double totalExtraItemPrice = 0.0;
        double price1 = 0.0;
        double itemPrice = Double.parseDouble(item.getmPrice());
        double quantity = Double.parseDouble(item.getmQuantity());
        if (extraItem != null && extraItem.size() > 0) {
            for (int b = 0; b < extraItem.size(); b++) {
                String extraPrice = extraItem.get(b).get("menu_extra_item_price");
                double counter = Double.parseDouble(extraPrice);
                totalExtraItemPrice = counter + totalExtraItemPrice;
            }

            price1 = (totalExtraItemPrice + itemPrice) * quantity;
        } else {

            price1 = itemPrice * quantity;
        }

        tvAmount.setText(currencySymbol + Functions.roundoffDecimal(price1));
    }

    @Override
    public int getItemCount() {
        return arrayList.size();
    }

    public void updateList(ArrayList<CalculationModel> carList) {
        arrayList = carList;
        notifyDataSetChanged();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemViewBucketBinding binding;

        public ViewHolder(@NonNull ItemViewBucketBinding binding) {
            super(binding.getRoot());
            this.binding = binding;

        }


        public void bind(final int pos, final CalculationModel item, final AdapterClickListener clickListener) {
            itemView.setOnClickListener(v -> clickListener.onItemClickListener(pos, item, v));
        }
    }
}
