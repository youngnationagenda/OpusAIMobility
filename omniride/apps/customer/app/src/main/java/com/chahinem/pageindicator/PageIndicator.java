package com.chahinem.pageindicator;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;

import androidx.recyclerview.widget.RecyclerView;

/**
 * Stub PageIndicator — satisfies layout XML references to com.chahinem.pageindicator.PageIndicator.
 * Original library (chahinem/pageindicator) is no longer available on JitPack.
 * Custom attrs (piSelectedColor, piUnselectedColor, etc.) declared in res/values/attrs.xml.
 */
public class PageIndicator extends View {

    public PageIndicator(Context context) {
        super(context);
    }

    public PageIndicator(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public PageIndicator(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void attachTo(RecyclerView recyclerView) {
        // stub — draws page dots based on adapter item count
    }
}
