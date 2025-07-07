#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

class LogViewer {
  constructor() {
    this.dataDir = path.join(__dirname, 'data')
  }

  async viewActivityLog(lines = 50) {
    const logFile = path.join(this.dataDir, 'activity_log.json')
    
    if (!fs.existsSync(logFile)) {
      console.log('📝 No activity log found yet. Run the bot first to generate logs.')
      return
    }

    try {
      const content = fs.readFileSync(logFile, 'utf8')
      const logs = JSON.parse(content)
      
      console.log(`\n📊 YouTube Bot Activity Log (Last ${Math.min(lines, logs.length)} entries)\n`)
      console.log('=' .repeat(80))
      
      const recentLogs = logs.slice(-lines)
      
      recentLogs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString()
        const levelColors = {
          INFO: '\x1b[36m',     // Cyan
          SUCCESS: '\x1b[32m',  // Green
          WARNING: '\x1b[33m',  // Yellow
          ERROR: '\x1b[31m',    // Red
        }
        
        const color = levelColors[log.level] || '\x1b[0m'
        const reset = '\x1b[0m'
        
        console.log(`${color}[${timestamp}] ${log.level}:${reset} ${log.message}`)
        
        if (log.data) {
          console.log(`${color}Data:${reset}`, JSON.stringify(log.data, null, 2))
        }
        console.log('-'.repeat(40))
      })
      
    } catch (error) {
      console.error('❌ Error reading activity log:', error.message)
    }
  }

  async viewDailyReports() {
    const files = fs.readdirSync(this.dataDir)
    const reportFiles = files.filter(f => f.startsWith('daily_report_') && f.endsWith('.json'))
    
    if (reportFiles.length === 0) {
      console.log('📊 No daily reports found yet.')
      return
    }

    console.log(`\n📈 Daily Reports (${reportFiles.length} available)\n`)
    console.log('=' .repeat(80))

    // Sort by date (newest first)
    reportFiles.sort().reverse()

    reportFiles.slice(0, 7).forEach(file => { // Show last 7 days
      try {
        const content = fs.readFileSync(path.join(this.dataDir, file), 'utf8')
        const report = JSON.parse(content)
        
        console.log(`\n📅 ${report.date}`)
        console.log(`🎯 Videos Processed: ${report.performance.videosProcessedToday}`)
        console.log(`💬 Comments Checked: ${report.performance.commentsCheckedToday}`)
        console.log(`✅ Responses Posted: ${report.performance.responsesPostedToday}`)
        console.log(`⏱️  Rate Limits: ${report.rateLimits.dailyUsed}/${report.rateLimits.dailyLimit} daily, ${report.rateLimits.hourlyUsed}/${report.rateLimits.hourlyLimit} hourly`)
        console.log('-'.repeat(40))
        
      } catch (error) {
        console.error(`❌ Error reading ${file}:`, error.message)
      }
    })
  }

  async viewCurrentStats() {
    const files = [
      'processed_videos.json',
      'responded_users.json', 
      'responded_videos.json',
      'daily_responses.json',
      'hourly_responses.json'
    ]

    console.log(`\n📊 Current Bot Statistics\n`)
    console.log('=' .repeat(80))

    for (const file of files) {
      const filePath = path.join(this.dataDir, file)
      
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8')
          const data = JSON.parse(content)
          
          console.log(`\n📁 ${file}:`)
          
          if (Array.isArray(data)) {
            console.log(`   📊 Total entries: ${data.length}`)
            if (data.length > 0) {
              console.log(`   🕐 Latest entry: ${JSON.stringify(data[data.length - 1], null, 4)}`)
            }
          } else if (typeof data === 'object') {
            console.log(`   📊 Keys: ${Object.keys(data).length}`)
            console.log(`   📋 Sample data:`, JSON.stringify(data, null, 4))
          }
          
        } catch (error) {
          console.log(`   ❌ Error reading ${file}: ${error.message}`)
        }
      } else {
        console.log(`\n📁 ${file}: Not found`)
      }
    }
  }

  async showHelp() {
    console.log(`
🤖 YouTube Bot Log Viewer

Usage: node view-logs.js [command] [options]

Commands:
  logs [lines]     Show activity log (default: 50 lines)
  reports          Show daily reports
  stats            Show current statistics
  help             Show this help message

Examples:
  node view-logs.js logs 100    # Show last 100 log entries
  node view-logs.js reports     # Show daily reports
  node view-logs.js stats       # Show current bot statistics
`)
  }
}

// Main execution
async function main() {
  const viewer = new LogViewer()
  const command = process.argv[2] || 'logs'
  const option = process.argv[3]

  switch (command) {
    case 'logs':
      const lines = option ? parseInt(option) : 50
      await viewer.viewActivityLog(lines)
      break
    
    case 'reports':
      await viewer.viewDailyReports()
      break
    
    case 'stats':
      await viewer.viewCurrentStats()
      break
    
    case 'help':
    default:
      await viewer.showHelp()
      break
  }
}

main().catch(console.error)
