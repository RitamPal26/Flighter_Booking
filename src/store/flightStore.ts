import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Flight } from '@/types/supabase'

interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengers: number
}

interface PassengerDetails {
  fullName: string
  passportNo: string
  nationality: string
  dob: string
}

interface BookingResult {
  bookingId: string
  pnrCode: string
  seatNumber: string
  seatClass: string
  totalPrice: number
}

interface FlightState {
  searchQuery: SearchQuery | null
  selectedFlight: Flight | null
  selectedSeatId: string | null
  currentStep: 'search' | 'flight_selection' | 'seat_selection' | 'passenger_details' | 'confirmation'
  passengerData: PassengerDetails | null
  bookingResult: BookingResult | null
  pendingSeatId: string | null
  
  // Actions
  setSearchQuery: (query: SearchQuery) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeatId: (seatId: string | null) => void
  setStep: (step: FlightState['currentStep']) => void
  setPassengerData: (data: PassengerDetails) => void
  setBookingResult: (result: BookingResult) => void
  setPendingSeatId: (seatId: string | null) => void
  rollbackSeatSelection: (previousSeatId: string | null) => void
  resetBooking: () => void
}

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      searchQuery: null,
      selectedFlight: null,
      selectedSeatId: null,
      currentStep: 'search',
      passengerData: null,
      bookingResult: null,
      pendingSeatId: null,

      setSearchQuery: (query) => set({ searchQuery: query, currentStep: 'flight_selection' }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight, selectedSeatId: null, currentStep: 'seat_selection' }),
      setSelectedSeatId: (seatId) => set({ selectedSeatId: seatId, currentStep: 'passenger_details' }),
      setStep: (step) => set({ currentStep: step }),
      setPassengerData: (data) => set({ passengerData: data, currentStep: 'confirmation' }),
      setBookingResult: (result) => set({ bookingResult: result }),
      setPendingSeatId: (seatId) => set({ pendingSeatId: seatId }),
      rollbackSeatSelection: (previousSeatId) => set({ selectedSeatId: previousSeatId, pendingSeatId: null }),
      
      resetBooking: () => set({
        searchQuery: null,
        selectedFlight: null,
        selectedSeatId: null,
        currentStep: 'search',
        passengerData: null,
        bookingResult: null,
        pendingSeatId: null,
      }),
    }),
    {
      name: 'flight-storage',
      partialize: (state) => {
        if (!state.passengerData) return state;
        
        const safePassengerData = { ...state.passengerData };
        // Redact the passport number before it hits local storage
        safePassengerData.passportNo = ''; 
        
        return {
          ...state,
          passengerData: safePassengerData
        };
      },
    }
  )
)