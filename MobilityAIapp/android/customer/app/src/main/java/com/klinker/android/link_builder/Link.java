package com.klinker.android.link_builder;
import android.text.TextPaint;
import android.text.style.ClickableSpan;
import android.view.View;
/** Stub for klinker/Android-Link-Builder. */
public class Link extends ClickableSpan {
    public interface OnClickListener { void onClick(String text); }
    public interface OnLongClickListener { void onLongClick(String text); }
    private final String pattern;
    public Link(String pattern) { this.pattern = pattern; }
    public Link setOnClickListener(OnClickListener l) { return this; }
    public Link setOnLongClickListener(OnLongClickListener l) { return this; }
    public Link setTextColor(int color) { return this; }
    public Link setTextColorOfHighlightedLink(int color) { return this; }
    public Link setBold(boolean bold) { return this; }
    public Link setUnderline(boolean underline) { return this; }
    @Override public void onClick(View widget) {}
    @Override public void updateDrawState(TextPaint ds) {}
    public String getText() { return pattern; }
}
