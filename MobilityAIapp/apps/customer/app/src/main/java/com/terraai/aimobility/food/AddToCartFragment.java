package com.terraai.aimobility.food;

import android.app.Dialog;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.CheckBox;
import android.widget.ExpandableListView;
import android.widget.FrameLayout;

import androidx.core.content.ContextCompat;

import com.google.android.material.snackbar.Snackbar;
import com.terraai.aimobility.activitiesandfragment.FoodActivity;
import com.terraai.aimobility.codeclasses.DateOperations;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.foodadapter.AddToCartExpandable;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.terraai.aimobility.model.CalculationModel;
import com.terraai.aimobility.model.ChildExpandListModel;
import com.terraai.aimobility.model.MenuDetailsModel;
import com.terraai.aimobility.model.ParentExpandListModel;
import com.terraai.aimobility.model.ResturantModel;
import com.terraai.aimobility.R;
import com.terraai.aimobility.databinding.DateSheduleDialogFoodBinding;
import com.terraai.aimobility.databinding.FragmentAddToCartBinding;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;



public class AddToCartFragment extends RootFragment implements View.OnClickListener {

    public boolean FLAG_ONCE_LOOP_ADD;
    public Date date;
    FragmentAddToCartBinding binding;
    int counter = 1;
    String currencySymbol, previousCheck, fromWhere;
    Bundle bundle;
    MenuDetailsModel menuDetailsModel;
    ResturantModel resturantModel;
    ArrayList<ParentExpandListModel> parentExpandListModels;
    ArrayList<ChildExpandListModel> childExpandListModels;
    AddToCartExpandable listAdapter;
    ArrayList<Integer> arrayList = new ArrayList<>();
    int required = 0;
    ArrayList<HashMap<String, String>> extraItem = new ArrayList<>();
    ArrayList<CalculationModel> carList = new ArrayList<>();
    FoodActivity mainActivity;
    int cartposition;
    FragmentCallBack fragmentCallBack;
    Date pickedDate;
    String pickedDateSt;
    double itemPrice;
    Double totalExtraItemPrice = 0.0;
    ArrayList<CalculationModel> dataList;
    boolean isRequiredChecked = false;
    ArrayList<ArrayList<ChildExpandListModel>> listChild;
    String schedule = "0";
    String scheduleDatetime = "";
    String isRequired = "0";

    public AddToCartFragment() {
        // Required empty public constructor
    }


    public AddToCartFragment(FragmentCallBack fragmentCallBack) {
        this.fragmentCallBack = fragmentCallBack;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentAddToCartBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();

        parentExpandListModels = new ArrayList<>();
        childExpandListModels = new ArrayList<>();
        dataList = new ArrayList<>();
        menuDetailsModel = new MenuDetailsModel();

        currencySymbol = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        bundle = getArguments();
        mainActivity = (FoodActivity) this.getActivity();
        extraItem = new ArrayList<>();
        if (bundle != null) {
            menuDetailsModel = (MenuDetailsModel) bundle.getSerializable("recipeMenuDetailsModel");
            fromWhere = bundle.getString("fromWhere");
            resturantModel = (ResturantModel) bundle.getSerializable("resturantModel");

            if (menuDetailsModel != null && menuDetailsModel.getMenuSectionList() != null && menuDetailsModel.getMenuSectionList().size() > 0) {
                parentExpandListModels = menuDetailsModel.getMenuSectionList();
            }

            if (fromWhere != null && fromWhere.equals("viewBucket")) {
                ArrayList<HashMap<String, String>> hashMaps = (ArrayList<HashMap<String, String>>) bundle.getSerializable("extraItem");
                extraItem = hashMaps;
                cartposition = bundle.getInt("position");
            }
        }

        try {
            // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
            // Original: carList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
            // [AWS] Read result discarded
        } catch (Exception e) {
            e.printStackTrace();
        }

        listChild = new ArrayList<>();

        if (parentExpandListModels != null && !parentExpandListModels.isEmpty()) {
            for (int i = 0; i < parentExpandListModels.size(); i++) {
                ParentExpandListModel parentExpandListModel = parentExpandListModels.get(i);
                ArrayList<ChildExpandListModel> listModel = parentExpandListModel.getChildExpandListModel();
                childExpandListModels = new ArrayList<>();
                for (int a = 0; a < listModel.size(); a++) {
                    ChildExpandListModel childExpandListModel = new ChildExpandListModel();
                    childExpandListModel.setChildName(listModel.get(a).getChildName());
                    childExpandListModel.setMenuExtraChildid(listModel.get(a).getMenuExtraChildid());
                    childExpandListModel.setPriceAddOns(listModel.get(a).getPriceAddOns());
                    childExpandListModel.setActive(listModel.get(a).getActive());

                    if (fromWhere.equals("viewBucket")) {
                        ArrayList<HashMap<String, String>> extraItemBucket = carList.get(cartposition).getExtraItem();
                        for (int x = 0; x < extraItemBucket.size(); x++) {
                            String menuExtraItemId = extraItemBucket.get(x).get("menu_extra_item_id");
                            if (menuExtraItemId.equals(childExpandListModel.menuExtraChildid)) {
                                childExpandListModel.isChecked = true;
                            }
                        }
                    }
                    childExpandListModels.add(childExpandListModel);
                }

                listChild.add(childExpandListModels);
            }

            binding.itemDetailList.setExpanded(true);
            binding.itemDetailList.setGroupIndicator(null);

            listAdapter = new AddToCartExpandable(getActivity(), parentExpandListModels, listChild, fromWhere);
            binding.itemDetailList.setOnChildClickListener(new ExpandableListView.OnChildClickListener() {
                @Override
                public boolean onChildClick(ExpandableListView expandableListView, View view, int groupPosition, int childPosition, long l) {

                    ChildExpandListModel item = (ChildExpandListModel) listAdapter.getChild(groupPosition, childPosition);

                    boolean iteIsRequired = item.isCheckedRequired();
                    if (!iteIsRequired) {
                        CheckBox checkBox = view.findViewById(R.id.check_btn);
                        if (checkBox != null) {
                            if (!checkBox.isChecked()) {
                                checkBox.setChecked(true);
                                FLAG_ONCE_LOOP_ADD = true;
                                item.setChecked(true);
                                addNewNode(item.getMenuExtraChildid(), item.getChildName(), item.getPriceAddOns());
                                loadCalculationOnClick();
                            } else if (checkBox.isChecked()) {
                                deleteNode(item.getMenuExtraChildid());
                                checkBox.setChecked(false);
                                item.setChecked(false);
                                FLAG_ONCE_LOOP_ADD = false;
                                loadCalculationOnClick();
                            }
                        }
                        listAdapter.notifyDataSetChanged();
                    } else {
                        if (!item.isChecked()) {
                            ArrayList<ChildExpandListModel> childsList = listAdapter.getChilderns(groupPosition);
                            for (ChildExpandListModel model : childsList) {
                                if (model.isChecked()) {
                                    previousCheck = model.getMenuExtraChildid();
                                    break;
                                }
                            }

                            if (arrayList.contains(groupPosition)) {
                                deleteNode(previousCheck);
                                addNewNode(item.getMenuExtraChildid(), item.getChildName(), item.getPriceAddOns());
                                previousCheck = item.getMenuExtraChildid();
                                loadCalculationOnClick();
                                isRequiredChecked = true;
                            } else {
                                isRequiredChecked = true;
                                addNewNode(item.getMenuExtraChildid(), item.getChildName(), item.getPriceAddOns());
                                previousCheck = item.getMenuExtraChildid();
                                loadCalculationOnClick();
                                required = required + 1;
                            }

                            if (!arrayList.contains(groupPosition)) {
                                arrayList.add(groupPosition);
                            }

                            upDateNotify(listAdapter.getChilderns(groupPosition));
                            item.setChecked(true);
                            listAdapter.notifyDataSetChanged();
                        }
                    }
                    return false;
                }
            });
            binding.itemDetailList.setAdapter(listAdapter);

            for (int l = 0; l < listAdapter.getGroupCount(); l++)
                binding.itemDetailList.expandGroup(l);
        }

        initializeListeners();
        setUpScreenData();

        if (resturantModel.getBlock().equals("1") || menuDetailsModel.getActive().equals("0")) {
            binding.addToCartBtn.setVisibility(View.GONE);
            binding.view.setVisibility(View.GONE);
            binding.itemNotAvaliable.setVisibility(View.VISIBLE);
        }

        return view;
    }


    private void initializeListeners() {

        binding.minusBtn.setOnClickListener(this);
        binding.plusBtn.setOnClickListener(this);
        binding.backBtn.setOnClickListener(this);
        binding.addToCartBtn.setOnClickListener(this);
        binding.deleteItem.setOnClickListener(this);

        binding.plusBtn.setOnClickListener(v -> {
            counter++;
            changeData(counter);
            binding.icMinus.setImageResource(R.drawable.ic_minus_black);
            binding.minusBtn.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.white_circle_with_stroke));
            loadCalculationOnClick();
        });

        binding.minusBtn.setOnClickListener(v -> {
            if (counter > 1) {
                counter--;
                changeData(counter);
                if (counter == 1) {
                    binding.icMinus.setImageResource(R.drawable.ic_minus_grey);
                    binding.minusBtn.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.grey_circle_with_stroke));
                }
                loadCalculationOnClick();
            }
        });

    }

    private void setUpScreenData() {
        binding.menuName.setText(Functions.decodeString(menuDetailsModel.getName()));

        String resturantImage = menuDetailsModel.getImage();
        if (resturantImage != null && !resturantImage.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + resturantImage);
            binding.menuImage.setImageURI(uri);
        }
        binding.tvSymbol.setText(currencySymbol);
        binding.tvMenuExtraDesc.setText(Functions.decodeString(menuDetailsModel.getDescription()));


        if (fromWhere.equals("viewBucket")) {
            binding.deleteItem.setVisibility(View.VISIBLE);

            binding.tvCounter.setText(carList.get(cartposition).getmQuantity());

            counter = Integer.parseInt(carList.get(cartposition).getmQuantity());

            binding.tvCartCountBtn.setText(binding.getRoot().getContext().getString(R.string.update));
            loadCalculationOnClick();
            binding.tvInstruction.setText("" + carList.get(cartposition).getInstruction());
            if (binding.tvInstruction.getText().length() > 0) {
                binding.tvInstruction.setSelection(binding.tvInstruction.getText().length());
            }


            if (counter > 0 && counter == 1) {
                binding.icMinus.setImageResource(R.drawable.ic_minus_grey);
                binding.minusBtn.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.grey_circle_with_stroke));
            } else {
                binding.icMinus.setImageResource(R.drawable.ic_minus_black);
                binding.minusBtn.setBackground(ContextCompat.getDrawable(getActivity(), R.drawable.white_circle_with_stroke));
            }

            binding.nestedScrollView.post(new Runnable() {
                @Override
                public void run() {
                    binding.nestedScrollView.fullScroll(View.FOCUS_DOWN);
                }
            });

            schedule = carList.get(cartposition).getSchedule();
            scheduleDatetime = carList.get(cartposition).getScheduleDatetime();
        } else {
            binding.tvPrice.setText(menuDetailsModel.getPrice());
        }

    }

    public void addNewNode(String id, String name, String price) {
        HashMap<String, String> names = new HashMap<>();
        names.put("menu_extra_item_id", id);
        names.put("menu_extra_item_name", name);
        names.put("menu_extra_item_price", price);
        names.put("menu_extra_item_quantity", binding.tvCounter.getText().toString());
        extraItem.add(names);
    }

    private void changeData(int counter) {
        if (!fromWhere.equals("viewBucket")) {
            binding.tvCartCountBtn.setText(binding.getRoot().getContext().getString(R.string.add) + " " + counter + binding.getRoot().getContext().getString(R.string.to_cart));
        }
        binding.tvCounter.setText("" + counter);
    }

    private void loadCalculationOnClick() {
        totalExtraItemPrice = 0.0;
        double price1 = 0.0;
        itemPrice = Double.parseDouble(menuDetailsModel.getPrice());
        double quantity = Double.parseDouble(binding.tvCounter.getText().toString());
        if (extraItem != null && extraItem.size() > 0) {
            for (int b = 0; b < extraItem.size(); b++) {
                String extraPrice = extraItem.get(b).get("menu_extra_item_price");
                double counter = Double.parseDouble(extraPrice);
                totalExtraItemPrice = counter + totalExtraItemPrice;
            }

            price1 = (totalExtraItemPrice + itemPrice) * quantity;
        } else {
            price1 = itemPrice * quantity;
        }

        binding.tvPrice.setText("" + Functions.roundoffDecimal(price1));
    }

    private void deleteNode(String id) {

        for (int b = 0; b < extraItem.size(); b++) {
            String extraItemId = extraItem.get(b).get("menu_extra_item_id");
            if (extraItemId.equals(id)) {
                extraItem.remove(b);
            }
        }

    }

    public void upDateNotify(ArrayList<ChildExpandListModel> child) {
        for (int i = 0; i < child.size(); i++) {
            child.get(i).setChecked(false);
        }
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.back_btn:
                Functions.hideSoftKeyboard(getActivity());
                getActivity().onBackPressed();
                break;

            case R.id.delete_item:
                Functions.hideSoftKeyboard(getActivity());
                carList.remove(cartposition);
                // [AWS-MIGRATED] PaperDB write → SharedPreferences
                // Original: Paper.book().write("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), carList);
                android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext())
                    // .edit().putString("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID.replace("/","_"), new com.google.gson.Gson().toJson("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID)).apply(); // TODO: replace key+value correctly
                mainActivity.checkFragment();
                if (fragmentCallBack != null) {
                    fragmentCallBack.onItemClick(new Bundle());
                }
                getActivity().onBackPressed();
                break;

            case R.id.addToCartBtn:


                Functions.hideSoftKeyboard(getActivity());
                if (fromWhere.equals("viewBucket")) {
                    CalculationModel calculationModel = new CalculationModel(
                            menuDetailsModel.getMenuId(),
                            menuDetailsModel.getMenuItemId(),
                            menuDetailsModel.getName(),
                            menuDetailsModel.getPrice(),
                            binding.tvPrice.getText().toString(),
                            binding.tvCounter.getText().toString(),
                            "0",
                            resturantModel.getMinOrderPrice(),
                            extraItem,
                            binding.tvInstruction.getText().toString(),
                            resturantModel.getId(),
                            resturantModel.getResturantName(),
                            currencySymbol,
                            menuDetailsModel.getDescription(),
                            resturantModel.getDeliveryFee(),
                            resturantModel,
                            menuDetailsModel,
                            schedule,
                            scheduleDatetime,
                            resturantModel.getResturantLat(),
                            resturantModel.getResturantLong());

                    // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
                    // Original: ArrayList<CalculationModel> list = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
                    ArrayList<CalculationModel> list = null; // [AWS] TODO: deserialize from SharedPreferences

                    list.remove(cartposition);

                    list.add(cartposition, calculationModel);


                    // [AWS-MIGRATED] PaperDB write → SharedPreferences
                    // Original: Paper.book().write("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), list);
                    android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext())
                        // .edit().putString("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID.replace("/","_"), new com.google.gson.Gson().toJson("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID)).apply(); // TODO: replace key+value correctly

                    mainActivity.updateist(carList);

                    if (fragmentCallBack != null) {
                        fragmentCallBack.onItemClick(new Bundle());
                    }

                    getActivity().onBackPressed();

                } else {

                    if (parentExpandListModels != null && !parentExpandListModels.isEmpty()) {
                        for (int i = 0; i < parentExpandListModels.size(); i++) {
                            ParentExpandListModel parentExpandListModel = parentExpandListModels.get(i);
                            if (parentExpandListModel.getIsRequired().equals("1")) {
                                isRequired = "1";
                                break;
                            }
                        }
                    }

                    if (isRequired.equals("1") && isRequiredChecked) {
                        addToCart();
                    } else if (isRequired.equals("0")) {
                        addToCart();
                    } else {
                        Snackbar snack = Snackbar.make(binding.addToCartF, R.string.select_all_required_items, Snackbar.LENGTH_LONG);
                        View view = snack.getView();
                        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) view.getLayoutParams();
                        params.gravity = Gravity.TOP;
                        view.setLayoutParams(params);
                        snack.show();

                    }
                }
                break;

            default:
                break;
        }
    }


    private void addToCart() {
        if (checkCart(resturantModel.getId())) {
            CancelFoodBottomSheet cancelFoodBottomSheet = new CancelFoodBottomSheet(bundle -> {
                if (bundle != null) {
                    // [AWS-MIGRATED] PaperDB delete
                    // Original: /* AWS-MIGRATED: was Paper.book().delete("carList" + MyPreferences.getSharedPreference(getActivity() */).getString(MyPreferences.USER_ID, ""));
                    if (!checkCart(resturantModel.getId())) {
                        if (resturantModel.getOpen().equals("1")) {
                            methodAddToCart();
                        } else {
                            dateSchedulePicker();
                        }
                    }
                }
            });
            Bundle bundle = new Bundle();
            bundle.putString("resturantName", resturantModel.getResturantName());
            bundle.putString("resturantNameOld", dataList.get(0).getRest_name());
            cancelFoodBottomSheet.setArguments(bundle);
            cancelFoodBottomSheet.show(getActivity().getSupportFragmentManager(), "");
        } else {
            if (resturantModel.getOpen().equals("1") || (dataList.size() > 0 && dataList.get(0).getSchedule().equals("1"))) {
                methodAddToCart();
            } else {
                if (carList.size() > 0) {
                    methodAddToCart();
                } else {
                    dateSchedulePicker();
                }

            }
        }
    }

    private void methodAddToCart() {
        CalculationModel calculationModel = new CalculationModel(
                menuDetailsModel.getMenuId(),
                menuDetailsModel.getMenuItemId(),
                menuDetailsModel.getName(),
                menuDetailsModel.getPrice(),
                binding.tvPrice.getText().toString(),
                binding.tvCounter.getText().toString(),
                "0",
                resturantModel.getMinOrderPrice(),
                extraItem,
                binding.tvInstruction.getText().toString(),
                resturantModel.getId(),
                resturantModel.getResturantName(),
                currencySymbol,
                menuDetailsModel.getDescription(),
                resturantModel.getDeliveryFee(),
                resturantModel,
                menuDetailsModel,
                schedule,
                scheduleDatetime,
                resturantModel.getResturantLat(),
                resturantModel.getResturantLong());


        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: ArrayList<CalculationModel> list = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        ArrayList<CalculationModel> list = null; // [AWS] TODO: deserialize from SharedPreferences
        list.add(calculationModel);

        // [AWS-MIGRATED] PaperDB write → SharedPreferences
        // Original: Paper.book().write("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""), list);
        android.preference.PreferenceManager.getDefaultSharedPreferences(com.terraai.aimobility.codeclasses.AiMobilityApp.getAppContext())
            // .edit().putString("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID.replace("/","_"), new com.google.gson.Gson().toJson("carList" + MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID)).apply(); // TODO: replace key+value correctly
        mainActivity.checkFragment();
        if (fragmentCallBack != null) {
            fragmentCallBack.onItemClick(new Bundle());
        }
        getActivity().onBackPressed();


    }

    private void dateSchedulePicker() {

        Dialog dialog = new Dialog(getActivity());

        DateSheduleDialogFoodBinding binding = DateSheduleDialogFoodBinding.inflate(LayoutInflater.from(getContext()));
        dialog.setContentView(binding.getRoot());

        Functions.clearBackgrounds(binding.getRoot());
        Window window = dialog.getWindow();
        window.setLayout(WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.WRAP_CONTENT);
        WindowManager.LayoutParams wlp = window.getAttributes();
        wlp.gravity = Gravity.BOTTOM;
        window.setAttributes(wlp);


        Calendar calendar = Calendar.getInstance();
        int day = calendar.get(Calendar.DAY_OF_WEEK);
        binding.tvOpenTime.setText(binding.getRoot().getContext().getString(R.string.open_at) + " " + DateOperations.changeDateFormat("HH:mm:ss", "hh:mm a", resturantModel.getTimeModelArrayList().get(day - 1).getOpening_time()));


        final Calendar calendarMin = Calendar.getInstance();
        final Date minDate = calendarMin.getTime();
        binding.singleDateTimePicker.setMinDate(minDate);

        Date date = new Date(System.currentTimeMillis() + ((long) (Constants.timeForScheculeFood * 60000)));
        pickedDate = date;
        Calendar instance = Calendar.getInstance();
        this.date = instance.getTime();
        binding.singleDateTimePicker.setDefaultDate(date);

        binding.singleDateTimePicker.addOnDateChangedListener((displayed, date1) -> {
            pickedDateSt = displayed;
            pickedDate = date1;
        });

        binding.buttonSelectDate.setOnClickListener(v -> {
            final Date now = new Date();
            String formatted = DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "yyyy-MM-dd HH:mm:ss", "" + pickedDate.toString());
            String formattednow = DateOperations.changeDateFormat("EEE MMM dd HH:mm:ss zzzz yyyy", "yyyy-MM-dd HH:mm:ss", "" + now.toString());

            String timeCalculate = DateOperations.calculateTime(formattednow, formatted, false);
            Functions.logDMsg("timeCalculated : " + timeCalculate);
            if (!timeCalculate.contains("hour")) {
                timeCalculate = timeCalculate.replace("-", "");
                double time = Double.parseDouble(timeCalculate);
                if (time < Constants.timeForScheculeRide) {
                    binding.warningAlertLayout.setVisibility(View.VISIBLE);
                    binding.warningAlert.setText(binding.getRoot().getContext().getString(R.string.please_select_time));
                    return;
                }
            }
            binding.warningAlertLayout.setVisibility(View.GONE);
            schedule = "1";
            scheduleDatetime = formatted;
            methodAddToCart();
            dialog.dismiss();
        });

        dialog.show();
    }

    private boolean checkCart(String id) {
        // [AWS-MIGRATED] PaperDB read → SharedPreferences (returns null — implement read)
        // Original: dataList = /* AWS-MIGRATED: was Paper.book().read("carList" + MyPreferences.getSharedPreference(getActivity() */ null).getString(MyPreferences.USER_ID, ""), new ArrayList<>());
        // [AWS] Read result discarded
        if (!dataList.isEmpty()) {
            for (int x = 0; x < dataList.size(); x++) {
                if (!dataList.get(x).getRestID().equals(id)) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            return false;
        }
        return false;
    }


}