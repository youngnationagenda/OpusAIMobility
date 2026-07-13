package com.terraai.aimobility.mapclasses;

import android.animation.ValueAnimator;
import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.BlurMaskFilter;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PathMeasure;
import android.graphics.Point;
import android.graphics.PorterDuff;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.util.AttributeSet;
import android.view.View;

import androidx.core.content.ContextCompat;

import com.terraai.aimobility.codeclasses.Functions;
import com.yna.opusaimobilityapp.R;

import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

import kotlin.Pair;
import kotlin.collections.ArraysKt;
import kotlin.collections.CollectionsKt;
import kotlin.collections.IndexedValue;
import kotlin.collections.IntIterator;
import kotlin.jvm.internal.Intrinsics;
import kotlin.ranges.IntRange;
import kotlin.ranges.RangesKt;


public final class ArchView extends View {
    /* access modifiers changed from: private */
    public static final float LARGE_RADIUS = Functions.getDPToPixels(8);
    /* access modifiers changed from: private */
    public static final float SEGMENT_SIZE = Functions.getDPToPixels(2);
    /* access modifiers changed from: private */
    public static final float SHADOW_PADDING = Functions.getDPToPixels(2);
    /* access modifiers changed from: private */
    public static final float SMALL_RADIUS = Functions.getDPToPixels(5);
    /* access modifiers changed from: private */
    /* access modifiers changed from: private */
    public float animatedValue;
    private ValueAnimator animation;
    private Paint animationPaint;
    private Paint[] archPaints;
    private Path[] archPaths;
    private final AttributeSet attrs;
    private final int destinationColour;
    private int duration;
    private final Path fadePath;
    private final RectF firstRect;
    private final RectF lastRect;
    private Paint markerAnimationPaint;
    private Paint[] markerPaints;
    private List<Path>[] pathSegments;
    private final int pickupColour;
    private Point[] points;
    private final int shadowColour;
    private Paint shadowMarkerPaint;
    private Paint shadowPaint;
    private Path[] shadowPaths;
    private final int via11Colour;
    private final int via12Colour;
    private final int via22Colour;

    public ArchView(Context context, AttributeSet attributeSet) {
        this(context, attributeSet, 0, 4);
    }

    /* JADX INFO: super call moved to the top of the method (can break code semantics) */
    @SuppressLint("WrongConstant")
    public ArchView(Context context, AttributeSet attributeSet, int i) {
        super(context, attributeSet, i);
        Intrinsics.checkNotNullParameter(context, "context");
        this.attrs = attributeSet;
        this.fadePath = new Path();
        this.firstRect = new RectF();
        this.lastRect = new RectF();
        this.pickupColour = ContextCompat.getColor(context, R.color.gray);
        this.via11Colour = ContextCompat.getColor(context, R.color.blue_color);
        this.via12Colour = ContextCompat.getColor(context, R.color.red_color);
        this.via22Colour = ContextCompat.getColor(context, R.color.yellow);
        this.destinationColour = ContextCompat.getColor(context, R.color.app_color);
        int parseColor = Color.parseColor("#33272726");
        this.shadowColour = parseColor;
        this.duration = 4000;
        setLayerType(1, (Paint) null);
        Paint paint = new Paint();
        this.shadowPaint = paint;
        Intrinsics.checkNotNull(paint);
        paint.setAntiAlias(true);
        Paint paint2 = this.shadowPaint;
        Intrinsics.checkNotNull(paint2);
        paint2.setStyle(Paint.Style.STROKE);
        Paint paint3 = this.shadowPaint;
        Intrinsics.checkNotNull(paint3);
        paint3.setStrokeWidth(10.0f);
        Paint paint4 = this.shadowPaint;
        Intrinsics.checkNotNull(paint4);
        paint4.setMaskFilter(new BlurMaskFilter(8.0f, BlurMaskFilter.Blur.NORMAL));
        Paint paint5 = this.shadowPaint;
        Intrinsics.checkNotNull(paint5);
        paint5.setColor(parseColor);
        Paint paint6 = new Paint();
        this.shadowMarkerPaint = paint6;
        Intrinsics.checkNotNull(paint6);
        paint6.setAntiAlias(true);
        Paint paint7 = this.shadowMarkerPaint;
        Intrinsics.checkNotNull(paint7);
        paint7.setStyle(Paint.Style.FILL);
        Paint paint8 = this.shadowMarkerPaint;
        Intrinsics.checkNotNull(paint8);
        paint8.setMaskFilter(new BlurMaskFilter(8.0f, BlurMaskFilter.Blur.NORMAL));
        Paint paint9 = this.shadowMarkerPaint;
        Intrinsics.checkNotNull(paint9);
        paint9.setColor(parseColor);
        Paint paint10 = new Paint();
        this.animationPaint = paint10;
        Intrinsics.checkNotNull(paint10);
        paint10.setAntiAlias(true);
        Paint paint11 = this.animationPaint;
        Intrinsics.checkNotNull(paint11);
        paint11.setStyle(Paint.Style.STROKE);
        Paint paint12 = this.animationPaint;
        Intrinsics.checkNotNull(paint12);
        paint12.setStrokeWidth(10.0f);
        Paint paint13 = this.animationPaint;
        Intrinsics.checkNotNull(paint13);
        paint13.setStrokeCap(Paint.Cap.ROUND);
        Paint paint14 = new Paint();
        this.markerAnimationPaint = paint14;
        Intrinsics.checkNotNull(paint14);
        paint14.setAntiAlias(true);
        Paint paint15 = this.markerAnimationPaint;
        Intrinsics.checkNotNull(paint15);
        paint15.setStyle(Paint.Style.FILL);
        resetAnimation();
    }

    /* JADX INFO: this call moved to the top of the method (can break code semantics) */
    public /* synthetic */ ArchView(Context context, AttributeSet attributeSet, int i, int i2) {
        this(context, attributeSet, (i2 & 4) != 0 ? 0 : i);
    }

    public final AttributeSet getAttrs() {
        return this.attrs;
    }

    private final void resetAnimation() {
        ValueAnimator valueAnimator = this.animation;
        if (valueAnimator != null) {
            Intrinsics.checkNotNull(valueAnimator);
            valueAnimator.cancel();
        }
        ValueAnimator ofFloat = ValueAnimator.ofFloat(new float[]{-0.5f, 2.0f});
        this.animation = ofFloat;
        Intrinsics.checkNotNull(ofFloat);
        ofFloat.setDuration((long) this.duration);
        ValueAnimator valueAnimator2 = this.animation;
        Intrinsics.checkNotNull(valueAnimator2);
        valueAnimator2.setRepeatCount(-1);
        ValueAnimator valueAnimator3 = this.animation;
        Intrinsics.checkNotNull(valueAnimator3);
        valueAnimator3.setRepeatMode(ValueAnimator.RESTART);
        ValueAnimator valueAnimator4 = this.animation;
        Intrinsics.checkNotNull(valueAnimator4);
        valueAnimator4.addUpdateListener(new ArchViewResetAnimation(this));
    }

    public final void setPoints(Point... pointArr) {
        Intrinsics.checkNotNullParameter(pointArr, "points");
        this.points = pointArr;
        makePaths();
    }

    private final void makePaths() {
        Point[] pointArr = this.points;
        Intrinsics.checkNotNull(pointArr);
        int length = (pointArr.length * 1000) + 1000;
        if (this.duration != length) {
            this.duration = length;
            resetAnimation();
        }
        int[] iArr = new int[pointArr.length];
        iArr[0] = this.pickupColour;
        int length2 = pointArr.length;
        if (length2 == 2) {
            iArr[1] = this.destinationColour;
        } else if (length2 == 3) {
            iArr[1] = this.via11Colour;
            iArr[2] = this.destinationColour;
        } else if (length2 == 4) {
            iArr[1] = this.via12Colour;
            iArr[2] = this.via22Colour;
            iArr[3] = this.destinationColour;
        }
        int length3 = pointArr.length;
        Paint[] paintArr = new Paint[length3];
        for (int i = 0; i < length3; i++) {
            Paint paint = new Paint();
            paint.setAntiAlias(true);
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(iArr[i]);
            paintArr[i] = paint;
        }
        this.markerPaints = paintArr;
        int length4 = pointArr.length - 1;
        Paint[] paintArr2 = new Paint[length4];
        for (int i2 = 0; i2 < length4; i2++) {
            Paint paint2 = new Paint();
            paint2.setAntiAlias(true);
            paint2.setStyle(Paint.Style.STROKE);
            paint2.setStrokeWidth(10.0f);
            paint2.setStrokeCap(Paint.Cap.ROUND);
            paintArr2[i2] = paint2;
        }
        this.archPaints = paintArr2;
        int length5 = pointArr.length - 1;
        Path[] pathArr = new Path[length5];
        for (int i3 = 0; i3 < length5; i3++) {
            pathArr[i3] = new Path();
        }
        this.archPaths = pathArr;
        int i4 = pointArr.length == 2 ? 1 : 0;
        Path[] pathArr2 = new Path[i4];
        for (int i5 = 0; i5 < i4; i5++) {
            pathArr2[i5] = new Path();
        }
        this.shadowPaths = pathArr2;
        int length6 = pointArr.length - 1;
        List<Path>[] listArr = new List[length6];
        for (int i6 = 0; i6 < length6; i6++) {
            listArr[i6] = new LinkedList();
        }
        this.pathSegments = listArr;
        Iterator it = RangesKt.until(1, pointArr.length).iterator();
        while (it.hasNext()) {
            int nextInt = ((IntIterator) it).nextInt();
            int i7 = nextInt - 1;
            Point point = pointArr[i7];
            Point point2 = pointArr[nextInt];
            int i8 = iArr[i7];
            int i9 = iArr[nextInt];
            Paint[] paintArr3 = this.archPaints;
            Intrinsics.checkNotNull(paintArr3);
            paintArr3[i7].setShader(new LinearGradient((float) point.x, (float) point.y, (float) point2.x, (float) point2.y, i8, i9, Shader.TileMode.CLAMP));
            int i10 = point.x - point2.x;
            int i11 = point.y - point2.y;
            int sqrt = (int) ((float) Math.sqrt((double) (((float) (i10 * i10)) + ((float) (i11 * i11)))));
            Path[] pathArr3 = this.archPaths;
            Intrinsics.checkNotNull(pathArr3);
            makeArch(pathArr3[i7], point.x, point.y, point2.x, point2.y, sqrt);
            if (pointArr.length == 2) {
                Path[] pathArr4 = this.shadowPaths;
                Intrinsics.checkNotNull(pathArr4);
                pathArr4[i7].moveTo((float) point.x, (float) point.y);
                Path[] pathArr5 = this.shadowPaths;
                Intrinsics.checkNotNull(pathArr5);
                pathArr5[i7].lineTo((float) point2.x, (float) point2.y);
            }
            List<Path>[] listArr2 = this.pathSegments;
            Intrinsics.checkNotNull(listArr2);
            List<Path> list = listArr2[i7];
            Path[] pathArr6 = this.archPaths;
            Intrinsics.checkNotNull(pathArr6);
            segmentPath(list, pathArr6[i7]);
        }
        ValueAnimator valueAnimator = this.animation;
        Intrinsics.checkNotNull(valueAnimator);
        if (!valueAnimator.isRunning()) {
            ValueAnimator valueAnimator2 = this.animation;
            Intrinsics.checkNotNull(valueAnimator2);
            valueAnimator2.start();
        }
        invalidate();
    }

    /* access modifiers changed from: protected */
    public void onDraw(Canvas canvas) {

        List<Path>[] listArr;
        int i;
        float f;
        float f2;
        Canvas canvas2 = canvas;
        Intrinsics.checkNotNullParameter(canvas2, "canvas");
        super.onDraw(canvas);
        if (this.archPaths != null) {
            int i2 = 0;
            canvas2.drawColor(0, PorterDuff.Mode.MULTIPLY);
            Path[] pathArr = this.shadowPaths;
            Intrinsics.checkNotNull(pathArr);
            for (Path drawPath : pathArr) {
                Paint paint = this.shadowPaint;
                Intrinsics.checkNotNull(paint);
                canvas2.drawPath(drawPath, paint);
            }
            Point[] pointArr = this.points;
            Intrinsics.checkNotNull(pointArr);
            for (IndexedValue indexedValue : ArraysKt.withIndex(pointArr)) {
                if (indexedValue.getIndex() != 0) {
                    int index = indexedValue.getIndex();
                    Point[] pointArr2 = this.points;
                    Intrinsics.checkNotNull(pointArr2);
                    if (index != pointArr2.length - 1) {
                        f2 = SMALL_RADIUS;
                        float f3 = f2 + SHADOW_PADDING;
                        Paint paint2 = this.shadowMarkerPaint;
                        Intrinsics.checkNotNull(paint2);
                        canvas2.drawCircle((float) ((Point) indexedValue.getValue()).x, (float) ((Point) indexedValue.getValue()).y, f3, paint2);
                    }
                }
                f2 = LARGE_RADIUS;
                float f32 = f2 + SHADOW_PADDING;
                Paint paint22 = this.shadowMarkerPaint;
                Intrinsics.checkNotNull(paint22);
                canvas2.drawCircle((float) ((Point) indexedValue.getValue()).x, (float) ((Point) indexedValue.getValue()).y, f32, paint22);
            }
            Point[] pointArr3 = this.points;
            Intrinsics.checkNotNull(pointArr3);
            Paint[] paintArr = this.markerPaints;
            Intrinsics.checkNotNull(paintArr);
            for (IndexedValue indexedValue2 : CollectionsKt.withIndex(ArraysKt.zip(pointArr3,paintArr))) {
                int index2 = indexedValue2.getIndex();
                Point point = (Point) ((Pair) indexedValue2.getValue()).getFirst();
                Paint paint3 = (Paint) ((Pair) indexedValue2.getValue()).getSecond();
                if (index2 != 0) {
                    Point[] pointArr4 = this.points;
                    Intrinsics.checkNotNull(pointArr4);
                    if (index2 != pointArr4.length - 1) {
                        f = SMALL_RADIUS;
                        canvas2.drawCircle((float) point.x, (float) point.y, f, paint3);
                    }
                }
                f = LARGE_RADIUS;
                canvas2.drawCircle((float) point.x, (float) point.y, f, paint3);
            }
            float f4 = this.animatedValue;
            if (((double) f4) > -0.5d && f4 < ((float) 0)) {
                Point[] pointArr5 = this.points;
                Intrinsics.checkNotNull(pointArr5);
                drawCircleAnimation(canvas2, pointArr5[0], ((float) 1) + (this.animatedValue / 0.5f));
            }
            float f5 = this.animatedValue;
            float f6 = (float) 1;
            if (f5 > f6 && f5 < ((float) 2)) {
                Point[] pointArr6 = this.points;
                Intrinsics.checkNotNull(pointArr6);
                Point[] pointArr7 = this.points;
                Intrinsics.checkNotNull(pointArr7);
                drawCircleAnimation(canvas2, pointArr6[pointArr7.length - 1], f6 - (this.animatedValue - f6));
            }
            Path[] pathArr2 = this.archPaths;
            Intrinsics.checkNotNull(pathArr2);
            Paint[] paintArr2 = this.archPaints;
            Intrinsics.checkNotNull(paintArr2);
            for (Pair pair : ArraysKt.zip(pathArr2, paintArr2)) {
                canvas2.drawPath((Path) pair.getFirst(), (Paint) pair.getSecond());
            }
            List<Path>[] listArr2 = this.pathSegments;
            Intrinsics.checkNotNull(listArr2);
            int i3 = 0;
            for (List<Path> size : listArr2) {
                i3 += size.size();
            }
            float f7 = (float) i3;
            int i4 = (int) (this.animatedValue * f7);
            List<Path>[] listArr3 = this.pathSegments;
            Intrinsics.checkNotNull(listArr3);
            int length = listArr3.length;
            int i5 = 0;
            int i6 = 0;
            while (i5 < length) {
                List<Path> list = listArr3[i5];
                this.fadePath.reset();
                Path path = null;
                int size2 = list.size();
                Iterator it = new IntRange(i2, i3).iterator();
                Path path2 = path;
                int i7 = 0;
                while (true) {
                    listArr = listArr3;
                    if (!it.hasNext()) {
                        break;
                    }
                    int nextInt = ((IntIterator) it).nextInt();
                    int i8 = i4;
                    int i9 = (i4 - nextInt) - i6;
                    if (i9 >= 0 && size2 > i9) {
                        i = i3;
                        i7 = (int) (((float) 255) * (1.0f - (((float) nextInt) / f7)));
                        Path path3 = list.get(i9);
                        if (path == null) {
                            path = path3;
                            i2 = i7;
                        }
                        Path path4 = this.fadePath;
                        Intrinsics.checkNotNull(path3);
                        path4.addPath(path3);
                        path2 = path3;
                    } else {
                        i = i3;
                    }
                    i3 = i;
                    listArr3 = listArr;
                    i4 = i8;
                }
                int i10 = i4;
                int i11 = i3;
                i6 += size2;
                if (path != null) {
                    int argb = Color.argb(i2, 255, 255, 255);
                    int argb2 = Color.argb(i7, 255, 255, 255);
                    Intrinsics.checkNotNull(path);
                    path.computeBounds(this.firstRect, true);
                    Intrinsics.checkNotNull(path2);
                    path2.computeBounds(this.lastRect, true);
                    Paint paint4 = this.animationPaint;
                    Intrinsics.checkNotNull(paint4);
                    paint4.setShader(new LinearGradient(this.firstRect.centerX(), this.firstRect.centerY(), this.lastRect.centerX(), this.lastRect.centerY(), argb, argb2, Shader.TileMode.CLAMP));
                    Path path5 = this.fadePath;
                    Paint paint5 = this.animationPaint;
                    Intrinsics.checkNotNull(paint5);
                    canvas2.drawPath(path5, paint5);
                }
                i5++;
                i3 = i11;
                listArr3 = listArr;
                i4 = i10;
                i2 = 0;
            }
        }
    }

    private final void drawCircleAnimation(Canvas canvas, Point point, float f) {
        int i = (int) (((float) 255) * f);
        float coerceAtMost = RangesKt.coerceAtMost(f * ((float) 2), 1.0f);
        int argb = Color.argb((int) (((float) i) * coerceAtMost), 255, 255, 255);
        int argb2 = Color.argb((int) (((float) (255 - i)) * coerceAtMost), 255, 255, 255);
        Paint paint = this.markerAnimationPaint;
        Intrinsics.checkNotNull(paint);
        float f2 = (float) point.x;
        float f3 = (float) point.y;
        float f4 = LARGE_RADIUS;
        paint.setShader(new RadialGradient(f2, f3, f4, argb, argb2, Shader.TileMode.CLAMP));
        Paint paint2 = this.markerAnimationPaint;
        Intrinsics.checkNotNull(paint2);
        canvas.drawCircle((float) point.x, (float) point.y, f4, paint2);
    }

    private final void segmentPath(List<Path> list, Path path) {
        PathMeasure pathMeasure = new PathMeasure(path, false);
        float length = pathMeasure.getLength();
        float coerceAtLeast = RangesKt.coerceAtLeast(length / ((float) 100), SEGMENT_SIZE);
        float f = 0.0f;
        while (f <= length) {
            float f2 = f + coerceAtLeast;
            float f3 = f2 > length ? length : f2;
            Path path2 = new Path();
            pathMeasure.getSegment(f, f3, path2, true);
            list.add(path2);
            f = f2;
        }
    }

    private final void makeArch(Path path, int i, int i2, int i3, int i4, int i5) {
        int i6 = i;
        int i7 = i2;
        int i8 = i3;
        int i9 = i4;
        int i10 = i5;
        if (i8 <= i6) {
            i10 = -i10;
        }
        float f = (float) i6;
        float f2 = (((float) (i8 - i6)) / 2.0f) + f;
        float f3 = (float) i7;
        float f4 = (((float) (i9 - i7)) / 2.0f) + f3;
        double radians = Math.toRadians((((double) ((float) Math.atan2((double) (f4 - f3), (double) (f2 - f)))) * 57.29577951308232d) - ((double) 90));
        double d = (double) (i10 / 2);
        double sin = ((double) f4) + (d * Math.sin(radians));
        Path path2 = path;
        path.moveTo(f, f3);
        path.cubicTo(f, f3, (float) (((double) f2) + (Math.cos(radians) * d)), (float) sin, (float) i8, (float) i9);
    }
}
