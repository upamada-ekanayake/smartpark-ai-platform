# Smart Parking Platform - Enhanced Data Structures & Time Complexities

This document outlines the computer science data structures utilized within the **Smart Parking Platform** to ensure high-performance in-memory search, prioritization, and log sorting under heavy loads.

---

## 1. Queue for Waiting List Management
- **Implementation**: `com.smartpark.ai.ds.QueueWaitingList` wraps a thread-safe `ConcurrentLinkedQueue` of bookings waiting for slots.
- **Use Case**: FCFS (First-Come, First-Served) waiting queue when a parking lot reaches capacity (available slots = 0).
- **Time & Space Complexity**:

| Operation | Average Case | Worst Case | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| **Enqueue** (`add`) | $O(1)$ | $O(1)$ | $O(N)$ | Constant-time tail insertion. |
| **Dequeue** (`poll`) | $O(1)$ | $O(1)$ | $O(1)$ | Constant-time head retrieval and node linking. |
| **Search/Remove** | $O(N)$ | $O(N)$ | $O(1)$ | Linear-scan traversal to find a booking to remove if cancelled. |

---

## 2. Priority Queue for VIP Parking Requests
- **Implementation**: `com.smartpark.ai.ds.PriorityQueueVip` wraps a synchronized `PriorityQueue` with a custom `Comparator`.
- **Use Case**: Prioritizes waiting bookings based on the user's role (Admin/VIP role gets absolute priority over standard users). When a slot becomes available, the VIP queue is polled first.
- **Time & Space Complexity**:

| Operation | Average Case | Worst Case | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| **Enqueue** (`add`) | $O(\log N)$ | $O(\log N)$ | $O(N)$ | Requires bubble-up tree balancing in the binary heap structure. |
| **Dequeue** (`poll`) | $O(\log N)$ | $O(\log N)$ | $O(1)$ | Requires bubble-down tree balancing to restore heap properties. |
| **Peek** (`peek`) | $O(1)$ | $O(1)$ | $O(1)$ | Immediate access to root element. |

---

## 3. HashMap for Fast Slot Lookup
- **Implementation**: `com.smartpark.ai.ds.SlotLookupCache` wraps a `ConcurrentHashMap` mapping a slot ID (Long) to its active availability status.
- **Use Case**: $O(1)$ status lookup for booking eligibility checks, skipping costly database query paths.
- **Time & Space Complexity**:

| Operation | Average Case | Worst Case | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| **Put** (`put`) | $O(1)$ | $O(N)$ | $O(N)$ | Constant hash index write, degrading to linear scan only in hash collisions. |
| **Get** (`get`) | $O(1)$ | $O(N)$ | $O(1)$ | Direct hash lookup indexing. |
| **Remove** (`remove`) | $O(1)$ | $O(N)$ | $O(1)$ | Constant-time bucket removal. |

---

## 4. TreeMap for Date-Sorted Booking History
- **Implementation**: `com.smartpark.ai.ds.DateSortedBookingHistory` utilizes a `TreeMap<LocalDateTime, List<Booking>>` to group and sort booking lists chronologically.
- **Use Case**: Orders user reservation logs by start time.
- **Time & Space Complexity**:

| Operation | Average Case | Worst Case | Space Complexity | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| **Insert** (`put`) | $O(\log N)$ | $O(\log N)$ | $O(N)$ | Operates on Red-Black self-balancing BST tree heights. |
| **Search** (`get`) | $O(\log N)$ | $O(\log N)$ | $O(1)$ | Binary search tree traversal. |
| **Range Query** | $O(\log N + K)$ | $O(\log N + K)$ | $O(K)$ | Finds the start node in $O(\log N)$ and walks $K$ sequential values. |
