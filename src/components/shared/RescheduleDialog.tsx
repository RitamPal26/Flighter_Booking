"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { flightService } from "@/lib/supabase/queries"
import { rescheduleBooking } from "@/app/actions/bookingActions"
import { formatCurrency, formatTime } from "@/utils/formatters"
import { toast } from "sonner"
import { Loader2Icon } from "lucide-react"
import type { Flight, Seat } from "@/types/supabase"

interface BookingInfo {
  id: string
  pnr_code: string
  total_price: number
  flights: {
    flight_no: string
    origin: string
    destination: string
    departs_at: string
    arrives_at: string
  } | null
}

interface RescheduleDialogProps {
  booking: BookingInfo
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "select_flight" | "select_seat" | "confirming"

export default function RescheduleDialog({
  booking,
  open,
  onOpenChange,
}: RescheduleDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("select_flight")
  const [flights, setFlights] = useState<Flight[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isLoadingFlights, setIsLoadingFlights] = useState(false)
  const [isLoadingSeats, setIsLoadingSeats] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (!open) return

    const init = async () => {
      setIsLoadingFlights(true)
      setStep("select_flight")
      setSelectedFlight(null)
      setSelectedSeat(null)
      setSeats([])
      setFlights([])

      const { data, error } = await flightService.getAllFlights()
      if (!error && data) {
        setFlights(data as Flight[])
      }
      setIsLoadingFlights(false)
    }

    init()
  }, [open])

  const handleFlightSelect = async (flight: Flight) => {
    setSelectedFlight(flight)
    setSelectedSeat(null)
    setIsLoadingSeats(true)
    setStep("select_seat")

    const { data, error } = await flightService.getCabinMap(flight.id)
    if (!error && data) {
      setSeats(data as Seat[])
    }
    setIsLoadingSeats(false)
  }

  const handleSeatSelect = (seat: Seat) => {
    if (!seat.is_available) return
    setSelectedSeat(seat)
  }

  const handleConfirm = async () => {
    if (!selectedFlight || !selectedSeat) return

    setIsProcessing(true)
    setStep("confirming")

    const result = await rescheduleBooking(booking.id, selectedFlight.id, selectedSeat.id)

    if (!result.success) {
      toast.error("Reschedule Failed", { description: result.error })
      setIsProcessing(false)
      setStep("select_seat")
      return
    }

    toast.success("Flight Rescheduled!", {
      description: `New PNR: ${result.pnrCode}. A $50 reschedule fee has been charged.`,
    })
    setIsProcessing(false)
    onOpenChange(false)
    router.refresh()
  }

  if (!booking) return null

  const rescheduleFee = 50
  const newTotal = booking.total_price + rescheduleFee

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            {step === "select_flight" && "Choose a new flight for your rescheduled journey."}
            {step === "select_seat" && "Select a seat on the new flight."}
            {step === "confirming" && "Processing your reschedule..."}
          </DialogDescription>
        </DialogHeader>

        {step === "select_flight" && (
          <div className="space-y-4">
            {isLoadingFlights ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Current booking: {booking.flights?.flight_no} ({booking.flights?.origin} &rarr; {booking.flights?.destination})
                </p>
                <div className="grid gap-3 max-h-80 overflow-y-auto pr-1">
                  {flights.map((flight) => (
                    <Card
                      key={flight.id}
                      className={`cursor-pointer transition-colors hover:border-blue-400 ${
                        selectedFlight?.id === flight.id ? "border-blue-500 ring-2 ring-blue-200" : ""
                      }`}
                      onClick={() => handleFlightSelect(flight)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-sm">{flight.flight_no}</span>
                          <p className="text-xs text-muted-foreground">{flight.aircraft_type}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">{flight.origin}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(flight.departs_at)}
                          </span>
                          <span className="text-muted-foreground">&rarr;</span>
                          <span className="font-medium">{flight.destination}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(flight.arrives_at)}
                          </span>
                          <span className="font-bold">{formatCurrency(flight.base_price)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {step === "select_seat" && selectedFlight && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              New flight: {selectedFlight.flight_no} &middot; {selectedFlight.origin} &rarr; {selectedFlight.destination}
            </p>

            {isLoadingSeats ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex gap-3 text-xs flex-wrap">
                  {["first", "business", "economy"].map((cls) => {
                    const clsSeats = seats.filter((s) => s.class === cls && s.is_available)
                    return (
                      <div key={cls} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded ${
                          cls === "first" ? "bg-purple-300" : cls === "business" ? "bg-sky-300" : "bg-stone-200"
                        }`} />
                        <span className="capitalize">{cls}</span>
                        <span className="text-muted-foreground">({clsSeats.length})</span>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-1">
                  {seats.map((seat) => {
                    const isSelected = selectedSeat?.id === seat.id
                    const seatColor = !seat.is_available
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                      : isSelected
                        ? "bg-green-500 text-white border-green-600"
                        : seat.class === "first"
                          ? "bg-purple-200 hover:bg-purple-300 border-purple-400 cursor-pointer"
                          : seat.class === "business"
                            ? "bg-sky-200 hover:bg-sky-300 border-sky-400 cursor-pointer"
                            : "bg-stone-100 hover:bg-stone-200 border-stone-300 cursor-pointer"

                    return (
                      <button
                        key={seat.id}
                        disabled={!seat.is_available}
                        onClick={() => handleSeatSelect(seat)}
                        className={`h-10 text-xs font-medium rounded border transition-colors ${seatColor}`}
                        title={`${seat.seat_number} - ${seat.class}${seat.extra_fee > 0 ? ` (+$${seat.extra_fee})` : ""}`}
                      >
                        {seat.seat_number}
                      </button>
                    )
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original total</span>
                    <span>{formatCurrency(booking.total_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reschedule fee</span>
                    <span>{formatCurrency(rescheduleFee)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>New total</span>
                    <span>{formatCurrency(newTotal)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => { setStep("select_flight"); setSelectedSeat(null) }}
                  >
                    Back to Flights
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedSeat}
                    onClick={handleConfirm}
                  >
                    Confirm Reschedule
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "confirming" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2Icon className="size-10 animate-spin text-blue-500" />
            <p className="text-sm text-muted-foreground">
              {isProcessing ? "Processing your reschedule..." : "Please wait..."}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
