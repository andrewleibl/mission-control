#!/bin/bash

# Weekly Commitment Sender
# Sends Monday 6 AM message with week's priorities

GOALS_DIR="/Users/poseidon/mission-control/goals"
WEEK=$(date +%Y-W%V)
WEEKLY_FILE="$GOALS_DIR/weekly/${WEEK}.md"
TELEGRAM_CHAT_ID="6005829549"

if [ ! -f "$WEEKLY_FILE" ]; then
    MESSAGE="⚠️ Week $(date +%V) — No weekly priorities set yet.\n\nRun: goal weekly \"Your priority\" --parent <monthly-id>"
else
    # Extract priorities from weekly file
    PRIORITY1=$(grep "^1\." "$WEEKLY_FILE" | sed 's/^1\.//' | xargs)
    PRIORITY2=$(grep "^2\." "$WEEKLY_FILE" | sed 's/^2\.//' | xargs)
    PRIORITY3=$(grep "^3\." "$WEEKLY_FILE" | sed 's/^3\.//' | xargs)
    
    MESSAGE="📅 Week $(date +%V) Commitments\n\nYour 3 priorities this week:\n1. $PRIORITY1\n2. $PRIORITY2\n3. $PRIORITY3\n\nReply \"done 1\", \"done 2\", or \"done 3\" when complete."
fi

# Send via Telegram
if command -v telegram-send &> /dev/null; then
    telegram-send "$MESSAGE"
else
    echo "[$(date)] Weekly commitment:" 
    echo -e "$MESSAGE"
fi