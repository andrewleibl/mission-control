# Weekly Commitment Automation

## Purpose
Send Monday 6 AM message with the week's 3 priorities pulled from `/mission-control/goals/weekly/`.

## Cron Setup

```
0 6 * * 1 /Users/poseidon/mission-control/goals/cron/send-weekly-commitment.sh
```

## Message Format

```
📅 Week [N] Commitments

Your 3 priorities this week:
1. [Priority 1 from weekly file]
2. [Priority 2 from weekly file]
3. [Priority 3 from weekly file]

🔗 Parent Monthly Goal: [Name]
📊 Quarter Progress: [X]%

Reply "done 1", "done 2", or "done 3" when complete.
```

## Manual Test

```bash
bash /Users/poseidon/mission-control/goals/cron/send-weekly-commitment.sh
```