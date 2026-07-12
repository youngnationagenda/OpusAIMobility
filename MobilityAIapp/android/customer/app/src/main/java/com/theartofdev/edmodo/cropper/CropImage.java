package com.theartofdev.edmodo.cropper;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import androidx.fragment.app.Fragment;
/** Stub for ArthurHub/Android-Image-Cropper (theartofdev.edmodo). */
public class CropImage {
    public static final int CROP_IMAGE_ACTIVITY_REQUEST_CODE = 203;
    public static final int CROP_IMAGE_ACTIVITY_RESULT_ERROR_CODE = 204;
    public static ActivityBuilder activity() { return new ActivityBuilder(); }
    public static ActivityBuilder activity(Uri uri) { return new ActivityBuilder(); }
    public static class ActivityBuilder {
        public ActivityBuilder setAspectRatio(int x, int y) { return this; }
        public ActivityBuilder setFixAspectRatio(boolean fix) { return this; }
        public ActivityBuilder setCropShape(CropImageView.CropShape shape) { return this; }
        public ActivityBuilder setRequestedSize(int w, int h) { return this; }
        public void start(Activity activity) {}
        public void start(Context ctx, Fragment fragment) {}
        public Intent getIntent(Context context) { return new Intent(); }
    }
    public static class ActivityResult {
        public Uri getUri() { return null; }
        public Exception getError() { return null; }
    }
    public static ActivityResult getActivityResult(Intent data) { return new ActivityResult(); }
}
