"use client"

import { useEffect, useState } from "react"
import { useFlightStore } from "@/store/flightStore"
import { flightService } from "@/lib/supabase/queries"
import type { Seat } from "@/types/supabase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatTime } from "@/utils/formatters"
import { toast } from "sonner"
import { processMultiBooking } from "@/app/actions/bookingActions"
import PaymentForm from "./PaymentForm"
import { Loader2Icon } from "lucide-react"

export default function CheckoutDialog() {
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const selectedSeatIds = useFlightStore((state) => state.selectedSeatIds)
  const setStep = useFlightStore((state) => state.setStep)
  const storeSetBookingResults = useFlightStore((state) => state.setBookingResults)
  const passengersData = useFlightStore((state) => state.passengersData)

  const [seats, setSeats] = useState<Seat[]>([])
  const [isFetchingSeats, setIsFetchingSeats] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const isOpen = !completed

  useEffect(() => {
    if (!selectedSeatIds.length || !selectedFlight) return

    const fetchSeats = async () => {
      setIsFetchingSeats(true)
      const { data, error } = await flightService.getCabinMap(selectedFlight.id)
      if (!error && data) {
        const found = (data as Seat[]).filter((s) => selectedSeatIds.includes(s.id))
        setSeats(found)
      }
      setIsFetchingSeats(false)
    }

    fetchSeats()
  }, [selectedSeatIds, selectedFlight])

  const handleConfirm = async () => {
    if (!selectedFlight || !seats.length) return

    setIsProcessing(true)

    const seatInfos = seats.map((s) => ({
      id: s.id,
      extraFee: s.extra_fee,
      seatNumber: s.seat_number,
      seatClass: s.class,
    }))

    const result = await processMultiBooking(
      selectedFlight.id,
      selectedFlight.base_price,
      seatInfos,
    )

    if (!result.success) {
      toast.error("Payment Failed", { description: result.error })
      setIsProcessing(false)
      return
    }

    storeSetBookingResults(result.results)
    setCompleted(true)
    setStep('confirmation')
    toast.success("Booking Confirmed!", {
      description: `${result.results.length} booking${result.results.length > 1 ? "s" : ""} confirmed.`,
    })
  }

  const handleClose = () => {
    if (!isProcessing) {
      setStep('passenger_details')
    }
  }

  if (!selectedFlight || !isOpen) return null

  const basePrice = selectedFlight.base_price
  const totalExtraFee = seats.reduce((sum, s) => sum + s.extra_fee, 0)
  const totalPrice = basePrice * selectedSeatIds.length + totalExtraFee

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Review your booking details and confirm payment.
          </DialogDescription>
        </DialogHeader>

        {isFetchingSeats ? (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
              {passengersData.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Passengers</p>
                  {passengersData.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-muted-foreground">{p.fullName}</span>
                      <span className="font-medium font-mono text-xs">***{p.passportNo.slice(-4)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Flight</span>
                <span className="font-medium">{selectedFlight.flight_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route</span>
                <span className="font-medium">
                  {selectedFlight.origin} &rarr; {selectedFlight.destination}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Departure</span>
                <span className="font-medium">
                  {formatTime(selectedFlight.departs_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrival</span>
                <span className="font-medium">
                  {formatTime(selectedFlight.arrives_at)}
                </span>
              </div>
              {seats.length > 0 && (
                <div className="border-t pt-2 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Seats</p>
                  {seats.map((s, i) => (
                    <div key={s.id} className="flex justify-between text-xs">
                      <span>
                        Seat {s.seat_number} &middot; <span className="capitalize">{s.class}</span>
                      </span>
                      {s.extra_fee > 0 && <span>+{formatCurrency(s.extra_fee)}</span>}
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-xs text-muted-foreground">
                <span>Base fare &times; {selectedSeatIds.length}</span>
                <span>{formatCurrency(basePrice * selectedSeatIds.length)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <PaymentForm />

            <Button
              className="w-full"
              size="lg"
              disabled={isProcessing}
              onClick={handleConfirm}
            >
              {isProcessing ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                `Pay ${formatCurrency(totalPrice)}`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
