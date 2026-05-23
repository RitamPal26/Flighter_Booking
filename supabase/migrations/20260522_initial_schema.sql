-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tables
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_no TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departs_at TIMESTAMPTZ NOT NULL,
    arrives_at TIMESTAMPTZ NOT NULL,
    aircraft_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    base_price NUMERIC NOT NULL
);

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    class TEXT NOT NULL CHECK (class IN ('economy', 'business', 'first')),
    is_available BOOLEAN NOT NULL DEFAULT true,
    extra_fee NUMERIC NOT NULL DEFAULT 0,
    UNIQUE(flight_id, seat_number)
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    seat_id UUID REFERENCES seats(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'rescheduled', 'cancelled')),
    booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    total_price NUMERIC NOT NULL,
    pnr_code TEXT NOT NULL UNIQUE
);

CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    passport_no TEXT NOT NULL,
    nationality TEXT NOT NULL,
    dob DATE NOT NULL
);

CREATE TABLE reschedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    old_flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    new_flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    fee_charged NUMERIC NOT NULL DEFAULT 0
);

-- 2. Row Level Security (RLS)
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- Public read access for flights and seats
CREATE POLICY "Flights are viewable by everyone" ON flights FOR SELECT USING (true);
CREATE POLICY "Seats are viewable by everyone" ON seats FOR SELECT USING (true);

-- Users can only access their own bookings and related data
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their passengers" ON passengers FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = passengers.booking_id AND bookings.user_id = auth.uid())
);
CREATE POLICY "Users can insert passengers" ON passengers FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = passengers.booking_id AND bookings.user_id = auth.uid())
);

CREATE POLICY "Users can view their reschedules" ON reschedules FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = reschedules.booking_id AND bookings.user_id = auth.uid())
);
CREATE POLICY "Users can insert reschedules" ON reschedules FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM bookings WHERE bookings.id = reschedules.booking_id AND bookings.user_id = auth.uid())
);

-- 3. RPC Function for atomic seat reservation (Prevents double-booking)
CREATE OR REPLACE FUNCTION book_seat(
    p_user_id UUID,
    p_flight_id UUID,
    p_seat_id UUID,
    p_total_price NUMERIC,
    p_pnr_code TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_booking_id UUID;
    v_is_available BOOLEAN;
BEGIN
    -- Lock the row to prevent race conditions
    SELECT is_available INTO v_is_available
    FROM seats
    WHERE id = p_seat_id AND flight_id = p_flight_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_available THEN
        RAISE EXCEPTION 'Seat is no longer available.';
    END IF;

    -- Mark seat as unavailable
    UPDATE seats SET is_available = false WHERE id = p_seat_id;

    -- Create booking
    INSERT INTO bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
    VALUES (p_user_id, p_flight_id, p_seat_id, 'confirmed', p_total_price, p_pnr_code)
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$;

-- RPC Function for atomic cancellation
CREATE OR REPLACE FUNCTION cancel_booking(
    p_booking_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_seat_id UUID;
BEGIN
    -- Get seat ID and lock booking
    SELECT seat_id INTO v_seat_id
    FROM bookings
    WHERE id = p_booking_id AND user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or access denied.';
    END IF;

    -- Update booking status
    UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;

    -- Free the seat
    UPDATE seats SET is_available = true WHERE id = v_seat_id;
END;
$$;

-- 4. DB-Level Constraint (Trigger): Prevent cancellation within 2 hours of departure
CREATE OR REPLACE FUNCTION enforce_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_departs_at TIMESTAMPTZ;
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT departs_at INTO v_departs_at FROM flights WHERE id = NEW.flight_id;
        
        IF v_departs_at <= (now() + interval '2 hours') THEN
            RAISE EXCEPTION 'Cancellations are not permitted within 2 hours of departure.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER check_cancellation_window
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION enforce_cancellation_window();

-- 5. Restrict SECURITY DEFINER RPC execution to authenticated users only
REVOKE EXECUTE ON FUNCTION book_seat(UUID, UUID, UUID, NUMERIC, TEXT) FROM anon, public;
REVOKE EXECUTE ON FUNCTION cancel_booking(UUID) FROM anon, public;
GRANT EXECUTE ON FUNCTION book_seat(UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking(UUID) TO authenticated;