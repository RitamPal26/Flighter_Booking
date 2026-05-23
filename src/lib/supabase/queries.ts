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
  },

  async getAllFlights() {
    const supabase = createClient()
    return await supabase
      .from('flights')
      .select('*')
      .order('departs_at', { ascending: true })
  },

  async searchFlightsByDate(origin: string, destination: string, date: string) {
    const supabase = createClient()
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`
    return await supabase
      .from('flights')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .gte('departs_at', startOfDay)
      .lte('departs_at', endOfDay)
      .order('departs_at', { ascending: true })
  }
}