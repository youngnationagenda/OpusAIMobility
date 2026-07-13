package com.terraai.aimobility.foodadapter;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.drawable.AnimatedVectorDrawable;
import android.net.Uri;
import android.os.Build;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;

import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.ResturantModel;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.ItemRcNearLayoutBinding;

import java.util.ArrayList;
import java.util.Calendar;

public class MapRestaurantAdapter extends RecyclerView.Adapter<MapRestaurantAdapter.NearViewHolder> {
    ItemRcNearLayoutBinding binding;
    String currencyUnit;
    Context context;
    ArrayList<ResturantModel> allRestaurantsModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    private AnimatedVectorDrawable emptyHeart;
    private AnimatedVectorDrawable fillHeart;
    private boolean full = false;

    public MapRestaurantAdapter(Context context, ArrayList<ResturantModel> nearByResturentsModelList, AdapterClickListener onItemClickListener) {
        this.context = context;
        this.allRestaurantsModelArrayList = nearByResturentsModelList;
        this.adapterClickListener = onItemClickListener;
    }

    public NearViewHolder onCreateViewHolder(ViewGroup viewGroup, int viewType) {
        binding = ItemRcNearLayoutBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            emptyHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(context, R.drawable.avd_heart_empty);
            fillHeart = (AnimatedVectorDrawable) ContextCompat.getDrawable(context, R.drawable.avd_heart_fill);
        }

        return new NearViewHolder(binding);
    }

    @SuppressLint("WrongConstant")
    public void onBindViewHolder(NearViewHolder holder, int position) {

        ResturantModel item = allRestaurantsModelArrayList.get(position);

        currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        holder.itemView.resturantName.setText(item.getResturantName());
        holder.itemView.deliveryAmount.setText(currencyUnit + item.getDeliveryFee() + context.getString(R.string.delivery_free));

        if (item.getTotalRatingCount() != null && !item.getTotalRatingCount().equals("") && !item.getTotalRatingCount().equals("null")) {
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


        if (item.getIsLiked().equals("null") || item.getIsLiked().equals("0")) {
            full = true;
            animate1(holder.itemView.favBtn);
        } else {
            full = false;
            animate1(holder.itemView.favBtn);
        }

        holder.bind(position, item, adapterClickListener);
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


    public int getItemCount() {
        return allRestaurantsModelArrayList.size();
    }

    class NearViewHolder extends RecyclerView.ViewHolder {


        ItemRcNearLayoutBinding itemView;

        public NearViewHolder(ItemRcNearLayoutBinding itemView) {
            super(itemView.getRoot());
            this.itemView = itemView;
        }

        public void bind(final int item, final ResturantModel model, final AdapterClickListener listener) {
            itemView.mainLayout.setOnClickListener(v -> listener.onItemClickListener(item, model, v));

            itemView.favLayout.setOnClickListener(v -> listener.onItemClickListener(item, model, v));
        }
    }
}
