#!/bin/bash

# Evening Reflection Prompt
# Sends daily 8 PM reminder to fill in reflection

GOALS_DIR="/Users/poseidon/mission-control/goals"
DATE=$(date +%Y-%m-%d)
DAILY_FILE="$GOALS_DIR/daily/${DATE}.md"

if [ -f "$DAILY_FILE" ]; then
    MESSAGE="🌙 Evening Reflection Time\n\nWhat got done today?\nWhat blocked you?\nWhat's #1 for tomorrow?\n\nDaily file: $DAILY_FILE"
else
    MESSAGE="🌙 Evening Reflection Time\n\nNo daily log for $(date +"%A").\n\nCreate one: goal today \"Your task here\" --parent <weekly-id>"
fi

if command -v telegram-send &> /dev/null; then
    telegram-send "$MESSAGE"
else
    echo "[$(date)] Evening reflection prompt:"
    echo -e "$MESSAGE"
fi