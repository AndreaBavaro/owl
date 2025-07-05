'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const checkEnvironment = async () => {
      const info = {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        supabaseClient: !!supabase,
        timestamp: new Date().toISOString()
      }

      // Try to get session
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        info.sessionCheck = {
          success: !error,
          hasSession: !!session,
          hasUser: !!session?.user,
          userEmail: session?.user?.email,
          error: error?.message
        }
      } catch (err) {
        info.sessionCheck = {
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }

      setDebugInfo(info)
      console.log('🐛 Debug Info:', info)
    }

    checkEnvironment()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
