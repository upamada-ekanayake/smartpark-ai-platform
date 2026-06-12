package com.smartpark.ai.ds;

import com.smartpark.ai.entity.Booking;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

public class QueueWaitingList {
    private final Queue<Booking> queue = new ConcurrentLinkedQueue<>();

    public void enqueue(Booking booking) {
        queue.add(booking);
    }

    public Booking dequeue() {
        return queue.poll();
    }

    public Booking peek() {
        return queue.peek();
    }

    public boolean isEmpty() {
        return queue.isEmpty();
    }

    public int size() {
        return queue.size();
    }

    public boolean remove(Booking booking) {
        return queue.remove(booking);
    }

    public void clear() {
        queue.clear();
    }
}
