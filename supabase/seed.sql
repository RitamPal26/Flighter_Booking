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
-- Part C: Flights — May 23 → Sep 30, 2026
-- 4 fixed daily slots per route, 56 routes
-- ==========================================
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
WITH cities AS (
    SELECT unnest(ARRAY['CCU', 'DEL', 'JFK', 'LHR', 'DXB', 'BOM', 'SFO', 'NRT']) as code
),
routes AS (
    SELECT a.code as origin, b.code as destination
    FROM cities a CROSS JOIN cities b WHERE a.code != b.code
),
days AS (
    SELECT ('2026-05-23 00:00:00'::timestamp + (i * INTERVAL '1 day')) as base_date
    FROM generate_series(0, 130) i
),
slots AS (
    SELECT *
    FROM (VALUES
        ('N'::text, INTERVAL '0 hours'::interval, 'Airbus A350-900'::text),
        ('M'::text, INTERVAL '6 hours'::interval, 'Boeing 737-800'::text),
        ('A'::text, INTERVAL '12 hours'::interval, 'Airbus A320neo'::text),
        ('E'::text, INTERVAL '18 hours'::interval, 'Boeing 787 Dreamliner'::text)
    ) AS t(slot_code, dep_offset, aircraft_type)
),
flight_data AS (
    SELECT
        r.origin,
        r.destination,
        (d.base_date + s.dep_offset) as departs_at,
        (d.base_date + s.dep_offset + INTERVAL '5 hours') as arrives_at,
        s.aircraft_type,
        floor(random() * 500 + 150)::int as base_price
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
-- Part D: Seats — per aircraft type (batched by month × type)
-- Each INSERT handles one aircraft type for one month (~200–470K rows)
-- ==========================================
-- May 23–31 · Airbus A350-900 (rows 1–6 first · 7–18 business · 19–45 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 6 THEN 'first' WHEN row_num <= 18 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 6 THEN 200 WHEN row_num <= 18 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 45) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A350-900'
  AND f.departs_at >= '2026-05-23' AND f.departs_at < '2026-06-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- May 23–31 · Boeing 787 Dreamliner (rows 1–5 first · 6–15 business · 16–40 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 5 THEN 'first' WHEN row_num <= 15 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 5 THEN 200 WHEN row_num <= 15 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 40) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 787 Dreamliner'
  AND f.departs_at >= '2026-05-23' AND f.departs_at < '2026-06-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- May 23–31 · Boeing 737-800 (rows 1–4 first · 5–10 business · 11–30 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 4 THEN 'first' WHEN row_num <= 10 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 4 THEN 200 WHEN row_num <= 10 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 30) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 737-800'
  AND f.departs_at >= '2026-05-23' AND f.departs_at < '2026-06-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- May 23–31 · Airbus A320neo (rows 1–3 first · 4–8 business · 9–28 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 3 THEN 'first' WHEN row_num <= 8 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 3 THEN 200 WHEN row_num <= 8 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 28) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A320neo'
  AND f.departs_at >= '2026-05-23' AND f.departs_at < '2026-06-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- June · Airbus A350-900
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 6 THEN 'first' WHEN row_num <= 18 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 6 THEN 200 WHEN row_num <= 18 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 45) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A350-900'
  AND f.departs_at >= '2026-06-01' AND f.departs_at < '2026-07-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- June · Boeing 787 Dreamliner
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 5 THEN 'first' WHEN row_num <= 15 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 5 THEN 200 WHEN row_num <= 15 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 40) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 787 Dreamliner'
  AND f.departs_at >= '2026-06-01' AND f.departs_at < '2026-07-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- June · Boeing 737-800
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 4 THEN 'first' WHEN row_num <= 10 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 4 THEN 200 WHEN row_num <= 10 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 30) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 737-800'
  AND f.departs_at >= '2026-06-01' AND f.departs_at < '2026-07-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- June · Airbus A320neo
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 3 THEN 'first' WHEN row_num <= 8 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 3 THEN 200 WHEN row_num <= 8 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 28) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A320neo'
  AND f.departs_at >= '2026-06-01' AND f.departs_at < '2026-07-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- July · Airbus A350-900 (rows 1–6 first · 7–18 business · 19–45 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 6 THEN 'first' WHEN row_num <= 18 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 6 THEN 200 WHEN row_num <= 18 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 45) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A350-900'
  AND f.departs_at >= '2026-07-01' AND f.departs_at < '2026-08-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- July · Boeing 787 Dreamliner (rows 1–5 first · 6–15 business · 16–40 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 5 THEN 'first' WHEN row_num <= 15 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 5 THEN 200 WHEN row_num <= 15 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 40) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 787 Dreamliner'
  AND f.departs_at >= '2026-07-01' AND f.departs_at < '2026-08-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- July · Boeing 737-800 (rows 1–4 first · 5–10 business · 11–30 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 4 THEN 'first' WHEN row_num <= 10 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 4 THEN 200 WHEN row_num <= 10 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 30) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 737-800'
  AND f.departs_at >= '2026-07-01' AND f.departs_at < '2026-08-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- July · Airbus A320neo (rows 1–3 first · 4–8 business · 9–28 economy)
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 3 THEN 'first' WHEN row_num <= 8 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 3 THEN 200 WHEN row_num <= 8 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 28) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A320neo'
  AND f.departs_at >= '2026-07-01' AND f.departs_at < '2026-08-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- August · Airbus A350-900
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 6 THEN 'first' WHEN row_num <= 18 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 6 THEN 200 WHEN row_num <= 18 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 45) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A350-900'
  AND f.departs_at >= '2026-08-01' AND f.departs_at < '2026-09-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- August · Boeing 787 Dreamliner
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 5 THEN 'first' WHEN row_num <= 15 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 5 THEN 200 WHEN row_num <= 15 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 40) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 787 Dreamliner'
  AND f.departs_at >= '2026-08-01' AND f.departs_at < '2026-09-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- August · Boeing 737-800
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 4 THEN 'first' WHEN row_num <= 10 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 4 THEN 200 WHEN row_num <= 10 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 30) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 737-800'
  AND f.departs_at >= '2026-08-01' AND f.departs_at < '2026-09-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- August · Airbus A320neo
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 3 THEN 'first' WHEN row_num <= 8 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 3 THEN 200 WHEN row_num <= 8 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 28) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A320neo'
  AND f.departs_at >= '2026-08-01' AND f.departs_at < '2026-09-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- September · Airbus A350-900
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 6 THEN 'first' WHEN row_num <= 18 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 6 THEN 200 WHEN row_num <= 18 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 45) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A350-900'
  AND f.departs_at >= '2026-09-01' AND f.departs_at < '2026-10-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- September · Boeing 787 Dreamliner
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 5 THEN 'first' WHEN row_num <= 15 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 5 THEN 200 WHEN row_num <= 15 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 40) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 787 Dreamliner'
  AND f.departs_at >= '2026-09-01' AND f.departs_at < '2026-10-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- September · Boeing 737-800
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 4 THEN 'first' WHEN row_num <= 10 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 4 THEN 200 WHEN row_num <= 10 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 30) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Boeing 737-800'
  AND f.departs_at >= '2026-09-01' AND f.departs_at < '2026-10-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;

-- September · Airbus A320neo
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
SELECT f.id, row_num || col,
    CASE WHEN row_num <= 3 THEN 'first' WHEN row_num <= 8 THEN 'business' ELSE 'economy' END,
    random() > 0.15,
    CASE WHEN row_num <= 3 THEN 200 WHEN row_num <= 8 THEN 80 ELSE 0 END
FROM flights f
CROSS JOIN generate_series(1, 28) row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) col
WHERE f.aircraft_type = 'Airbus A320neo'
  AND f.departs_at >= '2026-09-01' AND f.departs_at < '2026-10-01'
ON CONFLICT (flight_id, seat_number) DO NOTHING;
