'use server'

import { createBooking } from '@/lib/supabase/booking';

export async function processBooking(formData: FormData) {
  const flightId = formData.get('flightId') as string;
  const seatId = formData.get('seatId') as string;
  const userId = formData.get('userId') as string;

  const isPaymentSuccessful = Math.random() > 0.1;
  if (!isPaymentSuccessful) return { success: false, error: 'Payment declined' };

  const result = await createBooking(flightId, seatId, userId);
  if (result.error) return { success: false, error: result.error.message };

  return { success: true, data: result.data };
}