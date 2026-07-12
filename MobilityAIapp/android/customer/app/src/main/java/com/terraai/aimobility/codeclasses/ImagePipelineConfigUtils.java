package com.terraai.aimobility.codeclasses;

import android.content.Context;

/**
 * ImagePipelineConfigUtils — previously configured Fresco image pipeline.
 *
 * MIGRATION: Fresco removed. Image loading now uses Glide.
 * This class is kept as a no-op stub so existing call sites compile cleanly.
 * All image loading is done via Functions.loadImage() which now uses Glide.
 */
public class ImagePipelineConfigUtils {

    /**
     * No-op stub. Previously returned a Fresco ImagePipelineConfig.
     * Glide handles its own config automatically via AppGlideModule.
     */
    public static Object getDefaultImagePipelineConfig(Context context) {
        return null; // Glide needs no explicit pipeline config
    }
}
