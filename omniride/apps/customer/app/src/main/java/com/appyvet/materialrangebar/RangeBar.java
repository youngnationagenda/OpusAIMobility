package com.appyvet.materialrangebar;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;

/**
 * Stub RangeBar — satisfies layout XML references to com.appyvet.materialrangebar.RangeBar.
 * Original library (appyvet/MaterialRangeBar) returns 401 on JitPack.
 * Custom attrs (mrb_rangeBar, mrb_pinColor, mrb_selectorColor, etc.) declared in res/values/attrs.xml.
 */
public class RangeBar extends View {

    public interface OnRangeBarChangeListener {
        void onRangeChangeListener(RangeBar rangeBar, int leftPinIndex, int rightPinIndex,
                                   String leftPinValue, String rightPinValue);
        default void onTouchEnded(RangeBar rangeBar) {}
        default void onTouchStarted(RangeBar rangeBar) {}
    }

    private OnRangeBarChangeListener mListener;

    public RangeBar(Context context) {
        super(context);
    }

    public RangeBar(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public RangeBar(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void setOnRangeBarChangeListener(OnRangeBarChangeListener listener) {
        mListener = listener;
    }

    public void setRangePinsByValue(float minValue, float maxValue) {
        // stub
    }

    public float getTickStart() {
        return 0f;
    }

    public void setTickEnd(float tickEnd) {
        // stub
    }

    public float getTickEnd() {
        return 100f;
    }

    public String getLeftPinValue() {
        return "0";
    }

    public String getRightPinValue() {
        return "100";
    }
}
