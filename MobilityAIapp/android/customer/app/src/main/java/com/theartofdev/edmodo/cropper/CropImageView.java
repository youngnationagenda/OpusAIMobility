package com.theartofdev.edmodo.cropper;
import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;
/** Stub for ArthurHub/Android-Image-Cropper (theartofdev.edmodo). */
public class CropImageView extends FrameLayout {
    public enum CropShape { RECTANGLE, OVAL }
    public CropImageView(Context ctx) { super(ctx); }
    public CropImageView(Context ctx, AttributeSet attrs) { super(ctx, attrs); }
    public CropImageView(Context ctx, AttributeSet attrs, int def) { super(ctx, attrs, def); }
    public void setAspectRatio(int x, int y) {}
    public void setFixedAspectRatio(boolean fixed) {}
    public void setCropShape(CropShape shape) {}
    public android.net.Uri getCroppedImageUri() { return null; }
}
