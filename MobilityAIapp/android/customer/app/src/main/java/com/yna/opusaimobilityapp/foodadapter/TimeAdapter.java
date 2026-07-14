package com.yna.opusaimobilityapp.foodadapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.yna.opusaimobilityapp.codeclasses.DateOperations;
import com.yna.opusaimobilityapp.model.TimeModel;
import com.yna.opusaimobilityapp.databinding.ItemTimeListBinding;

import java.util.ArrayList;

public class TimeAdapter extends RecyclerView.Adapter<TimeAdapter.ViewHolder> {
    ItemTimeListBinding binding;
    Context context;
    ArrayList<TimeModel> timeModelArrayList = new ArrayList<>();

    public TimeAdapter(Context context, ArrayList<TimeModel> timeModelArrayList) {
        this.context = context;
        this.timeModelArrayList = timeModelArrayList;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemTimeListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        final TimeModel item = timeModelArrayList.get(position);
        String openingTime = DateOperations.changeDateFormat("HH:mm:ss","hh:mm a",item.getOpening_time());
        String closingTime = DateOperations.changeDateFormat("HH:mm:ss","hh:mm a",item.getClosing_time());
        holder.binding.tvDay.setText(item.getDay());
        holder.binding.tvtimeOpening.setText(openingTime + " . Opening Time");
        holder.binding.tvtimeClose.setText(closingTime + " . Closing Time");
    }

    @Override
    public int getItemCount() {
        return timeModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemTimeListBinding binding;
        public ViewHolder(@NonNull ItemTimeListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }
}
