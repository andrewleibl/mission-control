# Goal Tracker System

Business goal tracking with cascading objectives: Quarterly → Monthly → Weekly → Daily.

## Structure

```
/mission-control/goals/
├── quarterly/    # 3-month strategic goals
├── monthly/      # Monthly milestones
├── weekly/       # Weekly priorities
├── daily/        # Daily tasks + reflections
├── cli/          # Command-line tools
└── cron/         # Automation configs
```

## Quick Start

```bash
# Add to your PATH or use full path
alias goal="/Users/poseidon/mission-control/goals/cli/goal.sh"

# Set a quarterly goal
goal 3m "Hit $50K MRR" --so-that "hire a second dev"

# Set monthly milestone (links to quarterly)
goal monthly "Launch webhook integration" --parent q1

# Set weekly priority (links to monthly)
goal weekly "Build webhook endpoint" --parent m1

# Set today's task (links to weekly)
goal today "Write webhook payload parser" --parent w1

# Check status + red flags
goal status

# Evening reflection
goal reflect
```

## Automation

### Weekly Commitment (Mondays 6 AM)
Cron job sends your 3 weekly priorities via Telegram.

### Evening Reflection (Daily 8 PM)
Prompt to fill in daily reflection.

### Red Flag Monitoring
Real-time alerts when goals slip.

## File Naming

- Quarterly: `2026-Q2.md`
- Monthly: `2026-04.md`
- Weekly: `2026-W17.md`
- Daily: `2026-04-27.md`

## Red Flag Rules

- Daily: 3 consecutive missed days → 🚩
- Weekly: Past Friday with no reflection → 🚩
- Monthly: <10 days left, <50% progress → 🚩