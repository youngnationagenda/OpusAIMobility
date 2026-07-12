package com.terraai.aimobility.codeclasses;

import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.PixelFormat;
import android.graphics.drawable.Drawable;

/**
 * Base stub for CircleProgressBarDrawable.
 * Provides the minimal Drawable implementation so CircleProgressBarDrawable compiles.
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
