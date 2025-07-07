export interface ClientTheme {
  name: string
  logo: {
    src: string
    alt: string
    width?: number
    height?: number
  }
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    background: string
    foreground: string
    card: string
    cardForeground: string
    border: string
    input: string
    ring: string
    muted: string
    mutedForeground: string
    destructive: string
    destructiveForeground: string
  }
  branding: {
    companyName: string
    tagline?: string
    primaryColor: string
    secondaryColor: string
  }
}

export const clientThemes: Record<string, ClientTheme> = {
  owl: {
    name: 'OwlMortgage Lead Hub',
    logo: {
      src: '/owl-mortgage-logo.svg',
      alt: 'OwlMortgage Lead Hub Logo',
      width: 45,
      height: 45,
    },
    colors: {
      primary: '#2C5F7C', // Dark blue from owl
      primaryForeground: '#FFFFFF',
      secondary: '#40B5A8', // Teal/turquoise from owl
      secondaryForeground: '#FFFFFF',
      accent: '#5FCCC9', // Light teal accent
      accentForeground: '#FFFFFF',
      background: '#FAFCFC',
      foreground: '#1A3A47', // Deep blue-gray
      card: '#FFFFFF',
      cardForeground: '#1A3A47',
      border: '#D1E7E5', // Light teal border
      input: '#FFFFFF',
      ring: '#40B5A8',
      muted: '#F0F8F7', // Very light teal
      mutedForeground: '#4A6B73', // Medium blue-gray
      destructive: '#DC2626',
      destructiveForeground: '#FFFFFF',
    },
    branding: {
      companyName: 'OwlMortgage Lead Hub',
      tagline: 'Smart Mortgage Solutions',
      primaryColor: '#2C5F7C',
      secondaryColor: '#40B5A8',
    },
  },
  default: {
    name: 'OwlMortgage Lead Hub',
    logo: {
      src: '/owl-mortgage.png',
      alt: 'Mortgage Hub Logo',
      width: 40,
      height: 40,
    },
    colors: {
      primary: '#0F172A',
      primaryForeground: '#F8FAFC',
      secondary: '#F1F5F9',
      secondaryForeground: '#0F172A',
      accent: '#F1F5F9',
      accentForeground: '#0F172A',
      background: '#FFFFFF',
      foreground: '#0F172A',
      card: '#FFFFFF',
      cardForeground: '#0F172A',
      border: '#E2E8F0',
      input: '#FFFFFF',
      ring: '#0F172A',
      muted: '#F1F5F9',
      mutedForeground: '#64748B',
      destructive: '#DC2626',
      destructiveForeground: '#FFFFFF',
    },
    branding: {
      companyName: 'OwlMortgage.ca',
      tagline: 'Smart Mortgage Solutions',
      primaryColor: '#0F172A',
      secondaryColor: '#64748B',
    },
  },
}

export function getClientTheme(clientId?: string): ClientTheme {
  if (!clientId) return clientThemes.default
  return clientThemes[clientId] || clientThemes.default
}

export function generateCSSVariables(theme: ClientTheme): string {
  return `
    :root {
      --primary: ${theme.colors.primary};
      --primary-foreground: ${theme.colors.primaryForeground};
      --secondary: ${theme.colors.secondary};
      --secondary-foreground: ${theme.colors.secondaryForeground};
      --accent: ${theme.colors.accent};
      --accent-foreground: ${theme.colors.accentForeground};
      --background: ${theme.colors.background};
      --foreground: ${theme.colors.foreground};
      --card: ${theme.colors.card};
      --card-foreground: ${theme.colors.cardForeground};
      --border: ${theme.colors.border};
      --input: ${theme.colors.input};
      --ring: ${theme.colors.ring};
      --muted: ${theme.colors.muted};
      --muted-foreground: ${theme.colors.mutedForeground};
      --destructive: ${theme.colors.destructive};
      --destructive-foreground: ${theme.colors.destructiveForeground};
    }
  `.trim()
}
