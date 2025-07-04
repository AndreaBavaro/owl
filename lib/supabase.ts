import { createClient } from '@supabase/supabase-js'
import { Database, Lead, Status } from './database.types'

// Re-export Status type
export type { Status } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth types
export type AuthProvider = 'google' | 'github' | 'facebook'

// Extended Lead type with UI-specific properties
export interface LeadWithUI extends Lead {
  priority?: 'low' | 'medium' | 'high'
  // Virtual property to combine first and last name
  fullName?: string
  // UUID should be available from the database
  uuid: string
  // Additional properties used in the application
  loan_type?: string | null
  loan_amount?: number | null
  notes?: string | null
  updated_at?: string | null
}

// Authentication functions
export async function signInWithEmail(email: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) {
    console.error('Error sending magic link:', error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function signInWithProvider(provider: AuthProvider): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider as any, // Type assertion to handle provider type compatibility
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  })

  if (error) {
    console.error(`Error signing in with ${provider}:`, error)
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Error signing out:', error)
    return false
  }
  
  return true
}

// Database functions
export async function getLeads(): Promise<LeadWithUI[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  // Convert database leads to UI leads with default priority
  return (data || []).map(lead => ({
    ...lead,
    priority: determinePriority(lead),
    fullName: combineNames(lead.first_name, lead.last_name)
  }))
}

// Helper function to determine lead priority based on business rules
function determinePriority(lead: Lead): 'low' | 'medium' | 'high' {
  // This is a placeholder implementation - customize based on your business rules
  // For example, you might prioritize based on loan amount, source, or time since creation
  const daysSinceCreation = (new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  
  if (daysSinceCreation > 7) return 'high'
  if (daysSinceCreation > 3) return 'medium'
  return 'low'
}

// Helper function to combine first and last name
function combineNames(firstName: string | null, lastName: string | null): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`
  } else if (firstName) {
    return firstName
  } else if (lastName) {
    return lastName
  }
  return 'Unknown'
}

export async function getLeadById(lead_id: number): Promise<LeadWithUI | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('lead_id', lead_id)
    .single()

  if (error) {
    console.error('Error fetching lead:', error)
    return null
  }

  if (!data) return null
  
  return {
    ...data,
    priority: determinePriority(data),
    fullName: combineNames(data.first_name, data.last_name)
  }
}

export async function updateLeadStatus(
  lead_id: number,
  status_code: string
): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({ status_code })
    .eq('lead_id', lead_id)

  if (error) {
    console.error('Error updating lead status:', error)
    return false
  }

  return true
}

export async function updateLead(
  lead_id: number,
  updates: Partial<Lead>
): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update(updates)
    .eq('lead_id', lead_id)

  if (error) {
    console.error('Error updating lead:', error)
    return false
  }

  return true
}

// Import UUID generation library
import { v4 as uuidv4 } from 'uuid'

export async function createLead(lead: Omit<Lead, 'lead_id' | 'created_at' | 'uuid'>): Promise<Lead | null> {
  // Set created_at to current timestamp and generate UUID if not provided
  const newLead = {
    ...lead,
    created_at: new Date().toISOString(),
    // UUID will be generated by the database thanks to our DEFAULT uuid_generate_v4()
    // But we can also generate it client-side if needed
    // uuid: uuidv4()
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([newLead])
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    return null
  }

  return data
}

export async function deleteLead(lead_id: number): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('lead_id', lead_id)

  if (error) {
    console.error('Error deleting lead:', error)
    return false
  }

  return true
}

// Get all statuses from the database
export async function getStatuses(): Promise<Status[]> {
  const { data, error } = await supabase
    .from('statuses')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching statuses:', error)
    return []
  }
  console.log(data);

  return data || []
}

// Get lead counts by status
export async function getLeadCounts(): Promise<Record<string, number>> {
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('status_code')

  const { data: statuses, error: statusesError } = await supabase
    .from('statuses')
    .select('status_code')

  if (leadsError || statusesError) {
    console.error('Error fetching lead counts:', leadsError || statusesError)
    return {}
  }

  // Initialize counts with 0 for all statuses
  const counts: Record<string, number> = {}
  statuses?.forEach(status => {
    counts[status.status_code] = 0
  })

  // Count leads by status
  leads?.forEach(lead => {
    if (lead.status_code) {
      counts[lead.status_code] = (counts[lead.status_code] || 0) + 1
    }
  })

  return counts
}

// Get current user session
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  return !!session
}
