"use client"

import { useFlightStore } from "@/store/flightStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatTime } from "@/utils/formatters"
import { CircleCheckIcon } from "lucide-react"

export default function ConfirmationView() {
  const selectedFlight = useFlightStore((state) => state.selectedFlight)
  const resetBooking = useFlightStore((state) => state.resetBooking)

  if (!selectedFlight) return null

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
            <span className="text-xs text-muted-foreground">
              Boarding pass available at check-in
            </span>
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
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-bold text-lg">
                {formatCurrency(selectedFlight.base_price)}
              </span>
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
