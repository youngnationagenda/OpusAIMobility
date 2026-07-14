package com.terraai.aimobility.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.ItemFavouriteHomeListBinding;

import java.util.ArrayList;
import java.util.Calendar;

public class FavrouiteHomeAdapter extends RecyclerView.Adapter<FavrouiteHomeAdapter.ViewHolder> {
    ItemFavouriteHomeListBinding binding;
    String currencyUnit;
    Context context;
    ArrayList<ResturantModel> resturantModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    private boolean full = false;

    public FavrouiteHomeAdapter(Context context, ArrayList<ResturantModel> resturantModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.resturantModelArrayList = resturantModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemFavouriteHomeListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final ResturantModel item = resturantModelArrayList.get(position);

        int height = (int) context.getResources().getDimension(R.dimen._190sdp);

        LinearLayout.LayoutParams parms = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, height);

        if (resturantModelArrayList != null && resturantModelArrayList.size() > 1) {
            int width = (int) context.getResources().getDimension(R.dimen._230sdp);
            parms = new LinearLayout.LayoutParams(width, height);
        }

        holder.binding.mainLayout.setLayoutParams(parms);

        currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        holder.binding.recipeName.setText(item.getResturantName());
        holder.binding.deliveryAmount.setText(currencyUnit + item.getDeliveryFee() + context.getString(R.string.delivery_fee));
        holder.binding.tvTime.setText(item.getDeliveryMinTime() + " - " + item.getDeliveryMaxTime() + context.getString(R.string.min_time));

        if (item.getTotalRatingCount() != null && (!item.getTotalRatingCount().equals("") || !item.getTotalRatingCount().equals("null"))) {
            holder.binding.rating.setText(String.format("%.03s", item.getTotalRatings()));
            holder.binding.ratingLayout.setVisibility(View.VISIBLE);
        } else {
            holder.binding.ratingLayout.setVisibility(View.GONE);
        }

        if (item.getBlock().equals("1")) {
            holder.binding.unavailableLayout.setVisibility(View.VISIBLE);
            holder.binding.warningTxt.setText(context.getResources().getString(R.string.not_available));
        } else {
            if (item.getOpen().equals("0")) {
                Calendar calendar = Calendar.getInstance();
                int day = calendar.get(Calendar.DAY_OF_WEEK);
                holder.binding.unavailableLayout.setVisibility(View.VISIBLE);
                holder.binding.scheduleOrderLayout.setVisibility(View.VISIBLE);
                holder.binding.warningTxt.setText(context.getResources().getString(R.string.open_at) + " " + DateOperations.changeDateFormat("HH:mm:ss", "hh:mm a", item.getTimeModelArrayList().get(day - 1).getOpening_time()));
            }
        }


        String resturantImage = item.getResturantImage();


        if (resturantImage != null && !resturantImage.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + resturantImage);
            holder.binding.resturantImage.setImageURI(uri);
        }

        if (item.getIsLiked().equals("null") || item.getIsLiked().equals("0")) {
            full = true;
            holder.binding.favBtn.setImageResource(R.drawable.ic_empty_heart);
        } else {
            full = false;
            holder.binding.favBtn.setImageResource(R.drawable.ic_filled_heart);
        }

        holder.bind(position, item, adapterClickListener);
    }

    @Override
    public int getItemCount() {
        return resturantModelArrayList.size();
    }


    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemFavouriteHomeListBinding binding;

        public ViewHolder(@NonNull ItemFavouriteHomeListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        public void bind(final int pos, final ResturantModel item, final AdapterClickListener adapter_clickListener) {
            binding.ratingLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });

            binding.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapter_clickListener.onItemClickListener(pos, item, v);
                }
            });

            binding.favLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapterClickListener.onItemClickListener(pos, item, v);
                }
            });
        }
    }
}
