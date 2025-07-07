'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPassword, isAuthenticated } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Shield, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [isBlocked, setIsBlocked] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Security: Rate limiting
  const MAX_LOGIN_ATTEMPTS = 3
  const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (authenticated) {
        router.push('/dashboard')
      }
    }

    checkAuth()

    // Check if user is temporarily blocked
    const blockExpiry = localStorage.getItem('loginBlockExpiry')
    if (blockExpiry && new Date().getTime() < parseInt(blockExpiry)) {
      setIsBlocked(true)
      const remainingTime = Math.ceil(
        (parseInt(blockExpiry) - new Date().getTime()) / 60000
      )
      toast({
        title: 'Account Temporarily Locked',
        description: `Too many failed attempts. Try again in ${remainingTime} minutes.`,
        variant: 'destructive',
      })
    }
  }, [router, toast])

  // Security: Input validation and sanitization
  const validateInput = (email: string, password: string): string | null => {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }

    // Password strength validation
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }

    // Check for potential injection attempts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /\bselect\b.*\bfrom\b/i,
      /\bunion\b.*\bselect\b/i,
      /\bdrop\b.*\btable\b/i,
      /\binsert\b.*\binto\b/i,
      /\bupdate\b.*\bset\b/i,
      /\bdelete\b.*\bfrom\b/i,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(email) || pattern.test(password)) {
        return 'Invalid characters detected in input'
      }
    }

    return null
  }

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isBlocked) {
      toast({
        title: 'Account Locked',
        description: 'Please wait before attempting to login again.',
        variant: 'destructive',
      })
      return
    }

    // Security: Input validation
    const validationError = validateInput(email, password)
    if (validationError) {
      toast({
        title: 'Invalid Input',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      // Use secure API endpoint instead of direct client call
      const response = await fetch('/api/auth/secure-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reset login attempts on successful login
        setLoginAttempts(0)
        localStorage.removeItem('loginBlockExpiry')

        // Establish client-side session with Supabase
        if (result.session) {
          // Set the session in Supabase client
          const { createClient } = await import('@supabase/supabase-js')
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          )

          await supabase.auth.setSession({
            access_token: result.session.access_token,
            refresh_token: result.session.refresh_token,
          })
        }

        toast({
          title: 'Signed in successfully',
          description: 'Welcome back to Owl Mortgage!',
        })

        // Small delay to ensure session is established
        setTimeout(() => {
          router.push('/dashboard')
        }, 100)
      } else {
        // Handle rate limiting from server
        if (response.status === 429) {
          setIsBlocked(true)
          const blockExpiry = new Date().getTime() + BLOCK_DURATION
          localStorage.setItem('loginBlockExpiry', blockExpiry.toString())

          toast({
            title: 'Account Temporarily Locked',
            description: result.error || 'Too many failed attempts.',
            variant: 'destructive',
          })
        } else {
          // Increment failed attempts for client-side tracking
          const newAttempts = loginAttempts + 1
          setLoginAttempts(newAttempts)

          if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
            setIsBlocked(true)
            const blockExpiry = new Date().getTime() + BLOCK_DURATION
            localStorage.setItem('loginBlockExpiry', blockExpiry.toString())

            toast({
              title: 'Account Temporarily Locked',
              description:
                'Too many failed attempts. Account locked for 15 minutes.',
              variant: 'destructive',
            })
          } else {
            toast({
              title: 'Login Failed',
              description: result.error || 'Invalid credentials',
              variant: 'destructive',
            })
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Connection Error',
        description: 'Unable to connect to server. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Secure Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your Owl Mortgage dashboard
          </p>
          {isBlocked && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <Lock className="h-4 w-4 text-red-500 mr-2" />
                <p className="text-sm text-red-700">
                  Account temporarily locked for security
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-200 space-y-6">
          <form onSubmit={handlePasswordSignIn} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@owlmortgage.com"
                disabled={loading || isBlocked}
                className="h-12 text-base"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  disabled={loading || isBlocked}
                  className="h-12 text-base pr-12"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading || isBlocked}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
              disabled={loading || isBlocked}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Secure Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Security Features
                </h3>
                <ul className="mt-2 text-xs text-blue-700 space-y-1">
                  <li>• Input validation and sanitization</li>
                  <li>• Rate limiting (3 attempts max)</li>
                  <li>• 15-minute lockout after failed attempts</li>
                  <li>• Protection against injection attacks</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
