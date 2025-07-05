/**
 * Script to create an Owl Mortgage user account
 * Run this script to set up credentials for Owl Mortgage
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnvFile()

// Configuration
const OWL_CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const DEFAULT_EMAIL = 'admin@owlmortgage.com'
const DEFAULT_PASSWORD = 'OwlMortgage2024!' // Change this to a secure password

async function createOwlUser() {
  // Initialize Supabase admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration')
    console.log('Make sure you have set up your .env.local file with:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('🔧 Creating Owl Mortgage user account...')
    
    // Create user with admin privileges
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: DEFAULT_EMAIL,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        client_id: OWL_CLIENT_ID,
        role: 'admin',
        company: 'Owl Mortgage'
      }
    })

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('⚠️  User already exists, updating metadata...')
        
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === DEFAULT_EMAIL)
        
        if (existingUser) {
          // Update user metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                client_id: OWL_CLIENT_ID,
                role: 'admin',
                company: 'Owl Mortgage'
              }
            }
          )
          
          if (updateError) {
            throw updateError
          }
          
          console.log('✅ Updated existing user metadata')
        }
      } else {
        throw createError
      }
    } else {
      console.log('✅ Created new user account')
    }

    // Verify the setup
    console.log('🔍 Verifying user setup...')
    
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('verify_user_client_association', { user_email: DEFAULT_EMAIL })
    
    if (verifyError) {
      console.warn('⚠️  Could not verify user association:', verifyError.message)
    } else if (verifyData && verifyData.length > 0) {
      const userData = verifyData[0]
      console.log('✅ User verification successful:')
      console.log(`   Email: ${userData.email}`)
      console.log(`   Client ID: ${userData.client_id}`)
      console.log(`   Client Name: ${userData.client_name}`)
    }

    console.log('\n🎉 Owl Mortgage credentials setup complete!')
    console.log('\nLogin credentials:')
    console.log(`   Email: ${DEFAULT_EMAIL}`)
    console.log(`   Password: ${DEFAULT_PASSWORD}`)
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!')
    
  } catch (error) {
    console.error('❌ Error setting up credentials:', error.message)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  createOwlUser()
}

module.exports = { createOwlUser }
