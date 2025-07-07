# YouTube Auto-Response Bot for Owl Mortgage

This bot automatically monitors the @wiseoldowlshow YouTube channel and responds to comments containing mortgage-related keywords with helpful messages directing users to the Owl Mortgage contact form.

## Features

- ✅ Monitors @wiseoldowlshow channel comments 24/7
- ✅ Detects 30+ mortgage-related keywords
- ✅ Smart response logic (different responses for questions vs statements)
- ✅ YouTube compliance (rate limiting, duplicate prevention)
- ✅ Fully automated via GitHub Actions (free)
- ✅ Persistent tracking to avoid spam

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

4. Add the refresh token as a GitHub Secret:
   ```
   GOOGLE_REFRESH_TOKEN: [the token from step 3]
   ```

### 4. Enable GitHub Actions

1. Go to your repository → Actions tab
2. Enable GitHub Actions if not already enabled
3. The bot will run automatically every 30 minutes

## How It Works

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
- ✅ Only responds to recent videos (last 7 days)

## Monitoring

### Check Bot Status

- Go to GitHub repository → Actions tab
- View recent workflow runs
- Check logs for any errors or response activity

### Data Tracking

The bot maintains these files in `youtube-bot/data/`:

- `daily_responses.json` - Daily response counts
- `hourly_responses.json` - Hourly response counts
- `responded_users.json` - Users already responded to
- `responded_videos.json` - Videos already responded to

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
