#!/bin/zsh

# Set PATH explicitly to include homebrew
export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH

echo "=== Running Daily Video Bot at $(date) ===" >> /tmp/ai-bot.log

# Navigate to project and run bot
cd /Users/jebbarimohammed/Desktop/website || exit 1
/opt/homebrew/bin/node tools/ai-marketing/daily-review-video.mjs >> /tmp/ai-bot.log 2>&1

echo "=== Run Complete ===" >> /tmp/ai-bot.log
