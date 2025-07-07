import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rate limiting store (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

// Security: Input validation patterns
const DANGEROUS_PATTERNS = [
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

function validateInput(email: string, password: string): string | null {
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email format'
  }

  // Password validation
  if (password.length < 8) {
    return 'Password too short'
  }

  // Check for injection attempts
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(email) || pattern.test(password)) {
      return 'Invalid characters detected'
    }
  }

  return null
}

function checkRateLimit(ip: string): {
  allowed: boolean
  remainingTime?: number
} {
  const now = Date.now()
  const attempt = loginAttempts.get(ip)

  if (!attempt) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return { allowed: true }
  }

  // Reset if 15 minutes have passed
  if (now - attempt.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now })
    return { allowed: true }
  }

  // Check if exceeded limit
  if (attempt.count >= 3) {
    const remainingTime = Math.ceil(
      (15 * 60 * 1000 - (now - attempt.lastAttempt)) / 60000
    )
    return { allowed: false, remainingTime }
  }

  // Increment attempt count
  loginAttempts.set(ip, { count: attempt.count + 1, lastAttempt: now })
  return { allowed: true }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'

    // Rate limiting check
    const rateLimitResult = checkRateLimit(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Try again in ${rateLimitResult.remainingTime} minutes.`,
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password } = body

    // Server-side input validation
    const validationError = validateInput(email, password)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: validationError },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    if (error) {
      // Log security event
      console.warn(`Failed login attempt for ${email} from IP ${ip}`)

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Success - reset rate limit for this IP
    loginAttempts.delete(ip)

    // Log successful login
    console.log(`Successful login for ${email} from IP ${ip}`)

    // Create response with session cookies
    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: data.session,
    })

    // Set session cookies for proper authentication
    if (data.session) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: data.session.expires_in,
        path: '/',
      })

      response.cookies.set('sb-refresh-token', data.session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
