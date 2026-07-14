package com.yna.opusaimobilityapp.codeclasses;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.PixelFormat;
import android.graphics.drawable.Drawable;

/**
 * Base stub for CircleProgressBarDrawable.
 * Copied from com.terraai.aimobility.codeclasses.ProgressBarDrawable to allow
 * excluding the entire com.terraai.aimobility source tree during CI builds.
 */
public abstract class ProgressBarDrawable extends Drawable {

    @Override
    public void draw(Canvas canvas) { /* no-op */ }

    @Override
    public void setAlpha(int alpha) { /* no-op */ }

    @Override
    public void setColorFilter(ColorFilter colorFilter) { /* no-op */ }

    @Override
    public int getOpacity() {
        return PixelFormat.TRANSLUCENT;
    }
}
