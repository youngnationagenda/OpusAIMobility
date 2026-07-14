package com.yna.opusaimobilityapp.foodadapter;

import android.content.Context;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.net.Uri;
import android.os.Build;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.codeclasses.DateOperations;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.Interface.AdapterClickListener;
import com.yna.opusaimobilityapp.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.ItemFilterResturantListBinding;

import java.util.ArrayList;
import java.util.Calendar;

public class FilterAdapter extends RecyclerView.Adapter<FilterAdapter.ViewHolder> {
    ItemFilterResturantListBinding binding;
    String currencyUnit;
    Context context;
    ArrayList<ResturantModel> allRestaurantsModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    private AnimatedVectorDrawable emptyHeart;
    private AnimatedVectorDrawable fillHeart;
    private boolean full = false;

    public FilterAdapter(Context context, ArrayList<ResturantModel> allRestaurantsModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.allRestaurantsModelArrayList = allRestaurantsModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public FilterAdapter.ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemFilterResturantListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            emptyHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(context, R.drawable.avd_heart_empty);
            fillHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(context, R.drawable.avd_heart_fill);
        }

        return new FilterAdapter.ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull FilterAdapter.ViewHolder holder, int positions) {

        final ResturantModel item = allRestaurantsModelArrayList.get(positions);
        currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        holder.itemView.resturantName.setText(item.getResturantName());
        holder.itemView.deliveryAmount.setText(currencyUnit + item.getDeliveryFee() + context.getString(R.string.delivery_free));

        if (item.getTotalRatingCount() != null && (!item.getTotalRatingCount().equals("") || !item.getTotalRatingCount().equals("null"))) {
            holder.itemView.rating.setText(String.format("%.03s", item.getTotalRatings()));
            holder.itemView.ratingLayout.setVisibility(View.VISIBLE);
        } else {
            holder.itemView.ratingLayout.setVisibility(View.GONE);
        }

        if (item.getBlock().equals("1")) {
            holder.itemView.unavailableLayout.setVisibility(View.VISIBLE);
            holder.itemView.warningTxt.setText(context.getString(R.string.not_available));
        } else {
            if (item.getOpen().equals("0")) {
                Calendar calendar = Calendar.getInstance();
                int day = calendar.get(Calendar.DAY_OF_WEEK);
                holder.itemView.unavailableLayout.setVisibility(View.VISIBLE);
                holder.itemView.scheduleOrderLayout.setVisibility(View.VISIBLE);
                holder.itemView.warningTxt.setText(context.getString(R.string.open_at) + " " + DateOperations.changeDateFormat("HH:mm:ss", "hh:mm a", item.getTimeModelArrayList().get(day - 1).getOpening_time()));
            }
        }

        String resturantImage = item.getResturantImage();

        if (resturantImage != null && !resturantImage.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + resturantImage);
            holder.itemView.menuImage.setImageURI(uri);
        }


        Functions.logDMsg("isLiked : " + item.getIsLiked());

        if (item.getIsLiked().equals("null") || item.getIsLiked().equals("0")) {
            full = true;
            holder.itemView.favBtn.setImageResource(R.drawable.ic_empty_heart);
        } else {
            full = false;
            holder.itemView.favBtn.setImageResource(R.drawable.ic_filled_heart);
        }

        holder.bind(positions, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return allRestaurantsModelArrayList.size();
    }

    public void animate1(ImageView view) {
        AnimatedVectorDrawable drawable
                = full
                ? emptyHeart
                : fillHeart;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            view.setImageDrawable(drawable);
        }
        drawable.start();
        full = !full;
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemFilterResturantListBinding itemView;

        public ViewHolder(@NonNull ItemFilterResturantListBinding itemView) {
            super(itemView.getRoot());

            this.itemView = itemView;

        }

        public void bind(final int pos, final ResturantModel item, final AdapterClickListener adapterClickListener1) {

            itemView.ratingLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapterClickListener1.onItemClickListener(pos, item, v);
                }
            });

            itemView.mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapterClickListener1.onItemClickListener(pos, item, v);
                }
            });

            itemView.favLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    adapterClickListener1.onItemClickListener(pos, item, v);
                }
            });
        }

    }

}

