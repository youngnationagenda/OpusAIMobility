package com.yna.opusaimobilityapp.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.codeclasses.DateOperations;
import com.yna.opusaimobilityapp.Constants;
import com.yna.opusaimobilityapp.model.RestaurantRatingModel;
import com.yna.opusaimobilityapp.databinding.ItemReviewListBinding;

import java.util.ArrayList;

public class ReviewAdapter extends RecyclerView.Adapter<ReviewAdapter.ViewHolder> {
    ItemReviewListBinding binding;
    Context context;
    ArrayList<RestaurantRatingModel> reviewModelArrayList = new ArrayList<>();

    public ReviewAdapter(Context context, ArrayList<RestaurantRatingModel> reviewModelArrayList) {
        this.context = context;
        this.reviewModelArrayList = reviewModelArrayList;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemReviewListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final RestaurantRatingModel item = reviewModelArrayList.get(position);
        holder.binding.userName.setText(item.getName());
        holder.binding.dateTime.setText(DateOperations.changeDate(item.getCreated()));
        holder.binding.commentsTxt.setText(item.getComment());
        holder.binding.dateTime.setText(DateOperations.changeDateFormat("yyyy-MM-dd HH:mm:ss", "MMMM yyyy", "" + item.getCreated()));
        String image = item.getImage();
        if (image != null && !image.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + image);
            holder.binding.userCommentImg.setImageURI(uri);
        }


    }

    @Override
    public int getItemCount() {
        return reviewModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemReviewListBinding binding;

        public ViewHolder(@NonNull ItemReviewListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;

        }
    }
}
