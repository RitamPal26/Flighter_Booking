"use client"

import { useFlightStore } from "@/store/flightStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatTime } from "@/utils/formatters"
import { CircleCheckIcon } from "lucide-react"

export default function ConfirmationView() {
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const bookingResult = useFlightStore((state) => state.bookingResult)
  const selectedSeatId = useFlightStore((state) => state.selectedSeatId)
  const passengerData = useFlightStore((state) => state.passengerData)
  const resetBooking = useFlightStore((state) => state.resetBooking)

  if (!selectedFlight) return null

  const basePrice = selectedFlight.base_price
  const extraFee = bookingResult ? bookingResult.totalPrice - basePrice : 0

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <CircleCheckIcon className="size-12 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold tracking-tight">Booking Confirmed!</h1>
        <p className="text-muted-foreground">
          Your flight has been booked successfully.
        </p>
      </div>

      <Card className="border-2 border-green-100">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              E-Ticket
            </span>
            {bookingResult && (
              <span className="text-xs font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                {bookingResult.pnrCode}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flight</span>
              <span className="font-medium">{selectedFlight.flight_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aircraft</span>
              <span className="font-medium">{selectedFlight.aircraft_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">From</span>
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
            {selectedSeatId && bookingResult && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seat</span>
                <span className="font-medium">
                  {bookingResult.seatNumber} &middot;{" "}
                  <span className="capitalize">{bookingResult.seatClass}</span>
                </span>
              </div>
            )}
            {passengerData && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passenger</span>
                <span className="font-medium">{passengerData.fullName}</span>
              </div>
            )}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Base fare</span>
                <span>{formatCurrency(basePrice)}</span>
              </div>
              {extraFee > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Seat upgrade fee</span>
                  <span>{formatCurrency(extraFee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 font-bold text-lg">
                <span>Total Paid</span>
                <span>{formatCurrency(bookingResult?.totalPrice ?? basePrice)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" disabled>
          Reschedule
        </Button>
        <Button onClick={resetBooking}>Book Another Flight</Button>
      </div>
    </div>
  )
}
