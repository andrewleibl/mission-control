#!/bin/bash

# Red Flag Monitor
# Checks for slipping goals and sends alerts

GOALS_DIR="/Users/poseidon/mission-control/goals"
DATE=$(date +%Y-%m-%d)
WEEK=$(date +%Y-W%V)
FLAGS=""

# Check for missing daily logs (last 3 days)
MISSING_DAYS=0
for i in 1 2 3; do
    CHECK_DATE=$(date -v-${i}d +%Y-%m-%d)
    if [ ! -f "$GOALS_DIR/daily/${CHECK_DATE}.md" ]; then
        MISSING_DAYS=$((MISSING_DAYS + 1))
    fi
done

if [ $MISSING_DAYS -ge 3 ]; then
    FLAGS="${FLAGS}🚩 3+ consecutive days without daily logs\n"
fi

# Check weekly reflection (if it's Friday or later)
TODAY_DAY=$(date +%u)
if [ "$TODAY_DAY" -ge 5 ] && [ -f "$GOALS_DIR/weekly/${WEEK}.md" ]; then
    if ! grep -q "What worked:" "$GOALS_DIR/weekly/${WEEK}.md"; then
        FLAGS="${FLAGS}🚩 Week $(date +%V) reflection not completed\n"
    fi
fi

# Check monthly progress (if less than 10 days left in month)
DAYS_LEFT=$(expr 31 - $(date +%d) || expr 30 - $(date +%d) || expr 28 - $(date +%d))
MONTH=$(date +%Y-%m)
if [ "$DAYS_LEFT" -le 10 ] && [ -f "$GOALS_DIR/monthly/${MONTH}.md" ]; then
    # Count completed milestones vs total
    TOTAL=$(grep -c "^## Milestone:" "$GOALS_DIR/monthly/${MONTH}.md" 2>/dev/null || echo 0)
    COMPLETED=$(grep -c "Status: ✅" "$GOALS_DIR/monthly/${MONTH}.md" 2>/dev/null || echo 0)
    
    if [ "$TOTAL" -gt 0 ]; then
        PROGRESS=$((COMPLETED * 100 / TOTAL))
        if [ "$PROGRESS" -lt 50 ]; then
            FLAGS="${FLAGS}🚩 Monthly milestones at risk: ${PROGRESS}% complete with ${DAYS_LEFT} days left\n"
        fi
    fi
fi

# Send alert if flags found
if [ -n "$FLAGS" ]; then
    MESSAGE="⚠️ RED FLAGS — Action Needed\n\n${FLAGS}\nRun 'goal status' for details."
    
    if command -v telegram-send &> /dev/null; then
        telegram-send "$MESSAGE"
    else
        echo "[$(date)] RED FLAGS:"
        echo -e "$MESSAGE"
    fi
else
    echo "[$(date)] No red flags — all clear"
fi