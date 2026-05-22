import { createClient } from './server';

export async function createBooking(flightId: string, seatId: string, userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('book_seat', {
    p_flight_id: flightId,
    p_seat_id: seatId,
    p_user_id: userId,
    p_total_price: 0,
    p_pnr_code: `PNR${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  });

  return { data, error };
}