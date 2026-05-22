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

interface FlightState {
  searchQuery: SearchQuery | null
  selectedFlight: Flight | null
  selectedSeatId: string | null
  currentStep: 'search' | 'flight_selection' | 'seat_selection' | 'passenger_details' | 'confirmation'
  passengerData: PassengerDetails | null
  
  // Actions
  setSearchQuery: (query: SearchQuery) => void
  setSelectedFlight: (flight: Flight | null) => void
  setSelectedSeatId: (seatId: string | null) => void
  setStep: (step: FlightState['currentStep']) => void
  setPassengerData: (data: PassengerDetails) => void
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

      setSearchQuery: (query) => set({ searchQuery: query, currentStep: 'flight_selection' }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight, currentStep: 'seat_selection' }),
      setSelectedSeatId: (seatId) => set({ selectedSeatId: seatId, currentStep: 'passenger_details' }),
      setStep: (step) => set({ currentStep: step }),
      setPassengerData: (data) => set({ passengerData: data, currentStep: 'confirmation' }),
      
      resetBooking: () => set({
        searchQuery: null,
        selectedFlight: null,
        selectedSeatId: null,
        currentStep: 'search',
        passengerData: null,
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