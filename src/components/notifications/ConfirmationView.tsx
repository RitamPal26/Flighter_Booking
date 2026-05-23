"use client"

import { useFlightStore } from "@/store/flightStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatTime } from "@/utils/formatters"
import { CircleCheckIcon } from "lucide-react"

export default function ConfirmationView() {
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const bookingResults = useFlightStore((state) => state.bookingResults)
  const passengersData = useFlightStore((state) => state.passengersData)
  const resetBooking = useFlightStore((state) => state.resetBooking)

  if (!selectedFlight) return null

  const basePrice = selectedFlight.base_price
  const totalPaid = bookingResults.reduce((sum, r) => sum + r.totalPrice, 0)

  return (
    <div className="p-6 md:p-12 max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <CircleCheckIcon className="size-12 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold tracking-tight">
          {bookingResults.length > 1 ? "Bookings Confirmed!" : "Booking Confirmed!"}
        </h1>
        <p className="text-muted-foreground">
          {bookingResults.length} booking{bookingResults.length > 1 ? "s" : ""} confirmed successfully.
        </p>
      </div>

      <Card className="border-2 border-green-100">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              E-Tickets
            </span>
            <span className="text-xs text-muted-foreground">
              {bookingResults.length} ticket{bookingResults.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-3">
            {bookingResults.map((result, i) => (
              <div key={result.bookingId} className="rounded-lg border bg-muted/20 p-3 space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Ticket {i + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                    {result.pnrCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passenger</span>
                  <span className="font-medium">{passengersData[i]?.fullName ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat</span>
                  <span className="font-medium">
                    {result.seatNumber} &middot; <span className="capitalize">{result.seatClass}</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Fare</span>
                  <span>{formatCurrency(result.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 text-sm border-t pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flight</span>
              <span className="font-medium">{selectedFlight.flight_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aircraft</span>
              <span className="font-medium">{selectedFlight.aircraft_type}</span>
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
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Base fare &times; {bookingResults.length}</span>
                <span>{formatCurrency(basePrice * bookingResults.length)}</span>
              </div>
              {bookingResults.some((r) => r.totalPrice > basePrice) && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Seat upgrade fees</span>
                  <span>{formatCurrency(totalPaid - basePrice * bookingResults.length)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1 font-bold text-lg">
                <span>Total Paid</span>
                <span>{formatCurrency(totalPaid)}</span>
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
