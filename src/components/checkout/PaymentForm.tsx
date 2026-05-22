"use client"

import { Input } from "@/components/ui/input"

export default function PaymentForm() {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Card Number</label>
        <Input
          name="cardNumber"
          placeholder="4242 4242 4242 4242"
          maxLength={19}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Expiry</label>
          <Input name="expiry" placeholder="MM/YY" maxLength={5} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">CVV</label>
          <Input name="cvv" placeholder="123" maxLength={4} required />
        </div>
      </div>
    </div>
  )
}
