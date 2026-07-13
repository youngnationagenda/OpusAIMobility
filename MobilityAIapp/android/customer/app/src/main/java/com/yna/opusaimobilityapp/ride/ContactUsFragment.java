package com.yna.opusaimobilityapp.ride;

import android.app.Activity;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.RequiresApi;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.yna.opusaimobilityapp.api.Singleton;
import com.yna.opusaimobilityapp.codeclasses.Functions;
import com.yna.opusaimobilityapp.codeclasses.PermissionUtils;
import com.yna.opusaimobilityapp.codeclasses.RootFragment;
import com.yna.opusaimobilityapp.codeclasses.MyPreferences;
import com.yna.opusaimobilityapp.R;
import com.yna.opusaimobilityapp.databinding.FragmentContactUsBinding;
import com.squareup.retrofitplus.api.RetrofitRequest;
import com.squareup.retrofitplus.interfaces.ApiCallback;
import com.theartofdev.edmodo.cropper.CropImage;
import com.theartofdev.edmodo.cropper.CropImageView;

import org.json.JSONObject;

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


public class ContactUsFragment extends RootFragment implements View.OnClickListener {
    FragmentContactUsBinding binding;

    String imageFilePath;
    Uri selectedImage;
    String extension = null, imageName;
    Bitmap bitmap = null;

    PermissionUtils takePermissionUtils;





    public ContactUsFragment() {
        // Required empty public constructor
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
        // Inflate the layout for this fragment
        binding = FragmentContactUsBinding.inflate(getLayoutInflater());
       Bundle bundle=getArguments();
       if(bundle!=null){
           binding.reasonTxt.setText(bundle.getString("reason"));
       }

       initLayouts();
       initializeListeners();

        return binding.getRoot();
    }

    private void initializeListeners() {

        binding.backBtn.setOnClickListener(this);
        binding.continueBtn.setOnClickListener(this);
        binding.sendMessageBtn.setOnClickListener(this);
        binding.deleteBtn.setOnClickListener(this);
    }

    private void initLayouts() {

        binding.sendMessageBtn.setClickable(false);
        binding.sendMessageBtn.setEnabled(false);

        binding.complaintEditText.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                //auto generated source
            }

            @Override
            public void onTextChanged(CharSequence charSequence, int i, int i1, int i2) {
                //auto generated source
            }

            @Override
            public void afterTextChanged(Editable editable) {

                if (binding.complaintEditText.getText().length() > 0) {
                    binding.sendMessageBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.app_color_bg_btn));
                    binding.sendMessageBtn.setClickable(true);
                    binding. sendMessageBtn.setEnabled(true);

                } else {
                    binding.sendMessageBtn.setClickable(false);
                    binding.sendMessageBtn.setEnabled(false);
                    binding.sendMessageBtn.setBackground(ContextCompat.getDrawable(getContext(), R.drawable.un_selected_btn_grey));
                }
            }
        });


    }

    @Override
    public void onClick(View v) {

        switch (v.getId()) {

            case R.id.backBtn:

                getActivity().onBackPressed();

                break;

            case R.id.continueBtn:
                selectImage();
                break;

            case R.id.sendMessageBtn:
                callApiAddUserDoc();
                break;

            case R.id.delete_btn:
                binding.textFileName.setText("");
                bitmap = null;
                selectedImage = null;
                binding.imageRlt.setVisibility(View.GONE);
                break;

            default:
                break;
        }
    }

    private void callApiAddUserDoc() {
        JSONObject params = new JSONObject();
        String base64 = "";
        try {
            params.put("user_id", MyPreferences.getSharedPreference(getActivity()).getString(MyPreferences.USER_ID, ""));
            params.put("message", binding.complaintEditText.getText().toString());
            if(bitmap != null){
                base64  =  Functions.convertBitmapToBase64(bitmap);
            }
            params.put("attachment", base64);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Functions.showLoader(getActivity(), false, false);


        RetrofitRequest.JsonPostRequest(binding.getRoot().getContext(),
                params.toString(),
                Singleton.getApiCall(binding.getRoot().getContext()).contactUs(params.toString()), new ApiCallback() {
                    @Override
                    public void onResponce(String resp,boolean isSuccess) {
                        Functions.cancelLoader();
                        if (isSuccess)
                        {
                            try {
                                JSONObject respobj = new JSONObject(resp);
                                if (respobj.getString("code").equals("200")) {
                                    Functions.showToast(getActivity(), respobj.getString("msg"));
                                    getActivity().onBackPressed();
                                } else {
                                    Functions.dialouge(getActivity(), getResources().getString(R.string.alert), respobj.getString("msg"));
                                }
                            } catch (Exception e) {
                                Functions.logDMsg("Exception: "+e);
                            }
                        }
                        else
                        {

                        }
                    }
                });

    }

    // this method will show the dialog of selete the either take a picture form camera or pick the image from gallary
    private void selectImage() {

        final CharSequence[] options = {binding.getRoot().getContext().getString(R.string.take_photo),
                binding.getRoot().getContext().getString(R.string.choose_from_gallery),
                binding.getRoot().getContext().getString(R.string.cancel)};


        AlertDialog.Builder builder = new AlertDialog.Builder(getActivity(), R.style.AlertDialogCustom);

        builder.setTitle(binding.getRoot().getContext().getString(R.string.add_photo_));

        builder.setItems(options, new DialogInterface.OnClickListener() {

            @Override

            public void onClick(DialogInterface dialog, int item) {

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


    private void openCameraIntent() {
        Intent pictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (pictureIntent.resolveActivity(getActivity().getPackageManager()) != null) {
            //Create a file to store the image
            File photoFile = null;
            try {
                photoFile = createImageFile();
            } catch (IOException ex) {
                // Error occurred while creating the File
            }
            if (photoFile != null) {
                Uri photoURI = FileProvider.getUriForFile(getActivity(), getActivity().getPackageName() + ".fileprovider", photoFile);
                pictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, photoURI);
                cameraLauncher.launch(pictureIntent);
            }
        }
    }

    private File createImageFile() throws IOException {
        String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(new Date());
        String imageFileName = "IMG_" + timeStamp + "_";
        File storageDir = getActivity().getExternalFilesDir(Environment.DIRECTORY_PICTURES);
        File image = File.createTempFile(imageFileName,  // prefix /
                ".jpg",         // suffix /
                storageDir      // directory /
        );
        imageFilePath = image.getAbsolutePath();
        return image;
    }

    ActivityResultLauncher<Intent> galleryLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Intent data = result.getData();
                    if (data != null) {
                        selectedImage = data.getData();
                        beginCrop(selectedImage);
                    }

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
                            e.printStackTrace();
                        }
                        Uri selectedImage = (Uri.fromFile(new File(imageFilePath)));
                        beginCrop(selectedImage);
                    }
                }
            });


    private void beginCrop(Uri source) {
        Intent intent=CropImage.activity(source).setCropShape(CropImageView.CropShape.OVAL)
                .setAspectRatio(1,1).getIntent(requireActivity());
        cropResultCallback.launch(intent);
    }

    ActivityResultLauncher<Intent> cropResultCallback = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(), new ActivityResultCallback<ActivityResult>() {
                @Override
                public void onActivityResult(ActivityResult result) {
                    if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                        Intent data = result.getData();
                        CropImage.ActivityResult result1 = CropImage.getActivityResult(data);
                        Uri resultUri = result1.getUri();

                        InputStream imageStream = null;
                        try {
                            imageStream = getActivity().getContentResolver().openInputStream(resultUri);
                        } catch (FileNotFoundException e) {
                            e.printStackTrace();
                        }
                        bitmap = BitmapFactory.decodeStream(imageStream);

                        String[] filePathColumn = {MediaStore.Images.Media.DATA, MediaStore.Images.Media.DISPLAY_NAME};
                        Cursor cursor = getContext().getContentResolver().query(selectedImage, filePathColumn, null, null, null);
                        if (cursor != null) {
                            if (cursor.moveToFirst()) {
                                int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
                                String filePath = cursor.getString(columnIndex);
                                int fileNameIndex = cursor.getColumnIndex(filePathColumn[1]);
                                String fileName = cursor.getString(fileNameIndex);
                                // Here we get the extension you want
                                extension = fileName.replaceAll("^.*\\.", "");
                                File f = new File(filePath);
                                imageName = f.getName();
                                binding.textFileName.setText(imageName);
                                binding.imageRlt.setVisibility(View.VISIBLE);
                            }
                        } else {
                            binding.textFileName.setText(imageFilePath);
                            binding.imageRlt.setVisibility(View.VISIBLE);
                        }
                    }
                }
            });
}