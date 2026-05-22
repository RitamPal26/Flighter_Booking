CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create a Test User Account
-- Credentials -> Email: test@example.com | Password: password123
INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    encrypted_password, 
    email_confirmed_at, 
    raw_app_meta_data, 
    raw_user_meta_data, 
    created_at, 
    updated_at, 
    confirmation_token, 
    email_change, 
    email_change_token_new, 
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
    id, 
    user_id, 
    identity_data, 
    provider, 
    last_sign_in_at, 
    created_at, 
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    format('{"sub":"%s","email":"%s"}', '00000000-0000-0000-0000-000000000001', 'test@example.com')::jsonb,
    'email',
    now(),
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert 8 Flights across 4 Routes (Dates set for June 2026)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES
    -- Route 1: CCU to DEL
    (uuid_generate_v4(), 'FL-101', 'CCU', 'DEL', '2026-06-10 08:00:00+00', '2026-06-10 10:30:00+00', 'Boeing 737', 'scheduled', 120.00),
    (uuid_generate_v4(), 'FL-102', 'CCU', 'DEL', '2026-06-10 18:00:00+00', '2026-06-10 20:30:00+00', 'Boeing 737', 'scheduled', 150.00),
    -- Route 2: JFK to LHR
    (uuid_generate_v4(), 'FL-201', 'JFK', 'LHR', '2026-06-12 19:00:00+00', '2026-06-13 07:00:00+00', 'Airbus A350', 'scheduled', 450.00),
    (uuid_generate_v4(), 'FL-202', 'JFK', 'LHR', '2026-06-12 22:00:00+00', '2026-06-13 10:00:00+00', 'Airbus A350', 'scheduled', 400.00),
    -- Route 3: DXB to BOM
    (uuid_generate_v4(), 'FL-301', 'DXB', 'BOM', '2026-06-15 14:00:00+00', '2026-06-15 18:30:00+00', 'Boeing 777', 'scheduled', 200.00),
    (uuid_generate_v4(), 'FL-302', 'DXB', 'BOM', '2026-06-15 23:00:00+00', '2026-06-16 03:30:00+00', 'Boeing 777', 'scheduled', 180.00),
    -- Route 4: SFO to NRT
    (uuid_generate_v4(), 'FL-401', 'SFO', 'NRT', '2026-06-20 11:00:00+00', '2026-06-21 14:00:00+00', 'Boeing 787', 'scheduled', 600.00),
    (uuid_generate_v4(), 'FL-402', 'SFO', 'NRT', '2026-06-20 23:30:00+00', '2026-06-22 02:30:00+00', 'Boeing 787', 'scheduled', 550.00);

-- 3. Dynamically Generate Seat Maps for All Flights
-- Generates 120 seats per flight: 
-- Rows 1-3: First Class ($500 extra)
-- Rows 4-8: Business Class ($200 extra)
-- Rows 9-20: Economy ($0 extra)
WITH flight_data AS (
    SELECT id FROM flights
),
rows AS (
    SELECT generate_series(1, 20) AS row_num
),
cols AS (
    SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F']) AS seat_letter
)
INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
SELECT 
    f.id,
    r.row_num || c.seat_letter,
    CASE 
        WHEN r.row_num <= 3 THEN 'first'
        WHEN r.row_num <= 8 THEN 'business'
        ELSE 'economy'
    END,
    CASE 
        WHEN r.row_num <= 3 THEN 500.00
        WHEN r.row_num <= 8 THEN 200.00
        ELSE 0.00
    END,
    random() > 0.15
FROM flight_data f
CROSS JOIN rows r
CROSS JOIN cols c;