-- 1. Safely wipe existing data (CASCADE removes dependent bookings too)
TRUNCATE TABLE seats CASCADE;
DELETE FROM flights;

-- 2. Populate flights for the year 2026 only (full year)
INSERT INTO flights (flight_no, origin, destination, departs_at, arrives_at, base_price, aircraft_type)
WITH cities AS (
    SELECT unnest(ARRAY['CCU', 'DEL', 'JFK', 'LHR', 'DXB', 'BOM', 'SFO', 'NRT']) as code
),
routes AS (
    SELECT a.code as origin, b.code as destination
    FROM cities a CROSS JOIN cities b WHERE a.code != b.code
),
flight_times AS (
    -- Start at Jan 1, 2026 and add 'i' days up to 364 days (full year)
    SELECT ('2026-01-01 00:00:00'::timestamp + (i * INTERVAL '1 day')) as base_date 
    FROM generate_series(0, 364) i
)
SELECT 
    'FL' || floor(random() * 9000 + 1000)::text as flight_no,
    r.origin,
    r.destination,
    (ft.base_date + (floor(random() * 24) * INTERVAL '1 hour')) as departs_at,
    (ft.base_date + (floor(random() * 24) * INTERVAL '1 hour') + INTERVAL '5 hours') as arrives_at,
    floor(random() * 500 + 150)::int as base_price,
    (ARRAY['Boeing 737-800', 'Airbus A320neo', 'Boeing 787 Dreamliner', 'Airbus A350-900'])[floor(random() * 4 + 1)] as aircraft_type
FROM routes r
CROSS JOIN flight_times ft
WHERE random() > 0.8;

-- 3. Dynamic Seat Generation
INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
WITH flight_config AS (
    SELECT 
        id as flight_id,
        aircraft_type,
        CASE 
            WHEN aircraft_type = 'Airbus A320neo' THEN 28
            WHEN aircraft_type = 'Boeing 737-800' THEN 30
            WHEN aircraft_type = 'Boeing 787 Dreamliner' THEN 40
            WHEN aircraft_type = 'Airbus A350-900' THEN 45
            ELSE 30
        END as max_rows,
        CASE 
            WHEN aircraft_type = 'Airbus A320neo' THEN 3
            WHEN aircraft_type = 'Boeing 737-800' THEN 4
            WHEN aircraft_type = 'Boeing 787 Dreamliner' THEN 5
            WHEN aircraft_type = 'Airbus A350-900' THEN 6
            ELSE 4
        END as first_class_limit,
        CASE 
            WHEN aircraft_type = 'Airbus A320neo' THEN 8
            WHEN aircraft_type = 'Boeing 737-800' THEN 10
            WHEN aircraft_type = 'Boeing 787 Dreamliner' THEN 15
            WHEN aircraft_type = 'Airbus A350-900' THEN 18
            ELSE 10
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
        WHEN row_num <= fc.first_class_limit THEN 200
        WHEN row_num <= fc.business_class_limit THEN 80
        ELSE 0
    END as extra_fee
FROM flight_config fc
CROSS JOIN generate_series(1, 45) row_num
CROSS JOIN unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F']) AS col
WHERE row_num <= fc.max_rows
ON CONFLICT (flight_id, seat_number) DO NOTHING;