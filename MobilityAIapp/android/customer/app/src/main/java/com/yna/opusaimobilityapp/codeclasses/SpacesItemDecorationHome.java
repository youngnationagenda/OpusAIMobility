package com.yna.opusaimobilityapp.codeclasses;

import android.graphics.Rect;
import android.view.View;

import androidx.recyclerview.widget.RecyclerView;

public class SpacesItemDecorationHome extends RecyclerView.ItemDecoration {

    private final int space;

    public SpacesItemDecorationHome(int space) {
        this.space = space;
    }

    @Override
    public void getItemOffsets(Rect outRect, View view, RecyclerView parent, RecyclerView.State state) {
        int position = parent.getChildAdapterPosition(view);
        boolean isLast = position == state.getItemCount() - 1;
        if (isLast) {
            outRect.right = space;

        }
        if(position == 0){
            outRect.left = space;
        }
    }
}
