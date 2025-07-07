import type { Metadata } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export const metadata: Metadata = {
  title: 'Mortgage Lead Hub - Manage Your Leads Efficiently',
  description:
    'A modern, intuitive dashboard for managing mortgage leads with drag-and-drop functionality, real-time updates, and comprehensive lead tracking.',
  keywords: [
    'mortgage',
    'leads',
    'CRM',
    'dashboard',
    'real estate',
    'lead management',
  ],
  authors: [{ name: 'Mortgage Lead Hub Team' }],
  creator: 'Mortgage Lead Hub',
  publisher: 'Mortgage Lead Hub',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mortgage-lead-hub.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Mortgage Lead Hub - Manage Your Leads Efficiently',
    description:
      'A modern, intuitive dashboard for managing mortgage leads with drag-and-drop functionality.',
    url: 'https://mortgage-lead-hub.vercel.app',
    siteName: 'Mortgage Lead Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mortgage Lead Hub Dashboard',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mortgage Lead Hub - Manage Your Leads Efficiently',
    description:
      'A modern, intuitive dashboard for managing mortgage leads with drag-and-drop functionality.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body
        className="min-h-screen bg-background antialiased"
        style={{ backgroundColor: '#F4F8FA' }}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
