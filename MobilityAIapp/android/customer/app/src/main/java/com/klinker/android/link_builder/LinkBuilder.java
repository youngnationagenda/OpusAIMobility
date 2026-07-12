package com.klinker.android.link_builder;
import android.text.SpannableString;
import android.widget.TextView;
/** Stub for klinker/Android-Link-Builder. */
public class LinkBuilder {
    private final TextView textView;
    private LinkBuilder(TextView tv) { this.textView = tv; }
    public static LinkBuilder on(TextView tv) { return new LinkBuilder(tv); }
    public LinkBuilder addLink(Link link) { return this; }
    public void build() {}
    public static SpannableString applyLinks(TextView tv, Link... links) {
        return new SpannableString(tv.getText());
    }
}
