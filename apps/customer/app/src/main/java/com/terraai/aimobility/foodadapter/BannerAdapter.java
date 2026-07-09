package com.terraai.aimobility.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.LinearLayout;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.BannerModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.ItemBannerListBinding;

import java.util.ArrayList;

public class BannerAdapter extends RecyclerView.Adapter<BannerAdapter.ViewHolder> {
    ItemBannerListBinding binding;
    Context context;
    ArrayList<BannerModel> bannerModelArrayList;
    AdapterClickListener adapterClickListener;


    public BannerAdapter(Context context, ArrayList<BannerModel> bannerModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.bannerModelArrayList = bannerModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemBannerListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final BannerModel item = bannerModelArrayList.get(position);

        String imageUrl = item.getBannerImage();
        if (imageUrl != null && !imageUrl.equalsIgnoreCase("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + imageUrl);
            holder.listBinding.bannerImage.setImageURI(uri);
        }

        int height = (int) context.getResources().getDimension(R.dimen._140sdp);
        int  width = (int) context.getResources().getDimension(R.dimen._275sdp);

        if (bannerModelArrayList != null && bannerModelArrayList.size() > 1) {
             width = (int) context.getResources().getDimension(R.dimen._263sdp);
        }

        LinearLayout.LayoutParams parms = new LinearLayout.LayoutParams(width, height);
        holder.listBinding.mainLayout.setLayoutParams(parms);


        holder.bind(position, item, adapterClickListener);

    }

    @Override
    public int getItemCount() {
        return bannerModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {

        ItemBannerListBinding listBinding;

        public ViewHolder(@NonNull ItemBannerListBinding listBinding) {
            super(listBinding.getRoot());
            this.listBinding = listBinding;

        }


        public void bind(final int pos, final BannerModel item, final AdapterClickListener clickListener) {
            itemView.setOnClickListener(v -> clickListener.onItemClickListener(pos, item, v));
        }
    }
}
