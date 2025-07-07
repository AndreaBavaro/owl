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
      if (response.data.items.length) return response.data.items[0].id
      throw new Error(`Channel not found: ${CONFIG.TARGET_CHANNEL_HANDLE}`)
    } catch (error) {
      console.error('❌ Error getting channel ID:', error.message)
      return null
    }
  }

  async getRecentVideos(channelId, maxResults = 50, daysBack = 30) {
    try {
      const publishedAfter = new Date(
        Date.now() - daysBack * 86400000
      ).toISOString()
      console.log(`🔍 Searching for videos published after: ${publishedAfter}`)
      const response = await this.youtube.search.list({
        part: 'id,snippet',
        channelId,
        type: 'video',
        order: 'date',
        maxResults,
        publishedAfter,
      })
      const videos = response.data.items || []
      console.log(
        `📹 Found ${videos.length} videos from the last ${daysBack} days`
      )
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
        videoId,
        maxResults,
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
    const lower = text.toLowerCase()
    const found = CONFIG.KEYWORDS.find((k) => lower.includes(k.toLowerCase()))
    return found || null
  }

  isQuestion(text) {
    const lower = text.toLowerCase()
    return (
      text.includes('?') ||
      [
        'how ',
        'what ',
        'when ',
        'where ',
        'why ',
        'can you',
        'could you',
        'would you',
      ].some((p) => lower.includes(p))
    )
  }

  generateResponse(commentText, keyword) {
    const template = this.isQuestion(commentText)
      ? RESPONSES.QUESTION
      : Math.random() < 0.5
        ? RESPONSES.STATEMENT_1
        : RESPONSES.STATEMENT_2
    return template
      .replace('{keyword}', keyword)
      .replace('{form_url}', CONFIG.TALLY_FORM_URL)
  }

  async loadData(filename) {
    try {
      const data = await fs.readFile(path.join(this.dataDir, filename), 'utf8')
      return JSON.parse(data)
    } catch {
      // default arrays for list files
      return ['processed_videos.json', 'responded_videos.json'].includes(
        filename
      )
        ? []
        : {}
    }
  }

  async saveData(filename, data) {
    await fs.writeFile(
      path.join(this.dataDir, filename),
      JSON.stringify(data, null, 2)
    )
  }

  async checkRateLimits() {
    const today = new Date().toISOString().split('T')[0]
    const hourKey = `${today}-${new Date().getHours()}`
    const daily = await this.loadData('daily_responses.json')
    const hourly = await this.loadData('hourly_responses.json')
    return {
      canRespond:
        (daily[today] || 0) < CONFIG.MAX_RESPONSES_PER_DAY &&
        (hourly[hourKey] || 0) < CONFIG.MAX_RESPONSES_PER_HOUR,
      dailyCount: daily[today] || 0,
      hourlyCount: hourly[hourKey] || 0,
    }
  }

  async incrementResponseCount() {
    const today = new Date().toISOString().split('T')[0]
    const hourKey = `${today}-${new Date().getHours()}`
    const daily = await this.loadData('daily_responses.json')
    const hourly = await this.loadData('hourly_responses.json')
    daily[today] = (daily[today] || 0) + 1
    hourly[hourKey] = (hourly[hourKey] || 0) + 1
    await this.saveData('daily_responses.json', daily)
    await this.saveData('hourly_responses.json', hourly)
  }

  async hasRespondedToUser(userId) {
    const users = await this.loadData('responded_users.json')
    const last = users[userId]
    return last && Date.now() - new Date(last) < 7 * 86400000
  }

  async markUserResponded(userId) {
    const users = await this.loadData('responded_users.json')
    users[userId] = new Date().toISOString()
    await this.saveData('responded_users.json', users)
  }

  async hasRespondedToVideo(videoId) {
    const list = await this.loadData('responded_videos.json')
    return Array.isArray(list) && list.includes(videoId)
  }

  async markVideoResponded(videoId) {
    const list = Array.isArray(await this.loadData('responded_videos.json'))
      ? await this.loadData('responded_videos.json')
      : []
    list.push(videoId)
    await this.saveData('responded_videos.json', list)
  }

  async hasProcessedVideo(videoId) {
    const list = Array.isArray(await this.loadData('processed_videos.json'))
      ? await this.loadData('processed_videos.json')
      : []
    return list.some((v) => v.videoId === videoId)
  }

  async markVideoProcessed(videoId, title, publishedAt) {
    const list = Array.isArray(await this.loadData('processed_videos.json'))
      ? await this.loadData('processed_videos.json')
      : []
    list.push({
      videoId,
      title,
      publishedAt,
      processedAt: new Date().toISOString(),
      commentsChecked: 0,
      responsesPosted: 0,
    })
    await this.saveData('processed_videos.json', list)
  }

  async updateVideoStats(videoId, commentsChecked, responsesPosted) {
    const list = Array.isArray(await this.loadData('processed_videos.json'))
      ? await this.loadData('processed_videos.json')
      : []
    const idx = list.findIndex((v) => v.videoId === videoId)
    if (idx > -1) {
      list[idx].commentsChecked = commentsChecked
      list[idx].responsesPosted = responsesPosted
      list[idx].lastProcessed = new Date().toISOString()
      await this.saveData('processed_videos.json', list)
    }
  }

  async getProcessingStats() {
    const list = Array.isArray(await this.loadData('processed_videos.json'))
      ? await this.loadData('processed_videos.json')
      : []
    const rl = await this.checkRateLimits()
    return {
      totalVideosProcessed: list.length,
      totalCommentsChecked: list.reduce(
        (s, v) => s + (v.commentsChecked || 0),
        0
      ),
      totalResponsesPosted: list.reduce(
        (s, v) => s + (v.responsesPosted || 0),
        0
      ),
      dailyResponsesRemaining: CONFIG.MAX_RESPONSES_PER_DAY - rl.dailyCount,
      hourlyResponsesRemaining: CONFIG.MAX_RESPONSES_PER_HOUR - rl.hourlyCount,
      lastProcessedVideo: list[list.length - 1] || null,
    }
  }

  async logActivity(level, message, data) {
    const entry = { timestamp: new Date().toISOString(), level, message, data }
    console.log(`[${entry.timestamp}] ${level}: ${message}`, data || '')
    const logFile = path.join(this.dataDir, 'activity_log.json')
    let logs = []
    if (fsSync.existsSync(logFile))
      logs = JSON.parse(fsSync.readFileSync(logFile, 'utf8'))
    logs.push(entry)
    if (logs.length > 1000) logs = logs.slice(-1000)
    fsSync.writeFileSync(logFile, JSON.stringify(logs, null, 2))
  }

  async postComment(commentId, text) {
    try {
      const yt = google.youtube({ version: 'v3', auth: this.oauth2Client })
      await yt.comments.insert({
        part: 'snippet',
        requestBody: { snippet: { parentId: commentId, textOriginal: text } },
      })
      return true
    } catch (err) {
      await this.logActivity('ERROR', 'Error posting comment', err.message)
      return false
    }
  }

  async processComments(daysBack = 30) {
    await this.logActivity('INFO', 'Starting processing', { daysBack })
    const rl = await this.loadData('daily_responses.json')
    const videos = await this.getRecentVideos(
      await this.getChannelId(),
      50,
      daysBack
    )
    for (const vid of videos) {
      const vidId = vid.id.videoId
      if (
        (await this.loadData('processed_videos.json')).some(
          (v) => v.videoId === vidId
        )
      )
        continue
      await this.saveData('processed_videos.json', [
        ...(await this.loadData('processed_videos.json')),
        {
          videoId: vidId,
          title: vid.snippet.title,
          publishedAt: vid.snippet.publishedAt,
          processedAt: new Date().toISOString(),
          commentsChecked: 0,
          responsesPosted: 0,
        },
      ])

      const comments = await this.getVideoComments(vidId)
      for (const thread of comments) {
        const c = thread.snippet.topLevelComment.snippet
        const commentId = thread.snippet.topLevelComment.id
        if (c.textOriginal.length < CONFIG.MIN_COMMENT_LENGTH) continue
        if (thread.snippet.totalReplyCount > CONFIG.MAX_REPLIES_TO_SKIP)
          continue
        const author = c.authorChannelId?.value
        if (
          author &&
          (await this.loadData('responded_users.json'))[author] &&
          Date.now() -
            new Date((await this.loadData('responded_users.json'))[author]) <
            7 * 86400000
        )
          continue

        const keyword = this.containsKeywords(c.textOriginal)
        if (!keyword) continue

        const reply = this.generateResponse(c.textOriginal, keyword)
        const success = await this.postComment(commentId, reply)

        // Detailed logging for each reply attempt
        await this.logActivity(
          'INFO',
          success ? 'Replied' : 'Failed to reply',
          {
            videoId: vidId,
            commentId,
            commentText: c.textOriginal,
            replyText: reply,
          }
        )

        if (success) {
          // Track counters
          const dr = await this.loadData('daily_responses.json')
          dr[new Date().toISOString().split('T')[0]] =
            (dr[new Date().toISOString().split('T')[0]] || 0) + 1
          await this.saveData('daily_responses.json', dr)
          const ru = await this.loadData('responded_users.json')
          ru[author] = new Date().toISOString()
          await this.saveData('responded_users.json', ru)
          await this.saveData('responded_videos.json', [
            ...(await this.loadData('responded_videos.json')),
            vidId,
          ])
          break // only one reply per video
        }
      }
    }
    await this.logActivity('INFO', 'Processing finished')
  }

  async run() {
    if (await this.initialize()) await this.processComments()
  }
}

new YouTubeBot().run().catch((err) => console.error('❌ Bot crashed:', err))
