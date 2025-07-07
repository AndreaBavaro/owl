// components/Navbar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/providers/ThemeProvider'
import Image from 'next/image'

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const { theme } = useTheme()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full navbar-bg">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side: logo + text */}
        <Link href="/dashboard" className="flex items-center gap-4">
          <Image
            src={theme.logo.src}
            alt={theme.logo.alt}
            width={theme.logo.width || 48}
            height={theme.logo.height || 48}
            className="rounded-lg"
          />
          <div className="flex flex-col">
            <span
              className="font-bold text-2xl"
              style={{ color: theme.branding.primaryColor }}
            >
              {theme.branding.companyName}
            </span>
            {theme.branding.tagline && (
              <span className="text-sm text-muted-foreground">
                {theme.branding.tagline}
              </span>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
