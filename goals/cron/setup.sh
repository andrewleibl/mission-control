#!/bin/bash

# Cron Setup Script for Goal Tracker
# Run this to install the automation jobs

echo "Installing Goal Tracker cron jobs..."

# Weekly commitment - Monday 6 AM
(crontab -l 2>/dev/null | grep -v "send-weekly-commitment"; echo "0 6 * * 1 /Users/poseidon/mission-control/goals/cron/send-weekly-commitment.sh") | crontab -

# Evening reflection prompt - Daily 8 PM
(crontab -l 2>/dev/null | grep -v "send-evening-reflection"; echo "0 20 * * * /Users/poseidon/mission-control/goals/cron/send-evening-reflection.sh") | crontab -

# Red flag check - Daily 9 AM
(crontab -l 2>/dev/null | grep -v "red-flag-check"; echo "0 9 * * * /Users/poseidon/mission-control/goals/cron/red-flag-check.sh") | crontab -

echo "Cron jobs installed. Current crontab:"
crontab -l