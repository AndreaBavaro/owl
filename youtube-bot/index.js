const { google } = require('googleapis')
const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')

// Configuration
const CONFIG = {
  TARGET_CHANNEL_HANDLE: '@wiseoldowlshow',
  TALLY_FORM_URL: 'https://tally.so/r/w4R8lb',
  MAX_RESPONSES_PER_HOUR: 3,
  MAX_RESPONSES_PER_DAY: 15,
  MIN_COMMENT_LENGTH: 5,
  MAX_REPLIES_TO_SKIP: 3,
  DELAY_BETWEEN_RESPONSES: [5, 15], // minutes
  KEYWORDS: [
    'wealth',
    'renewal',
    'mortgage',
    'refinance',
    'equity',
    'money',
    'home',
    'purchase',
    'rate',
    'bank',
    'help',
    'loan',
    'lending',
    'credit',
    'debt',
    'payment',
    'interest',
    'approval',
    'qualify',
    'application',
    'broker',
    'lender',
    'closing',
    'downpayment',
    'preapproval',
    'amortization',
    'insurance',
    'property',
    'investment',
    'buyer',
    'seller',
    'realtor',
    'agent',
    'financing',
    'consolidation',
    'heloc',
    'line of credit',
  ],
}

// Response templates
const RESPONSES = {
  QUESTION:
    "Great question about {keyword}! We'd be happy to help you explore your options. Feel free to reach out: {form_url}",
  STATEMENT_1:
    "That's a common concern with {keyword}. Our team specializes in finding the right solutions. Contact us here: {form_url}",
  STATEMENT_2:
    'Happy to help with your {keyword} questions! We work with clients in similar situations daily. Get in touch: {form_url}',
}

class YouTubeBot {
  constructor() {
    this.youtube = null
    this.oauth2Client = null
    this.dataDir = path.join(__dirname, 'data')
    this.initializeDataDir()
  }

  async initializeDataDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true })
    } catch (error) {
      console.log('Data directory already exists or created')
    }
  }

  async initialize() {
    try {
      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob'
      )

      // Set refresh token if available
      if (process.env.GOOGLE_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        })
      }

      // Initialize YouTube API
      this.youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
      })

      console.log('✅ YouTube Bot initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize YouTube Bot:', error.message)
      return false
    }
  }

  async getChannelId() {
    try {
      const response = await this.youtube.channels.list({
        part: 'id',
        forHandle: CONFIG.TARGET_CHANNEL_HANDLE,
      })

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id
      }

      throw new Error(`Channel not found: ${CONFIG.TARGET_CHANNEL_HANDLE}`)
    } catch (error) {
      console.error('❌ Error getting channel ID:', error.message)
      return null
    }
  }

  async getRecentVideos(channelId, maxResults = 50, daysBack = 30) {
    try {
      const publishedAfter = new Date(
        Date.now() - daysBack * 24 * 60 * 60 * 1000
      ).toISOString()
      
      console.log(`🔍 Searching for videos published after: ${publishedAfter}`)
      
      const response = await this.youtube.search.list({
        part: 'id,snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: maxResults,
        publishedAfter: publishedAfter,
      })

      const videos = response.data.items || []
      console.log(`📹 Found ${videos.length} videos from the last ${daysBack} days`)
      
      return videos
    } catch (error) {
      console.error('❌ Error getting recent videos:', error.message)
      return []
    }
  }

  async getVideoComments(videoId, maxResults = 50) {
    try {
      const response = await this.youtube.commentThreads.list({
        part: 'snippet',
        videoId: videoId,
        maxResults: maxResults,
        order: 'time',
      })

      return response.data.items || []
    } catch (error) {
      console.error(
        `❌ Error getting comments for video ${videoId}:`,
        error.message
      )
      return []
    }
  }

  containsKeywords(text) {
    const lowerText = text.toLowerCase()
    const foundKeywords = CONFIG.KEYWORDS.filter((keyword) =>
      lowerText.includes(keyword.toLowerCase())
    )
    return foundKeywords.length > 0 ? foundKeywords[0] : null
  }

  isQuestion(text) {
    const lowerText = text.toLowerCase()
    return (
      text.includes('?') ||
      lowerText.includes('how ') ||
      lowerText.includes('what ') ||
      lowerText.includes('when ') ||
      lowerText.includes('where ') ||
      lowerText.includes('why ') ||
      lowerText.includes('can you') ||
      lowerText.includes('could you') ||
      lowerText.includes('would you')
    )
  }

  generateResponse(commentText, keyword) {
    const isQuestionComment = this.isQuestion(commentText)
    let template

    if (isQuestionComment) {
      template = RESPONSES.QUESTION
    } else {
      // Randomly choose between the two statement responses
      template =
        Math.random() < 0.5 ? RESPONSES.STATEMENT_1 : RESPONSES.STATEMENT_2
    }

    return template
      .replace('{keyword}', keyword)
      .replace('{form_url}', CONFIG.TALLY_FORM_URL)
  }

  async loadData(filename) {
    try {
      const filePath = path.join(this.dataDir, filename)
      const data = await fs.readFile(filePath, 'utf8')
      return JSON.parse(data)
    } catch (error) {
      return {}
    }
  }

  async saveData(filename, data) {
    try {
      const filePath = path.join(this.dataDir, filename)
      await fs.writeFile(filePath, JSON.stringify(data, null, 2))
    } catch (error) {
      console.error(`❌ Error saving ${filename}:`, error.message)
    }
  }

  async checkRateLimits() {
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()

    const dailyData = await this.loadData('daily_responses.json')
    const hourlyData = await this.loadData('hourly_responses.json')

    const dailyCount = dailyData[today] || 0
    const hourlyCount = hourlyData[`${today}-${currentHour}`] || 0

    return {
      canRespond:
        dailyCount < CONFIG.MAX_RESPONSES_PER_DAY &&
        hourlyCount < CONFIG.MAX_RESPONSES_PER_HOUR,
      dailyCount,
      hourlyCount,
    }
  }

  async incrementResponseCount() {
    const today = new Date().toISOString().split('T')[0]
    const currentHour = new Date().getHours()

    // Update daily count
    const dailyData = await this.loadData('daily_responses.json')
    dailyData[today] = (dailyData[today] || 0) + 1
    await this.saveData('daily_responses.json', dailyData)

    // Update hourly count
    const hourlyData = await this.loadData('hourly_responses.json')
    const hourlyKey = `${today}-${currentHour}`
    hourlyData[hourlyKey] = (hourlyData[hourlyKey] || 0) + 1
    await this.saveData('hourly_responses.json', hourlyData)
  }

  async hasRespondedToUser(userId) {
    const userData = await this.loadData('responded_users.json')
    const lastResponse = userData[userId]

    if (!lastResponse) return false

    const daysSinceResponse =
      (Date.now() - new Date(lastResponse).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceResponse < 7 // Don't respond to same user within 7 days
  }

  async markUserResponded(userId) {
    const userData = await this.loadData('responded_users.json')
    userData[userId] = new Date().toISOString()
    await this.saveData('responded_users.json', userData)
  }

  async hasRespondedToVideo(videoId) {
    const respondedVideos = await this.loadData('responded_videos.json')
    return respondedVideos.includes(videoId)
  }

  async markVideoResponded(videoId) {
    const respondedVideos = await this.loadData('responded_videos.json')
    respondedVideos.push(videoId)
    await this.saveData('responded_videos.json', respondedVideos)
  }

  async hasProcessedVideo(videoId) {
    const processedVideos = await this.loadData('processed_videos.json')
    return processedVideos.some(v => v.videoId === videoId)
  }

  async markVideoProcessed(videoId, videoTitle, publishedAt) {
    const processedVideos = await this.loadData('processed_videos.json')
    processedVideos.push({
      videoId,
      title: videoTitle,
      publishedAt,
      processedAt: new Date().toISOString(),
      commentsChecked: 0,
      responsesPosted: 0
    })
    await this.saveData('processed_videos.json', processedVideos)
  }

  async updateVideoStats(videoId, commentsChecked, responsesPosted) {
    const processedVideos = await this.loadData('processed_videos.json')
    const videoIndex = processedVideos.findIndex(v => v.videoId === videoId)
    if (videoIndex !== -1) {
      processedVideos[videoIndex].commentsChecked = commentsChecked
      processedVideos[videoIndex].responsesPosted = responsesPosted
      processedVideos[videoIndex].lastProcessed = new Date().toISOString()
      await this.saveData('processed_videos.json', processedVideos)
    }
  }

  async getProcessingStats() {
    const processedVideos = await this.loadData('processed_videos.json')
    const rateLimits = await this.checkRateLimits()
    
    // Ensure processedVideos is an array
    const videosArray = Array.isArray(processedVideos) ? processedVideos : []
    
    return {
      totalVideosProcessed: videosArray.length,
      totalCommentsChecked: videosArray.reduce((sum, v) => sum + (v.commentsChecked || 0), 0),
      totalResponsesPosted: videosArray.reduce((sum, v) => sum + (v.responsesPosted || 0), 0),
      dailyResponsesRemaining: CONFIG.MAX_RESPONSES_PER_DAY - rateLimits.dailyCount,
      hourlyResponsesRemaining: CONFIG.MAX_RESPONSES_PER_HOUR - rateLimits.hourlyCount,
      lastProcessedVideo: videosArray.length > 0 ? videosArray[videosArray.length - 1] : null
    }
  }

  // Enhanced logging system
  async logActivity(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data
    }
    
    // Console output with colors
    const colors = {
      INFO: '\x1b[36m',    // Cyan
      SUCCESS: '\x1b[32m', // Green
      WARNING: '\x1b[33m', // Yellow
      ERROR: '\x1b[31m',   // Red
      RESET: '\x1b[0m'     // Reset
    }
    
    const color = colors[level] || colors.RESET
    console.log(`${color}[${timestamp}] ${level}: ${message}${colors.RESET}`)
    if (data) {
      console.log(`${color}Data:${colors.RESET}`, JSON.stringify(data, null, 2))
    }
    
    // Save to log file
    await this.saveLogEntry(logEntry)
  }
  
  async saveLogEntry(logEntry) {
    try {
      const logFile = path.join(this.dataDir, 'activity_log.json')
      let logs = []
      
      if (fsSync.existsSync(logFile)) {
        const content = fsSync.readFileSync(logFile, 'utf8')
        logs = JSON.parse(content)
      }
      
      logs.push(logEntry)
      
      // Keep only last 1000 log entries to prevent file from growing too large
      if (logs.length > 1000) {
        logs = logs.slice(-1000)
      }
      
      fsSync.writeFileSync(logFile, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.error('Failed to save log entry:', error.message)
    }
  }
  
  async generateDailyReport() {
    const today = new Date().toISOString().split('T')[0]
    const stats = await this.getProcessingStats()
    const rateLimits = await this.checkRateLimits()
    
    const report = {
      date: today,
      timestamp: new Date().toISOString(),
      statistics: stats,
      rateLimits: {
        hourlyUsed: rateLimits.hourlyCount,
        dailyUsed: rateLimits.dailyCount,
        hourlyLimit: CONFIG.MAX_RESPONSES_PER_HOUR,
        dailyLimit: CONFIG.MAX_RESPONSES_PER_DAY
      },
      performance: {
        videosProcessedToday: stats.totalVideosProcessed,
        commentsCheckedToday: stats.totalCommentsChecked,
        responsesPostedToday: stats.totalResponsesPosted
      }
    }
    
    await this.logActivity('INFO', 'Daily report generated', report)
    await this.saveData(`daily_report_${today}.json`, report)
    
    return report
  }

  async postComment(commentId, responseText) {
    try {
      if (!this.oauth2Client) {
        throw new Error('OAuth2 client not initialized')
      }

      const youtubeAuth = google.youtube({
        version: 'v3',
        auth: this.oauth2Client,
      })

      await youtubeAuth.comments.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: responseText,
          },
        },
      })

      return true
    } catch (error) {
      await this.logActivity('ERROR', 'Error posting comment', { error: error.message })
      return false
    }
  }

  async processComments(daysBack = 30, maxResponses = 5) {
    await this.logActivity('INFO', 'Starting YouTube comment processing', { daysBack, maxResponses })
    
    // Get initial stats
    const initialStats = await this.getProcessingStats()
    await this.logActivity('INFO', 'Initial Processing Stats', initialStats)

    // Check rate limits
    const rateLimits = await this.checkRateLimits()
    if (!rateLimits.canRespond) {
      await this.logActivity('WARNING', 'Rate limit reached', {
        daily: `${rateLimits.dailyCount}/${CONFIG.MAX_RESPONSES_PER_DAY}`,
        hourly: `${rateLimits.hourlyCount}/${CONFIG.MAX_RESPONSES_PER_HOUR}`
      })
      return
    }

    // Get channel ID
    const channelId = await this.getChannelId()
    if (!channelId) {
      await this.logActivity('ERROR', 'Could not get channel ID')
      return
    }

    await this.logActivity('SUCCESS', 'Found channel ID', { channelId })

    // Get recent videos from the specified time period
    const videos = await this.getRecentVideos(channelId, 50, daysBack)
    await this.logActivity('INFO', `Found videos from the last ${daysBack} days`, { 
      videoCount: videos.length,
      daysBack 
    })

    let responsesPosted = 0
    let videosProcessed = 0
    let totalCommentsChecked = 0

    for (const video of videos) {
      if (responsesPosted >= CONFIG.MAX_RESPONSES_PER_HOUR) {
        console.log('⏸️ Hourly limit reached, stopping')
        break
      }

      const videoId = video.id.videoId
      const videoTitle = video.snippet?.title || 'Unknown Title'
      const publishedAt = video.snippet?.publishedAt
      
      console.log(`🎥 Processing: "${videoTitle}" (${videoId})`)

      // Check if we've already processed this video
      if (await this.hasProcessedVideo(videoId)) {
        console.log(`⏭️ Already processed video: ${videoTitle}`)
        continue
      }

      // Mark video as processed
      await this.markVideoProcessed(videoId, videoTitle, publishedAt)
      videosProcessed++

      const comments = await this.getVideoComments(videoId)
      console.log(`💬 Found ${comments.length} comments`)
      totalCommentsChecked += comments.length
      
      let videoResponses = 0

      for (const commentThread of comments) {
        if (responsesPosted >= CONFIG.MAX_RESPONSES_PER_HOUR) break
        if (videoResponses >= 1) break // Only respond once per video to avoid spam

        const comment = commentThread.snippet.topLevelComment.snippet
        const commentText = comment.textOriginal
        const authorId = comment.authorChannelId?.value
        const commentId = commentThread.snippet.topLevelComment.id

        // Skip short comments
        if (commentText.length < CONFIG.MIN_COMMENT_LENGTH) continue

        // Skip if comment already has many replies
        if (commentThread.snippet.totalReplyCount > CONFIG.MAX_REPLIES_TO_SKIP)
          continue

        // Skip if we've responded to this user recently
        if (authorId && (await this.hasRespondedToUser(authorId))) continue

        // Check for keywords
        const foundKeyword = this.containsKeywords(commentText)
        if (!foundKeyword) continue

        console.log(
          `🎯 Found relevant comment with keyword "${foundKeyword}": ${commentText.substring(0, 100)}...`
        )

        // Generate response
        const responseText = this.generateResponse(commentText, foundKeyword)

        // Post response
        const success = await this.postComment(commentId, responseText)

        if (success) {
          console.log(`✅ Posted response: ${responseText}`)

          // Update tracking data
          await this.incrementResponseCount()
          if (authorId) await this.markUserResponded(authorId)
          await this.markVideoResponded(videoId)

          responsesPosted++
          videoResponses++

          // Add random delay between responses
          const delayMinutes =
            Math.random() *
              (CONFIG.DELAY_BETWEEN_RESPONSES[1] -
                CONFIG.DELAY_BETWEEN_RESPONSES[0]) +
            CONFIG.DELAY_BETWEEN_RESPONSES[0]
          console.log(
            `⏳ Waiting ${delayMinutes.toFixed(1)} minutes before next response...`
          )
          await new Promise((resolve) =>
            setTimeout(resolve, delayMinutes * 60 * 1000)
          )
        } else {
          console.log('❌ Failed to post response')
        }

        break // Only respond once per video
      }
      
      // Update video stats
      await this.updateVideoStats(videoId, comments.length, videoResponses)
    }

    // Log final processing results
    const sessionStats = {
      videosProcessed,
      commentsChecked: totalCommentsChecked,
      responsesPosted
    }
    
    await this.logActivity('SUCCESS', 'Processing session completed', sessionStats)
    
    // Get and log final overall stats
    const finalStats = await this.getProcessingStats()
    await this.logActivity('INFO', 'Final overall statistics', finalStats)
    
    // Generate daily report if it's a new day or significant activity
    if (responsesPosted > 0 || videosProcessed > 10) {
      await this.generateDailyReport()
    }
  }

  async run() {
    const initialized = await this.initialize()
    if (!initialized) {
      process.exit(1)
    }

    await this.processComments()
  }
}

// Run the bot
const bot = new YouTubeBot()
bot.run().catch((error) => {
  console.error('❌ Bot crashed:', error)
  process.exit(1)
})
