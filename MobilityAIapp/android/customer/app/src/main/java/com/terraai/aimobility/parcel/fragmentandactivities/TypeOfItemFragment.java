package com.terraai.aimobility.parcel.fragmentandactivities;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.recyclerview.widget.LinearLayoutManager;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.TypesOfItemModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.FragmentTypeOfItemBinding;
import com.terraai.aimobility.parcel.adapter.TypesOfItemAdapter;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;


public class TypeOfItemFragment extends BottomSheetDialogFragment {

    public static String selectedItem = "";
    ArrayList<TypesOfItemModel> typesOfItemModelArrayList = new ArrayList<>();
    TypesOfItemAdapter typesOfItemAdapter;
    Boolean isFromItem;
    FragmentTypeOfItemBinding binding;
    private FragmentCallBack callBack;

    public TypeOfItemFragment(Boolean isFromItem, FragmentCallBack callBack) {
        this.isFromItem = isFromItem;
        this.callBack = callBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentTypeOfItemBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        methodSetTypesOfItemAdapter();
        getTypesOfItemData();

        return view;
    }


    private void getTypesOfItemData() {
        binding.shimmerFrameContainer.shimmerViewContainer.setVisibility(View.VISIBLE);
        binding.shimmerFrameContainer.shimmerViewContainer.startShimmer();
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                new JSONObject().toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showGoodTypes(new JSONObject().toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {

                        binding.shimmerFrameContainer.shimmerViewContainer.setVisibility(View.GONE);
                        binding.shimmerFrameContainer.shimmerViewContainer.stopShimmer();

                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject responseObj = new JSONObject(resp);
                                    int code = responseObj.optInt("code");
                                    if (code == 200) {
                                        JSONArray msgarray = responseObj.getJSONArray("msg");
                                        typesOfItemModelArrayList.clear();
                                        for (int i = 0; i<msgarray.length(); i++){
                                            JSONObject goodsobj = msgarray.getJSONObject(i).getJSONObject("GoodType");

                                            TypesOfItemModel model = new TypesOfItemModel();
                                            model.setItemName(goodsobj.optString("name"));
                                            model.setId(goodsobj.optString("id"));
                                            typesOfItemModelArrayList.add(model);
                                        }
                                        typesOfItemAdapter.notifyDataSetChanged();
                                    } else {
                                        Functions.dialouge(getActivity(), "" + getActivity().getString(R.string.type_of_item_1), "" + responseObj.getString("msg"));
                                    }
                                } catch (Exception e) {
                                    Functions.logDMsg("Exception: "+e);
                                }

                            }
                        }
                        else
                        {

                        }
                    }
                });
    }

    private void methodSetTypesOfItemAdapter() {

        typesOfItemAdapter = new TypesOfItemAdapter(isFromItem, getActivity(), typesOfItemModelArrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {

                switch (view.getId()) {

                    case R.id.mainLayout:

                        TypesOfItemModel typesOfItemModel = (TypesOfItemModel) model;

                        selectedItem = typesOfItemModel.getItemName();

                        Functions.hideSoftKeyboard(getActivity());
                        Bundle bundle = new Bundle();
                        bundle.putString("item_name", selectedItem);
                        bundle.putString("item_id", typesOfItemModel.getId());
                        callBack.onItemClick(bundle);
                        dismiss();

                        break;

                    default:
                        break;
                }
            }
        });

        binding.typesOfItemRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.typesOfItemRecyclerView.setAdapter(typesOfItemAdapter);
        typesOfItemAdapter.notifyDataSetChanged();

    }

}