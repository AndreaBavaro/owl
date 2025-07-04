'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, signOut, getCurrentUser } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated()
        if (!authenticated) {
          router.push('/login')
          return
        }
        
        const user = await getCurrentUser()
        setUserEmail(user?.email || null)
        setLoading(false)
      } catch (error) {
        console.error('Authentication error:', error)
        router.push('/login')
      }
    }
    
    checkAuth()
  }, [router])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully',
      })
      router.push('/login')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Mortgage Lead Hub</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              <span>{userEmail}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
