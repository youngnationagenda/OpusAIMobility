package com.terraai.aimobility.codeclasses;

import android.graphics.Rect;
import android.view.View;

import androidx.recyclerview.widget.RecyclerView;

public class SpacesItemDecorationBottom extends RecyclerView.ItemDecoration {

    private final int space;

    public SpacesItemDecorationBottom(int space) {
        this.space = space;
    }

    @Override
    public void getItemOffsets(Rect outRect, View view, RecyclerView parent, RecyclerView.State state) {
        int position = parent.getChildAdapterPosition(view);
        boolean isLast = position == state.getItemCount() - 1;
        if (isLast) {
            outRect.bottom = space;
        }
    }
}
