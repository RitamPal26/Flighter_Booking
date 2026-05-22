import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useFlightStore } from './flightStore'

interface CachedBooking {
  id: string
  pnr_code: string
  flight_no: string
  origin: string
  destination: string
  departs_at: string
  arrives_at: string
  status: string
  seat_number: string
  seat_class: string
  total_price: number
}

interface UserState {
  sessionToken: string | null
  cachedBookings: CachedBooking[]
  setSessionToken: (token: string | null) => void
  setCachedBookings: (bookings: CachedBooking[]) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      sessionToken: null,
      cachedBookings: [],
      setSessionToken: (token) => set({ sessionToken: token }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      logout: () => {
        set({ sessionToken: null, cachedBookings: [] })
        useFlightStore.getState().resetBooking()
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ sessionToken: state.sessionToken, cachedBookings: state.cachedBookings }),
    }
  )
)
