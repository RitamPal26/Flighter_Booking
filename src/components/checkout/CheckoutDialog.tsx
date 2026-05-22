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
import { processBooking } from "@/app/actions/bookingActions"
import PaymentForm from "./PaymentForm"
import { Loader2Icon } from "lucide-react"

export default function CheckoutDialog() {
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const selectedSeatId = useFlightStore((state) => state.selectedSeatId)
  const setSelectedSeatId = useFlightStore((state) => state.setSelectedSeatId)
  const setStep = useFlightStore((state) => state.setStep)
  const storeSetBookingResult = useFlightStore((state) => state.setBookingResult)
  const passengerData = useFlightStore((state) => state.passengerData)

  const [seat, setSeat] = useState<Seat | null>(null)
  const [isFetchingSeat, setIsFetchingSeat] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completed, setCompleted] = useState(false)

  const isOpen = !completed

  useEffect(() => {
    if (!selectedSeatId || !selectedFlight) return

    const fetchSeat = async () => {
      setIsFetchingSeat(true)
      const { data, error } = await flightService.getCabinMap(selectedFlight.id)
      if (!error && data) {
        const found = (data as Seat[]).find((s) => s.id === selectedSeatId)
        setSeat(found ?? null)
      }
      setIsFetchingSeat(false)
    }

    fetchSeat()
  }, [selectedSeatId, selectedFlight])

  const handleConfirm = async () => {
    if (!selectedFlight || !seat) return

    setIsProcessing(true)

    const formData = new FormData()
    formData.set('flightId', selectedFlight.id)
    formData.set('seatId', seat.id)
    formData.set('basePrice', String(selectedFlight.base_price))
    formData.set('extraFee', String(seat.extra_fee))

    const result = await processBooking(formData)

    if (!result.success) {
      toast.error("Payment Failed", { description: result.error })
      setIsProcessing(false)
      return
    }

    storeSetBookingResult({
      bookingId: result.bookingId,
      pnrCode: result.pnrCode,
      seatNumber: seat.seat_number,
      seatClass: seat.class,
      totalPrice: totalPrice,
    })
    setCompleted(true)
    setStep('confirmation')
    toast.success("Booking Confirmed!", {
      description: `PNR: ${result.pnrCode}`,
    })
  }

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedSeatId(null)
      setStep('passenger_details')
    }
  }

  if (!selectedFlight || !isOpen) return null

  const totalPrice = selectedFlight.base_price + (seat?.extra_fee ?? 0)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
          <DialogDescription>
            Review your flight details and confirm payment.
          </DialogDescription>
        </DialogHeader>

        {isFetchingSeat ? (
          <div className="flex justify-center py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
              {passengerData && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Passenger</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{passengerData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passport</span>
                    <span className="font-medium font-mono text-xs">***{passengerData.passportNo.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nationality</span>
                    <span className="font-medium">{passengerData.nationality}</span>
                  </div>
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
              {seat && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seat</span>
                    <span className="font-medium">{seat.seat_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Class</span>
                    <span className="font-medium capitalize">{seat.class}</span>
                  </div>
                </>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
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
