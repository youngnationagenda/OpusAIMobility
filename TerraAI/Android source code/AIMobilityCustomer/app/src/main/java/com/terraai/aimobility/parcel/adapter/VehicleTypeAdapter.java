package com.terraai.aimobility.parcel.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.VehicleTypeModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.parcel.fragmentandactivities.VehicleTypeFragment;

import java.util.ArrayList;

public class VehicleTypeAdapter extends RecyclerView.Adapter<VehicleTypeAdapter.ViewHolder> {

    Context context;
    ArrayList<VehicleTypeModel> vehicleTypeModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;

    public VehicleTypeAdapter(Context context, ArrayList<VehicleTypeModel> vehicleTypeModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.vehicleTypeModelArrayList = vehicleTypeModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        View view = LayoutInflater.from(viewGroup.getContext()).inflate(R.layout.item_vehicle_type_list, null);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final VehicleTypeModel item = vehicleTypeModelArrayList.get(position);

        holder.vehicleName.setText(item.getVehicleName());
        holder.forItems.setText(item.getForItem());
        holder.tvPrice.setText(item.getAmount());
        holder.ivVehicle.setImageResource(item.getVehicleImage());


        if (VehicleTypeFragment.selectItem.equals("") && position == 0) {

            holder.mainLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.green_bg_with_stroke));

        } else if (item.getId().equals(VehicleTypeFragment.selectItem)) {

            holder.mainLayout.setBackground(ContextCompat.getDrawable(context, R.drawable.green_bg_with_stroke));

        } else {

            holder.mainLayout.setBackgroundColor(ContextCompat.getColor(context, R.color.transparent));

        }


        holder.bind(position, item, adapterClickListener);


    }

    @Override
    public int getItemCount() {
        return vehicleTypeModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        TextView vehicleName, forItems, tvPrice;
        ImageView ivVehicle;
        RelativeLayout mainLayout;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);

            ivVehicle = itemView.findViewById(R.id.ivVehicle);
            vehicleName = itemView.findViewById(R.id.vehicleName);
            forItems = itemView.findViewById(R.id.forItems);
            tvPrice = itemView.findViewById(R.id.tvPrice);
            mainLayout = itemView.findViewById(R.id.mainLayout);

        }

        public void bind(final int pos, final VehicleTypeModel item, final AdapterClickListener adapter_clickListener) {
            mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });
        }

    }
}
