-- Fix all SECURITY DEFINER functions to use schema-qualified table names.
-- With SET search_path = '', unqualified table references cannot be resolved.

-- 1. Fix book_seat
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
    SELECT is_available INTO v_is_available
    FROM public.seats
    WHERE id = p_seat_id AND flight_id = p_flight_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_available THEN
        RAISE EXCEPTION 'Seat is no longer available.';
    END IF;

    UPDATE public.seats SET is_available = false WHERE id = p_seat_id;

    INSERT INTO public.bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
    VALUES (p_user_id, p_flight_id, p_seat_id, 'confirmed', p_total_price, p_pnr_code)
    RETURNING id INTO v_booking_id;

    RETURN v_booking_id;
END;
$$;

-- 2. Fix cancel_booking
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
    SELECT seat_id INTO v_seat_id
    FROM public.bookings
    WHERE id = p_booking_id AND user_id = auth.uid()
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or access denied.';
    END IF;

    UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
    UPDATE public.seats SET is_available = true WHERE id = v_seat_id;
END;
$$;

-- 3. Fix enforce_cancellation_window
CREATE OR REPLACE FUNCTION enforce_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_departs_at TIMESTAMPTZ;
BEGIN
    IF NEW.status IN ('cancelled', 'rescheduled') AND OLD.status NOT IN ('cancelled', 'rescheduled') THEN
        SELECT departs_at INTO v_departs_at FROM public.flights WHERE id = NEW.flight_id;

        IF v_departs_at <= (now() + interval '2 hours') THEN
            RAISE EXCEPTION 'Cancellations are not permitted within 2 hours of departure.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 4. Fix reschedule_booking
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
    SELECT seat_id, flight_id INTO v_old_seat_id, v_old_flight_id
    FROM public.bookings
    WHERE id = p_booking_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found or access denied.';
    END IF;

    SELECT is_available INTO v_is_available
    FROM public.seats
    WHERE id = p_new_seat_id AND flight_id = p_new_flight_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_is_available THEN
        RAISE EXCEPTION 'New seat is no longer available.';
    END IF;

    UPDATE public.bookings
    SET status = 'rescheduled'
    WHERE id = p_booking_id;

    UPDATE public.seats SET is_available = true WHERE id = v_old_seat_id;
    UPDATE public.seats SET is_available = false WHERE id = p_new_seat_id;

    INSERT INTO public.bookings (user_id, flight_id, seat_id, status, total_price, pnr_code)
    VALUES (p_user_id, p_new_flight_id, p_new_seat_id, 'confirmed', p_new_total_price, p_new_pnr_code)
    RETURNING id INTO v_new_booking_id;

    INSERT INTO public.reschedules (booking_id, old_flight_id, new_flight_id, new_booking_id, fee_charged)
    VALUES (p_booking_id, v_old_flight_id, p_new_flight_id, v_new_booking_id, p_reschedule_fee);

    RETURN v_new_booking_id;
END;
$$;

-- 5. Re-grant execute permissions (they may have been dropped by CREATE OR REPLACE)
GRANT EXECUTE ON FUNCTION book_seat(UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reschedule_booking(UUID, UUID, UUID, UUID, TEXT, NUMERIC, NUMERIC) TO authenticated;
