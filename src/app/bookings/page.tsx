import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import BookingsClient from "./BookingsClient"

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

export default async function BookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, flights(*), seats(*)")
    .eq("user_id", user.id)
    .order("booked_at", { ascending: false })
    .returns<BookingWithJoins[]>()

  return <BookingsClient bookings={bookings ?? []} />
}
