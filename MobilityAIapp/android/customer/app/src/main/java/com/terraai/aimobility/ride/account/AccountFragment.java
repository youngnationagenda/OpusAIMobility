package com.terraai.aimobility.ride.account;

import android.util.Log;

import static com.terraai.aimobility.codeclasses.Variables.PACKAGE_URL_SCHEME;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.terraai.aimobility.Constants;
import com.yna.opusaimobilityapp.R;
import com.terraai.aimobility.activitiesandfragment.LoginActivity;
import com.terraai.aimobility.activitiesandfragment.SelectLanguageF;
import com.terraai.aimobility.api.Singleton;
import com.terraai.aimobility.codeclasses.CircleProgressBarDrawable;
import com.terraai.aimobility.codeclasses.Functions;
import com.terraai.aimobility.codeclasses.PermissionUtils;
import com.terraai.aimobility.codeclasses.RootFragment;
import com.terraai.aimobility.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.databinding.FragmentAccountBinding;
import com.terraai.aimobility.ride.NotificationFragment;
import com.terraai.aimobility.ride.ReportProblemFragment;
import com.terraai.aimobility.ride.WebViewFragment;
import com.terraai.aimobility.ride.payment.PaymentFragment;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;
import com.theartofdev.edmodo.cropper.CropImage;
import com.theartofdev.edmodo.cropper.CropImageView;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

// Fresco imports - required for GenericDraweeHierarchy, RoundingParams, ScalingUtils
import com.facebook.drawee.generic.GenericDraweeHierarchy;
import com.facebook.drawee.generic.GenericDraweeHierarchyBuilder;
import com.facebook.drawee.generic.RoundingParams;
import com.facebook.drawee.drawable.ScalingUtils;

public class AccountFragment extends RootFragment implements View.OnClickListener {

    FragmentAccountBinding binding;
    android.content.SharedPreferences.Editor prefsEditor;
    String username, fname, userId, lname, image, email;
    String imageFilePath;

    PermissionUtils takePermissionUtils;
    ActivityResultLauncher<Intent> cropResultCallback = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Intent data = result.getData();
                    CropImage.ActivityResult result1 = CropImage.getActivityResult(data);
                    Uri resultUri = result1.getUri();
                    InputStream imageStream = null;
                    try {
                        imageStream = getActivity().getContentResolver().openInputStream(resultUri);
                    } catch (FileNotFoundException e) {
                        Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                    }
                    final Bitmap imagebitmap = BitmapFactory.decodeStream(imageStream);
                    Bitmap rotatedBitmap = Bitmap.createBitmap(imagebitmap, 0, 0, imagebitmap.getWidth(), imagebitmap.getHeight(), null, true);
                    ByteArrayOutputStream baos = new ByteArrayOutputStream();
                    rotatedBitmap.compress(Bitmap.CompressFormat.JPEG, 50, baos);
                    String imageBase64 = bitmapToBase64(rotatedBitmap);

                    callApiUploadImage(imageBase64);
                }
            });
    ActivityResultLauncher<Intent> galleryLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Intent data = result.getData();
                    Uri selectedImage = data.getData();
                    beginCrop(selectedImage);

                }
            });
    ActivityResultLauncher<Intent> cameraLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback<ActivityResult>() {
                @Override
                public void onActivityResult(ActivityResult result) {
                    if (result.getResultCode() == Activity.RESULT_OK) {
                        Matrix matrix = new Matrix();
                        try {
                            android.media.ExifInterface exif = new android.media.ExifInterface(imageFilePath);
                            int orientation = exif.getAttributeInt(android.media.ExifInterface.TAG_ORIENTATION, 1);
                            switch (orientation) {
                                case android.media.ExifInterface.ORIENTATION_ROTATE_90:
                                    matrix.postRotate(90);
                                    break;
                                case android.media.ExifInterface.ORIENTATION_ROTATE_180:
                                    matrix.postRotate(180);
                                    break;
                                case ExifInterface.ORIENTATION_ROTATE_270:
                                    matrix.postRotate(270);
                                    break;
                            }
                        } catch (Exception e) {
                            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
                        }
                        Uri selectedImage = (Uri.fromFile(new File(imageFilePath)));
                        beginCrop(selectedImage);
                    }
                }
            });


    public AccountFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        binding = FragmentAccountBinding.inflate(getLayoutInflater());
        View view = binding.getRoot();
        userId = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, "");
        prefsEditor = MyPreferences.getSharedPreference(getActivity()).edit();
        initLayouts();
        initializeListeners();
        setUpScreenData();
        return view;
    }

    private void setUpScreenData() {
        image = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.image, "");
        fname = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.fname, "");
        email = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.email, "");
        lname = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.lname, "");
        username = MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.userName, "");
        RoundingParams roundingParams = RoundingParams.fromCornersRadius(7f);
        roundingParams.setRoundAsCircle(true);
        GenericDraweeHierarchy hierarchy = GenericDraweeHierarchyBuilder.newInstance(getResources())
                .setActualImageScaleType(ScalingUtils.ScaleType.FIT_CENTER)
                .setProgressBarImage(new CircleProgressBarDrawable())
                .setRoundingParams(roundingParams)
                .setPlaceholderImage(R.drawable.ic_profile_avatar)
                .build();

        binding.profileImg.setHierarchy(hierarchy);

        if (image != null && !image.equals("")) {
            Uri uri = Uri.parse(Constants.BASE_URL + image);
            binding.profileImg.setImageURI(uri);
        }
        binding.tvUserName.setText(fname + " " + lname);

    }

    private void initializeListeners() {

        binding.personalInfoLayout.setOnClickListener(this);
        binding.paymentMethodLayout.setOnClickListener(this);
        binding.notificationLayout.setOnClickListener(this);
        binding.yourGuideLayout.setOnClickListener(this);
        binding.logoutLayout.setOnClickListener(this);
        binding.profileImgLayout.setOnClickListener(this);
        binding.termsOfService.setOnClickListener(this);
        binding.selectLanguageBtn.setOnClickListener(this);
    }

    private void initLayouts() {
        binding.versionTxt.setText(getActivity().getResources().getString(R.string.version) + " " + Functions.getVersion(getActivity()));
    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.personalInfoLayout:

                EditPersonalInfoFragment resetPasswordFragment = new EditPersonalInfoFragment(bundle -> setUpScreenData());
                FragmentTransaction fragmentTransaction = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction.add(R.id.fragment_main_container, resetPasswordFragment).addToBackStack(null).commit();

                break;


            case R.id.select_language_btn:

                SelectLanguageF selectLanguage_f = new SelectLanguageF();
                FragmentManager fragmentManager_history = getActivity().getSupportFragmentManager();
                FragmentTransaction fragmentTransaction_history = fragmentManager_history.beginTransaction();
                fragmentTransaction_history.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction_history.replace(R.id.fragment_main_container, selectLanguage_f).addToBackStack(null).commit();


                break;

            case R.id.paymentMethodLayout:

                PaymentFragment payWithFragment = new PaymentFragment(bundle -> {
                    if (bundle != null) {
                        //on response back
                    }
                }, false);
                FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
                transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                transaction.add(R.id.fragment_main_container, payWithFragment).addToBackStack(null).commit();

                break;

            case R.id.notificationLayout:
                NotificationFragment notificationFragment = new NotificationFragment();
                FragmentTransaction fragmentTransaction2 = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction2.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction2.add(R.id.fragment_main_container, notificationFragment).addToBackStack(null).commit();
                break;

            case R.id.yourGuideLayout:
                ReportProblemFragment reportProblemFragment = new ReportProblemFragment();
                FragmentTransaction fragmentTransaction3 = getActivity().getSupportFragmentManager().beginTransaction();
                fragmentTransaction3.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
                fragmentTransaction3.add(R.id.fragment_main_container, reportProblemFragment).addToBackStack(null).commit();
                break;

            case R.id.logoutLayout:
                showLogoutAlert();
                break;

            case R.id.terms_of_service:
                openWebView();
                break;

            case R.id.profileImgLayout:
                selectImage();
                break;

            default:
                break;
        }
    }

    // this method will show the dialog of select the either take a picture form camera or pick the image from gallary
    private void selectImage() {

        final CharSequence[] options = {binding.getRoot().getContext().getString(R.string.take_photo),
                binding.getRoot().getContext().getString(R.string.choose_from_gallery),
                binding.getRoot().getContext().getString(R.string.cancel)};


        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity(), R.style.AlertDialogCustom);

        builder.setTitle(binding.getRoot().getContext().getString(R.string.add_photo_));

        builder.setItems(options, (dialog, item) -> {

            if (options[item].equals(binding.getRoot().getContext().getString(R.string.take_photo))) {
                takePermissionUtils=new PermissionUtils(getActivity(), cameraPermissionCallback);
                if (takePermissionUtils.isCameraPermissionGranted())
                {
                    openCameraIntent();
                }
                else
                {
                    takePermissionUtils.showCameraPermissionDailog(getActivity().getString(R.string.to_upload_image_permission_string));
                }


            } else if (options[item].equals(binding.getRoot().getContext().getString(R.string.choose_from_gallery))) {
                takePermissionUtils=new PermissionUtils(getActivity(), galleryPermissionCallback);
                if (takePermissionUtils.isStoragePermissionGranted())
                {
                    openGallery();
                }
                else
                {
                    takePermissionUtils.showStoragePermissionDailog(getActivity().getString(R.string.to_upload_image_permission_string));
                }

            } else if (options[item].equals(binding.getRoot().getContext().getString(R.string.cancel))) {

                dialog.dismiss();

            }

        });

        builder.show();

    }


    private ActivityResultLauncher<String[]> cameraPermissionCallback = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(), new ActivityResultCallback<Map<String, Boolean>>() {
                @RequiresApi(api = Build.VERSION_CODES.M)
                @Override
                public void onActivityResult(Map<String, Boolean> result) {

                    boolean allPermissionClear=true;
                    List<String> blockPermissionCheck=new ArrayList<>();
                    for (String key : result.keySet())
                    {
                        if (!(result.get(key)))
                        {
                            allPermissionClear=false;
                            blockPermissionCheck.add(Functions.getPermissionStatus(getActivity(),key));
                        }
                    }
                    if (blockPermissionCheck.contains("blocked"))
                    {
                        Functions.showPermissionSetting(getActivity(),"camera");
                    }
                    else
                    if (allPermissionClear)
                    {
                        openCameraIntent();
                    }

                }
            });

    private ActivityResultLauncher<String[]> galleryPermissionCallback = registerForActivityResult(
            new ActivityResultContracts.RequestMultiplePermissions(), new ActivityResultCallback<Map<String, Boolean>>() {
                @RequiresApi(api = Build.VERSION_CODES.M)
                @Override
                public void onActivityResult(Map<String, Boolean> result) {

                    boolean allPermissionClear=true;
                    List<String> blockPermissionCheck=new ArrayList<>();
                    for (String key : result.keySet())
                    {
                        if (!(result.get(key)))
                        {
                            allPermissionClear=false;
                            blockPermissionCheck.add(Functions.getPermissionStatus(getActivity(),key));
                        }
                    }
                    if (blockPermissionCheck.contains("blocked"))
                    {
                        Functions.showPermissionSetting(getActivity(),"gallery");
                    }
                    else
                    if (allPermissionClear)
                    {
                        openGallery();
                    }

                }
            });




    // below three method is related with taking the picture from camera
    private void openGallery() {
        Intent intent = new Intent(Intent.ACTION_PICK, android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        galleryLauncher.launch(intent);
    }

    // below three method is related with taking the picture from camera
    private void openCameraIntent() {
        Intent pictureIntent = new Intent(
                MediaStore.ACTION_IMAGE_CAPTURE);
        if (pictureIntent.resolveActivity(getActivity().getPackageManager()) != null) {
            //Create a file to store the image
            File photoFile = null;
            try {
                photoFile = createImageFile();
            } catch (IOException ex) {
                // Error occurred while creating the File

            }
            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(getActivity().getApplicationContext(), getActivity().getPackageName() + ".fileprovider", photoFile);
                pictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                cameraLauncher.launch(pictureIntent);
            }
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp =
                new SimpleDateFormat("yyyyMMdd_HHmmss",
                        Locale.getDefault()).format(new Date());
        String imageFileName = "IMG_" + timeStamp + "_";
        File storageDir =
                getActivity().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(
                imageFileName,  /* prefix */
                ".jpg",         /* suffix */
                storageDir      /* directory */
        );

        imageFilePath = image.getAbsolutePath();
        return image;
    }

    public String bitmapToBase64(Bitmap imagebitmap) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        imagebitmap.compress(Bitmap.CompressFormat.JPEG, 70, baos);
        byte[] byteArray = baos.toByteArray();
        return Base64.encodeToString(byteArray, Base64.DEFAULT);
    }

    private void callApiUploadImage(String imageBase64) {
        JSONObject params = new JSONObject();
        try {
            params.put("user_id", userId);
            params.put("image", imageBase64);
        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        Functions.showLoader(getActivity(), false, false);
        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).editProfile(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject jsonObject = new JSONObject(resp);
                                    int code = jsonObject.optInt("code");
                                    if (code == 200) {
                                        JSONObject json = new JSONObject(jsonObject.toString());
                                        JSONObject msgObj = json.getJSONObject("msg");
                                        JSONObject json1 = new JSONObject(msgObj.toString());
                                        JSONObject userObj = json1.getJSONObject("User");
                                        String imageurl = userObj.optString("image");
                                        MyPreferences.getSharedPreference(getActivity()).edit().putString(MyPreferences.image, imageurl).commit();
                                        setUpScreenData();
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

    private void beginCrop(Uri source) {
        Intent intent = CropImage.activity(source).setCropShape(CropImageView.CropShape.OVAL)
                .setAspectRatio(1, 1).getIntent(requireActivity());
        cropResultCallback.launch(intent);
    }

    // first step helper function
    private void showLogoutAlert() {

        Functions.customAlertDialog(getActivity(), getResources().getString(R.string.logout)
                , getResources().getString(R.string.are_you_sure),requireContext().getResources().getString(R.string.logout),true, resp -> {
                    if (resp != null && resp.equalsIgnoreCase("okay")) {
                        callApiForLogout();
                    }
                });
    }

    private void callApiForLogout() {

        JSONObject sendobj = new JSONObject();

        try {
            sendobj.put("user_id", MyPreferences.mPrefs.getString(MyPreferences.USER_ID, ""));
        } catch (JSONException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                sendobj.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).logout(sendobj.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        if (isSuccess)
                        {
                            if (resp != null) {
                                try {
                                    JSONObject respobj = new JSONObject(resp);
                                    if (respobj.getString("code").equals("200")) {
                                        methodClearsharedpref();
                                    } else {
                                        Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
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

    private void methodClearsharedpref() {
        prefsEditor.putBoolean(MyPreferences.isLogin, false);
        prefsEditor.putBoolean(MyPreferences.isloginwithSocail, false);
        prefsEditor.remove(MyPreferences.USER_ID);
        prefsEditor.remove(MyPreferences.fname);
        prefsEditor.remove(MyPreferences.lname);
        prefsEditor.remove(MyPreferences.email);
        prefsEditor.remove(MyPreferences.image);
        prefsEditor.remove(MyPreferences.phoneNo);
        prefsEditor.remove("Device_token");
        prefsEditor.remove("Role");
        prefsEditor.clear();
        prefsEditor.commit();
        Intent intent = new Intent(getActivity(), LoginActivity.class);
        startActivity(intent);
        getActivity().finish();
    }


    private void openWebView() {
        Functions.hideSoftKeyboard(getActivity());
        WebViewFragment webviewF = new WebViewFragment();
        FragmentTransaction transaction = getActivity().getSupportFragmentManager().beginTransaction();
        transaction.setCustomAnimations(R.anim.in_from_right, R.anim.out_to_left, R.anim.in_from_left, R.anim.out_to_right);
        Bundle bundle = new Bundle();
        bundle.putString("url", Constants.HELP_URL);
        bundle.putString("title", "Term of Service");
        webviewF.setArguments(bundle);
        transaction.addToBackStack(null);
        transaction.replace(R.id.fragment_main_container, webviewF).commit();
    }

}
