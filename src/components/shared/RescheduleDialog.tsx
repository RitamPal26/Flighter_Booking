"use client"

import { useEffect, useRef, useState } from "react"
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
import { Input } from "@/components/ui/input"
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
    id: string
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

type Step = "select_flight" | "select_seat" | "confirm"

export default function RescheduleDialog({
  booking,
  open,
  onOpenChange,
}: RescheduleDialogProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>("select_flight")
  const [date, setDate] = useState("")
  const [flights, setFlights] = useState<Flight[]>([])
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [isLoadingFlights, setIsLoadingFlights] = useState(false)
  const [isLoadingSeats, setIsLoadingSeats] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const searchReqId = useRef(0)

  useEffect(() => {
    if (!open) return
    searchReqId.current += 1
    const defaultDate = booking.flights?.departs_at
      ? new Date(booking.flights.departs_at).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
    setDate(defaultDate)
    setStep("select_flight")
    setSelectedFlight(null)
    setSelectedSeat(null)
    setSeats([])
    setFlights([])
  }, [open])

  const handleSearch = async () => {
    if (!date || !booking.flights) return
    const reqId = ++searchReqId.current
    setIsLoadingFlights(true)
    const { data, error } = await flightService.searchFlightsByDate(
      booking.flights.origin,
      booking.flights.destination,
      date,
    )
    if (reqId !== searchReqId.current) { setIsLoadingFlights(false); return }
    if (error) {
      console.error("Flight search error:", error)
      toast.error("Search failed", { description: error.message })
      setIsLoadingFlights(false)
      return
    }
    if (data) {
      const now = Date.now()
      const dayStart = new Date(`${date}T00:00:00Z`).getTime()
      const dayEnd = new Date(`${date}T23:59:59Z`).getTime()
      const eligible = (data as Flight[]).filter((f) => {
        const depTime = new Date(f.departs_at).getTime()
        if (isNaN(depTime)) return false
        return (
          f.id !== booking.flights?.id &&
          depTime >= dayStart &&
          depTime <= dayEnd &&
          depTime - now > 2 * 60 * 60 * 1000
        )
      })
      if (reqId !== searchReqId.current) { setIsLoadingFlights(false); return }
      setFlights(eligible)
    }
    setIsLoadingFlights(false)
  }

  useEffect(() => {
    if (!open || !date || !booking.flights) return
    handleSearch()
  }, [open, date])

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

    const result = await rescheduleBooking(booking.id, selectedFlight.id, selectedSeat.id)

    if (!result.success) {
      const msg = result.error ?? "Unknown error"
      if (msg.includes("within 2 hours") || msg.includes("2 hours")) {
        toast.error("Cannot reschedule", {
          description: "Your current flight is within 2 hours of departure. Rescheduling is not permitted at this time.",
        })
      } else {
        toast.error("Reschedule Failed", { description: msg })
      }
      setIsProcessing(false)
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
  const newTotal = (selectedFlight?.base_price ?? 0) + (selectedSeat?.extra_fee ?? 0) + rescheduleFee

  const classLabel: Record<string, string> = {
    first: "First Class",
    business: "Business Class",
    economy: "Economy Class",
  }

  const classTheme: Record<string, string> = {
    first: "border-purple-400 bg-purple-100 text-purple-900",
    business: "border-sky-400 bg-sky-100 text-sky-900",
    economy: "border-stone-300 bg-stone-100 text-stone-800",
  }

  const colHeaders = ["A", "B", "C", "", "D", "E", "F"]

  const getRowNum = (seatNumber: string) => parseInt(seatNumber.replace(/[A-F]/g, ""), 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Booking</DialogTitle>
          <DialogDescription>
            {step === "select_flight" && "Pick a new date and flight for your rescheduled journey."}
            {step === "select_seat" && "Select a seat on the new flight."}
            {step === "confirm" && "Review and confirm your reschedule."}
          </DialogDescription>
        </DialogHeader>

        {step === "select_flight" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Current booking: {booking.flights?.flight_no} &middot;{" "}
              {booking.flights?.origin} &rarr; {booking.flights?.destination}
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Travel Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {isLoadingFlights ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-3 max-h-72 overflow-y-auto pr-1">
                {flights.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {date ? "No flights found on this date." : "Select a date to search flights."}
                  </p>
                ) : (
                  flights.map((flight) => (
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
                  ))
                )}
              </div>
            )}

            {flights.length > 0 && (
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {step === "select_seat" && selectedFlight && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {selectedFlight.flight_no} &middot; {selectedFlight.origin} &rarr;{" "}
              {selectedFlight.destination} &middot; {formatTime(selectedFlight.departs_at)}
            </p>

            {isLoadingSeats ? (
              <div className="flex justify-center py-8">
                <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex gap-4 text-sm justify-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-300 border border-purple-400 rounded"></div> First
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-sky-300 border border-sky-400 rounded"></div> Business
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-stone-200 border border-stone-300 rounded"></div> Economy
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div> Selected
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-300 rounded"></div> Occupied
                  </div>
                </div>

                <div className="overflow-x-auto pb-4">
                  <div className="min-w-[500px] space-y-6">
                    {["first", "business", "economy"].map((cls) => {
                      const clsSeats = seats.filter((s) => s.class === cls)
                      if (clsSeats.length === 0) return null
                      const startRow = getRowNum(clsSeats[0].seat_number)
                      const endRow = getRowNum(clsSeats[clsSeats.length - 1].seat_number)

                      return (
                        <div key={cls}>
                          <div className={`border-2 rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${classTheme[cls]}`}>
                            {classLabel[cls]} &middot; Rows {startRow}&ndash;{endRow}
                          </div>
                          <div className="grid grid-cols-7 gap-2 text-center items-center justify-items-center">
                            {colHeaders.map((col, i) => (
                              <div key={i} className="font-bold text-gray-400 text-xs w-10">
                                {col}
                              </div>
                            ))}
                            {clsSeats.map((seat, idx) => {
                              const isAisleNext = (idx + 1) % 6 === 3
                              const isSelected = selectedSeat?.id === seat.id
                              const seatColor = !seat.is_available
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                                : isSelected
                                  ? "bg-green-500 hover:bg-green-600 text-white"
                                  : seat.class === "first"
                                    ? "bg-purple-200 hover:bg-purple-300 border-purple-400 text-purple-900"
                                    : seat.class === "business"
                                      ? "bg-sky-200 hover:bg-sky-300 border-sky-400 text-sky-900"
                                      : "bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800"

                              return (
                                <div key={seat.id} className="contents">
                                  <button
                                    disabled={!seat.is_available}
                                    onClick={() => handleSeatSelect(seat)}
                                    className={`w-11 h-11 text-xs font-medium rounded border transition-colors ${seatColor}`}
                                    title={`${seat.seat_number} - ${seat.class.toUpperCase()}${seat.extra_fee > 0 ? ` (+$${seat.extra_fee})` : ""}`}
                                  >
                                    {getRowNum(seat.seat_number)}
                                  </button>
                                  {isAisleNext && <div className="w-6"></div>}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original total</span>
                    <span>{formatCurrency(booking.total_price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New base fare</span>
                    <span>{formatCurrency(selectedFlight.base_price)}</span>
                  </div>
                  {selectedSeat && selectedSeat.extra_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Seat upgrade fee</span>
                      <span>{formatCurrency(selectedSeat.extra_fee)}</span>
                    </div>
                  )}
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
                    onClick={() => setStep("confirm")}
                  >
                    Continue to Confirmation
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {step === "confirm" && selectedFlight && selectedSeat && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">New Flight</p>
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
                <span className="font-medium">{formatTime(selectedFlight.departs_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arrival</span>
                <span className="font-medium">{formatTime(selectedFlight.arrives_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seat</span>
                <span className="font-medium">
                  {selectedSeat.seat_number} &middot; <span className="capitalize">{selectedSeat.class}</span>
                </span>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Price Breakdown</p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Original booking</span>
                <span>{formatCurrency(booking.total_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">New base fare</span>
                <span>{formatCurrency(selectedFlight.base_price)}</span>
              </div>
              {selectedSeat.extra_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seat upgrade fee</span>
                  <span>{formatCurrency(selectedSeat.extra_fee)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reschedule fee</span>
                <span>{formatCurrency(rescheduleFee)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Amount due</span>
                <span className="text-blue-600">{formatCurrency(newTotal)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("select_seat")}
                disabled={isProcessing}
              >
                Back to Seats
              </Button>
              <Button
                className="flex-1"
                disabled={isProcessing}
                onClick={handleConfirm}
              >
                {isProcessing ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Confirm & Pay ${formatCurrency(newTotal)}`
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
