package com.terraai.aimobility.codeclasses;

import android.util.Log;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class DateOperations {

    public static String showMessageTime(String date) {
        Date d = null;
        try {
            DateFormat df = new SimpleDateFormat(Variables.df1Pattern, Locale.ENGLISH);
            d = df.parse(date);
            SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.ENGLISH);
            date = sdf.format(d);
        } catch (ParseException e) {
            Functions.logDMsg("showMessageTime exception : " + e.toString());
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        if (date != null) {
            return date;
        } else {
            return "null";
        }
    }

    // change the date into (today ,yesterday and date)
    public static String changeDate(String date) {

        Calendar cal = Calendar.getInstance();
        Functions.todayDay = cal.get(Calendar.DAY_OF_MONTH);

        //current date in millisecond
        long currenttime = System.currentTimeMillis();

        //database date in millisecond
        long databasedate = 0;
        Date d = null;
        try {
            DateFormat df = new SimpleDateFormat(Variables.df1Pattern, Locale.ENGLISH);
            d = df.parse(date);

            SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd-MM-yyyy HH:mm:ssZZ", Locale.ENGLISH);
            date = simpleDateFormat.format(d);
            databasedate = d.getTime();

        } catch (ParseException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }
        long difference = currenttime - databasedate;
        if (difference < 86400000) {
            int chatday = Integer.parseInt(date.substring(0, 2));
            if (Functions.todayDay == chatday)
                return "Today";
            else if ((Functions.todayDay - chatday) == 1)
                return "Yesterday";
        } else if (difference < 172800000) {
            int chatday = Integer.parseInt(date.substring(0, 2));
            if ((Functions.todayDay - chatday) == 1)
                return "Yesterday";
        }

        SimpleDateFormat sdf = new SimpleDateFormat("MMM-dd", Locale.ENGLISH);

        if (d != null)
            return sdf.format(d);
        else
            return "";
    }

    public static String calculateTime(String pickupDatetime, String destinationDatetime, boolean history) {
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.ENGLISH);
        long difference = 0;
        try {
            Date date1 = format.parse(pickupDatetime);
            Date date2 = format.parse(destinationDatetime);
            difference = date2.getTime() - date1.getTime();
        } catch (ParseException e) {
            Functions.logDMsg("exception at calculateTime :" + e.toString());
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
        }

        String totalTime = formatDuration(difference, history);

        return totalTime;
    }

    private static String formatDuration(long duration, boolean history) {
        long hours = TimeUnit.MILLISECONDS.toHours(duration);

        long minutes = TimeUnit.MILLISECONDS.toMinutes(duration) % 60;
        Functions.logDMsg("date duration duration : " + duration);
        if (history) {
            if (hours != 0) {
                return String.valueOf(hours + " hour" + " " + minutes + " min");
            } else {
                return String.valueOf(minutes + " min");
            }
        } else {
            if (hours != 0) {
                return String.valueOf(hours + " hour" + " " + minutes + " min");
            } else {
                return String.valueOf(minutes);
            }
        }
    }

    //This method will change the date format
    public static String changeDateFormat(String fromFormat, String toFormat, String date) {

        SimpleDateFormat dateFormat = new SimpleDateFormat(fromFormat, Locale.ENGLISH);
        Date sourceDate = null;

        try {
            sourceDate = dateFormat.parse(date);

            SimpleDateFormat targetFormat = new SimpleDateFormat(toFormat, Locale.ENGLISH);

            return targetFormat.format(sourceDate);

        } catch (ParseException e) {
            Log.e("aimobility", e.getMessage() != null ? e.getMessage() : e.toString(), e);
            Functions.logDMsg("e at date : " + e.toString());
            return "";
        }
    }


    public static String getDate(long milliSeconds, String dateFormat)
    {
        // Create a DateFormatter object for displaying date in specified format.
        SimpleDateFormat formatter = new SimpleDateFormat(dateFormat);

        // Create a calendar object that will convert the date and time value in milliseconds to date.
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(milliSeconds);
        return formatter.format(calendar.getTime());
    }
}
