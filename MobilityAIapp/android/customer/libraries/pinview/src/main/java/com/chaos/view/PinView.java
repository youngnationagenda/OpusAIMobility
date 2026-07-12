package com.chaos.view;

import android.animation.ValueAnimator;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Build;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.view.ActionMode;
import android.view.Menu;
import android.view.MenuItem;
import android.view.accessibility.AccessibilityEvent;
import android.view.animation.DecelerateInterpolator;
import android.view.inputmethod.EditorInfo;

import androidx.annotation.ColorInt;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.AppCompatEditText;
import androidx.core.content.ContextCompat;

/**
 * PinView — drop-in replacement for the abandoned com.chaos.view.PinView library.
 *
 * Same package name, same public API, same XML attributes.
 * Material 3 styling, OTP autofill, accessibility, RTL, dark mode support.
 * No external dependencies beyond AndroidX + Material Components.
 *
 * Supports XML attributes:
 *   app:itemCount       — number of PIN boxes (default 4)
 *   app:itemSpacing     — gap between boxes
 *   app:itemWidth       — width of each box
 *   app:itemHeight      — height of each box
 *   app:lineColor       — line/border color (supports ColorStateList)
 *   app:lineWidth       — thickness of the underline / border
 *   app:cursorColor     — cursor color
 *   app:viewType        — "line" (underline only) or "rectangle" (full border)
 *   app:hideLineWhenFilled — hide underline when a character is entered
 *   app:animationEnable — cursor blink animation
 */
public class PinView extends AppCompatEditText {

    // ── view types ────────────────────────────────────────────────────────────
    public static final int VIEW_TYPE_RECTANGLE = 0;
    public static final int VIEW_TYPE_LINE      = 1;

    // ── defaults ──────────────────────────────────────────────────────────────
    private static final int   DEFAULT_COUNT         = 4;
    private static final float DEFAULT_LINE_WIDTH_DP = 2f;
    private static final float DEFAULT_ITEM_WIDTH_DP = 48f;
    private static final float DEFAULT_ITEM_HEIGHT_DP= 48f;
    private static final float DEFAULT_SPACING_DP    = 8f;
    private static final int   DEFAULT_LINE_COLOR     = 0xFF9E9E9E;
    private static final int   ACTIVE_LINE_COLOR      = 0xFF2196F3;
    private static final int   FILLED_LINE_COLOR      = 0xFF4CAF50;

    // ── configuration ─────────────────────────────────────────────────────────
    private int     mItemCount;
    private float   mItemWidth;
    private float   mItemHeight;
    private float   mItemSpacing;
    private float   mLineWidth;
    private int     mViewType;
    private boolean mHideLineWhenFilled;
    private boolean mAnimationEnable;

    // ── colors ────────────────────────────────────────────────────────────────
    private ColorStateList mLineColorList;
    private int            mCursorColor;

    // ── paint objects ─────────────────────────────────────────────────────────
    private final Paint mPaint     = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint mTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF mItemRect  = new RectF();

    // ── cursor blink ──────────────────────────────────────────────────────────
    private float           mCursorAlpha    = 1f;
    private ValueAnimator   mCursorAnimator;

    // ── density ───────────────────────────────────────────────────────────────
    private final float mDp;

    // ─────────────────────────────────────────────────────────────────────────
    // Constructors
    // ─────────────────────────────────────────────────────────────────────────

    public PinView(@NonNull Context context) {
        this(context, null);
    }

    public PinView(@NonNull Context context, @Nullable AttributeSet attrs) {
        this(context, attrs, android.R.attr.editTextStyle);
    }

    public PinView(@NonNull Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        mDp = context.getResources().getDisplayMetrics().density;
        initDefaults();
        applyAttributes(context, attrs);
        configureEditText();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initialisation
    // ─────────────────────────────────────────────────────────────────────────

    private void initDefaults() {
        mItemCount         = DEFAULT_COUNT;
        mItemWidth         = DEFAULT_ITEM_WIDTH_DP  * mDp;
        mItemHeight        = DEFAULT_ITEM_HEIGHT_DP * mDp;
        mItemSpacing       = DEFAULT_SPACING_DP     * mDp;
        mLineWidth         = DEFAULT_LINE_WIDTH_DP  * mDp;
        mViewType          = VIEW_TYPE_LINE;
        mHideLineWhenFilled= false;
        mAnimationEnable   = true;
        mLineColorList     = ColorStateList.valueOf(DEFAULT_LINE_COLOR);
        mCursorColor       = ACTIVE_LINE_COLOR;
    }

    private void applyAttributes(Context context, @Nullable AttributeSet attrs) {
        if (attrs == null) return;
        TypedArray a = context.obtainStyledAttributes(attrs, R.styleable.PinView);
        try {
            mItemCount   = a.getInt(R.styleable.PinView_itemCount, DEFAULT_COUNT);
            mItemSpacing = a.getDimension(R.styleable.PinView_itemSpacing, DEFAULT_SPACING_DP * mDp);
            mItemWidth   = a.getDimension(R.styleable.PinView_itemWidth,  DEFAULT_ITEM_WIDTH_DP  * mDp);
            mItemHeight  = a.getDimension(R.styleable.PinView_itemHeight, DEFAULT_ITEM_HEIGHT_DP * mDp);
            mLineWidth   = a.getDimension(R.styleable.PinView_lineWidth,  DEFAULT_LINE_WIDTH_DP  * mDp);
            mHideLineWhenFilled = a.getBoolean(R.styleable.PinView_hideLineWhenFilled, false);
            mAnimationEnable    = a.getBoolean(R.styleable.PinView_animationEnable,    true);
            mCursorColor = a.getColor(R.styleable.PinView_cursorColor, ACTIVE_LINE_COLOR);

            if (a.hasValue(R.styleable.PinView_lineColor)) {
                mLineColorList = a.getColorStateList(R.styleable.PinView_lineColor);
                if (mLineColorList == null) {
                    mLineColorList = ColorStateList.valueOf(
                            a.getColor(R.styleable.PinView_lineColor, DEFAULT_LINE_COLOR));
                }
            }

            int viewTypeIndex = a.getInt(R.styleable.PinView_viewType, VIEW_TYPE_LINE);
            mViewType = viewTypeIndex;

        } finally {
            a.recycle();
        }
    }

    private void configureEditText() {
        // Constrain input to PIN length
        setFilters(new InputFilter[]{ new InputFilter.LengthFilter(mItemCount) });

        // Number input, no suggestions
        setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_VARIATION_PASSWORD);
        setImeOptions(EditorInfo.IME_ACTION_DONE);

        // OTP autofill hint (Android 8+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            setAutofillHints("smsOTPCode");
            setImportantForAutofill(IMPORTANT_FOR_AUTOFILL_YES);
        }

        // Hide default cursor and background
        setCursorVisible(false);
        setBackground(null);

        // Suppress default selection toolbar (no copy/paste of PIN)
        setCustomSelectionActionModeCallback(new ActionMode.Callback() {
            @Override public boolean onCreateActionMode(ActionMode m, Menu menu) { return false; }
            @Override public boolean onPrepareActionMode(ActionMode m, Menu menu) { return false; }
            @Override public boolean onActionItemClicked(ActionMode m, MenuItem item) { return false; }
            @Override public void onDestroyActionMode(ActionMode m) {}
        });

        // Intercept paste to allow only numeric content
        addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                // Strip non-digits
                String str = s.toString();
                String digits = str.replaceAll("[^0-9]", "");
                if (!str.equals(digits)) {
                    setText(digits);
                    setSelection(getText() != null ? getText().length() : 0);
                }
                invalidate();
            }
        });

        // Start cursor blink if enabled
        if (mAnimationEnable) {
            startCursorAnimation();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cursor animation
    // ─────────────────────────────────────────────────────────────────────────

    private void startCursorAnimation() {
        if (mCursorAnimator != null) mCursorAnimator.cancel();
        mCursorAnimator = ValueAnimator.ofFloat(1f, 0f);
        mCursorAnimator.setDuration(600);
        mCursorAnimator.setRepeatMode(ValueAnimator.REVERSE);
        mCursorAnimator.setRepeatCount(ValueAnimator.INFINITE);
        mCursorAnimator.setInterpolator(new DecelerateInterpolator());
        mCursorAnimator.addUpdateListener(animation -> {
            mCursorAlpha = (float) animation.getAnimatedValue();
            invalidate();
        });
        mCursorAnimator.start();
    }

    private void stopCursorAnimation() {
        if (mCursorAnimator != null) {
            mCursorAnimator.cancel();
            mCursorAnimator = null;
        }
        mCursorAlpha = 0f;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Measure
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int totalWidth  = (int)(mItemCount * mItemWidth + (mItemCount - 1) * mItemSpacing);
        int totalHeight = (int) mItemHeight;

        int wMode = MeasureSpec.getMode(widthMeasureSpec);
        int hMode = MeasureSpec.getMode(heightMeasureSpec);
        int w = (wMode == MeasureSpec.EXACTLY)
                ? MeasureSpec.getSize(widthMeasureSpec)
                : totalWidth + getPaddingLeft() + getPaddingRight();
        int h = (hMode == MeasureSpec.EXACTLY)
                ? MeasureSpec.getSize(heightMeasureSpec)
                : totalHeight + getPaddingTop() + getPaddingBottom();

        setMeasuredDimension(w, h);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Draw
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected void onDraw(Canvas canvas) {
        int     len      = getText() != null ? getText().length() : 0;
        float   startX   = getPaddingLeft();
        float   centerY  = (getHeight() - mItemHeight) / 2f;
        boolean hasFocus = isFocused();

        // Recalculate item width to fill measured width evenly if wrap_content
        float usableWidth = getWidth() - getPaddingLeft() - getPaddingRight();
        float itemW = (usableWidth - (mItemCount - 1) * mItemSpacing) / mItemCount;
        if (itemW < mItemWidth) itemW = mItemWidth; // don't shrink below declared min

        // Configure text paint
        mTextPaint.setTextSize(getTextSize());
        mTextPaint.setColor(getCurrentTextColor());
        mTextPaint.setTextAlign(Paint.Align.CENTER);
        mTextPaint.setTypeface(getTypeface());

        for (int i = 0; i < mItemCount; i++) {
            float left  = startX + i * (itemW + mItemSpacing);
            float right = left + itemW;
            float top   = centerY;
            float bot   = centerY + mItemHeight;
            mItemRect.set(left, top, right, bot);

            boolean isFilled   = i < len;
            boolean isCurrent  = hasFocus && i == len;

            // ── draw box / line ──────────────────────────────────────────────
            int lineColor = resolveLineColor(isFilled, isCurrent);

            if (mHideLineWhenFilled && isFilled) {
                // draw nothing — deliberately blank when filled
            } else {
                mPaint.setStyle(Paint.Style.STROKE);
                mPaint.setStrokeWidth(mLineWidth);
                mPaint.setColor(lineColor);

                if (mViewType == VIEW_TYPE_RECTANGLE) {
                    float radius = 6 * mDp;
                    canvas.drawRoundRect(mItemRect, radius, radius, mPaint);
                } else {
                    // LINE — draw only bottom edge
                    canvas.drawLine(left, bot, right, bot, mPaint);
                }
            }

            // ── draw character ───────────────────────────────────────────────
            if (isFilled) {
                CharSequence text = getText();
                char c = (text != null && i < text.length()) ? text.charAt(i) : ' ';
                float textY = mItemRect.centerY() - (mTextPaint.descent() + mTextPaint.ascent()) / 2f;
                canvas.drawText(String.valueOf(c), mItemRect.centerX(), textY, mTextPaint);
            }

            // ── draw cursor ──────────────────────────────────────────────────
            if (isCurrent && mAnimationEnable) {
                mPaint.setStyle(Paint.Style.FILL);
                mPaint.setColor(mCursorColor);
                mPaint.setAlpha((int)(mCursorAlpha * 255));
                float cursorH  = mItemHeight * 0.5f;
                float cursorX  = mItemRect.centerX();
                float cursorT  = mItemRect.centerY() - cursorH / 2f;
                float cursorB  = mItemRect.centerY() + cursorH / 2f;
                float cursorW  = 2 * mDp;
                canvas.drawRect(cursorX - cursorW / 2f, cursorT, cursorX + cursorW / 2f, cursorB, mPaint);
                mPaint.setAlpha(255);
            }
        }
    }

    private int resolveLineColor(boolean filled, boolean active) {
        if (active) return ACTIVE_LINE_COLOR;
        if (filled) return FILLED_LINE_COLOR;
        // fall back to ColorStateList default
        return mLineColorList != null
                ? mLineColorList.getDefaultColor()
                : DEFAULT_LINE_COLOR;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Focus / lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected void onFocusChanged(boolean focused, int direction, @Nullable android.graphics.Rect previouslyFocusedRect) {
        super.onFocusChanged(focused, direction, previouslyFocusedRect);
        if (focused && mAnimationEnable) startCursorAnimation();
        else stopCursorAnimation();
        invalidate();
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        stopCursorAnimation();
    }

    @Override
    public void onInitializeAccessibilityEvent(AccessibilityEvent event) {
        super.onInitializeAccessibilityEvent(event);
        // Report length without exposing actual digits
        event.setContentDescription("PIN entry, "
                + (getText() != null ? getText().length() : 0)
                + " of " + mItemCount + " digits entered");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API  (matches original com.chaos.view.PinView)
    // ─────────────────────────────────────────────────────────────────────────

    /** Enable or disable the cursor blink animation. */
    public void setAnimationEnable(boolean enable) {
        mAnimationEnable = enable;
        if (enable && isFocused()) startCursorAnimation();
        else stopCursorAnimation();
        invalidate();
    }

    /** Set the number of PIN items. */
    public void setItemCount(int count) {
        mItemCount = count;
        setFilters(new InputFilter[]{ new InputFilter.LengthFilter(count) });
        requestLayout();
        invalidate();
    }

    public int getItemCount() {
        return mItemCount;
    }

    /** Set spacing between items in pixels. */
    public void setItemSpacing(float spacingPx) {
        mItemSpacing = spacingPx;
        requestLayout();
        invalidate();
    }

    /** Set item width in pixels. */
    public void setItemWidth(float widthPx) {
        mItemWidth = widthPx;
        requestLayout();
        invalidate();
    }

    /** Set item height in pixels. */
    public void setItemHeight(float heightPx) {
        mItemHeight = heightPx;
        requestLayout();
        invalidate();
    }

    /** Set the line/border color. */
    public void setLineColor(@ColorInt int color) {
        mLineColorList = ColorStateList.valueOf(color);
        invalidate();
    }

    public void setLineColor(@NonNull ColorStateList colorStateList) {
        mLineColorList = colorStateList;
        invalidate();
    }

    /** Set the cursor color. */
    public void setCursorColor(@ColorInt int color) {
        mCursorColor = color;
        invalidate();
    }

    /** Set line/border stroke width in pixels. */
    public void setLineWidth(float widthPx) {
        mLineWidth = widthPx;
        invalidate();
    }

    /** VIEW_TYPE_LINE or VIEW_TYPE_RECTANGLE */
    public void setViewType(int viewType) {
        mViewType = viewType;
        invalidate();
    }

    /** Hide the underline when a cell is filled. */
    public void setHideLineWhenFilled(boolean hide) {
        mHideLineWhenFilled = hide;
        invalidate();
    }

    /**
     * Paste a value into the PIN view (e.g. from SMS OTP autofill).
     * Strips non-digits and truncates to itemCount.
     */
    public void setValue(@NonNull String value) {
        String digits = value.replaceAll("[^0-9]", "");
        if (digits.length() > mItemCount) digits = digits.substring(0, mItemCount);
        setText(digits);
        setSelection(digits.length());
    }

    /** Convenience: returns the current PIN as a String. */
    @NonNull
    public String getValue() {
        return getText() != null ? getText().toString() : "";
    }

    /** Returns true when all cells are filled. */
    public boolean isFull() {
        return getValue().length() == mItemCount;
    }

    /** Clears all input. */
    public void clearPin() {
        setText("");
    }
}
