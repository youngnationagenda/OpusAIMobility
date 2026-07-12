package com.terraai.aimobility.codeclasses;

import android.content.Context;
import android.text.Editable;
import android.text.InputFilter;
import android.text.InputType;
import android.text.Spanned;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.text.method.NumberKeyListener;
import android.util.AttributeSet;

import androidx.annotation.NonNull;
import androidx.appcompat.widget.AppCompatEditText;

import com.terraai.aimobility.Interface.CreditCardNumberListener;

import java.util.ArrayList;

public class CreditCardNumberEditText extends AppCompatEditText {

    private static final char SEPARATOR = ' ';
    private static final String EMPTY = "";
    private ArrayList<CreditCardNumberListener> listeners;

    public CreditCardNumberEditText(Context context) {
        super(context);
        init();
    }

    public CreditCardNumberEditText(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public CreditCardNumberEditText(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    @Override
    public final void setInputType(int type) {
        super.setInputType(InputType.TYPE_NULL);
    }

    @Override
    public final void setRawInputType(int type) {
        super.setRawInputType(InputType.TYPE_CLASS_NUMBER);
    }

    private void init() {
        super.setInputType(InputType.TYPE_NULL);
        super.setRawInputType(InputType.TYPE_CLASS_NUMBER);
        final InputFilter[] filters = {new CreditCardNumberKeyListener()};
        setFilters(filters);

        addTextChangedListener(textWatcher);
    }


    public void addNumberListener(CreditCardNumberListener listener) {
        if (listeners == null) {
            listeners = new ArrayList<>();
        }
        listeners.add(listener);
    }



    private final TextWatcher textWatcher = new TextWatcher() {

        private String beforeText;
        private int beforeSelectionStart;
        private int beforeSelectionEnd;

        @Override
        public void beforeTextChanged(CharSequence s, int start, int count, int after) {
            beforeText = s.toString();
            beforeSelectionStart = getSelectionStart();
            beforeSelectionEnd = getSelectionEnd();
        }

        @Override
        public void onTextChanged(CharSequence s, int start, int before, int count) {
            // noop
        }

        @Override
        public void afterTextChanged(Editable s) {
            final String beforeCardNumber = removeSeparators(beforeText);
            final int beforeRawLength = beforeText.length();

            final String afterCardNumber = removeSeparators(s.toString());
            final StringBuilder afterRawText = new StringBuilder(s);

            boolean noSelection = beforeSelectionStart == beforeSelectionEnd;
            boolean deleteKeyEntered = noSelection
                    && beforeSelectionStart > 1
                    && getSelectionStart() == beforeSelectionStart - 1
                    && getSelectionStart() == getSelectionEnd();

            boolean separatorDeleted = deleteKeyEntered
                    && beforeSelectionStart < beforeRawLength
                    && equalsChatAt(beforeText, beforeSelectionStart - 1, SEPARATOR);

            if (separatorDeleted) {
                if (!equalsChatAt(beforeText, beforeSelectionStart, SEPARATOR)) {
                    afterRawText.deleteCharAt(getSelectionStart() - 1);
                }
            }

            final CreditCardBrand brand = CreditCardBrand.getBrand(afterCardNumber);
            removeSeparators(afterRawText, 0);
            insertSeparator(afterRawText, brand, 0);

            if (!TextUtils.equals(s, afterRawText)) {
                s.replace(0, s.length(), afterRawText.toString());
                StringBuilder beforeRawText = new StringBuilder(beforeText);
                int selectionIndex = separatorDeleted ? beforeSelectionStart - 1 : beforeSelectionStart;
                selectionIndex = removeSeparators(beforeRawText, selectionIndex);
                selectionIndex = insertSeparator(beforeRawText, brand, selectionIndex);
                selectionIndex = Math.min(selectionIndex, brand.getMaxLength() + brand.getSeparatorCount());
                setSelection(selectionIndex);
            } else {
                sendNumberChanged(afterCardNumber, brand);
            }
        }

        private void sendNumberChanged(String number, CreditCardBrand brand) {
            if (listeners != null) {
                final ArrayList<CreditCardNumberListener> list = listeners;
                final int count = list.size();
                for (int i = 0; i < count; i++) {
                    list.get(i).onChanged(number, brand);
                }
            }
        }
    };

    private static class CreditCardNumberKeyListener extends NumberKeyListener {
        private final char[] accepted = {'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', SEPARATOR};

        @NonNull
        @Override
        protected char[] getAcceptedChars() {
            return accepted;
        }

        @Override
        public CharSequence filter(CharSequence source, int start, int end, Spanned dest, int dstart, int dend) {

            // 入力文字（数字かどうか）をチェック
            final CharSequence out = super.filter(source, start, end, dest, dstart, dend);

            if (TextUtils.equals(out, EMPTY)) {
                return EMPTY;
            }

            if (out != null) {
                source = out;
                start = 0;
                end = source.length();
            }


            final String tempRawText = new StringBuilder(dest)
                    .replace(dstart, dend, source.subSequence(start, end).toString())
                    .toString();
            final String tempCardNumber = removeSeparators(tempRawText);
            final CreditCardBrand tempBrand = CreditCardBrand.getBrand(tempCardNumber);

            final StringBuilder sourceBuf = new StringBuilder(source.subSequence(start, end));
            for (int i = end - 1; i >= start; --i) {
                if (sourceBuf.charAt(i) == SEPARATOR) {
                    int index = i + dstart;
                    if (!tempBrand.isSeparatorPosition(index)) {
                        sourceBuf.deleteCharAt(i);
                    }
                }
            }
            if (!TextUtils.equals(source, sourceBuf)) {
                source = sourceBuf;
                start = 0;
                end = source.length();
            }

            final int maxLength = tempBrand.getMaxLength() + tempBrand.getSeparatorCount();
            final CharSequence lengthOut = lengthFilter(maxLength, source, start, end, dest, dstart, dend);
            return lengthOut == null ? source : lengthOut;
        }

        private static CharSequence lengthFilter(int maxLength, CharSequence source, int start, int end, Spanned dest, int dstart, int dend) {
            int keep = maxLength - (dest.length() - (dend - dstart));
            if (keep <= 0) {
                return EMPTY;
            } else if (keep >= end - start) {
                return null; // keep original
            } else {
                keep += start;
                if (Character.isHighSurrogate(source.charAt(keep - 1))) {
                    --keep;
                    if (keep == start) {
                        return EMPTY;
                    }
                }
                return source.subSequence(start, keep);
            }
        }

        @Override
        public int getInputType() {
            return InputType.TYPE_CLASS_NUMBER;
        }
    }

    @NonNull
    public CreditCardBrand getBrand() {
        return CreditCardBrand.getBrand(getNumber());
    }


    @NonNull
    public String getNumber() {
        final Editable text = getText();
        return removeSeparators(text == null ? "" : text.toString());
    }


    @NonNull
    private static String removeSeparators(String s) {
        return s.replace(String.valueOf(SEPARATOR), EMPTY);
    }


    private static int removeSeparators(StringBuilder sb, int selectionIndex) {
        int newSelection = selectionIndex;
        for (int i = sb.length() - 1; i >= 0; i--) {
            if (sb.charAt(i) == SEPARATOR) {
                sb.deleteCharAt(i);
                if (i < selectionIndex) {
                    --newSelection;
                }
            }
        }
        return newSelection;
    }


    private static int insertSeparator(StringBuilder sb, CreditCardBrand brand, int selectionIndex) {
        int newSelectionIndex = selectionIndex;
        final int[] format = brand.getFormat();
        int i = 0;
        for (int number : format) {
            i += number;
            if (sb.length() > i) {
                sb.insert(i, SEPARATOR);
                if (i <= newSelectionIndex) {
                    ++newSelectionIndex;
                }
            } else {
                break;
            }
            i++;
        }
        return newSelectionIndex;
    }

    private static boolean equalsChatAt(CharSequence s, int index, char c) {
        return index < s.length() && s.charAt(index) == c;
    }
}
