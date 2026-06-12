package com.smartpark.ai.ds;

import com.smartpark.ai.entity.Booking;
import com.smartpark.ai.entity.User;
import java.util.PriorityQueue;

public class PriorityQueueVip {
    
    private final PriorityQueue<Booking> pq = new PriorityQueue<>((b1, b2) -> {
        boolean b1Admin = b1.getUser().getRole() == User.Role.ADMIN;
        boolean b2Admin = b2.getUser().getRole() == User.Role.ADMIN;
        
        if (b1Admin && !b2Admin) return -1;
        if (!b1Admin && b2Admin) return 1;
        
        return b1.getBookingDate().compareTo(b2.getBookingDate());
    });

    public synchronized void enqueue(Booking booking) {
        pq.add(booking);
    }

    public synchronized Booking dequeue() {
        return pq.poll();
    }

    public synchronized Booking peek() {
        return pq.peek();
    }

    public synchronized boolean isEmpty() {
        return pq.isEmpty();
    }

    public synchronized int size() {
        return pq.size();
    }

    public synchronized boolean remove(Booking booking) {
        return pq.remove(booking);
    }

    public synchronized void clear() {
        pq.clear();
    }
}
