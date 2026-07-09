package com.terraai.aimobility.foodadapter;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseExpandableListAdapter;
import android.widget.CheckBox;
import android.widget.ImageView;
import android.widget.RadioButton;
import android.widget.TextView;

import com.terraai.aimobility.Constants;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.model.ChildExpandListModel;
import com.terraai.aimobility.model.ParentExpandListModel;
import com.terraai.aimobility.R;

import java.util.ArrayList;

public class AddToCartExpandable extends BaseExpandableListAdapter {
    public boolean flagCheckbox;
    String currencyUnit;
    Context context;
    ArrayList<ParentExpandListModel> parentExpandListModelArrayList;
    ArrayList<ArrayList<ChildExpandListModel>> listChildTerbaru;
    String fromWhere;

    public AddToCartExpandable(Context context, ArrayList<ParentExpandListModel> parentExpandListModelArrayList, ArrayList<ArrayList<ChildExpandListModel>> ListChildTerbaru, String fromWhere) {
        this.context = context;
        this.parentExpandListModelArrayList = parentExpandListModelArrayList;
        this.listChildTerbaru = ListChildTerbaru;
        this.fromWhere = fromWhere;
    }

    @Override
    public boolean areAllItemsEnabled() {
        return true;
    }


    @Override
    public ChildExpandListModel getChild(int groupPosition, int childPosition) {
        return listChildTerbaru.get(groupPosition).get(childPosition);
    }

    @Override
    public long getChildId(int groupPosition, int childPosition) {
        return childPosition;
    }


    @Override
    public View getChildView(int groupPosition, final int childPosition, boolean isLastChild, View convertView, ViewGroup parent) {
        currencyUnit = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);

        final ChildExpandListModel childModel = getChild(groupPosition, childPosition);

        AddToCartExpandable.ViewHolder holder = null;
        notifyDataSetChanged();

        if (convertView == null) {
            LayoutInflater infalInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = infalInflater.inflate(R.layout.childexpandlistview, null);

            holder = new AddToCartExpandable.ViewHolder();
            holder.radioBtnItemName = convertView.findViewById(R.id.radio_btn_item_name);
            holder.itemPriceTv = convertView.findViewById(R.id.item_price_tv);

            holder.radioBtn = convertView.findViewById(R.id.radio_btn);
            holder.checkBtn = convertView.findViewById(R.id.check_btn);
            holder.viewLayout = convertView.findViewById(R.id.viewLayout);


            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }

        holder.radioBtnItemName.setText(Functions.decodeString(childModel.getChildName()));
        holder.itemPriceTv.setText("+ " + currencyUnit + childModel.getPriceAddOns());

        if (!flagCheckbox) {
            if (childModel.isChecked()) {
                holder.radioBtn.setChecked(true);
            } else {
                holder.radioBtn.setChecked(false);
            }
        } else {
            if (childModel.isChecked()) {
                holder.checkBtn.setChecked(true);
            } else {
                holder.checkBtn.setChecked(false);
            }
        }

        if (flagCheckbox) {
            childModel.setCheckedRequired(false);
            holder.radioBtn.setVisibility(View.INVISIBLE);
            holder.checkBtn.setVisibility(View.VISIBLE);
        } else {
            childModel.setCheckedRequired(true);
            holder.radioBtn.setVisibility(View.VISIBLE);
            holder.checkBtn.setVisibility(View.GONE);
        }

        int childCount = getChildrenCount(groupPosition);

        if (childCount - 1 == childPosition) {
            holder.viewLayout.setVisibility(View.GONE);
        }


        return convertView;
    }

    @Override
    public int getChildrenCount(int groupPosition) {
        return listChildTerbaru.get(groupPosition).size();
    }

    public ArrayList<ChildExpandListModel> getChilderns(int groupPos) {

        return listChildTerbaru.get(groupPos);
    }

    @Override
    public ParentExpandListModel getGroup(int groupPosition) {
        return parentExpandListModelArrayList.get(groupPosition);
    }

    @Override
    public int getGroupCount() {
        return parentExpandListModelArrayList.size();
    }

    @Override
    public long getGroupId(int groupPosition) {
        return groupPosition;
    }

    @Override
    public View getGroupView(int groupPosition, boolean isExpanded, View convertView, ViewGroup parent) {

        ParentExpandListModel modelParentName = (ParentExpandListModel) getGroup(groupPosition);
        AddToCartExpandable.ViewHolder holder = null;
        if (convertView == null) {
            LayoutInflater infalInflater = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
            convertView = infalInflater.inflate(R.layout.parentexpandview, null);
            holder = new AddToCartExpandable.ViewHolder();
            holder.parentTv = convertView.findViewById(R.id.parent_tv);
            holder.tvRequired = convertView.findViewById(R.id.tvRequired);
            holder.parentIndicatorImg = convertView.findViewById(R.id.parent_indicator_img);
            convertView.setTag(holder);
        } else {
            holder = (AddToCartExpandable.ViewHolder) convertView.getTag();
        }

        if (isExpanded) {
            holder.parentIndicatorImg.setImageResource(R.drawable.ic_arrow_down);
        } else {
            holder.parentIndicatorImg.setImageResource(R.drawable.ic_arrow_up);
        }

        holder.parentTv.setText(Functions.decodeString(modelParentName.getParentName()));
        String checkRequired = modelParentName.getIsRequired();
        if (checkRequired.equalsIgnoreCase("1")) {
            holder.tvRequired.setVisibility(View.VISIBLE);
            flagCheckbox = false;
        } else {
            holder.tvRequired.setVisibility(View.GONE);
            flagCheckbox = true;
        }

        return convertView;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    @Override
    public boolean isChildSelectable(int arg0, int arg1) {
        return true;
    }


    static class ViewHolder {
        TextView parentTv, radioBtnItemName, itemPriceTv, tvRequired;
        RadioButton radioBtn;
        CheckBox checkBtn;
        View viewLayout;
        ImageView parentIndicatorImg;
    }


}