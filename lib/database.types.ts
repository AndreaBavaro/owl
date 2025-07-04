export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          lead_id: number
          uuid: string
          external_id: string | null
          source: string | null
          service: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          created_at: string
          status_code: string | null
          referral_name: string | null
        }
        Insert: {
          lead_id?: number
          uuid?: string
          external_id?: string | null
          source?: string | null
          service?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          status_code?: string | null
          referral_name?: string | null
        }
        Update: {
          lead_id?: number
          uuid?: string
          external_id?: string | null
          source?: string | null
          service?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          created_at?: string
          status_code?: string | null
          referral_name?: string | null
        }
      }
      statuses: {
        Row: {
          status_code: string
          description: string | null
          sort_order: number | null
        }
        Insert: {
          status_code: string
          description?: string | null
          sort_order?: number | null
        }
        Update: {
          status_code?: string
          description?: string | null
          sort_order?: number | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for Supabase
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Lead = Tables<'leads'>
export type Status = Tables<'statuses'>
