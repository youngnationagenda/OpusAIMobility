# OpusAIMobility Driver App — ProGuard Rules

# AWS Amplify
-keep class com.amplifyframework.** { *; }
-dontwarn com.amplifyframework.**

# AWS Android SDK
-keep class com.amazonaws.** { *; }
-dontwarn com.amazonaws.**

# Retrofit / OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions

# Gson
-keepattributes *Annotation*
-keep class com.google.gson.** { *; }
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# App models (keep for Gson deserialisation)
-keep class com.opusaimobility.driver.model.** { *; }

# Google Maps
-keep class com.google.android.gms.maps.** { *; }
-dontwarn com.google.android.gms.**

# Firebase
-keep class com.google.firebase.** { *; }
-dontwarn com.google.firebase.**

# WebSocket
-keep class com.neovisionaries.ws.** { *; }
-dontwarn com.neovisionaries.ws.**

# Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
-keep public enum com.bumptech.glide.load.ImageHeaderParser$** { **[] $VALUES; public *; }

# PaperDB
-keep class io.paperdb.** { *; }
-dontwarn io.paperdb.**

# Crash reporter
-keep class cat.ereza.customactivityoncrash.** { *; }

# Keep BuildConfig
-keep class com.opusaimobility.driver.BuildConfig { *; }

# Kotlin (if any)
-dontwarn kotlin.**
-keep class kotlin.** { *; }
