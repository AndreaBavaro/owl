import { createClient } from '@supabase/supabase-js'
import { Client, MultiTenantDatabase } from './database.types'

// Development mode flag
const isDevelopment = process.env.NODE_ENV === 'development'
const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
                   !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Create Supabase client with multi-tenant database type
export const supabase = useSupabase ? createClient<MultiTenantDatabase>(supabaseUrl, supabaseAnonKey) : null

// Default client configuration
export const DEFAULT_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'
export const DEFAULT_CLIENT_NAME = 'Owl Mortgage'

// Client configuration interface
export interface ClientConfig {
  clientId: string
  name: string
  subdomain: string | null
  logoUrl: string | null
  primaryColor: string | null
  schema: string
  active: boolean
}

// Mock client configuration for development
const mockClientConfig: ClientConfig = {
  clientId: DEFAULT_CLIENT_ID,
  name: DEFAULT_CLIENT_NAME,
  subdomain: 'owl',
  logoUrl: null,
  primaryColor: '#4f46e5', // Indigo
  schema: 'client_owl',
  active: true
}

// Cache for client configurations
let clientConfigCache: Record<string, ClientConfig> = {}

/**
 * Get client configuration by ID
 */
export async function getClientConfig(clientId: string = DEFAULT_CLIENT_ID): Promise<ClientConfig | null> {
  // Return from cache if available
  if (clientConfigCache[clientId]) {
    return clientConfigCache[clientId]
  }

  // Use mock data in development mode or if Supabase is not configured
  if (!supabase) {
    const config = { ...mockClientConfig }
    clientConfigCache[clientId] = config
    return config
  }

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (error || !data) {
      console.error('Error fetching client configuration:', error)
      return null
    }

    // Convert database record to ClientConfig
    const config: ClientConfig = {
      clientId: data.client_id,
      name: data.name,
      subdomain: data.subdomain,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      schema: `client_${data.client_id.replace(/-/g, '_')}`,
      active: data.active
    }

    // Cache the result
    clientConfigCache[clientId] = config
    return config
  } catch (error) {
    console.error('Error fetching client configuration:', error)
    return null
  }
}

/**
 * Get client configuration by subdomain
 */
export async function getClientConfigBySubdomain(subdomain: string): Promise<ClientConfig | null> {
  // Use mock data in development mode or if Supabase is not configured
  if (!supabase) {
    if (subdomain === mockClientConfig.subdomain) {
      return mockClientConfig
    }
    return null
  }

  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('subdomain', subdomain)
      .single()

    if (error || !data) {
      console.error('Error fetching client by subdomain:', error)
      return null
    }

    // Convert database record to ClientConfig
    const config: ClientConfig = {
      clientId: data.client_id,
      name: data.name,
      subdomain: data.subdomain,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      schema: `client_${data.client_id.replace(/-/g, '_')}`,
      active: data.active
    }

    // Cache the result
    clientConfigCache[data.client_id] = config
    return config
  } catch (error) {
    console.error('Error fetching client by subdomain:', error)
    return null
  }
}

/**
 * Get client configuration from user session
 * This checks the user metadata for client_id
 */
export async function getClientConfigFromSession(): Promise<ClientConfig | null> {
  if (!supabase) {
    return mockClientConfig
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return null
    }

    const clientId = user.user_metadata?.client_id || DEFAULT_CLIENT_ID
    return getClientConfig(clientId)
  } catch (error) {
    console.error('Error getting client from session:', error)
    return null
  }
}

/**
 * Clear client configuration cache
 */
export function clearClientConfigCache() {
  clientConfigCache = {}
}

/**
 * Get current client schema from subdomain
 */
export function getCurrentClientSchema(): string {
  if (typeof window === 'undefined') {
    // SSR fallback - return default
    return 'client_owl'
  }
  
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]
  
  // Map subdomains to schemas
  const clientSchemaMap: Record<string, string> = {
    'owl': 'client_owl',
    'localhost': 'client_owl', // Development
    '127': 'client_owl', // Local IP
    // Add more clients as needed
  }
  
  return clientSchemaMap[subdomain] || 'client_owl'
}

/**
 * Get schema name for a specific client ID
 */
export function getClientSchema(clientId: string = DEFAULT_CLIENT_ID): string {
  // For the default client, use the proper schema name
  if (clientId === DEFAULT_CLIENT_ID) {
    return 'client_owl'
  }
  return `client_${clientId.replace(/-/g, '_')}`
}

/**
 * Get current client ID from subdomain
 */
export function getCurrentClientId(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_CLIENT_ID
  }
  
  const hostname = window.location.hostname
  const subdomain = hostname.split('.')[0]
  
  // Map subdomains to client IDs
  const clientIdMap: Record<string, string> = {
    'owl': DEFAULT_CLIENT_ID,
    'localhost': DEFAULT_CLIENT_ID,
    '127': DEFAULT_CLIENT_ID,
    // Add more clients as needed
  }
  
  return clientIdMap[subdomain] || DEFAULT_CLIENT_ID
}
