package com.smartpark.ai;

import com.smartpark.ai.ds.*;
import com.smartpark.ai.dto.ParkingSlotDTO;
import com.smartpark.ai.dto.ReportsDTO;
import com.smartpark.ai.entity.*;
import com.smartpark.ai.repository.*;
import com.smartpark.ai.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SmartparkBackendApplicationTests {

    // Mock Repositories
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private ParkingZoneRepository parkingZoneRepository;
    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private QrPassRepository qrPassRepository;
    @Mock private EntryLogRepository entryLogRepository;
    @Mock private BookingRepository bookingRepository;
    @Mock private ParkingLotRepository parkingLotRepository;
    @Mock private PaymentRepository paymentRepository;

    // Mock Services
    @Mock private ParkingSlotService parkingSlotService;
    @Mock private AuditLogService mockAuditLogService;
    @Mock private NotificationService notificationService;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private ParkingQueueManager queueManager;

    // Inject Services Under Test
    @InjectMocks private AuditLogService auditLogService;
    @InjectMocks private RecommendationService recommendationService;
    @InjectMocks private QrPassService qrPassService;
    @InjectMocks private ReportsService reportsService;

    // Test Data
    private User adminUser;
    private User regularUser1;
    private User regularUser2;
    private Vehicle vehicle;
    private ParkingLot lot;
    private ParkingZone zone;
    private ParkingSlot slot;
    private Booking booking;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        adminUser = User.builder()
                .id(1L)
                .firstName("Admin")
                .lastName("User")
                .email("admin@test.com")
                .role(User.Role.ADMIN)
                .build();

        regularUser1 = User.builder()
                .id(2L)
                .firstName("User")
                .lastName("One")
                .email("user1@test.com")
                .role(User.Role.USER)
                .build();

        regularUser2 = User.builder()
                .id(3L)
                .firstName("User")
                .lastName("Two")
                .email("user2@test.com")
                .role(User.Role.USER)
                .build();

        vehicle = Vehicle.builder()
                .id(1L)
                .vehicleNumber("TX-12345")
                .user(regularUser1)
                .build();

        lot = ParkingLot.builder()
                .id(1L)
                .name("Main Plaza")
                .address("123 Main St")
                .totalSlots(10)
                .availableSlots(10)
                .build();

        zone = ParkingZone.builder()
                .id(1L)
                .name("Zone A")
                .zoneType(ParkingZone.ZoneType.REGULAR)
                .pricePerHour(new BigDecimal("5.00"))
                .distanceFromEntrance(30.0)
                .parkingLot(lot)
                .build();

        slot = ParkingSlot.builder()
                .id(1L)
                .slotNumber("A-01")
                .slotType(ParkingSlot.SlotType.REGULAR)
                .status(ParkingSlot.SlotStatus.AVAILABLE)
                .parkingZone(zone)
                .build();

        booking = Booking.builder()
                .id(1L)
                .bookingReference("REF123")
                .bookingDate(LocalDateTime.now())
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusHours(2))
                .status(Booking.BookingStatus.PENDING)
                .user(regularUser1)
                .vehicle(vehicle)
                .slot(slot)
                .build();
    }

    // --- Custom Data Structures Unit Tests ---

    @Test
    void testQueueWaitingList() {
        QueueWaitingList queue = new QueueWaitingList();
        assertTrue(queue.isEmpty());

        Booking b1 = Booking.builder().id(101L).user(regularUser1).vehicle(vehicle).bookingDate(LocalDateTime.now()).build();
        Booking b2 = Booking.builder().id(102L).user(regularUser2).vehicle(vehicle).bookingDate(LocalDateTime.now()).build();

        queue.enqueue(b1);
        queue.enqueue(b2);
        assertEquals(2, queue.size());

        assertEquals(b1, queue.peek());
        assertEquals(b1, queue.dequeue());
        assertEquals(1, queue.size());
        assertEquals(b2, queue.dequeue());
        assertTrue(queue.isEmpty());
    }

    @Test
    void testPriorityQueueVip() {
        PriorityQueueVip pq = new PriorityQueueVip();
        assertTrue(pq.isEmpty());

        LocalDateTime now = LocalDateTime.now();
        Booking regularBooking = Booking.builder()
                .id(101L)
                .user(regularUser1)
                .bookingDate(now.minusHours(1))
                .build();

        Booking vipBooking = Booking.builder()
                .id(102L)
                .user(adminUser)
                .bookingDate(now)
                .build();

        pq.enqueue(regularBooking);
        pq.enqueue(vipBooking);

        assertEquals(2, pq.size());

        // VIP booking must be dequeued first despite being later in time
        assertEquals(vipBooking, pq.dequeue());
        assertEquals(regularBooking, pq.dequeue());
        assertTrue(pq.isEmpty());
    }

    @Test
    void testSlotLookupCache() {
        SlotLookupCache cache = new SlotLookupCache();
        assertEquals(0, cache.size());

        cache.put(50L, ParkingSlot.SlotStatus.AVAILABLE);
        cache.put(51L, ParkingSlot.SlotStatus.OCCUPIED);

        assertTrue(cache.isAvailable(50L));
        assertFalse(cache.isAvailable(51L));
        assertEquals(ParkingSlot.SlotStatus.OCCUPIED, cache.get(51L));

        cache.remove(50L);
        assertNull(cache.get(50L));
    }

    @Test
    void testTreeMapDateSorting() {
        LocalDateTime t1 = LocalDateTime.of(2026, 6, 12, 10, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 6, 12, 11, 0);
        LocalDateTime t3 = LocalDateTime.of(2026, 6, 12, 9, 0);

        Booking b1 = Booking.builder().id(1L).startTime(t1).build();
        Booking b2 = Booking.builder().id(2L).startTime(t2).build();
        Booking b3 = Booking.builder().id(3L).startTime(t3).build();

        List<Booking> bookings = Arrays.asList(b1, b2, b3);
        TreeMap<LocalDateTime, List<Booking>> sortedHistory = DateSortedBookingHistory.getSortedHistory(bookings);

        List<Booking> sortedList = DateSortedBookingHistory.flatten(sortedHistory);
        assertEquals(3, sortedList.size());
        assertEquals(b2, sortedList.get(0)); // 11:00
        assertEquals(b1, sortedList.get(1)); // 10:00
        assertEquals(b3, sortedList.get(2)); // 9:00
    }

    // --- Service Level Mocks & Integration Unit Tests ---

    @Test
    void testAuditLogService() {
        // Assert that audit log gets saved correctly
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(i -> i.getArguments()[0]);
        auditLogService.logAction("TEST_ACTION", "TestEntity", 99L, "tester@test.com");
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testRecommendationService() {
        // Mock recommendation data
        when(parkingZoneRepository.findByParkingLotId(1L)).thenReturn(Collections.singletonList(zone));
        when(parkingSlotRepository.findByParkingZoneId(1L)).thenReturn(Collections.singletonList(slot));
        
        ParkingSlotDTO dto = ParkingSlotDTO.builder()
                .id(1L)
                .slotNumber("A-01")
                .slotType("REGULAR")
                .status("AVAILABLE")
                .parkingZoneId(1L)
                .build();
        when(parkingSlotService.mapToDTO(slot)).thenReturn(dto);

        List<ParkingSlotDTO> recs = recommendationService.recommendSlots(1L, "REGULAR");
        assertFalse(recs.isEmpty());
        assertEquals(1, recs.size());
        assertEquals("A-01", recs.get(0).getSlotNumber());
    }

    @Test
    void testQrPassService_GeneratePass() {
        when(qrPassRepository.save(any(QrPass.class))).thenAnswer(i -> {
            QrPass p = (QrPass) i.getArguments()[0];
            p.setId(10L);
            return p;
        });

        QrPass generated = qrPassService.generatePass(booking);
        assertNotNull(generated);
        assertEquals(10L, generated.getId());
        assertTrue(generated.getIsActive());
        assertTrue(generated.getPassToken().startsWith("QRP-REF123-"));
        verify(qrPassRepository, times(1)).save(any(QrPass.class));
    }

    @Test
    void testQrPassService_ScanEntrance() {
        // Set booking to ACTIVE (which is paid)
        booking.setStatus(Booking.BookingStatus.ACTIVE);
        
        QrPass pass = QrPass.builder()
                .id(1L)
                .passToken("QRP-TOKEN")
                .isActive(true)
                .booking(booking)
                .build();

        when(qrPassRepository.findByPassToken("QRP-TOKEN")).thenReturn(Optional.of(pass));
        when(entryLogRepository.findByQrPassId(1L)).thenReturn(new ArrayList<>());
        when(entryLogRepository.save(any(EntryLog.class))).thenAnswer(i -> i.getArguments()[0]);
        when(parkingSlotRepository.save(any(ParkingSlot.class))).thenAnswer(i -> i.getArguments()[0]);

        String result = qrPassService.scanPass("QRP-TOKEN");
        assertTrue(result.startsWith("ENTRANCE_SUCCESS:"));
        assertEquals(ParkingSlot.SlotStatus.OCCUPIED, slot.getStatus());
        verify(entryLogRepository, times(1)).save(any(EntryLog.class));
    }

    @Test
    void testQrPassService_ScanExit() {
        // Set booking to ACTIVE
        booking.setStatus(Booking.BookingStatus.ACTIVE);
        
        QrPass pass = QrPass.builder()
                .id(1L)
                .passToken("QRP-TOKEN")
                .isActive(true)
                .booking(booking)
                .build();

        EntryLog activeLog = EntryLog.builder()
                .id(100L)
                .entryTime(LocalDateTime.now().minusHours(2))
                .qrPass(pass)
                .build();

        when(qrPassRepository.findByPassToken("QRP-TOKEN")).thenReturn(Optional.of(pass));
        when(entryLogRepository.findByQrPassId(1L)).thenReturn(Collections.singletonList(activeLog));
        when(entryLogRepository.save(any(EntryLog.class))).thenAnswer(i -> i.getArguments()[0]);
        when(qrPassRepository.save(any(QrPass.class))).thenAnswer(i -> i.getArguments()[0]);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArguments()[0]);
        when(parkingSlotRepository.save(any(ParkingSlot.class))).thenAnswer(i -> i.getArguments()[0]);
        when(parkingLotRepository.save(any(ParkingLot.class))).thenAnswer(i -> i.getArguments()[0]);

        String result = qrPassService.scanPass("QRP-TOKEN");
        assertTrue(result.startsWith("EXIT_SUCCESS:"));
        assertFalse(pass.getIsActive());
        assertEquals(Booking.BookingStatus.COMPLETED, booking.getStatus());
        assertEquals(ParkingSlot.SlotStatus.AVAILABLE, slot.getStatus());
        assertNotNull(activeLog.getExitTime());
    }

    @Test
    void testReportsService_GenerateReport() {
        // Create Mock Bookings & Payments
        Booking b1 = Booking.builder()
                .id(1L)
                .bookingDate(LocalDateTime.now().minusDays(1))
                .status(Booking.BookingStatus.COMPLETED)
                .build();
        Booking b2 = Booking.builder()
                .id(2L)
                .bookingDate(LocalDateTime.now().minusDays(2))
                .status(Booking.BookingStatus.CANCELLED)
                .build();

        Payment p1 = Payment.builder()
                .id(1L)
                .amount(new BigDecimal("15.50"))
                .paymentMethod(Payment.PaymentMethod.CARD)
                .paymentStatus(Payment.PaymentStatus.COMPLETED)
                .booking(b1)
                .build();

        when(bookingRepository.findByBookingDateAfter(any(LocalDateTime.class))).thenReturn(Arrays.asList(b1, b2));
        when(paymentRepository.findByBookingIdInAndPaymentStatus(any(List.class), any(Payment.PaymentStatus.class)))
                .thenReturn(Collections.singletonList(p1));
        when(parkingSlotRepository.findAll()).thenReturn(Collections.singletonList(slot));

        ReportsDTO report = reportsService.generateReport("weekly");
        assertNotNull(report);
        assertEquals("WEEKLY", report.getPeriod());
        assertEquals(2L, report.getTotalBookings());
        assertEquals(1L, report.getCompletedBookings());
        assertEquals(1L, report.getCancelledBookings());
        assertEquals(new BigDecimal("15.50"), report.getTotalRevenue());
    }
}
