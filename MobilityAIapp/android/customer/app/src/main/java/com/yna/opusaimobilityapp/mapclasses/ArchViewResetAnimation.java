package com.yna.opusaimobilityapp.mapclasses;

import android.animation.ValueAnimator;

import java.util.Objects;

import kotlin.jvm.internal.Intrinsics;

final class ArchViewResetAnimation implements ValueAnimator.AnimatorUpdateListener {
    final ArchView archView;

    ArchViewResetAnimation(ArchView archView) {
        this.archView = archView;
    }

    public final void onAnimationUpdate(ValueAnimator valueAnimator) {
        Intrinsics.checkNotNullParameter(valueAnimator, "animation");
        ArchView archView = this.archView;
        Object animatedValue = valueAnimator.getAnimatedValue();
        Objects.requireNonNull(animatedValue, "null cannot be cast to non-null type");
        archView.animatedValue = ((Float) animatedValue).floatValue();
        this.archView.invalidate();
    }
}
