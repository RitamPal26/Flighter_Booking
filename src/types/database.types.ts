export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          booked_at: string
          flight_id: string | null
          id: string
          pnr_code: string
          seat_id: string | null
          status: string
          total_price: number
          user_id: string | null
        }
        Insert: {
          booked_at?: string
          flight_id?: string | null
          id?: string
          pnr_code: string
          seat_id?: string | null
          status: string
          total_price: number
          user_id?: string | null
        }
        Update: {
          booked_at?: string
          flight_id?: string | null
          id?: string
          pnr_code?: string
          seat_id?: string | null
          status?: string
          total_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      flights: {
        Row: {
          aircraft_type: string
          arrives_at: string
          base_price: number
          departs_at: string
          destination: string
          flight_no: string
          id: string
          origin: string
          status: string
        }
        Insert: {
          aircraft_type: string
          arrives_at: string
          base_price: number
          departs_at: string
          destination: string
          flight_no: string
          id?: string
          origin: string
          status?: string
        }
        Update: {
          aircraft_type?: string
          arrives_at?: string
          base_price?: number
          departs_at?: string
          destination?: string
          flight_no?: string
          id?: string
          origin?: string
          status?: string
        }
        Relationships: []
      }
      passengers: {
        Row: {
          booking_id: string | null
          dob: string
          full_name: string
          id: string
          nationality: string
          passport_no: string
        }
        Insert: {
          booking_id?: string | null
          dob: string
          full_name: string
          id?: string
          nationality: string
          passport_no: string
        }
        Update: {
          booking_id?: string | null
          dob?: string
          full_name?: string
          id?: string
          nationality?: string
          passport_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      reschedules: {
        Row: {
          booking_id: string | null
          fee_charged: number
          id: string
          new_booking_id: string | null
          new_flight_id: string | null
          old_flight_id: string | null
          requested_at: string
        }
        Insert: {
          booking_id?: string | null
          fee_charged?: number
          id?: string
          new_booking_id?: string | null
          new_flight_id?: string | null
          old_flight_id?: string | null
          requested_at?: string
        }
        Update: {
          booking_id?: string | null
          fee_charged?: number
          id?: string
          new_booking_id?: string | null
          new_flight_id?: string | null
          old_flight_id?: string | null
          requested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reschedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedules_new_booking_id_fkey"
            columns: ["new_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedules_new_flight_id_fkey"
            columns: ["new_flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reschedules_old_flight_id_fkey"
            columns: ["old_flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          class: string
          extra_fee: number
          flight_id: string | null
          id: string
          is_available: boolean
          seat_number: string
        }
        Insert: {
          class: string
          extra_fee?: number
          flight_id?: string | null
          id?: string
          is_available?: boolean
          seat_number: string
        }
        Update: {
          class?: string
          extra_fee?: number
          flight_id?: string | null
          id?: string
          is_available?: boolean
          seat_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "seats_flight_id_fkey"
            columns: ["flight_id"]
            isOneToOne: false
            referencedRelation: "flights"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_seat: {
        Args: {
          p_flight_id: string
          p_pnr_code: string
          p_seat_id: string
          p_total_price: number
          p_user_id: string
        }
        Returns: string
      }
      cancel_booking: { Args: { p_booking_id: string }; Returns: undefined }
      reschedule_booking: {
        Args: {
          p_booking_id: string
          p_new_flight_id: string
          p_new_pnr_code: string
          p_new_seat_id: string
          p_new_total_price: number
          p_reschedule_fee: number
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
