import { createClient } from './client'

export const flightService = {
  async searchFlights(origin: string, destination: string) {
    const supabase = createClient()
    return await supabase
      .from('flights')
      .select('*')
      .ilike('origin', `%${origin}%`)
      .ilike('destination', `%${destination}%`)
      .order('departs_at', { ascending: true })
  },

  async getCabinMap(flightId: string) {
    const supabase = createClient()
    return await supabase
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .order('seat_number', { ascending: true })
  }
}