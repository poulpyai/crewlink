export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'pilot' | 'examiner' | 'sim_company' | 'ame' | 'admin'

export type ExaminerType = 'TRE' | 'TRI' | 'SFE' | 'SFI' | 'FE' | 'FI'

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export type BookingType = 'simulator' | 'examiner' | 'ame'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: UserRole
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: UserRole
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      examiner_profiles: {
        Row: {
          id: string
          user_id: string
          examiner_number: string
          examiner_types: ExaminerType[]
          aircraft_types: string[]
          bio: string | null
          hourly_rate: number | null
          license_document_url: string | null
          verified: boolean
          location: string | null
          available_countries: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          examiner_number: string
          examiner_types: ExaminerType[]
          aircraft_types: string[]
          bio?: string | null
          hourly_rate?: number | null
          license_document_url?: string | null
          verified?: boolean
          location?: string | null
          available_countries?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          examiner_number?: string
          examiner_types?: ExaminerType[]
          aircraft_types?: string[]
          bio?: string | null
          hourly_rate?: number | null
          license_document_url?: string | null
          verified?: boolean
          location?: string | null
          available_countries?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      sim_companies: {
        Row: {
          id: string
          user_id: string
          company_name: string
          description: string | null
          logo_url: string | null
          location: string
          website: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          description?: string | null
          logo_url?: string | null
          location: string
          website?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          description?: string | null
          logo_url?: string | null
          location?: string
          website?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sim_slots: {
        Row: {
          id: string
          sim_company_id: string
          aircraft_type: string
          simulator_type: string
          start_time: string
          end_time: string
          price: number
          status: 'available' | 'booked' | 'maintenance'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sim_company_id: string
          aircraft_type: string
          simulator_type: string
          start_time: string
          end_time: string
          price: number
          status?: 'available' | 'booked' | 'maintenance'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sim_company_id?: string
          aircraft_type?: string
          simulator_type?: string
          start_time?: string
          end_time?: string
          price?: number
          status?: 'available' | 'booked' | 'maintenance'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          booking_type: BookingType
          sim_slot_id: string | null
          examiner_id: string | null
          ame_id: string | null
          status: BookingStatus
          total_price: number
          payment_intent_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          booking_type: BookingType
          sim_slot_id?: string | null
          examiner_id?: string | null
          ame_id?: string | null
          status?: BookingStatus
          total_price: number
          payment_intent_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          booking_type?: BookingType
          sim_slot_id?: string | null
          examiner_id?: string | null
          ame_id?: string | null
          status?: BookingStatus
          total_price?: number
          payment_intent_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
