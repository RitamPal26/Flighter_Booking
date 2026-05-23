import { createClient } from '@/lib/supabase/server';

export async function createBookingTransaction(
  flightId: string,
  seatId: string,
  userId: string,
  totalPrice: number,
  pnrCode: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('book_seat', {
    p_user_id: userId,
    p_flight_id: flightId,
    p_seat_id: seatId,
    p_total_price: totalPrice,
    p_pnr_code: pnrCode,
  });

  return { data, error };
}

export async function cancelBookingTransaction(bookingId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
  });

  return { data, error };
}

export async function rescheduleBookingTransaction(
  bookingId: string,
  newFlightId: string,
  newSeatId: string,
  userId: string,
  newPnrCode: string,
  newTotalPrice: number,
  rescheduleFee: number,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('reschedule_booking', {
    p_booking_id: bookingId,
    p_new_flight_id: newFlightId,
    p_new_seat_id: newSeatId,
    p_user_id: userId,
    p_new_pnr_code: newPnrCode,
    p_new_total_price: newTotalPrice,
    p_reschedule_fee: rescheduleFee,
  });

  return { data, error };
}