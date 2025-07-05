import { createClient } from '@supabase/supabase-js'
import { Lead, MultiTenantDatabase, Status } from './database.types'

import { getCurrentClientSchema } from './client-config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client with multi-tenant database type and proper session persistence
export const supabase = createClient<MultiTenantDatabase>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
)

// Re-export types
export type { Lead, Status } from './database.types'

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development'
const useSupabase = supabase !== null

if (!useSupabase && isDevelopment) {
  console.log('🔧 Development Mode: Using mock data instead of Supabase')
  console.log(
    'To use real Supabase, set up your .env.local file with valid credentials'
  )
} else if (!useSupabase) {
  console.warn('⚠️ Supabase environment variables are not properly configured')
}

// Auth types
export type AuthProvider = 'google' | 'github' | 'facebook'

// LeadWithUI interface removed - using Lead type directly

// Authentication functions
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return { success: false, error: 'Database not available' }
  }
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, error: null }
}

export async function signInWithProvider(
  provider: AuthProvider
): Promise<{ success: boolean; error: string | null }> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return { success: false, error: 'Database not available' }
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, error: null }
}

export async function signOut(): Promise<void> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return
  }
  await supabase.auth.signOut()
}

// Database functions
export async function getLeads(): Promise<Lead[]> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return []
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { data, error } = await supabase.rpc('get_leads_for_client', {
      client_schema: clientSchema,
    })

    if (error) {
      console.error('Error fetching leads:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getLeads:', error)
    return []
  }
}

// Helper function to determine lead priority based on business rules
function determinePriority(lead: Lead): 'low' | 'medium' | 'high' {
  // This is a placeholder implementation - customize based on your business rules
  // For example, you might prioritize based on loan amount, source, or time since creation
  const daysSinceCreation =
    (new Date().getTime() - new Date(lead.created_at).getTime()) /
    (1000 * 60 * 60 * 24)

  if (daysSinceCreation > 7) return 'high'
  if (daysSinceCreation > 3) return 'medium'
  return 'low'
}

// Helper function to combine first and last name
function combineNames(
  firstName: string | null,
  lastName: string | null
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  }
  return 'Unknown'
}

export async function getLeadById(id: number): Promise<Lead | null> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return null
  }

  try {
    const clientSchema = getCurrentClientSchema()
    const { data, error } = await supabase.rpc('get_lead_by_id', {
      client_schema: clientSchema,
      lead_id: id,
    })

    if (error) {
      console.error('Error fetching lead by id:', error)
      return null
    }
    return data as Lead | null
  } catch (error) {
    console.error('Error in getLeadById:', error)
    return null
  }
}

export async function getLead(id: number): Promise<Lead | null> {
  return getLeadById(id)
}

export async function updateLeadStatus(
  leadId: number,
  status: string
): Promise<{ success: boolean; error: any }> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return { success: false, error: { message: 'Database not available' } }
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { error } = await supabase.rpc('update_lead_status', {
      client_schema: clientSchema,
      lead_id: leadId,
      new_status: status,
    })

    if (error) {
      console.error('Error updating lead status:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in updateLeadStatus:', error)
    return { success: false, error }
  }
}

export async function updateLead(
  leadId: number,
  updates: Partial<Lead>
): Promise<Lead | null> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return null
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { data, error } = await supabase.rpc('update_lead', {
      client_schema: clientSchema,
      lead_id: leadId,
      lead_updates: updates,
    })

    if (error) {
      console.error('Error updating lead:', error)
      return null
    }

    return data as Lead | null
  } catch (error) {
    console.error('Error in updateLead:', error)
    return null
  }
}

// Import UUID generation library
import { v4 as uuidv4 } from 'uuid'

export async function createLead(
  lead: Omit<Lead, 'lead_id' | 'created_at' | 'client_id'>
): Promise<Lead | null> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return null
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { data, error } = await supabase.rpc('insert_lead_for_client', {
      client_schema: clientSchema,
      lead_data: lead,
    })

    if (error) {
      console.error('Error creating lead:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createLead:', error)
    return null
  }
}

export async function deleteLead(
  leadId: number
): Promise<{ success: boolean; error: any }> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return { success: false, error: { message: 'Database not available' } }
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { error } = await supabase.rpc('delete_lead', {
      client_schema: clientSchema,
      lead_id: leadId,
    })

    if (error) {
      console.error('Error deleting lead:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error in deleteLead:', error)
    return { success: false, error }
  }
}

// Get all statuses from the database
export async function getStatuses(): Promise<Status[]> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return []
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { data, error } = await supabase.rpc('get_statuses_for_client', {
      client_schema: clientSchema,
    })

    if (error) {
      console.error('Error fetching statuses:', error)
      return []
    }

    return (data as Status[]) || []
  } catch (error) {
    console.error('Error in getStatuses:', error)
    return []
  }
}

// Get lead counts by status
export async function getLeadCounts(): Promise<Record<string, number>> {
  if (!supabase) {
    console.log('Supabase not initialized')
    return {}
  }

  try {
    const clientSchema = getCurrentClientSchema()

    const { data, error } = await supabase.rpc('get_lead_counts_for_client', {
      client_schema: clientSchema,
    })

    if (error) {
      console.error('Error fetching lead counts:', error)
      return {}
    }

    return data || {}
  } catch (error) {
    console.error('Error in getLeadCounts:', error)
    return {}
  }
}

// Get current user session
export async function getCurrentUser() {
  if (!supabase) {
    console.log('Supabase not initialized')
    return null
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user || null
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  if (!supabase) {
    console.error(
      '❌ Supabase client not initialized! Check environment variables.'
    )
    console.log(
      'NEXT_PUBLIC_SUPABASE_URL:',
      process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'
    )
    console.log(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY:',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    )
    return false
  }

  try {
    console.log('🔍 Checking authentication...')
    // First check for existing session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('❌ Session check error:', sessionError)
      return false
    }

    console.log('📋 Session check result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
    })

    if (session?.user) {
      console.log('✅ User authenticated via session')
      return true
    }

    // Fallback to getUser if no session
    console.log('🔄 No session found, checking user directly...')
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      console.error('❌ User check error:', userError)
      return false
    }

    const isAuth = !!user
    console.log('📊 Final authentication result:', {
      isAuthenticated: isAuth,
      userEmail: user?.email,
    })
    return isAuth
  } catch (error) {
    console.error('💥 Authentication check failed:', error)
    return false
  }
}

// Real-time subscription functions
export function subscribeToLeads(callback: (payload: any) => void) {
  if (!supabase) {
    console.log('Mock mode: Real-time subscriptions not available')
    return null
  }

  const subscription = supabase
    .channel('leads-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'leads',
      },
      callback
    )
    .subscribe()

  return subscription
}

export function unsubscribeFromLeads(subscription: any) {
  if (subscription && supabase) {
    supabase.removeChannel(subscription)
  }
}
