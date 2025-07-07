// Update admin password using Supabase client
// Run with: node update-password.js

const { createClient } = require('@supabase/supabase-js')

// You'll need your Supabase URL and Service Role Key (not anon key)
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function updateAdminPassword() {
  try {
    console.log('🔐 Updating admin password...')

    // First, get the user ID
    const { data: users, error: fetchError } =
      await supabase.auth.admin.listUsers()

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError.message)
      return
    }

    const adminUser = users.users.find(
      (user) => user.email === 'admin@owlmortgage.com'
    )

    if (!adminUser) {
      console.error('❌ Admin user not found!')
      return
    }

    console.log('👤 Found admin user:', adminUser.email)

    // Update the password
    const { data, error } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: 'TOBlueJays2025!' }
    )

    if (error) {
      console.error('❌ Error updating password:', error.message)
      return
    }

    console.log('✅ Password updated successfully!')
    console.log('📧 User:', data.user.email)
    console.log('🕐 Updated at:', data.user.updated_at)
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the update
updateAdminPassword()
