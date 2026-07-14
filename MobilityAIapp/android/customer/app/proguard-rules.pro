# ─── aimobility ProGuard / R8 Rules ──────────────────────────────────────────
# Applied to release builds only (minifyEnabled true in build.gradle).
# R8 full mode is active via proguard-android-optimize.txt base rules.
# ─────────────────────────────────────────────────────────────────────────────

# Keep line numbers for crash stack traces (Crashlytics / CaOC readable stacks)
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep generic type signatures (needed by Retrofit, Gson, Jackson, Room)
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses

# ─── Application Classes ──────────────────────────────────────────────────────
# Keep all app classes intact so reflection-based APIs (Room DAOs, Gson models,
# Retrofit interfaces, WebSocket callbacks) survive R8 obfuscation.
#
# Primary package  : com.yna.opusaimobilityapp  (GoGrab UI + all features)
# AWS service layer: com.terraai.aimobility      (:pdf sub-module + AWS helpers)
-keep class com.yna.opusaimobilityapp.** { *; }
-keepclassmembers class com.yna.opusaimobilityapp.** { *; }
-keep class com.terraai.aimobility.** { *; }
-keepclassmembers class com.terraai.aimobility.** { *; }

# ─── AWS Amplify + Cognito ────────────────────────────────────────────────────
-keep class com.amplifyframework.** { *; }
-keepclassmembers class com.amplifyframework.** { *; }
-keep class com.amazonaws.** { *; }
-keepclassmembers class com.amazonaws.** { *; }
-keep class com.amazon.** { *; }
-keepclassmembers class com.amazon.** { *; }
-dontwarn com.amplifyframework.**
-dontwarn com.amazonaws.**
-dontwarn com.amazon.**
# Amplify uses Kotlin coroutines internally even from Java code
-dontwarn kotlin.**
-dontwarn kotlinx.**

# ─── Retrofit + OkHttp ───────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keep interface retrofit2.** { *; }
# Retrofit uses reflection to look up method return types at runtime
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
# OkHttp platform detection relies on class names
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
-dontwarn org.codehaus.mojo.animal_sniffer.*
-dontwarn javax.annotation.**

# ─── Gson / JSON Models ───────────────────────────────────────────────────────
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
# Generic type token used by Gson TypeToken
-keep class * extends com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-keepclassmembers,allowobfuscation class * {
    @com.google.gson.annotations.Expose <fields>;
}

# ─── Jackson ──────────────────────────────────────────────────────────────────
-keep class com.fasterxml.jackson.** { *; }
-keepclassmembers class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**
# Jackson uses reflection to read/write field names
-keepclassmembers class * {
    @com.fasterxml.jackson.annotation.* <fields>;
    @com.fasterxml.jackson.annotation.* <methods>;
}

# ─── Room Database ────────────────────────────────────────────────────────────
# Room generates implementation classes at compile time; their names are
# referenced by string in the generated code so they must not be renamed.
-keep class * extends androidx.room.RoomDatabase { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }
-keepclassmembers @androidx.room.Entity class * { *; }
-dontwarn androidx.room.paging.**

# ─── Glide (image loading) ────────────────────────────────────────────────────
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
    **[] $VALUES;
    public *;
}
-keep class com.bumptech.glide.load.data.ParcelFileDescriptorRewinder$InternalRewinder {
    *** rewind();
}
-dontwarn com.bumptech.glide.**

# ─── Facebook Fresco (image loading — used by food/restaurant screens) ────────
-keep class com.facebook.fresco.** { *; }
-keep class com.facebook.imagepipeline.** { *; }
-keep class com.facebook.drawee.** { *; }
-keepclassmembers class com.facebook.fresco.** { *; }
-dontwarn com.facebook.fresco.**
-dontwarn com.facebook.imagepipeline.**
-dontwarn com.facebook.drawee.**
# Fresco JNI dispatcher (native image decoding)
-keep class com.facebook.soloader.** { *; }
-dontwarn com.facebook.soloader.**

# ─── Facebook SDK (Login / CustomTabActivity in manifest) ─────────────────────
-keep class com.facebook.** { *; }
-keepclassmembers class com.facebook.** { *; }
-dontwarn com.facebook.**

# ─── MPAndroidChart — TERRA-081 Telemetry Screen ─────────────────────────────
# Chart classes are instantiated from XML layout inflation by class name.
-keep class com.github.mikephil.charting.** { *; }
-keepclassmembers class com.github.mikephil.charting.** { *; }
-dontwarn com.github.mikephil.charting.**

# ─── Google Maps / Places / Location ─────────────────────────────────────────
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.location.** { *; }
-keep class com.google.android.libraries.places.** { *; }
-keep class com.google.maps.android.** { *; }
-dontwarn com.google.android.gms.**
-dontwarn com.google.android.libraries.places.**

# ─── Material Components (Chip, RangeSlider, BottomSheet, TextInputLayout) ───
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**
# Chip state-list drawables use reflection against the style attribute name
-keepclassmembers class com.google.android.material.chip.Chip { *; }

# ─── CircleIndicator2 (me.relex:circleindicator) ─────────────────────────────
-keep class me.relex.circleindicator.** { *; }
-dontwarn me.relex.circleindicator.**

# ─── MaterialRatingBar (me.zhanghai.android.materialratingbar) ───────────────
-keep class me.zhanghai.android.materialratingbar.** { *; }
-dontwarn me.zhanghai.android.materialratingbar.**

# ─── vanniktech Image Cropper ────────────────────────────────────────────────
-keep class com.canhub.cropper.** { *; }
-dontwarn com.canhub.cropper.**

# ─── RecyclerTreeView (JitPack) ───────────────────────────────────────────────
-keep class tellh.com.recyclertreeview_lib.** { *; }
-dontwarn tellh.com.recyclertreeview_lib.**

# ─── Country Code Picker (com.hbb20:ccp) ─────────────────────────────────────
-keep class com.hbb20.** { *; }
-dontwarn com.hbb20.**

# ─── ExpandableTextView (at.blogc) ───────────────────────────────────────────
-keep class at.blogc.android.views.** { *; }
-dontwarn at.blogc.**

# ─── Facebook Shimmer ────────────────────────────────────────────────────────
-keep class com.facebook.shimmer.** { *; }
-dontwarn com.facebook.shimmer.**

# ─── Custom Activity On Crash ────────────────────────────────────────────────
-keep class cat.ereza.customactivityoncrash.** { *; }
-dontwarn cat.ereza.**

# ─── BouncyCastle (AWS SDK + iText7 in :pdf module) ──────────────────────────
# BouncyCastle uses reflection for crypto algorithm lookup by name string.
-keep class org.bouncycastle.** { *; }
-keepclassmembers class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**
# BC JCE provider registration by class name
-keep class org.bouncycastle.jce.provider.BouncyCastleProvider { *; }
-keep class org.bouncycastle.crypto.** { *; }

# ─── iText7 (via :pdf module — release only) ─────────────────────────────────
# iText7 loads layout renderers and font programs by class name at runtime.
-keep class com.itextpdf.** { *; }
-keepclassmembers class com.itextpdf.** { *; }
-dontwarn com.itextpdf.**
-dontwarn org.slf4j.**

# ─── Joda-Time ────────────────────────────────────────────────────────────────
-dontwarn org.joda.time.**
-keep class org.joda.time.** { *; }

# ─── Android Support / AndroidX ──────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**
# ViewBinding generated classes are referenced by name in Activities/Fragments
-keep class * implements androidx.viewbinding.ViewBinding {
    public static *** bind(android.view.View);
    public static *** inflate(...);
}

# ─── WebView JavaScript Bridge ───────────────────────────────────────────────
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ─── Parcelable ───────────────────────────────────────────────────────────────
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# ─── Serializable ─────────────────────────────────────────────────────────────
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# ─── Enum ─────────────────────────────────────────────────────────────────────
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# ─── R classes ────────────────────────────────────────────────────────────────
-keepclassmembers class **.R$* {
    public static <fields>;
}

# ─── Native methods ───────────────────────────────────────────────────────────
-keepclasseswithmembernames class * {
    native <methods>;
}

# ─── Firebase + GeoFire ──────────────────────────────────────────────────────
# Firebase IS in the dependency graph:
#   OpusAIMobility.java calls FirebaseApp.initializeApp()
#   GeoFire used for real-time driver location tracking
#   Firebase Crashlytics + Analytics active via BOM
-keep class com.google.firebase.** { *; }
-keepclassmembers class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**
-keep class com.firebase.** { *; }
-keepclassmembers class com.firebase.** { *; }
-dontwarn com.firebase.**

# ─── PaperDB (local key-value cache) ─────────────────────────────────────────
# Paper.init() called in OpusAIMobility.java; keep serialised model classes.
-keep class io.paperdb.** { *; }
-dontwarn io.paperdb.**
-keepclassmembers class * {
    @io.paperdb.* <fields>;
}
