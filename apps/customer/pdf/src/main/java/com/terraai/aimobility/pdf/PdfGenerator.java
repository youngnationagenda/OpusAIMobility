package com.terraai.aimobility.pdf;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;

import java.io.File;
import java.io.IOException;

/**
 * Thin wrapper around iText7 for generating order-receipt PDFs.
 *
 * Usage (release builds only — module is not linked in debug):
 * <pre>
 *     PdfGenerator.create(outputFile, "Order #1234", "Total: $29.99");
 * </pre>
 */
public class PdfGenerator {

    private PdfGenerator() { /* static utility */ }

    /**
     * Creates a simple one-page PDF receipt at {@code destFile}.
     *
     * @param destFile  target file path — parent dirs must already exist
     * @param title     bold heading line (e.g. "Order Receipt #1234")
     * @param body      multi-line body text
     * @throws IOException if the file cannot be written
     */
    public static void create(@NonNull File destFile,
                               @NonNull String title,
                               @Nullable String body) throws IOException {
        try (PdfWriter writer = new PdfWriter(destFile);
             PdfDocument pdf = new PdfDocument(writer);
             Document doc = new Document(pdf)) {

            doc.add(new Paragraph(title).setBold().setFontSize(16f));
            if (body != null && !body.isEmpty()) {
                doc.add(new Paragraph(body).setFontSize(12f));
            }
        }
    }
}
