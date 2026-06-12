package com.smartpark.ai.ds;

import com.smartpark.ai.entity.ParkingSlot;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class SlotLookupCache {
    private final Map<Long, ParkingSlot.SlotStatus> cache = new ConcurrentHashMap<>();

    public void put(Long slotId, ParkingSlot.SlotStatus status) {
        if (slotId != null && status != null) {
            cache.put(slotId, status);
        }
    }

    public ParkingSlot.SlotStatus get(Long slotId) {
        return slotId == null ? null : cache.get(slotId);
    }

    public boolean isAvailable(Long slotId) {
        return ParkingSlot.SlotStatus.AVAILABLE.equals(get(slotId));
    }

    public void remove(Long slotId) {
        if (slotId != null) {
            cache.remove(slotId);
        }
    }

    public void clear() {
        cache.clear();
    }

    public int size() {
        return cache.size();
    }
}
