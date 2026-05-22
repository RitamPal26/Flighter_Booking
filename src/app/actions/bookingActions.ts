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

export async function rescheduleBooking(bookingId: string, newSeatId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  const { error: cancelError } = await cancelBookingTransaction(bookingId);
  if (cancelError) return { success: false as const, error: cancelError.message };

  return { success: true as const };
}
