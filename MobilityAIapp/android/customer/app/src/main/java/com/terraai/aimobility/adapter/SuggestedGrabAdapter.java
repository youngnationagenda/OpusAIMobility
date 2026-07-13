package com.terraai.aimobility.adapter;

import android.content.Context;
import android.graphics.Paint;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import android.widget.ImageView; // AWS-MIGRATED: was ImageView (Fresco)
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.GrabCarModel;
import com.yna.opusaimobilityapp.R;

import java.util.ArrayList;

public class SuggestedGrabAdapter extends RecyclerView.Adapter<SuggestedGrabAdapter.ViewHolder> {

    Context context;
    ArrayList<GrabCarModel> list;
    AdapterClickListener adapterClickListener;

    public SuggestedGrabAdapter(Context context, ArrayList<GrabCarModel> list, AdapterClickListener adapterClickListener) {
        this.list = list;
        this.context = context;
        this.adapterClickListener = adapterClickListener;

    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.suggest_grabcar_itemview, null);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        GrabCarModel model = list.get(position);
        if (model.isFirstTime) {
            if (position == 0) {
                holder.grabCarItemViewLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.green_border_bg));
            } else {
                holder.grabCarItemViewLayout.setBackgroundResource(0);
            }
        } else {
            if (model.isSelected == true) {
                holder.grabCarItemViewLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.green_border_bg));
            } else {
                holder.grabCarItemViewLayout.setBackgroundResource(0);
            }
        }

        holder.grabNameText.setText(model.vehicleName);

        String imgUrl = model.vehicleImage;
        if (imgUrl != null && !imgUrl.equals("")) {
            Uri uri;
            if(model.vehicleImage.contains("http")){
                uri = Uri.parse(model.vehicleImage);
            }else{
                uri = Uri.parse(Constants.BASE_URL + model.vehicleImage);
            }
            holder.carImage.setImageURI(uri);
        }
        holder.arrivalTimeText.setText(model.time + " min");
        holder.grabSpecificationText.setText(model.vehicleDesc);

        if (model.discountValue != null && !model.discountValue.equals("")) {
            holder.rideFareText.setText(MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency)
                    + " " + model.discountValue);
            holder.actualPrice.setVisibility(View.VISIBLE);
            holder.actualPrice.setText(MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency)
                    + " " + model.estimatedFare);
        } else {
            holder.rideFareText.setText(MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency)
                    + " " + model.estimatedFare);
            holder.actualPrice.setVisibility(View.GONE);

        }

        holder.bind(position, model, adapterClickListener);
    }


    @Override
    public int getItemCount() {
        return list.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        View separatorView;
        TextView grabTypeText;
        TextView grabNameText;
        TextView rideFareText;
        TextView arrivalTimeText;
        ImageView carImage;
        TextView grabSpecificationText;
        RelativeLayout grabTypeLayout;
        RelativeLayout grabCarItemViewLayout;
        TextView actualPrice;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);


            grabTypeLayout = itemView.findViewById(R.id.grabTypeLayout);
            grabTypeText = itemView.findViewById(R.id.grabTypeText);
            carImage = itemView.findViewById(R.id.grabImage);
            separatorView = itemView.findViewById(R.id.separatorView);
            grabNameText = itemView.findViewById(R.id.grabNameText);
            rideFareText = itemView.findViewById(R.id.rideFareText);
            arrivalTimeText = itemView.findViewById(R.id.arrivalTimeText);
            grabSpecificationText = itemView.findViewById(R.id.grabSpecificationText);
            grabCarItemViewLayout = itemView.findViewById(R.id.grabCarItemViewLayout);
            actualPrice = itemView.findViewById(R.id.actualPrice);
            actualPrice.setPaintFlags(actualPrice.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
        }

        public void bind(int position, GrabCarModel model, AdapterClickListener adapterClickListener) {
            itemView.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    adapterClickListener.onItemClickListener(position, model, view);
                }
            });
        }
    }
}
