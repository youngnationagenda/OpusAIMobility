package com.github.florent37.singledateandtimepicker;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.FrameLayout;
import java.util.Date;

/**
 * Stub for florent37/SingleDateAndTimePicker.
 * UI shows nothing — the date/time picker is gracefully degraded.
 * Replace with a proper Material DatePicker when integrating the full UI.
 */
public class SingleDateAndTimePicker extends FrameLayout {

    public interface Listener {
        void onDateChanged(String displayed, Date date);
    }

    public SingleDateAndTimePicker(Context context) {
        super(context);
    }

    public SingleDateAndTimePicker(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public SingleDateAndTimePicker(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    public void setListener(Listener listener) { /* no-op */ }
    public void setMustBeOnFuture(boolean future) { /* no-op */ }
    public void setDefaultDate(Date date) { /* no-op */ }
    public void setMinDateRange(Date min) { /* no-op */ }
    public void setMaxDateRange(Date max) { /* no-op */ }
    public Date getDate() { return new Date(); }
    public void setDisplayMinutes(boolean display) { /* no-op */ }
    public void setDisplayHours(boolean display) { /* no-op */ }
    public void setDisplayDays(boolean display) { /* no-op */ }
    public void setDisplayMonths(boolean display) { /* no-op */ }
    public void setDisplayYears(boolean display) { /* no-op */ }
    public void setStepSizeMinutes(int step) { /* no-op */ }
    public void setStepSizeHours(int step) { /* no-op */ }
}
