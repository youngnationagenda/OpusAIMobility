package com.terraai.aimobility.foodadapter;

import android.content.Context;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.codeclasses.CustomLinearLayoutManager;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.databinding.ItemMenuDetailListBinding;
import com.terraai.aimobility.databinding.ItemMenuListBinding;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.MenuDetailsModel;
import com.terraai.aimobility.model.MenuModel;

import java.util.ArrayList;


public class MenuAdapter extends RecyclerView.Adapter<MenuAdapter.ViewHolder> {
    ItemMenuListBinding binding;
    Context context;
    ArrayList<MenuModel> menuModelArrayList;
    AdapterClickListener adapterClickListener;
    String currencyUnit;
    public MenuAdapter.OnItemClickListener listener;
    public  InnerCartAdapter itemListDataAdapter;
    boolean aBoolean;
    int pos;

    public interface OnItemClickListener {
        void onItemClick(Object model, int postion, View view);
    }

    public MenuAdapter(Context context, ArrayList<MenuModel> menuModelArrayList, AdapterClickListener adapterClickListener, OnItemClickListener onItemClickListener, boolean b) {
        this.context = context;
        this.menuModelArrayList = menuModelArrayList;
        this.adapterClickListener = adapterClickListener;
        this.listener = onItemClickListener;
        this.aBoolean = b;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup viewGroup, int viewType) {
        binding = ItemMenuListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
        return new ViewHolder(binding);
    }


    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {

        final MenuModel menuModel = menuModelArrayList.get(position);
        pos  =  position;

        holder.binding.tvTitle.setText(Functions.decodeString(menuModel.getMenuName()));
        if(aBoolean){
            if(position > 0){
                if(menuModelArrayList.get(position - 1).getMenuName().equals(menuModel.getMenuName())){
                    holder.binding.tvTitle.setVisibility(View.GONE);
                }else{
                    holder.binding.tvTitle.setVisibility(View.VISIBLE);
                }
            }
        }

        ArrayList<MenuDetailsModel> menuDetailsModelArrayList = menuModel.getMenuModelArrayList();

        itemListDataAdapter = new InnerCartAdapter(context, menuDetailsModelArrayList);
        CustomLinearLayoutManager customLayoutManager = new CustomLinearLayoutManager(context,LinearLayoutManager.VERTICAL,false);
        holder.binding.recyclerView.setLayoutManager(customLayoutManager);
        holder.binding.recyclerView.setAdapter(itemListDataAdapter);
        holder.binding.recyclerView.setNestedScrollingEnabled(false);
        itemListDataAdapter.notifyDataSetChanged();
    }



    public int getPosition(){
        return pos;
    }

    @Override
    public int getItemCount() {
        if (menuModelArrayList != null)
            return menuModelArrayList.size();
        else
            return 0;
    }

    public class ViewHolder extends RecyclerView.ViewHolder {
        ItemMenuListBinding binding;

        public ViewHolder(@NonNull ItemMenuListBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }
    }

    public static ArrayList<CalculationModel> findDuplicates(ArrayList<CalculationModel> carList) {

        ArrayList<CalculationModel> duplicates = new ArrayList<CalculationModel>();
        for (int i = 0; i < carList.size(); i++) {
            for (int j = 1; j < carList.size(); j++) {
                if (carList.get(i).getmItemID().equals(carList.get(j).getmItemID()) && i != j) {
                    // duplicate element found
                    duplicates.add(carList.get(i));
                    break;
                }
            }
        }

        return duplicates;
    }

    ///Second Adapter
    public class InnerCartAdapter extends RecyclerView.Adapter<InnerCartAdapter.CustomViewHolder> {
        ItemMenuDetailListBinding binding;
        public Context context;
        ArrayList<MenuDetailsModel> menuDetailsModelArrayList = new ArrayList<>();
        ArrayList<CalculationModel> carList = new ArrayList<>();

        public InnerCartAdapter(Context context, ArrayList<MenuDetailsModel> menuDetailsModels) {
            this.context = context;
            this.menuDetailsModelArrayList = menuDetailsModels;
        }

        public void updateList() {
            // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
            // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(context) */ null.getString(MyPreferences.USER_ID, ""), new ArrayList<>());
            // [AWS] Read result discarded
            notifyDataSetChanged();
        }

        @Override
        public InnerCartAdapter.CustomViewHolder onCreateViewHolder(ViewGroup viewGroup, int viewtype) {
            binding = ItemMenuDetailListBinding.inflate(LayoutInflater.from(viewGroup.getContext()), viewGroup, false);
            return new CustomViewHolder(binding);

        }

        @Override
        public void onBindViewHolder(CustomViewHolder holder, int position) {
            currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
            // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
            // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(context) */ null.getString(MyPreferences.USER_ID, ""), new ArrayList<>());
            // [AWS] Read result discarded

            MenuDetailsModel detailsModel = menuDetailsModelArrayList.get(position);
            holder.binding.recipeName.setText(Functions.decodeString(detailsModel.getName()));
            holder.binding.recipeDetail.setText(Functions.decodeString(detailsModel.getDescription()));
            holder.binding.tvAmount.setText(currencyUnit + " " + detailsModel.getPrice());

            if(carList.size() > 0) {
                for(int i = 0; i < carList.size(); i++){
                    if(carList.get(i).getmItemID().equals(detailsModel.getMenuItemId())){
                        holder.binding.quantityLayout.setVisibility(View.VISIBLE);
                        ArrayList<CalculationModel> duplicates = findDuplicates(carList);
                        int count = 0;
                        for (int j = 0; j < duplicates.size(); j++) {
                            if (duplicates.get(j).getmItemID().equals(detailsModel.getMenuItemId())) {
                                int quantity = Integer.parseInt(duplicates.get(j).getmQuantity());
                                count = count + quantity;
                            }
                        }
                        if(count == 0){
                            count = Integer.parseInt(carList.get(i).getmQuantity());
                        }
                        holder.binding.tvQuantityMenu.setText("" + count);
                    }
                }
            }

            String image = detailsModel.getImage();
            Uri uri = Uri.parse(Constants.BASE_URL + image);
            if (image != null && !image.equals("")) {
                Functions.loadImage(holder.binding.menuImage , uri);
            }else{
                holder.binding.menuImage.setVisibility(View.GONE);
            }
            holder.bind(position, detailsModel, listener);
        }

        @Override
        public int getItemCount() {
            if (menuDetailsModelArrayList != null)
                return menuDetailsModelArrayList.size();
            else
                return 0;
        }

        public void makeChanges() {
        }

        class CustomViewHolder extends RecyclerView.ViewHolder {

            ItemMenuDetailListBinding binding;
            public CustomViewHolder(ItemMenuDetailListBinding binding) {
                super(binding.getRoot());
                this.binding = binding;


            }

            public void bind(final int pos, final MenuDetailsModel datalist, OnItemClickListener listener) {
                binding.mainLayout.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        listener.onItemClick(datalist, pos, v);
                    }
                });
            }
        }
    }
}
