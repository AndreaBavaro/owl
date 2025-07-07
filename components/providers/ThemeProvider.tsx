'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  ClientTheme,
  getClientTheme,
  generateCSSVariables,
} from '@/lib/client-themes'
import { getCurrentClientId } from '@/lib/client-config'

interface ThemeContextType {
  theme: ClientTheme
  setTheme: (theme: ClientTheme) => void
  clientId: string | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize with correct theme immediately to prevent FOUC
  const initialClientId =
    typeof window !== 'undefined' ? getCurrentClientId() : null
  const [clientId, setClientId] = useState<string | null>(initialClientId)
  const [theme, setTheme] = useState<ClientTheme>(
    getClientTheme(initialClientId || undefined)
  )

  useEffect(() => {
    // Get client ID from subdomain
    const currentClientId = getCurrentClientId()
    setClientId(currentClientId)

    // Load theme based on client
    const clientTheme = getClientTheme(currentClientId)
    setTheme(clientTheme)

    // Apply CSS variables
    const styleElement = document.createElement('style')
    styleElement.id = 'client-theme-variables'
    styleElement.textContent = generateCSSVariables(clientTheme)

    // Remove existing theme styles
    const existingStyle = document.getElementById('client-theme-variables')
    if (existingStyle) {
      existingStyle.remove()
    }

    document.head.appendChild(styleElement)

    // Apply theme class to body for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '')
    document.body.classList.add(`theme-${currentClientId || 'default'}`)

    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [])

  // No loading state needed since we initialize with the correct theme

  return (
    <ThemeContext.Provider value={{ theme, setTheme, clientId }}>
      {children}
    </ThemeContext.Provider>
  )
}
