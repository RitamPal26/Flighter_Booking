'use server'

import { createClient } from '@/lib/supabase/server';
import { processPayment } from '@/lib/services/paymentService';
import {
  createBookingTransaction,
  cancelBookingTransaction,
} from '@/lib/services/bookingService';

export async function processBooking(formData: FormData) {
  const flightId = formData.get('flightId') as string;
  const seatId = formData.get('seatId') as string;
  const basePrice = Number(formData.get('basePrice'));
  const extraFee = Number(formData.get('extraFee'));
  const totalPrice = basePrice + extraFee;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  const paymentResult = await processPayment(totalPrice);
  if (!paymentResult.success) return paymentResult;

  const pnrCode = `PNR${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const { data, error } = await createBookingTransaction(
    flightId,
    seatId,
    user.id,
    totalPrice,
    pnrCode,
  );

  if (error) return { success: false as const, error: error.message };

  return { success: true as const, bookingId: data as string, pnrCode };
}

export async function rescheduleBooking(
  bookingId: string,
  newFlightId: string,
  newSeatId: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  const { data: oldBooking, error: fetchError } = await supabase
    .from('bookings')
    .select('*, flights(*)')
    .eq('id', bookingId)
    .single();

  if (fetchError || !oldBooking) {
    return { success: false as const, error: 'Booking not found' };
  }

  const { error: cancelError } = await cancelBookingTransaction(bookingId);
  if (cancelError) return { success: false as const, error: cancelError.message };

  const rescheduleFee = 50;
  const newTotalPrice = oldBooking.total_price + rescheduleFee;
  const newPnrCode = `PNR${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { data, error: bookError } = await createBookingTransaction(
    newFlightId,
    newSeatId,
    user.id,
    newTotalPrice,
    newPnrCode,
  );

  if (bookError) return { success: false as const, error: bookError.message };

  try {
    await supabase.from('reschedules').insert({
      booking_id: bookingId,
      old_flight_id: oldBooking.flight_id,
      new_flight_id: newFlightId,
      fee_charged: rescheduleFee,
    });
  } catch {
    console.error('Failed to record reschedule history');
  }

  return {
    success: true as const,
    bookingId: data as string,
    pnrCode: newPnrCode,
  };
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  const { error } = await cancelBookingTransaction(bookingId);
  if (error) return { success: false as const, error: error.message };

  return { success: true as const };
}
