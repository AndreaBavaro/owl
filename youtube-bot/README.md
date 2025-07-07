# YouTube Auto-Response Bot for Owl Mortgage

This enhanced bot automatically monitors the @wiseoldowlshow YouTube channel and responds to comments containing mortgage-related keywords with helpful messages directing users to the Owl Mortgage contact form.

## 🚀 Enhanced Features

- ✅ **Extended Coverage**: Processes videos from the last **30 days** (upgraded from 7 days)
- ✅ **Smart Scheduling**: Runs every 15 minutes during business hours, hourly otherwise
- ✅ **Advanced Tracking**: Comprehensive video and comment processing statistics
- ✅ **Duplicate Prevention**: Tracks processed videos to avoid redundant work
- ✅ **Enhanced Logging**: Detailed statistics and processing insights
- ✅ **Error Handling**: Robust failure recovery and partial data preservation
- ✅ **Rate Limiting**: YouTube API compliance with configurable limits
- ✅ **Keyword Detection**: 30+ mortgage-related keywords with smart response logic
- ✅ **GitHub Actions**: Fully automated with manual trigger options
- ✅ **Data Persistence**: Maintains processing history and response tracking

## Setup Instructions

### 1. Create Dedicated YouTube Account

1. Create a new Google account for business responses
2. Create a YouTube channel for this account
3. Make sure this account can comment on videos

### 2. Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
YOUTUBE_API_KEY: AIzaSyC67zOvqfT3GjTABRYKWLuBhpFnB4bZNIM
GOOGLE_CLIENT_ID: 1073838950100-vqa7v9t0dibfsgrbvqqk71i3u69ppvia.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET: 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
```

### 3. Get OAuth Refresh Token

1. Install dependencies:

   ```bash
   cd youtube-bot
   npm install
   ```

2. Run OAuth setup:

   ```bash
   GOOGLE_CLIENT_ID="1073838950100-vqa7v9t0dibfsgrbvqqk71i3u69ppvia.apps.googleusercontent.com" GOOGLE_CLIENT_SECRET="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" node setup-oauth.js
   ```

3. Follow the instructions to authorize your dedicated YouTube account
4. Copy the refresh token and add it to GitHub Secrets as `GOOGLE_REFRESH_TOKEN`

### 4. Test the Bot

```bash
cd youtube-bot
node index.js
```

The bot will:
- Find the target channel
- Get recent videos (last **30 days**)
- Check comments for keywords
- Post responses (if any matches found)
- Save comprehensive tracking data
- Display detailed processing statistics

## 🤖 Enhanced Automation

### Smart Scheduling
The bot runs automatically via GitHub Actions with intelligent scheduling:

- **Business Hours (9 AM - 6 PM EST, Mon-Fri)**: Every 15 minutes
- **Off-Hours & Weekends**: Every hour
- **Manual Triggers**: Available with custom parameters

### Manual Trigger Options
You can manually trigger the bot with custom settings:

1. Go to **Actions** tab in GitHub repository
2. Select **YouTube Auto Response Bot** workflow
3. Click **Run workflow**
4. Configure options:
   - **Days Back**: Number of days to search (default: 30)
   - **Max Responses**: Maximum responses per run (default: 5)

### Enhanced Tracking
The bot now maintains comprehensive statistics:

- **Video Processing**: Tracks all processed videos with metadata
- **Comment Analysis**: Counts comments checked per video
- **Response Tracking**: Monitors successful responses and rate limits
- **Error Handling**: Preserves data even during failures
- **Performance Metrics**: Detailed logging and statistics

## How It Works

1. **Extended Coverage**: Searches @wiseoldowlshow for videos from last 30 days
2. **Smart Processing**: Avoids reprocessing previously handled videos
3. **Comment Analysis**: Scans comments for 30+ mortgage keywords
4. **Intelligent Responses**: Different responses for questions vs statements
5. **Rate Limiting**: Max 2-3 responses/hour, 10-15/day with smart scheduling
6. **Duplicate Prevention**: Comprehensive tracking of users, videos, and responses
7. **YouTube Compliance**: Follows all community guidelines and API limits

## Response Examples

### Keywords Monitored

wealth, renewal, mortgage, refinance, equity, money, home, purchase, rate, bank, help, loan, lending, credit, debt, payment, interest, approval, qualify, application, broker, lender, closing, downpayment, preapproval, amortization, insurance, property, investment, buyer, seller, realtor, agent, financing, consolidation, heloc, line of credit

### Response Logic

- **Questions** (containing "?", "how", "what", etc.):

  > "Great question about [keyword]! We'd be happy to help you explore your options. Feel free to reach out: https://tally.so/r/w4R8lb"

- **Statements/Concerns**:

  > "That's a common concern with [keyword]. Our team specializes in finding the right solutions. Contact us here: https://tally.so/r/w4R8lb"

  OR

  > "Happy to help with your [keyword] questions! We work with clients in similar situations daily. Get in touch: https://tally.so/r/w4R8lb"

### Compliance Features

- ✅ Max 3 responses per hour
- ✅ Max 15 responses per day
- ✅ Never responds to same user twice in 7 days
- ✅ Never responds to same video more than once
- ✅ Skips very short comments (under 5 words)
- ✅ Skips comments with many existing replies
- ✅ Random delays between responses (5-15 minutes)
- ✅ Only responds to recent videos (last **30 days**)

## Monitoring

### Check Bot Status

- Go to GitHub repository → Actions tab
- View recent workflow runs
- Check logs for any errors or response activity

### Enhanced Data Tracking

The bot maintains comprehensive tracking files in `youtube-bot/data/`:

**Response Tracking:**
- `daily_responses.json` - Daily response counts with timestamps
- `hourly_responses.json` - Hourly response counts with rate limiting
- `responded_users.json` - Users already responded to (7-day tracking)
- `responded_videos.json` - Videos already responded to (permanent)

**Enhanced Processing Data:**
- `processed_videos.json` - Complete video processing history with metadata
- `video_stats.json` - Per-video statistics (comments checked, responses posted)
- `processing_stats.json` - Overall bot performance metrics and summaries

**Rate Limiting:**
- Automatic cleanup of expired tracking data
- Smart rate limiting based on time windows
- Comprehensive logging of all bot activities

### Manual Trigger

You can manually trigger the bot:

1. Go to Actions tab
2. Select "YouTube Auto Response Bot"
3. Click "Run workflow"

## Troubleshooting

### Common Issues

1. **"Channel not found"** - Verify @wiseoldowlshow handle is correct
2. **"Authentication failed"** - Check OAuth refresh token is valid
3. **"API quota exceeded"** - YouTube API has daily limits, will reset next day
4. **"Comments disabled"** - Some videos may have comments disabled

### Getting Help

Check the GitHub Actions logs for detailed error messages and bot activity.

## Security Notes

- All credentials are stored as encrypted GitHub Secrets
- Never commit API keys or tokens to the repository
- The bot only has permission to read comments and post replies
- Uses official YouTube Data API (not scraping)
