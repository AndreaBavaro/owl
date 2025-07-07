const { google } = require('googleapis')

async function testBot() {
  console.log('🧪 Testing YouTube Bot...')

  const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
  })

  try {
    // Get channel ID from username
    const channelResponse = await youtube.search.list({
      part: 'snippet',
      q: '@wiseoldowlshow',
      type: 'channel',
      maxResults: 1,
    })

    if (
      !channelResponse.data.items ||
      channelResponse.data.items.length === 0
    ) {
      console.log('❌ Channel not found')
      return
    }

    const channelId = channelResponse.data.items[0].snippet.channelId
    console.log('📺 Found channel ID:', channelId)

    // Get recent videos
    const videosResponse = await youtube.search.list({
      part: 'snippet',
      channelId: channelId,
      type: 'video',
      order: 'date',
      maxResults: 3,
    })

    console.log(`🎥 Found ${videosResponse.data.items.length} recent videos`)

    // Check comments on first video
    if (videosResponse.data.items.length > 0) {
      const videoId = videosResponse.data.items[0].id.videoId
      const videoTitle = videosResponse.data.items[0].snippet.title
      console.log(`🔍 Checking comments on: "${videoTitle}"`)

      const commentsResponse = await youtube.commentThreads.list({
        part: 'snippet',
        videoId: videoId,
        maxResults: 10,
        order: 'time',
      })

      console.log(`💬 Found ${commentsResponse.data.items.length} comments`)

      // Keywords to look for
      const keywords = [
        'mortgage',
        'loan',
        'help',
        'money',
        'home',
        'rate',
        'bank',
      ]

      let relevantComments = 0
      commentsResponse.data.items.forEach((item, index) => {
        const comment =
          item.snippet.topLevelComment.snippet.textDisplay.toLowerCase()
        const author = item.snippet.topLevelComment.snippet.authorDisplayName

        const foundKeywords = keywords.filter((keyword) =>
          comment.includes(keyword)
        )
        if (foundKeywords.length > 0) {
          relevantComments++
          console.log(`\n🎯 Relevant Comment #${relevantComments}:`)
          console.log(`👤 Author: ${author}`)
          console.log(`🔑 Keywords: ${foundKeywords.join(', ')}`)
          console.log(`💬 Comment: ${comment.substring(0, 100)}...`)

          // Determine response type
          const isQuestion = /[?]|how|what|when|where|why/i.test(comment)
          console.log(`❓ Is Question: ${isQuestion ? 'Yes' : 'No'}`)
        }
      })

      console.log(
        `\n📊 Summary: Found ${relevantComments} relevant comments out of ${commentsResponse.data.items.length} total`
      )
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testBot()
