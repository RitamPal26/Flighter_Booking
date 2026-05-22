export async function processPayment(amount: number) {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const isSuccessful = Math.random() > 0.1;

  if (!isSuccessful) {
    return { success: false as const, error: 'Payment declined. Please try a different card.' };
  }

  return { success: true as const, transactionId: `txn_${crypto.randomUUID()}` };
}
