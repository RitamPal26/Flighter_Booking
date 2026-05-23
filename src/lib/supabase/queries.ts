import { createClient } from './client'

export const flightService = {
  async searchFlights(origin: string, destination: string, date?: string) {
    const supabase = createClient()
    let query = supabase
      .from('flights')
      .select('*')
      .ilike('origin', `%${origin}%`)
      .ilike('destination', `%${destination}%`)

    if (date) {
      const dayStart = `${date}T00:00:00Z`
      const dayEnd = `${date}T23:59:59Z`
      query = query.gte('departs_at', dayStart).lte('departs_at', dayEnd)
    }

    return await query.order('departs_at', { ascending: true })
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

  async searchFlightsByDate(origin: string, destination: string, _date?: string) {
    const supabase = createClient()
    return await supabase
      .from('flights')
      .select('*')
      .ilike('origin', `%${origin}%`)
      .ilike('destination', `%${destination}%`)
      .order('departs_at', { ascending: true })
  }
}