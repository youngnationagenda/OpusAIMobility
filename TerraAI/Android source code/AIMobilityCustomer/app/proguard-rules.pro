# ─── aimobility ProGuard Rules (AWS Amplify stack — no Firebase) ──────────────

# Keep line numbers for crash stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ─── aimobility Application Classes ──────────────────────────────────────────
-keep class com.terraai.aimobility.** { *; }
-keepclassmembers class com.terraai.aimobility.** { *; }

# ─── AWS Amplify + Cognito ────────────────────────────────────────────────────
-keep class com.amplifyframework.** { *; }
-keep class com.amazonaws.** { *; }
-dontwarn com.amplifyframework.**
-dontwarn com.amazonaws.**
-keep class com.amazon.** { *; }
-dontwarn com.amazon.**

# ─── Retrofit + OkHttp ───────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# ─── Gson / JSON Models ───────────────────────────────────────────────────────
-keep class com.google.gson.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}

# ─── Glide (image loading) ────────────────────────────────────────────────────
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** {
  **[] $VALUES;
  public *;
}
-dontwarn com.bumptech.glide.**

# ─── Custom Activity On Crash ────────────────────────────────────────────────
-keep class cat.ereza.customactivityoncrash.** { *; }
-dontwarn cat.ereza.**

# ─── Android Support / AndroidX ──────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ─── Google Maps (still used for ride tracking UI) ───────────────────────────
-keep class com.google.android.gms.maps.** { *; }
-keep class com.google.android.gms.location.** { *; }
-dontwarn com.google.android.gms.**

# ─── Jackson ──────────────────────────────────────────────────────────────────
-keep class com.fasterxml.jackson.** { *; }
-dontwarn com.fasterxml.jackson.**

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

# ─── REMOVED (Firebase / Fresco / GeoFire / PaperDB) ─────────────────────────
# These SDKs have been replaced by AWS Amplify + Glide + SharedPreferences
