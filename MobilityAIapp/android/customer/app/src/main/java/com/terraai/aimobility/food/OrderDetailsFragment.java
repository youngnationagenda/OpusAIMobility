package com.terraai.aimobility.food;

import android.util.Log;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentTransaction;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.itextpdf.io.image.ImageData;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.List;
import com.itextpdf.layout.element.ListItem;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.terraai.aimobility.Constants;
import com.terraai.aimobility.Interface.APICallBack;
import com.terraai.aimobility.Interface.AdapterClickListener;
import com.terraai.aimobility.Interface.FragmentCallBack;
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.adapter.MyPrintDocument;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.DataParse;
import com.terraai.aimobility.codeclasses.FileUtils;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.databinding.FragmentOrderDetailsBinding;
import com.terraai.aimobility.foodadapter.FoodListAdapter;
import com.terraai.aimobility.model.FoodListModel;
import com.terraai.aimobility.model.YourOrdersModel;
import com.terraai.aimobility.ride.WebViewFragment;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;


public class OrderDetailsFragment extends Fragment implements View.OnClickListener {

    FragmentOrderDetailsBinding binding;
    ArrayList<FoodListModel> arrayList = new ArrayList<>();
    FoodListAdapter foodListAdapter;
    YourOrdersModel yourOrdersModel;
    Bundle bundle;
    Context context;
    String currencySymbol;
    String userName;
    String root;
    String status;


    public OrderDetailsFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentOrderDetailsBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        context = getActivity();
        bundle = getArguments();
        currencySymbol = MyPreferences.getSharedPreference(context).getString(MyPreferences.currencyUnit, Constants.defaultCurrency);
        String lname = MyPreferences.getSharedPreference(context).getString(MyPreferences.lname, Constants.defaultCurrency);
        String fname = MyPreferences.getSharedPreference(context).getString(MyPreferences.fname, Constants.defaultCurrency);
        userName = fname + " " + lname;
        if (bundle != null) {
            yourOrdersModel = (YourOrdersModel) bundle.getSerializable("dataModel");
        }

        initializeListeners();
        appBarLayout();
        setUpScreenData();
        callAPiForRideDetail();
        return view;
    }

    private void setUpScreenData() {
        binding.tvResturantNameToolbar.setText(yourOrdersModel.getResturantModel().getResturantName());
        binding.tvResturantName.setText(yourOrdersModel.getResturantModel().getResturantName());
        binding.tvDeliveryFee.setText(currencySymbol + yourOrdersModel.getDeliveryFee());
        binding.tvDiscount.setText("-" + currencySymbol + yourOrdersModel.getDiscount());
        binding.tvSubtotal.setText(currencySymbol + yourOrdersModel.getSubTotal());

        if (yourOrdersModel.getPaymentCardId().equals("0")) {
            binding.tvPaymentType.setText(context.getString(R.string.cash));
            binding.icPayment.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_cash));

        } else {
            binding.tvPaymentType.setText("****" + yourOrdersModel.getLastFour());
            String cardType = yourOrdersModel.getCardType();
            if (cardType.equalsIgnoreCase("visa")) {
                binding.icPayment.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_visa_card));
            } else if (cardType.equalsIgnoreCase("mastercard")) {
                binding.icPayment.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_mastercard));
            } else {
                binding.icPayment.setImageDrawable(ContextCompat.getDrawable(context, R.drawable.ic_card_any));
            }
        }


        binding.tvTotal.setText(currencySymbol + Functions.roundoffDecimal(yourOrdersModel.getTotalAmount()));

        binding.totalPrice.setText(currencySymbol + Functions.roundoffDecimal(yourOrdersModel.getTotalAmount()));

        if (!yourOrdersModel.getRatingId().equals("null")) {
            binding.submitRating.setVisibility(View.GONE);
            binding.view2.setVisibility(View.GONE);
        } else {
            binding.submitRating.setVisibility(View.VISIBLE);
        }

        status = yourOrdersModel.getStatus();
        if (status.equals("2")){
            binding.trackOrderBtn.setVisibility(View.GONE);
            binding.view1.setVisibility(View.GONE);
        }

        if (status.equals("3") || status.equals("4")){
            binding.trackOrderBtn.setVisibility(View.GONE);
            binding.view1.setVisibility(View.GONE);
            binding.submitRating.setVisibility(View.GONE);
            binding.view2.setVisibility(View.GONE);
        }

        if (yourOrdersModel.getResturantModel().getResturantImage() != null &&
                !yourOrdersModel.getResturantModel().getResturantImage().equals("")) {
            binding.menuImage.setImageURI(Uri.parse(Constants.BASE_URL + yourOrdersModel.getResturantModel().getResturantImage()));
        }

        if (yourOrdersModel.getModelArrayList() != null && !yourOrdersModel.getModelArrayList().isEmpty()) {
            arrayList = yourOrdersModel.getModelArrayList();
            methodSetYourItemsAdapter();
        }
    }

    private void appBarLayout() {

        binding.appBar.addOnOffsetChangedListener((appBarLayout, verticalOffset) -> {
            if (Math.abs(verticalOffset) == appBarLayout.getTotalScrollRange()) {
                binding.tvResturantNameToolbar.setVisibility(View.VISIBLE);
                binding.ivBack.setBackgroundColor(ContextCompat.getColor(getContext(), R.color.transparent));
            } else if (verticalOffset == 0) {
                binding.tvResturantNameToolbar.setVisibility(View.GONE);
            }
        });

    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.btnGetHelp.setOnClickListener(this);
        binding.submitRating.setOnClickListener(this);
        binding.trackOrderBtn.setOnClickListener(this);

    }

    private void methodSetYourItemsAdapter() {

        foodListAdapter = new FoodListAdapter(getActivity(), arrayList, new AdapterClickListener() {
            @Override
            public void onItemClickListener(int position, Object model, View view) {
                //on click listener
            }
        });

        binding.totalItemsRecyclerView.setLayoutManager(new LinearLayoutManager(getActivity(), LinearLayoutManager.VERTICAL, false));
        binding.totalItemsRecyclerView.setAdapter(foodListAdapter);
        foodListAdapter.notifyDataSetChanged();

    }

    @Override
    public void onClick(View v) {


        switch (v.getId()) {

            case R.id.backBtn:
                getActivity().onBackPressed();
                break;


            case R.id.submit_rating:
                RatingFragment ratingFragment = new RatingFragment(new FragmentCallBack() {
                    @Override
                    public void onItemClick(Bundle bundle) {
                        binding.submitRating.setVisibility(View.GONE);
                    }
                });
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                Bundle args = new Bundle();
                args.putString("id", yourOrdersModel.getResturantModel().getId());
                args.putString("order_id", yourOrdersModel.getOrderId());
                ratingFragment.setArguments(args);
                fragmentTransaction.addToBackStack(null);
                fragmentTransaction.replace(R.id.order_detail_container, ratingFragment).commit();
                break;



            case R.id.track_order_btn:
                Intent intent = new Intent(getActivity(), TrackFoodActivity.class);
                intent.putExtra("order_id", yourOrdersModel.getOrderId());
                intent.putExtra("status", yourOrdersModel.getStatus());
                Bundle bundle1 = new Bundle();
                bundle1.putSerializable("dataModel", yourOrdersModel);
                intent.putExtras(bundle1);
                startActivity(intent);
                getActivity().overridePendingTransition(R.anim.in_from_right, R.anim.out_to_left);
                break;

            case R.id.btn_get_help:
                WebViewFragment webviewF = new WebViewFragment();
                FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                Bundle bundle = new Bundle();
                bundle.putString("url", Constants.HELP_URL);
                bundle.putString("title", getString(R.string.get_help));
                webviewF.setArguments(bundle);
                transaction.addToBackStack(null);
                transaction.replace(R.id.order_detail_container, webviewF).commit();
                break;

            default:
                break;
        }
    }

    public void printPdf() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
            MyPrintDocument printDocumentAdapter = new MyPrintDocument(getActivity(), FileUtils.getAppFolder(getActivity()) + yourOrdersModel.getResturantModel().getResturantName() + ".pdf", yourOrdersModel.getOrderId());
            String jobName = "Document";
            printManager.print(jobName, printDocumentAdapter, new PrintAttributes.Builder().build());

        }
    }

    public void printDocument(String dest) throws IOException, java.io.IOException {
        try {
            PdfWriter writer = new PdfWriter(new FileOutputStream(dest));
            PdfDocument pdfDocument = new PdfDocument(writer);

            Document document = new Document(pdfDocument);
            addTitlePage(document);
            document.close();
            printPdf();
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
         }
    }

    private void addTitlePage(Document document) {

        Paragraph paragraph = new Paragraph();
        paragraph.setFontSize(18);
        paragraph.setBold();
        paragraph.add(context.getString(R.string.app_name));

        float columnWidth[] = {400F, 250F};

        Table table = new Table(columnWidth);

        table.addCell(new Cell().add(new Paragraph(context.getString(R.string.app_name)).setFontSize(18).setBold()).setBorder(Border.NO_BORDER));
        table.addCell(new Cell().add(new Paragraph("" + new Date()).setFontSize(14)).setBorder(Border.NO_BORDER));

        Paragraph paragraph1 = new Paragraph();
        paragraph1.setFontSize(18);
        paragraph1.add("Thank you for Ordering,");

        Paragraph paragraph2 = new Paragraph();
        paragraph2.setFontSize(18);
        paragraph2.add(userName);

        Paragraph paragraph3 = new Paragraph();
        paragraph3.setFontSize(16);
        paragraph3.add("Here is your receipt for " + yourOrdersModel.getResturantModel().getResturantName());

        Table table1 = new Table(columnWidth);
        table1.setMarginTop(30);

        table1.addCell(new Cell().add(new Paragraph(context.getString(R.string.total)).setFontSize(18).setBold()).setBorder(Border.NO_BORDER));
        table1.addCell(new Cell().add(new Paragraph(binding.tvTotal.getText().toString()).setFontSize(18).setBold()).setBorder(Border.NO_BORDER));

        Drawable drawable = context.getResources().getDrawable(R.drawable.food_image);
        Bitmap bitmap = ((BitmapDrawable) drawable).getBitmap();

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, stream);
        byte[] bitmapDetail = stream.toByteArray();

        ImageData imageData = ImageDataFactory.create(bitmapDetail);

        Image image = new Image(imageData);

        document.add(table);
        document.add(paragraph1);
        document.add(paragraph2);
        document.add(paragraph3);
        document.add(image.setFixedPosition(500, 700));
        document.add(table1);

        float[] pointColumnWidths = {20F, 550F, 350F};

        for (int i = 0; i < arrayList.size(); i++) {
            ArrayList<HashMap<String, String>> extraItem;
            FoodListModel foodListModel = arrayList.get(i);
            extraItem = foodListModel.getExtraItem();
            Table table2 = new Table(pointColumnWidths).setMarginTop(20);
            table2.addCell(new Cell().add(new Paragraph(foodListModel.getTvQuantity()).setFontSize(16)).setTextAlignment(TextAlignment.CENTER));
            table2.addCell(new Cell().add(new Paragraph(foodListModel.getItemName()).setFontSize(16)).setBorder(Border.NO_BORDER).setMarginLeft(20F));
            table2.addCell(new Cell().add(new Paragraph(currencySymbol + foodListModel.getAmount()).setFontSize(16)).setBorder(Border.NO_BORDER).setMarginLeft(100));
            Cell cell = new Cell().setBorder(Border.NO_BORDER).setMarginLeft(20F);

            StringBuilder stringBuilder = new StringBuilder();

            for (int b = 0; b < extraItem.size(); b++) {
                String menuExtraItemName = extraItem.get(b).get("menu_extra_item_name");
                String extraItemPrice = extraItem.get(b).get("menu_extra_item_price");
                stringBuilder.append(menuExtraItemName);
                stringBuilder.append(" ");
                stringBuilder.append("(");
                stringBuilder.append(currencySymbol + extraItemPrice);
                stringBuilder.append(")");
                if (b != extraItem.size() - 1) {
                    stringBuilder.append(" ");
                    stringBuilder.append("\u00b7");
                    stringBuilder.append(" ");
                }
                Functions.logDMsg("stringBuilder : " + stringBuilder.toString());

                ListItem listItem = new ListItem();
                listItem.add(new Paragraph(stringBuilder.toString()));
                cell = new Cell(1, 10).add(new List().add(listItem)).setBorder(Border.NO_BORDER);

            }

            table2.addCell(cell);

            document.add(table2);
        }
        Table table3 = new Table(columnWidth);
        table3.setMarginTop(30);

        table3.addCell(new Cell().add(new Paragraph(context.getString(R.string.sub_total)).setFontSize(18).setBold()).setBorder(Border.NO_BORDER));
        table3.addCell(new Cell().add(new Paragraph(binding.tvSubtotal.getText().toString()).setFontSize(18).setBold()).setBorder(Border.NO_BORDER));

        table3.addCell(new Cell().add(new Paragraph(context.getString(R.string.delivery_fee)).setFontSize(18)).setBorder(Border.NO_BORDER));
        table3.addCell(new Cell().add(new Paragraph(binding.tvDeliveryFee.getText().toString()).setFontSize(18)).setBorder(Border.NO_BORDER));


        table3.addCell(new Cell().add(new Paragraph(context.getString(R.string.delivery_discount)).setFontSize(18)).setBorder(Border.NO_BORDER));
        table3.addCell(new Cell().add(new Paragraph(binding.tvDiscount.getText().toString()).setFontSize(18)).setBorder(Border.NO_BORDER));


        table3.addCell(new Cell().add(new Paragraph(context.getString(R.string.total)).setFontSize(18)).setBorder(Border.NO_BORDER));
        table3.addCell(new Cell().add(new Paragraph(binding.tvTotal.getText().toString()).setFontSize(18)).setBorder(Border.NO_BORDER));


        table3.addCell(new Cell().add(new Paragraph(context.getString(R.string.payment)).setFontSize(18)).setBorder(Border.NO_BORDER));

        if (yourOrdersModel.getPaymentCardId().equals("0")) {
            table3.addCell(new Cell().add(new Paragraph(context.getString(R.string.cash)).setFontSize(18)).setBorder(Border.NO_BORDER));

        } else {
            table3.addCell(new Cell().add(new Paragraph("****" + yourOrdersModel.getLastFour()).setFontSize(18)).setBorder(Border.NO_BORDER));
        }


        document.add(table3);


    }

    private void callAPiForRideDetail() {
        JSONObject params = new JSONObject();
        try {
            params.put("food_order_id", yourOrdersModel.getOrderId());
        } catch (Exception e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).showOrderDetail(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        JSONObject msg = respobj.optJSONObject("msg");
                                        DataParse.showOrderDetail(msg, new APICallBack() {
                                            @Override
                                            public void onParseData(Object model) {
                                                yourOrdersModel = (YourOrdersModel) model;
                                                status = yourOrdersModel.getStatus();
                                                if (status.equals("3") || status.equals("4")){
                                                    binding.trackOrderBtn.setVisibility(View.GONE);
                                                    binding.view1.setVisibility(View.GONE);
                                                    binding.submitRating.setVisibility(View.GONE);
                                                    binding.view2.setVisibility(View.GONE);
                                                }

                                            }

                                        });
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


    public void createPdf() {
        root = getActivity().getExternalFilesDir(null).getPath() + "/MyPDFDoc";
        final File dir = new File(root);
        if (!dir.exists())
            dir.mkdirs();
        try {
            printDocument(FileUtils.getAppFolder(getActivity()) + yourOrdersModel.getResturantModel().getResturantName() + ".pdf");
        } catch (java.io.IOException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();

    }
}