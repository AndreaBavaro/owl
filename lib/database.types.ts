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
      clients: {
        Row: {
          client_id: string
          name: string
          subdomain: string | null
          logo_url: string | null
          primary_color: string | null
          created_at: string
          active: boolean
        }
        Insert: {
          client_id?: string
          name: string
          subdomain?: string | null
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
          active?: boolean
        }
        Update: {
          client_id?: string
          name?: string
          subdomain?: string | null
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
          active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_client_id: {
        Args: Record<string, never>
        Returns: string | null
      }
      create_client_schema: {
        Args: { client_id: string }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Client schema structure
export interface ClientSchema {
  Tables: {
    leads: {
      Row: {
        lead_id: number
        client_id: string
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
        client_id: string
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
        client_id?: string
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

// Extended Database type with dynamic client schemas
export interface MultiTenantDatabase extends Database {
  [schema: `client_${string}`]: ClientSchema
}

// Helper types for Supabase
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Client table types
export type ClientTables<T extends keyof ClientSchema['Tables']> = ClientSchema['Tables'][T]['Row']
export type ClientInsertTables<T extends keyof ClientSchema['Tables']> = ClientSchema['Tables'][T]['Insert']
export type ClientUpdateTables<T extends keyof ClientSchema['Tables']> = ClientSchema['Tables'][T]['Update']

// Specific table types
export type Client = Tables<'clients'>
export type Lead = ClientTables<'leads'>
export type Status = ClientTables<'statuses'>
