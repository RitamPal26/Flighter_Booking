"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/components/shared/ConfirmDialog"
import RescheduleDialog from "@/components/shared/RescheduleDialog"
import { formatInTimeZone } from "date-fns-tz"
import { formatCurrency, formatTime } from "@/utils/formatters"
import { toast } from "sonner"
import { cancelBooking } from "@/app/actions/bookingActions"
import { Loader2Icon } from "lucide-react"

interface BookingWithJoins {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: "confirmed" | "rescheduled" | "cancelled"
  booked_at: string
  total_price: number
  pnr_code: string
  flights: {
    id: string
    flight_no: string
    origin: string
    destination: string
    departs_at: string
    arrives_at: string
    aircraft_type: string
    status: string
    base_price: number
  } | null
  seats: {
    id: string
    seat_number: string
    class: "economy" | "business" | "first"
    extra_fee: number
  } | null
}

export default function BookingsClient({
  bookings,
}: {
  bookings: BookingWithJoins[]
}) {
  const router = useRouter()
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingWithJoins | null>(null)

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancellingId(cancelTarget)
    const result = await cancelBooking(cancelTarget)
    setCancellingId(null)
    setCancelTarget(null)

    if (!result.success) {
      toast.error("Cancellation failed", { description: result.error })
      return
    }

    toast.success("Booking cancelled")
    router.refresh()
  }

  const statusColor: Record<string, string> = {
    confirmed: "bg-green-100 text-green-800 border-green-200",
    rescheduled: "bg-amber-100 text-amber-800 border-amber-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          My Bookings
        </h1>

        {bookings.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Bookings Yet</CardTitle>
              <CardDescription>
                You haven&apos;t booked any flights yet. Find a flight to get started.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const flight = booking.flights
              const seat = booking.seats

              return (
                <Card
                  key={booking.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">
                            {flight?.flight_no ?? "Unknown"}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor[booking.status] ?? "bg-gray-100 text-gray-800"}`}
                          >
                            {booking.status.charAt(0).toUpperCase() +
                              booking.status.slice(1)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-500">
                          {flight?.origin ?? "?"} &rarr;{" "}
                          {flight?.destination ?? "?"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {flight
                            ? `${formatInTimeZone(flight.departs_at, 'UTC', 'MMM d, yyyy')}  ${formatTime(flight.departs_at)} - ${formatTime(flight.arrives_at)}`
                            : "Flight info unavailable"}
                        </p>
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-1">
                        <span className="text-xs text-gray-400">
                          PNR: {booking.pnr_code}
                        </span>
                        {seat && (
                          <span className="text-sm font-medium">
                            Seat {seat.seat_number} &middot;{" "}
                            <span className="capitalize">{seat.class}</span>
                          </span>
                        )}
                        <span className="text-lg font-bold text-gray-900">
                          {formatCurrency(booking.total_price)}
                        </span>
                        <span className="text-xs text-gray-400">
                          Booked{" "}
                          {formatInTimeZone(booking.booked_at, 'UTC', 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {booking.status === "confirmed" && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRescheduleTarget(booking)}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancellingId === booking.id}
                          onClick={() => setCancelTarget(booking.id)}
                        >
                          {cancellingId === booking.id ? (
                            <>
                              <Loader2Icon className="mr-1 size-3 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            "Cancel"
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null) }}
        title="Cancel Booking"
        description="Are you sure you want to cancel this booking? This action cannot be undone. Seats are not refundable within 2 hours of departure."
        confirmLabel="Cancel Booking"
        confirmVariant="destructive"
        onConfirm={handleCancel}
        loading={cancellingId !== null}
      />

      <RescheduleDialog
        booking={rescheduleTarget!}
        open={!!rescheduleTarget}
        onOpenChange={(open) => { if (!open) setRescheduleTarget(null) }}
      />
    </main>
  )
}
