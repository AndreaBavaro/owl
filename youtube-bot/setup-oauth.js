const { google } = require('googleapis')
const readline = require('readline')

// OAuth2 setup script - run this once to get refresh token
async function setupOAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/oauth/callback'
  )

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/youtube',
    ],
  })

  console.log(
    '🔗 Open this URL in your browser and sign in with your dedicated YouTube account:'
  )
  console.log(authUrl)
  console.log("\n📋 After authorization, you'll get a code. Paste it here:")

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question('Enter the authorization code: ', async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code)

      console.log(
        '\n✅ Success! Add this refresh token to your GitHub Secrets:'
      )
      console.log('Secret Name: GOOGLE_REFRESH_TOKEN')
      console.log('Secret Value:', tokens.refresh_token)

      console.log('\n🔧 Also make sure you have these other secrets set:')
      console.log('YOUTUBE_API_KEY:', process.env.YOUTUBE_API_KEY || 'NOT SET')
      console.log(
        'GOOGLE_CLIENT_ID:',
        process.env.GOOGLE_CLIENT_ID || 'NOT SET'
      )
      console.log(
        'GOOGLE_CLIENT_SECRET:',
        process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET'
      )
    } catch (error) {
      console.error('❌ Error getting tokens:', error.message)
    }

    rl.close()
  })
}

// Check if environment variables are set
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.error(
    '❌ Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables'
  )
  console.log('\nExample:')
  console.log(
    'GOOGLE_CLIENT_ID="your-client-id" GOOGLE_CLIENT_SECRET="your-client-secret" node setup-oauth.js'
  )
  process.exit(1)
}

setupOAuth()
