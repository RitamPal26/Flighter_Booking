-- 1. Track the new booking in reschedules
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'reschedules' AND column_name = 'new_booking_id'
    ) THEN
        ALTER TABLE reschedules ADD COLUMN new_booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_reschedules_new_booking_id ON reschedules(new_booking_id);

-- 2. Update trigger to also fire on 'rescheduled' status changes
CREATE OR REPLACE FUNCTION enforce_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_departs_at TIMESTAMPTZ;
BEGIN
    IF NEW.status IN ('cancelled', 'rescheduled') AND OLD.status NOT IN ('cancelled', 'rescheduled') THEN
        SELECT departs_at INTO v_departs_at FROM flights WHERE id = NEW.flight_id;

        IF v_departs_at <= (now() + interval '2 hours') THEN
            RAISE EXCEPTION 'Cancellations are not permitted within 2 hours of departure.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Atomic reschedule RPC (cancel old + create new + record history in one transaction)
CREATE OR REPLACE FUNCTION reschedule_booking(
    p_booking_id UUID,
    p_new_flight_id UUID,
    p_new_seat_id UUID,
    p_user_id UUID,
    p_new_pnr_code TEXT,
    p_new_total_price NUMERIC,
    p_reschedule_fee NUMERIC
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_old_seat_id UUID;
    v_old_flight_id UUID;
    v_new_booking_id UUID;
    v_is_available BOOLEAN;
BEGIN
    -- Lock old booking, verify ownership, get seat and flight
    SELECT seat_id, flight_id INTO v_old_seat_id, v_old_flight_id
    FROM bookings
    WHERE id = p_booking_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or access denied.';
    END IF;

    -- Lock new seat on new flight, verify availability
    SELECT is_available INTO v_is_available
    FROM seats
    WHERE id = p_new_seat_id AND flight_id = p_new_flight_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_available THEN
        RAISE EXCEPTION 'New seat is no longer available.';
    END IF;

    -- Update old booking status to rescheduled
    -- (trigger fires and enforces the 2-hour window)
    UPDATE bookings
    SET status = 'rescheduled'
    WHERE id = p_booking_id;

    -- Free the old seat
    UPDATE seats SET is_available = true WHERE id = v_old_seat_id;

    -- Mark new seat as unavailable
    UPDATE seats SET is_available = false WHERE id = p_new_seat_id;

    -- Create new booking
    INSERT INTO bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
    VALUES (p_user_id, p_new_flight_id, p_new_seat_id, 'confirmed', p_new_total_price, p_new_pnr_code)
    RETURNING id INTO v_new_booking_id;

    -- Record reschedule history
    INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, new_booking_id, fee_charged)
    VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, v_new_booking_id, p_reschedule_fee);

    RETURN v_new_booking_id;
END;
$$;

-- 4. Restrict the new RPC to authenticated users only
REVOKE EXECUTE ON FUNCTION reschedule_booking(UUID, UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC) FROM anon, public;
GRANT EXECUTE ON FUNCTION reschedule_booking(UUID, UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC) TO authenticated;
