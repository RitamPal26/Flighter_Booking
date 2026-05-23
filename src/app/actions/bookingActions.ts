'use server'

import { createClient } from '@/lib/supabase/server';
import { processPayment } from '@/lib/services/paymentService';
import {
  createBookingTransaction,
  cancelBookingTransaction,
  rescheduleBookingTransaction,
} from '@/lib/services/bookingService';

interface SeatInfo {
  id: string
  extraFee: number
  seatNumber: string
  seatClass: string
}

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

export async function processMultiBooking(
  flightId: string,
  basePrice: number,
  seats: SeatInfo[],
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  const totalPrice = basePrice * seats.length + seats.reduce((sum, s) => sum + s.extraFee, 0);

  const paymentResult = await processPayment(totalPrice);
  if (!paymentResult.success) return paymentResult;

  const results: { bookingId: string; pnrCode: string; seatNumber: string; seatClass: string; totalPrice: number }[] = [];

  for (const seat of seats) {
    const pnrCode = `PNR${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const seatTotal = basePrice + seat.extraFee;
    const { data, error } = await createBookingTransaction(
      flightId,
      seat.id,
      user.id,
      seatTotal,
      pnrCode,
    );

    if (error) {
      return { success: false as const, error: error.message };
    }

    results.push({
      bookingId: data as string,
      pnrCode,
      seatNumber: seat.seatNumber,
      seatClass: seat.seatClass,
      totalPrice: seatTotal,
    });
  }

  return { success: true as const, results };
}

export async function rescheduleBooking(
  bookingId: string,
  newFlightId: string,
  newSeatId: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  const rescheduleFee = 50;

  const { data: newSeat, error: seatError } = await supabase
    .from('seats')
    .select('extra_fee')
    .eq('id', newSeatId)
    .single();

  if (seatError || !newSeat) {
    return { success: false as const, error: 'New seat not found' };
  }

  const { data: newFlight, error: flightError } = await supabase
    .from('flights')
    .select('base_price')
    .eq('id', newFlightId)
    .single();

  if (flightError || !newFlight) {
    return { success: false as const, error: 'New flight not found' };
  }

  const newTotalPrice = newFlight.base_price + newSeat.extra_fee + rescheduleFee;
  const newPnrCode = `PNR${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const { data, error } = await rescheduleBookingTransaction(
    bookingId,
    newFlightId,
    newSeatId,
    user.id,
    newPnrCode,
    newTotalPrice,
    rescheduleFee,
  );

  if (error) {
    return { success: false as const, error: error.message };
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
  if (error) {
    const msg = error.message ?? 'Unknown error';
    if (msg.includes('within 2 hours') || msg.includes('2 hours')) {
      return { success: false as const, error: 'Your flight is within 2 hours of departure. Cancellation is not permitted at this time.' };
    }
    return { success: false as const, error: msg };
  }

  return { success: true as const };
}
