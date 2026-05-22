export interface Database {
  public: {
    Tables: {
      flights: {
        Row: Flight
        Insert: Omit<Flight, 'id'>
        Update: Partial<Omit<Flight, 'id'>>
      }
      seats: {
        Row: Seat
        Insert: Omit<Seat, 'id'>
        Update: Partial<Omit<Seat, 'id'>>
      }
      bookings: {
        Row: Booking
        Insert: Omit<Booking, 'id' | 'booked_at'>
        Update: Partial<Omit<Booking, 'id' | 'booked_at'>>
      }
    }
  }
}

export interface Flight {
  id: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  aircraft_type: string
  status: string
  base_price: number
}

export interface Seat {
  id: string
  flight_id: string
  seat_number: string
  class: 'economy' | 'business' | 'first'
  is_available: boolean
  extra_fee: number
}

export interface Booking {
  id: string
  user_id: string
  flight_id: string
  seat_id: string
  status: 'confirmed' | 'rescheduled' | 'cancelled'
  booked_at: string
  total_price: number
  pnr_code: string
}
