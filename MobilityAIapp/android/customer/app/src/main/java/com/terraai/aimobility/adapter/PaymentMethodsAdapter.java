package com.terraai.aimobility.adapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.model.PaymentMethodsModel;
import com.yna.opusaimobilityapp.R;

import java.util.ArrayList;

public class PaymentMethodsAdapter extends RecyclerView.Adapter<PaymentMethodsAdapter.ViewHolder> {

    Context context;
    ArrayList<PaymentMethodsModel> paymentMethodsModelArrayList = new ArrayList<>();
    AdapterClickListener adapterClickListener;
    boolean isEdit = false;

    public PaymentMethodsAdapter(Context context, ArrayList<PaymentMethodsModel> paymentMethodsModelArrayList, AdapterClickListener adapterClickListener) {
        this.context = context;
        this.paymentMethodsModelArrayList = paymentMethodsModelArrayList;
        this.adapterClickListener = adapterClickListener;
    }

    @NonNull
    @Override
    public PaymentMethodsAdapter.ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        View view = LayoutInflater.from(viewGroup.getContext()).inflate(R.layout.item_paymentmethods_list, null);
        return new PaymentMethodsAdapter.ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PaymentMethodsAdapter.ViewHolder holder, int position) {

        final PaymentMethodsModel item = paymentMethodsModelArrayList.get(position);

        if (isEdit) {
            holder.rledit.setVisibility(View.VISIBLE);
        } else {
            holder.rledit.setVisibility(View.GONE);
        }

        holder.tvMasterCard.setText(item.getCardName() + " (" + item.getCardFour() + ")");
        if(item.getCardName().equalsIgnoreCase("visa")){
            holder.cardImage.setImageResource(R.drawable.ic_visa_card);
        }else if(item.getCardName().equalsIgnoreCase("mastercard")){
            holder.cardImage.setImageResource(R.drawable.ic_mastercard);
        }else{
            holder.cardImage.setImageResource(R.drawable.ic_card_any);
        }
        holder.tvUserName.setText(item.getUserName());


        holder.tvDate.setText(item.getDate());
        holder.bind(position, item, adapterClickListener);
    }

    public void enableEdit(boolean b) {
        isEdit = b;
        notifyDataSetChanged();
    }

    @Override
    public int getItemCount() {
        return paymentMethodsModelArrayList.size();
    }

    public class ViewHolder extends RecyclerView.ViewHolder {


        TextView tvMasterCard, tvUserName, tvDate;
        RelativeLayout rledit;
        ImageView cardImage;
        LinearLayout mainLayout;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);

            tvMasterCard = itemView.findViewById(R.id.tvMasterCard);
            tvUserName = itemView.findViewById(R.id.tvUserName);
            rledit = itemView.findViewById(R.id.rledit);
            tvDate = itemView.findViewById(R.id.tvDate);
            mainLayout = itemView.findViewById(R.id.mainLayout);
            cardImage = itemView.findViewById(R.id.cardImage);

        }


        public void bind(final int item, final PaymentMethodsModel model,
                         final AdapterClickListener listener) {
            rledit.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // This is OnClick of any list Item
                    listener.onItemClickListener(item, model, v);
                }

            });

            mainLayout.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    // This is OnClick of any list Item
                    listener.onItemClickListener(item, model, v);
                }

            });
        }
    }
}
