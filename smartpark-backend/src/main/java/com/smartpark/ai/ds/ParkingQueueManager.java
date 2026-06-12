package com.smartpark.ai.ds;

import com.smartpark.ai.entity.Booking;
import com.smartpark.ai.entity.ParkingSlot;
import com.smartpark.ai.entity.User;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ParkingQueueManager {

    private final Map<Long, QueueWaitingList> standardQueues = new ConcurrentHashMap<>();
    private final Map<Long, PriorityQueueVip> vipQueues = new ConcurrentHashMap<>();
    private final SlotLookupCache slotLookupCache = new SlotLookupCache();

    // Slot Cache Methods
    public void registerSlot(Long slotId, ParkingSlot.SlotStatus status) {
        slotLookupCache.put(slotId, status);
    }

    public void updateSlotStatus(Long slotId, ParkingSlot.SlotStatus status) {
        slotLookupCache.put(slotId, status);
    }

    public boolean isSlotAvailable(Long slotId) {
        return slotLookupCache.isAvailable(slotId);
    }

    public ParkingSlot.SlotStatus getSlotStatus(Long slotId) {
        return slotLookupCache.get(slotId);
    }

    // Queue Methods
    private QueueWaitingList getOrCreateStandardQueue(Long lotId) {
        return standardQueues.computeIfAbsent(lotId, id -> new QueueWaitingList());
    }

    private PriorityQueueVip getOrCreateVipQueue(Long lotId) {
        return vipQueues.computeIfAbsent(lotId, id -> new PriorityQueueVip());
    }

    public synchronized void enqueueRequest(Long lotId, Booking booking) {
        if (booking.getUser().getRole() == User.Role.ADMIN) {
            getOrCreateVipQueue(lotId).enqueue(booking);
        } else {
            getOrCreateStandardQueue(lotId).enqueue(booking);
        }
    }

    public synchronized Booking dequeueNextRequest(Long lotId) {
        PriorityQueueVip vipQueue = vipQueues.get(lotId);
        if (vipQueue != null && !vipQueue.isEmpty()) {
            return vipQueue.dequeue();
        }
        
        QueueWaitingList standardQueue = standardQueues.get(lotId);
        if (standardQueue != null && !standardQueue.isEmpty()) {
            return standardQueue.dequeue();
        }
        
        return null;
    }

    public synchronized boolean hasWaitingRequests(Long lotId) {
        PriorityQueueVip vipQueue = vipQueues.get(lotId);
        if (vipQueue != null && !vipQueue.isEmpty()) {
            return true;
        }
        QueueWaitingList standardQueue = standardQueues.get(lotId);
        return standardQueue != null && !standardQueue.isEmpty();
    }

    public synchronized int getWaitingCount(Long lotId) {
        int count = 0;
        PriorityQueueVip vipQueue = vipQueues.get(lotId);
        if (vipQueue != null) {
            count += vipQueue.size();
        }
        QueueWaitingList standardQueue = standardQueues.get(lotId);
        if (standardQueue != null) {
            count += standardQueue.size();
        }
        return count;
    }

    public synchronized boolean removeRequest(Long lotId, Booking booking) {
        boolean removed = false;
        PriorityQueueVip vipQueue = vipQueues.get(lotId);
        if (vipQueue != null) {
            removed = vipQueue.remove(booking);
        }
        if (!removed) {
            QueueWaitingList standardQueue = standardQueues.get(lotId);
            if (standardQueue != null) {
                removed = standardQueue.remove(booking);
            }
        }
        return removed;
    }

    public void clearAll() {
        standardQueues.clear();
        vipQueues.clear();
        slotLookupCache.clear();
    }
}
