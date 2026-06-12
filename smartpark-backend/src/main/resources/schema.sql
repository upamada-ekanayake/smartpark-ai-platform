-- Drop tables if they exist
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS entry_logs CASCADE;
DROP TABLE IF EXISTS qr_passes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS parking_slots CASCADE;
DROP TABLE IF EXISTS parking_zones CASCADE;
DROP TABLE IF EXISTS parking_lots CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Tables
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    vehicle_number VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type VARCHAR(30) NOT NULL,
    model VARCHAR(50),
    color VARCHAR(20),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE parking_lots (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    total_slots INT NOT NULL,
    available_slots INT NOT NULL,
    opening_time TIME NOT NULL,
    closing_time TIME NOT NULL
);

CREATE TABLE parking_zones (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    zone_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR', -- REGULAR, VIP, STAFF, ACCESSIBLE
    price_per_hour DECIMAL(10,2) NOT NULL DEFAULT 5.00,
    distance_from_entrance DECIMAL(10,2) NOT NULL DEFAULT 50.00,
    parking_lot_id BIGINT REFERENCES parking_lots(id) ON DELETE CASCADE
);

CREATE TABLE parking_slots (
    id BIGSERIAL PRIMARY KEY,
    slot_number VARCHAR(20) NOT NULL,
    slot_type VARCHAR(20) NOT NULL DEFAULT 'REGULAR',
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    parking_zone_id BIGINT REFERENCES parking_zones(id) ON DELETE CASCADE,
    UNIQUE (parking_zone_id, slot_number)
);

CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    booking_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id BIGINT REFERENCES vehicles(id) ON DELETE CASCADE,
    slot_id BIGINT REFERENCES parking_slots(id) ON DELETE SET NULL
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    booking_id BIGINT UNIQUE REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) NOT NULL DEFAULT 'INFO',
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qr_passes (
    id BIGSERIAL PRIMARY KEY,
    pass_token VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    booking_id BIGINT UNIQUE REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE entry_logs (
    id BIGSERIAL PRIMARY KEY,
    entry_time TIMESTAMP,
    exit_time TIMESTAMP,
    qr_pass_id BIGINT REFERENCES qr_passes(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id BIGINT,
    performed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_parking_slots_zone_status ON parking_slots(parking_zone_id, status);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_reference ON bookings(booking_reference);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
