import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Flight } from '@/types/supabase'

interface SearchQuery {
  origin: string
  destination: string
  date: string
  passengers: number
}

export interface PassengerDetails {
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
  selectedSeatIds: string[]
  currentStep: 'search' | 'flight_selection' | 'seat_selection' | 'passenger_details' | 'confirmation'
  passengersData: PassengerDetails[]
  bookingResults: BookingResult[]
  pendingSeatId: string | null
  
  setSearchQuery: (query: SearchQuery) => void
  setSelectedFlight: (flight: Flight | null) => void
  toggleSeatSelection: (seatId: string) => void
  setStep: (step: FlightState['currentStep']) => void
  setPassengersData: (data: PassengerDetails[]) => void
  setBookingResults: (results: BookingResult[]) => void
  setPendingSeatId: (seatId: string | null) => void
  rollbackSeatSelection: (previousSeatIds: string[]) => void
  resetBooking: () => void
}

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      searchQuery: null,
      selectedFlight: null,
      selectedSeatIds: [],
      currentStep: 'search',
      passengersData: [],
      bookingResults: [],
      pendingSeatId: null,

      setSearchQuery: (query) => set({ searchQuery: query, currentStep: 'flight_selection' }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight, selectedSeatIds: [], currentStep: 'seat_selection' }),
      toggleSeatSelection: (seatId) => set((state) => {
        const ids = state.selectedSeatIds.includes(seatId)
          ? state.selectedSeatIds.filter((id) => id !== seatId)
          : [...state.selectedSeatIds, seatId]
        return { selectedSeatIds: ids }
      }),
      setStep: (step) => set({ currentStep: step }),
      setPassengersData: (data) => set({ passengersData: data, currentStep: 'confirmation' }),
      setBookingResults: (results) => set({ bookingResults: results }),
      setPendingSeatId: (seatId) => set({ pendingSeatId: seatId }),
      rollbackSeatSelection: (previousSeatIds) => set({ selectedSeatIds: previousSeatIds, pendingSeatId: null }),
      
      resetBooking: () => set({
        searchQuery: null,
        selectedFlight: null,
        selectedSeatIds: [],
        currentStep: 'search',
        passengersData: [],
        bookingResults: [],
        pendingSeatId: null,
      }),
    }),
    {
      name: 'flight-storage',
      partialize: (state) => {
        if (state.passengersData.length === 0) return state;
        
        const safePassengersData = state.passengersData.map((p) => ({
          ...p,
          passportNo: '',
        }));
        
        return {
          ...state,
          passengersData: safePassengersData,
        };
      },
    }
  )
)
