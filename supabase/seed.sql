CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- Part A: Test User
-- ==========================================
INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token,
    email_change, email_change_token_new, recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(), now(), '', '', '', ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
VALUES (
    'test@example.com',
    '00000000-0000-0000-0000-000000000001',
    format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'test@example.com')::jsonb,
    'email', now(), now(), now()
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- ==========================================
-- Part B: Clear existing data
-- ==========================================
ALTER TABLE bookings DISABLE TRIGGER check_cancellation_window;

DELETE FROM reschedules;
DELETE FROM passengers;
DELETE FROM bookings;
DELETE FROM seats;
DELETE FROM flights;

ALTER TABLE bookings ENABLE TRIGGER check_cancellation_window;

-- ==========================================
-- Part C: Flights — May 23 → July 30, 2026
-- 4 Routes, 4 Slots, 3 Plane Types
-- ==========================================
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
WITH routes AS (
    -- Exactly 4 Indian Domestic Routes
    SELECT * FROM (VALUES 
        ('DEL', 'BOM'), 
        ('BOM', 'DEL'), 
        ('DEL', 'CCU'), 
        ('CCU', 'DEL')
    ) AS t(origin, destination)
),
days AS (
    -- 68 days from May 23 to July 30
    SELECT ('2026-05-23 00:00:00'::timestamp + (i * INTERVAL '1 day')) as base_date
    FROM generate_series(0, 68) i
),
slots AS (
    -- 4 Flights Daily, 3 Plane Types
    SELECT * FROM (VALUES
        ('M'::text, INTERVAL '6 hours'::interval, 'Airbus A320neo'::text),
        ('A'::text, INTERVAL '12 hours'::interval, 'Boeing 737-800'::text),
        ('E'::text, INTERVAL '18 hours'::interval, 'Airbus A321'::text),
        ('N'::text, INTERVAL '22 hours'::interval, 'Airbus A320neo'::text)
    ) AS t(slot_code, dep_offset, aircraft_type)
),
flight_data AS (
    SELECT
        r.origin,
        r.destination,
        (d.base_date + s.dep_offset) as departs_at,
        (d.base_date + s.dep_offset + INTERVAL '2.5 hours') as arrives_at, -- Domestic flight duration
        s.aircraft_type,
        floor(random() * 150 + 80)::int as base_price -- Cheaper domestic fares
    FROM routes r
    CROSS JOIN days d
    CROSS JOIN slots s
)
SELECT
    uuid_generate_v4() as id,
    'FL-' || f.origin || '-' || f.destination || '-' || LPAD(
        row_number() OVER (
            PARTITION BY f.origin, f.destination
            ORDER BY f.departs_at
        )::text,
        3, '0'
    ) as flight_no,
    f.origin,
    f.destination,
    f.departs_at,
    f.arrives_at,
    f.aircraft_type,
    'scheduled' as status,
    f.base_price
FROM flight_data f;

-- ==========================================
-- Part D: Seats — All flights generated in a single query
-- Scales dynamically based on the 3 plane types
-- ==========================================
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
WITH flight_config AS (
    SELECT 
        id as flight_id, 
        aircraft_type,
        CASE aircraft_type
            WHEN 'Airbus A320neo' THEN 28 
            WHEN 'Boeing 737-800' THEN 30
            WHEN 'Airbus A321' THEN 35 
        END as max_rows,
        CASE aircraft_type
            WHEN 'Airbus A320neo' THEN 3 
            WHEN 'Boeing 737-800' THEN 4 
            WHEN 'Airbus A321' THEN 5 
        END as first_class_limit,
        CASE aircraft_type
            WHEN 'Airbus A320neo' THEN 8 
            WHEN 'Boeing 737-800' THEN 10 
            WHEN 'Airbus A321' THEN 12 
        END as business_class_limit
    FROM flights
)
SELECT 
    fc.flight_id, 
    row_num || col AS seat_number,
    CASE 
        WHEN row_num <= fc.first_class_limit THEN 'first'
        WHEN row_num <= fc.business_class_limit THEN 'business' 
        ELSE 'economy' 
    END as class,
    (random() > 0.15) as is_available,
    CASE 
        WHEN row_num <= fc.first_class_limit THEN 150
        WHEN row_num <= fc.business_class_limit THEN 50 
        ELSE 0 
    END as extra_fee
FROM flight_config fc
CROSS JOIN generate_series(1, 35) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE row_num <= fc.max_rows
ON CONFLICT (flight_id, seat_number) DO NOTHING;