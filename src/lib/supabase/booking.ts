// src/lib/supabase/booking.ts
import { createClient } from './server';

export async function createBooking(flightId: string, seatId: string, userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('create_booking_transaction', {
    p_flight_id: flightId,
    p_seat_id: seatId,
    p_user_id: userId
  });
  
  return { data, error };
}