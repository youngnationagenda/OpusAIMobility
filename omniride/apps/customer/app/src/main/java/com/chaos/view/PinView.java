package com.chaos.view;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.EditText;

/**
 * Stub PinView — satisfies layout XML references to com.chaos.view.PinView.
 * Original library (ChaosLeong/PinView) is no longer available on JitPack.
 * Custom attrs (hideLineWhenFilled, itemCount, viewType, etc.) declared in res/values/attrs.xml.
 */
public class PinView extends EditText {

    public PinView(Context context) {
        super(context);
    }

    public PinView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public PinView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void setAnimationEnable(boolean enable) {
        // stub — animation on pin input
    }
}
