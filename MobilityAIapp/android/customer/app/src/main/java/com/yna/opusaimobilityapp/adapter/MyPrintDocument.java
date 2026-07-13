package com.yna.opusaimobilityapp.adapter;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.pdf.PrintedPdfDocument;
import android.widget.Toast;

import androidx.annotation.RequiresApi;


import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

@RequiresApi(api = Build.VERSION_CODES.KITKAT)
public class MyPrintDocument extends PrintDocumentAdapter {
    public android.graphics.pdf.PdfDocument myPdfDocument;
    Context context;
    String filename;
    String path;

    public MyPrintDocument(Context context, String dest, String filename) {
        this.context = context;
        this.path = dest;
        this.filename = filename;
    }


    @RequiresApi(api = Build.VERSION_CODES.KITKAT)
    @Override
    public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes, CancellationSignal cancellationSignal,
                         LayoutResultCallback callback,
                         Bundle metadata) {

        myPdfDocument = new PrintedPdfDocument(context, newAttributes);

        if (cancellationSignal.isCanceled()) {
            callback.onLayoutCancelled();
            return;
        } else {
            PrintDocumentInfo.Builder builder = new PrintDocumentInfo.Builder(filename);
            builder.setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT).setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN).build();
            callback.onLayoutFinished(builder.build(), !newAttributes.equals(oldAttributes));
        }
    }

    @Override
    public void onWrite(final PageRange[] pageRanges,
                        final ParcelFileDescriptor destination,
                        final CancellationSignal
                                cancellationSignal,
                        final WriteResultCallback callback) {

        InputStream in = null;
        OutputStream out = null;
        try {
            File file = new File(path);
            in = new FileInputStream(file);
            out = new FileOutputStream(destination.getFileDescriptor());
            byte[] buff = new byte[16384];
            int size;
            while ((size = in.read(buff)) >= 0 && !cancellationSignal.isCanceled()) {
                out.write(buff, 0, size);
            }
            if (cancellationSignal.isCanceled())
                callback.onWriteCancelled();
            else
                callback.onWriteFinished(new PageRange[]{PageRange.ALL_PAGES});
        } catch (Exception e) {
            callback.onWriteFailed(e.getMessage());
            e.printStackTrace();
        } finally {
            try {
                in.close();
                out.close();
            } catch (IOException ex) {
                ex.printStackTrace();
                Toast.makeText(context, "ex : "+ex.toString(), Toast.LENGTH_SHORT).show();
            }
        }
    }
}
