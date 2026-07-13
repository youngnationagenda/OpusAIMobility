package com.terraai.aimobility.adapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.ride.bookride.BookGrabCarBottomSheet;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.GrabCarModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.BookGrabCarItemviewBinding;

import java.util.ArrayList;

public class GrabCarAdapter extends RecyclerView.Adapter<GrabCarAdapter.ViewHolder> {

    BookGrabCarItemviewBinding itemviewBinding;
    Context context;
    ArrayList<GrabCarModel> list;
    AdapterClickListener adapterClickListener;

    public GrabCarAdapter(Context context, ArrayList<GrabCarModel> list, AdapterClickListener adapterClickListener) {

        this.list = list;
        this.context = context;
        this.adapterClickListener = adapterClickListener;

    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        itemviewBinding = BookGrabCarItemviewBinding.inflate(LayoutInflater.from(parent.getContext()),parent, false);
        return new ViewHolder(itemviewBinding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        GrabCarModel model = list.get(position);

        holder.itemviewBinding.grabTypeText.setText(model.rideType);

        if (position == 0) {
            holder.itemviewBinding.grabTypeLayout.setVisibility(View.VISIBLE);

        } else {
            GrabCarModel grabCarModel = list.get(position - 1);
            if (model.rideType.equals(grabCarModel.rideType)) {
                holder.itemviewBinding.grabTypeLayout.setVisibility(View.GONE);
            } else {
                holder.itemviewBinding.grabTypeLayout.setVisibility(View.VISIBLE);
            }
        }

        if (model.id!=null &&  (BookGrabCarBottomSheet.selectedItem!=null && BookGrabCarBottomSheet.selectedItem.id!=null))
        {
            if (model.id.equals(BookGrabCarBottomSheet.selectedItem.id)) {
                holder.itemviewBinding.separatorView.setVisibility(View.GONE);
                holder.itemviewBinding.grabCarItemViewLayout.setBackgroundColor(ContextCompat.getColor(context, R.color.selection_green));
            }
            else
            if (position == 0 && BookGrabCarBottomSheet.selectedItem==null) {
                holder.itemviewBinding.separatorView.setVisibility(View.GONE);
                holder.itemviewBinding.grabCarItemViewLayout.setBackgroundColor(ContextCompat.getColor(context, R.color.selection_green));
            }
            else {
                holder.itemviewBinding.separatorView.setVisibility(View.VISIBLE);
                holder.itemviewBinding.grabCarItemViewLayout.setBackgroundColor(0);
            }
        }
        else
        {
            holder.itemviewBinding.separatorView.setVisibility(View.VISIBLE);
            holder.itemviewBinding.grabCarItemViewLayout.setBackgroundColor(0);
        }



        if (list.size() != (position + 1)) {
            GrabCarModel item1 = list.get(position + 1);
            if (item1 != null) {
                if (model.rideType.equalsIgnoreCase(item1.rideType)) {
                    model.setCheck(false);
                } else {
                    model.setCheck(true);
                }
            }
        }

        if (model.isCheck()) {
            holder.itemviewBinding.separatorView.setVisibility(View.GONE);
        }
        else {
            holder.itemviewBinding.separatorView.setVisibility(View.VISIBLE);
        }


        if (position == list.size() - 1) {
            holder.itemviewBinding.separatorView.setVisibility(View.GONE);
        }


        String imgUrl = model.vehicleImage;
        if (imgUrl != null && !imgUrl.equals("")) {
            Uri uri = Uri.parse(model.vehicleImage);
            holder.itemviewBinding.grabImage.setImageURI(uri);
        }

        if (model.discountValue != null && !model.discountValue.equals("")) {
            holder.itemviewBinding.rideFareText.setText(MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency)
                    + " " + model.discountValue);
            holder.itemviewBinding.actualPrice.setVisibility(View.VISIBLE);
            holder.itemviewBinding.actualPrice.setText(MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency)
                    + " " + model.estimatedFare);
        }
        else {
            holder.itemviewBinding.rideFareText.setText(MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency)
                    + " " + model.estimatedFare);
            holder.itemviewBinding.actualPrice.setVisibility(View.GONE);

        }


        holder.itemviewBinding.grabNameText.setText(model.vehicleName);
        holder.itemviewBinding.arrivalTimeText.setText(model.time + " min");
        holder.itemviewBinding.grabSpecificationText.setText(model.vehicleDesc);
        holder.bind(position, model, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return list.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        BookGrabCarItemviewBinding itemviewBinding;
        public ViewHolder(@NonNull BookGrabCarItemviewBinding itemviewBinding) {
            super(itemviewBinding.getRoot());
            this.itemviewBinding = itemviewBinding;
        }

        public void bind(int position, GrabCarModel model, AdapterClickListener adapterClickListener) {
            itemviewBinding.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    adapterClickListener.onItemClickListener(position, model, view);
                }
            });
        }
    }
}
