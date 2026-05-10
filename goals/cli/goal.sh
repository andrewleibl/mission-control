#!/bin/bash

# Goal Tracker CLI for Mission Control
# Usage: ./goal.sh [command] [args]

GOALS_DIR="/Users/poseidon/mission-control/goals"
DATE=$(date +%Y-%m-%d)
WEEK=$(date +%Y-W%V)
MONTH=$(date +%Y-%m)
QUARTER=$(date +%Y-Q)$(( ($(date +%-m)-1)/3 + 1 ))

show_help() {
    cat << 'EOF'
Goal Tracker CLI

Commands:
  3m|quarterly "Goal Name" --so-that "reason"     Create quarterly goal
  monthly "Goal Name" --parent <id>               Create monthly milestone
  weekly "Goal Name" --parent <id>                Create weekly priority
  today "Task Name" --parent <id>                 Create daily task
  done <id>                                       Mark task complete
  status                                          Show status + red flags
  reflect                                         Evening reflection prompt
  list [3m|monthly|weekly|daily]                    List goals

Examples:
  ./goal.sh 3m "Hit $50K MRR" --so-that "hire a second dev"
  ./goal.sh monthly "Launch webhook integration" --parent q1
  ./goal.sh weekly "Build endpoint" --parent m1
  ./goal.sh today "Write parser" --parent w1
  ./goal.sh done 1
  ./goal.sh status
EOF
}

create_quarterly() {
    local name="$1"
    local reason="$2"
    local file="$GOALS_DIR/quarterly/${QUARTER}.md"
    
    cat > "$file" << EOF
# Quarterly Goals: ${QUARTER}

## Goal 1: $name
- **Why:** $reason
- **Progress:** 0%
- **Status:** 🟡 In Progress
- **Created:** $DATE

## Milestones
EOF
    echo "Created quarterly goal: $name"
}

create_monthly() {
    local name="$1"
    local parent="$2"
    local file="$GOALS_DIR/monthly/${MONTH}.md"
    
    if [ ! -f "$file" ]; then
        cat > "$file" << EOF
# Monthly Goals: $(date +%B %Y)

EOF
    fi
    
    echo "## Milestone: $name
- **Parent:** $parent
- **Progress:** 0%
- **Status:** 🟡 In Progress
- **Created:** $DATE

### Weekly Targets
" >> "$file"
    echo "Created monthly milestone: $name"
}

create_weekly() {
    local name="$1"
    local parent="$2"
    local file="$GOALS_DIR/weekly/${WEEK}.md"
    
    cat > "$file" << EOF
# Weekly Goals: Week $(date +%V)

## Priorities

1. $name
   - Parent: $parent
   - Status: 🟡 In Progress
   - Created: $DATE

2. 

3. 

## Daily Breakdown

### Monday
- [ ] 

### Tuesday
- [ ] 

### Wednesday
- [ ] 

### Thursday
- [ ] 

### Friday
- [ ] 

---
**Weekly Reflection:** _Fill in Friday evening_
EOF
    echo "Created weekly priorities for Week $(date +%V)"
}

create_daily() {
    local name="$1"
    local parent="$2"
    local file="$GOALS_DIR/daily/${DATE}.md"
    
    cat > "$file" << EOF
# Daily Log: $(date +"%A, %B %d")

## Today's Focus

1. $name
   - Parent: $parent
   - Status: 🟡 In Progress

2. 

3. 

## Progress

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Evening Reflection

**What got done:**

**What blocked me:**

**Tomorrow's priority:**

---
*Logged at: $(date +"%I:%M %p")*
EOF
    echo "Created daily log for $DATE"
}

show_status() {
    echo "=== GOAL STATUS ==="
    echo ""
    
    # Check quarterly
    if [ -f "$GOALS_DIR/quarterly/${QUARTER}.md" ]; then
        echo "📊 Quarterly (${QUARTER}):"
        grep "^## Goal" "$GOALS_DIR/quarterly/${QUARTER}.md" | head -3
    else
        echo "⚠️  No quarterly goals set"
    fi
    
    echo ""
    
    # Check monthly
    if [ -f "$GOALS_DIR/monthly/${MONTH}.md" ]; then
        echo "📅 Monthly ($(date +%B)):"
        grep "^## Milestone" "$GOALS_DIR/monthly/${MONTH}.md" | head -3
    else
        echo "⚠️  No monthly milestones set"
    fi
    
    echo ""
    
    # Check weekly
    if [ -f "$GOALS_DIR/weekly/${WEEK}.md" ]; then
        echo "🗓️  Weekly (Week $(date +%V)):"
        grep "^[0-9]\." "$GOALS_DIR/weekly/${WEEK}.md" | head -3
    else
        echo "⚠️  No weekly priorities set"
    fi
    
    echo ""
    
    # Check daily
    if [ -f "$GOALS_DIR/daily/${DATE}.md" ]; then
        echo "☀️  Today ($(date +"%A")):"
        grep "^1\.\|^2\.\|^3\." "$GOALS_DIR/daily/${DATE}.md" | head -3
    else
        echo "⚠️  No daily tasks set"
    fi
    
    echo ""
    echo "=== RED FLAGS ==="
    check_red_flags
}

check_red_flags() {
    local flags_found=0
    
    # Check if weekly file exists and is older than Friday
    if [ -f "$GOALS_DIR/weekly/${WEEK}.md" ]; then
        local file_day=$(stat -f "%Sm" -t "%u" "$GOALS_DIR/weekly/${WEEK}.md")
        local today=$(date +%u)
        
        if [ "$today" -ge 6 ] && [ -z "$(grep "Weekly Reflection:" "$GOALS_DIR/weekly/${WEEK}.md" | grep -v "_Fill in")" ]; then
            echo "🚩 Weekly reflection not completed (Week $(date +%V))"
            flags_found=1
        fi
    fi
    
    # Check for missing daily logs (last 3 days)
    for i in 1 2 3; do
        local check_date=$(date -v-${i}d +%Y-%m-%d)
        if [ ! -f "$GOALS_DIR/daily/${check_date}.md" ]; then
            echo "🚩 Missing daily log for $(date -v-${i}d +"%A") ($check_date)"
            flags_found=1
        fi
    done
    
    if [ $flags_found -eq 0 ]; then
        echo "✅ All clear — no red flags"
    fi
}

reflect() {
    local file="$GOALS_DIR/daily/${DATE}.md"
    
    if [ ! -f "$file" ]; then
        echo "No daily log for today. Create one first: ./goal.sh today \"Your task\""
        exit 1
    fi
    
    echo "=== EVENING REFLECTION ==="
    echo ""
    echo "What got done today?"
    echo "What blocked you?"
    echo "What's the #1 priority for tomorrow?"
    echo ""
    echo "Edit $file to record your reflection."
}

# Main command handler
case "$1" in
    3m|quarterly)
        shift
        name="$1"
        shift
        reason=""
        while [[ "$#" -gt 0 ]]; do
            case "$1" in
                --so-that)
                    reason="$2"
                    shift 2
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        create_quarterly "$name" "$reason"
        ;;
    monthly)
        shift
        name="$1"
        parent=""
        while [[ "$#" -gt 0 ]]; do
            case "$1" in
                --parent)
                    parent="$2"
                    shift 2
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        create_monthly "$name" "$parent"
        ;;
    weekly)
        shift
        name="$1"
        parent=""
        while [[ "$#" -gt 0 ]]; do
            case "$1" in
                --parent)
                    parent="$2"
                    shift 2
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        create_weekly "$name" "$parent"
        ;;
    today)
        shift
        name="$1"
        parent=""
        while [[ "$#" -gt 0 ]]; do
            case "$1" in
                --parent)
                    parent="$2"
                    shift 2
                    ;;
                *)
                    shift
                    ;;
            esac
        done
        create_daily "$name" "$parent"
        ;;
    status)
        show_status
        ;;
    reflect)
        reflect
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        ;;
esac