# ─── :pdf module consumer ProGuard rules ─────────────────────────────────────
# These rules are merged into the consuming module (:app) by AGP at release
# build time.  They protect iText7 and BouncyCastle from R8 shrinking since
# both libraries rely heavily on runtime reflection and SPI class loading.
# ─────────────────────────────────────────────────────────────────────────────

# ── iText7 ───────────────────────────────────────────────────────────────────
# iText7 resolves layout renderers, font programs, and PDF handlers by their
# fully-qualified class name at runtime — those classes must not be renamed.
-keep class com.itextpdf.** { *; }
-keepclassmembers class com.itextpdf.** { *; }
-dontwarn com.itextpdf.**

# iText7 uses SLF4J for logging (no implementation on Android — suppress only)
-dontwarn org.slf4j.**

# ── BouncyCastle (pinned to 1.70 via resolutionStrategy) ─────────────────────
# BC registers crypto algorithms by string name via the JCE Provider SPI.
# Every algorithm class must survive R8 or PDF signing/encryption will fail.
-keep class org.bouncycastle.** { *; }
-keepclassmembers class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**
-keep class org.bouncycastle.jce.provider.BouncyCastleProvider { *; }
-keep class org.bouncycastle.crypto.** { *; }
-keep class org.bouncycastle.asn1.** { *; }
-keep class org.bouncycastle.cert.** { *; }
-keep class org.bouncycastle.operator.** { *; }
