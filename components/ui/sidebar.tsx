'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BarChart3, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/components/providers/ThemeProvider'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { theme } = useTheme()

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 transform border-r bg-card dark:bg-card transition-transform duration-200 ease-in-out md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="border-b border-border p-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 group"
            >
              <div className="flex items-center justify-center transition-transform group-hover:scale-105">
                <Image
                  src={theme.logo.src}
                  alt={theme.logo.alt}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-primary">
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

          <nav className="flex-1 space-y-2 p-4">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 hover:bg-secondary/10 om-focus-ring',
                    isActive
                      ? 'bg-secondary/10 text-secondary border-l-2 border-secondary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Desktop sidebar spacer */}
      <div className="hidden md:block md:w-72" />
    </>
  )
}
