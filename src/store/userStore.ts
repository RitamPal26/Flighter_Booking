import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  sessionToken: string | null
  setSessionToken: (token: string | null) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      sessionToken: null,
      setSessionToken: (token) => set({ sessionToken: token }),
      logout: () => {
        set({ sessionToken: null })
        // You can import useFlightStore.getState().resetBooking() here later 
        // to clear the flight state on logout as required by the assignment.
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ sessionToken: state.sessionToken }), // Persist ONLY the token
    }
  )
)