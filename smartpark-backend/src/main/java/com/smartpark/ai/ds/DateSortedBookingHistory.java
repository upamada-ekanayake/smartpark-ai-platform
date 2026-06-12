package com.smartpark.ai.ds;

import com.smartpark.ai.entity.Booking;
import java.time.LocalDateTime;
import java.util.*;

public class DateSortedBookingHistory {

    public static TreeMap<LocalDateTime, List<Booking>> getSortedHistory(Collection<Booking> bookings) {
        TreeMap<LocalDateTime, List<Booking>> sortedMap = new TreeMap<>(Comparator.reverseOrder()); // newest first
        
        for (Booking booking : bookings) {
            LocalDateTime key = booking.getStartTime();
            sortedMap.computeIfAbsent(key, k -> new ArrayList<>()).add(booking);
        }
        
        return sortedMap;
    }

    public static List<Booking> flatten(TreeMap<LocalDateTime, List<Booking>> sortedHistory) {
        List<Booking> list = new ArrayList<>();
        for (List<Booking> bookingsAtTime : sortedHistory.values()) {
            list.addAll(bookingsAtTime);
        }
        return list;
    }
}
