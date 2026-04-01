#!/bin/bash
# Creates campaign optimization HTML file

cat > ~/campaign-optimization-2026-03-30.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meta Ads Campaign Optimization - March 30, 2026</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #fff;
        }
        h1 {
            font-size: 28px;
            color: #1a1a1a;
            margin-bottom: 8px;
            border-bottom: 3px solid #c9894b;
            padding-bottom: 12px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 30px;
        }
        h2 {
            font-size: 22px;
            color: #1a1a1a;
            margin: 35px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid #e0e0e0;
        }
        h3 {
            font-size: 18px;
            color: #333;
            margin: 25px 0 12px 0;
        }
        .priority-critical {
            color: #d32f2f;
            font-weight: 700;
        }
        .priority-medium {
            color: #f57c00;
            font-weight: 700;
        }
        .priority-low {
            color: #388e3c;
            font-weight: 700;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f5f5f5;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background: #fafafa;
        }
        .client-section {
            background: #fafafa;
            border-left: 4px solid #c9894b;
            padding: 20px;
            margin: 25px 0;
        }
        .client-section.critical {
            border-left-color: #d32f2f;
        }
        .client-section.medium {
            border-left-color: #f57c00;
        }
        .client-section.low {
            border-left-color: #388e3c;
        }
        ul {
            margin: 15px 0 15px 25px;
        }
        li {
            margin: 8px 0;
        }
        .checkbox {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #666;
            margin-right: 8px;
            vertical-align: middle;
        }
        .summary-box {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .page-break {
            page-break-after: always;
        }
        @media print {
            body { padding: 20px; }
            .page-break { page-break-after: always; }
        }
    </style>
</head>
<body>

<h1>Meta Ads Campaign Optimization</h1>
<p class="subtitle">Analysis Period: February 28 – March 29, 2026 | 3 Active Clients</p>

<div class="summary-box">
    <h3>Executive Summary</h3>
    <table>
        <tr>
            <th>Client</th>
            <th>Priority</th>
            <th>Core Issue</th>
            <th>Immediate Action</th>
        </tr>
        <tr>
            <td><strong>Ricardo Madera</strong></td>
            <td><span class="priority-critical">CRITICAL</span></td>
            <td>CPL doubled post-vacation ($22 → $42)</td>
            <td>Creative refresh + audience expansion</td>
        </tr>
        <tr>
            <td><strong>Hector Huizar</strong></td>
            <td><span class="priority-medium">MEDIUM</span></td>
            <td>Lead quality dropping, frequency fatigue</td>
            <td>Audience expansion + form simplification</td>
        </tr>
        <tr>
            <td><strong>PJ Sparks</strong></td>
            <td><span class="priority-low">LOW</span></td>
            <td>Low volume (0.5 leads/day), good CPL ($28)</td>
            <td>Budget increase + scale up</td>
        </tr>
    </table>
</div>

<div class="page-break"></div>

<div class="client-section critical">
    <h2>Client 1: Ricardo Madera (Madera Landscape)</h2>
    <p><strong>Priority:</strong> <span class="priority-critical">CRITICAL</span></p>
    
    <h3>Current Status</h3>
    <ul>
        <li><strong>Campaign:</strong> 03/09/26 Lead Gen Ad Set</li>
        <li><strong>Status:</strong> Active</li>
        <li><strong>Budget:</strong> $30/day</li>
        <li><strong>Recent CPL:</strong> $24–$42 (avg $47.40 post-vacation)</li>
        <li><strong>Pre-vacation CPL:</strong> $22</li>
    </ul>

    <h3>The Problem</h3>
    <p><strong>Vacation Impact (Mar 19–23):</strong> Campaign paused for 5 days, causing learning phase reset.</p>
    <p><strong>Symptoms:</strong></p>
    <ul>
        <li>Frequency exploded: 1.48 (highest of all clients)</li>
        <li>Same people seeing ads 4–5x, not converting</li>
        <li>CTR dropped: 1.07% → 0.64%</li>
        <li>Link clicks: 20, leads: 1 = 5% conversion (should be 15–25%)</li>
    </ul>

    <h3>Immediate Actions (Do Today)</h3>
    
    <p><strong>Step 1: Creative Refresh</strong></p>
    <ul>
        <li><span class="checkbox"></span>Duplicate best-performing ad set</li>
        <li><span class="checkbox"></span>Change headline to: "Limited spots available — back from vacation, 2 slots left this week"</li>
        <li>Why: Creates urgency + explains the gap</li>
    </ul>

    <p><strong>Step 2: Expand Audience</strong></p>
    <ul>
        <li><span class="checkbox"></span>Increase age range by 3 years (e.g., 35–65 → 33–68)</li>
        <li><span class="checkbox"></span>OR add 2 adjacent zip codes</li>
        <li>Why: Fresh eyeballs, lower frequency</li>
    </ul>

    <p><strong>Step 3: Simplify Form</strong></p>
    <ul>
        <li><span class="checkbox"></span>Remove 1 question from instant form (keep to 2 max)</li>
        <li><span class="checkbox"></span>Test: "Budget + Timeline" only</li>
    </ul>

    <p><strong>Step 4: Temporary Budget Bump</strong></p>
    <ul>
        <li><span class="checkbox"></span>Increase to $40/day for 3 days</li>
        <li><span class="checkbox"></span>Then drop back to $30</li>
        <li>Why: Forces algorithm to find new audience faster</li>
    </ul>

    <p><strong>Expected Outcome:</strong> CPL should drop from $42 back to $25–$30 range within 3–5 days. Frequency should decrease from 1.48 to ~1.3.</p>
</div>

<div class="page-break"></div>

<div class="client-section medium">
    <h2>Client 2: Hector Huizar (Valley of the Sun Landscaping)</h2>
    <p><strong>Priority:</strong> <span class="priority-medium">MEDIUM</span></p>
    
    <h3>Current Status</h3>
    <ul>
        <li><strong>Campaign:</strong> 03/10/26 Lead Gen Campaign — Copy</li>
        <li><strong>Status:</strong> Not Delivering</li>
        <li><strong>Budget:</strong> $30/day</li>
        <li><strong>CPL Range:</strong> $13–$34 (volatile)</li>
    </ul>

    <h3>The Problem</h3>
    <p><strong>Lead quality is dropping</strong> despite quantity being consistent.</p>
    <p><strong>Symptoms:</strong></p>
    <ul>
        <li>Frequency rising: 1.28–1.33 (creative fatigue)</li>
        <li>Link clicks low: 3–11 per day despite 700–1200 impressions</li>
        <li>CTR climbing: 0.93% on 3/27 vs 0.61% on 3/21</li>
        <li><strong>BUT</strong> CPL also climbing: $13 → $34</li>
    </ul>

    <h3>Immediate Actions (Do Today)</h3>
    
    <p><strong>Step 1: Creative Refresh</strong></p>
    <ul>
        <li><span class="checkbox"></span>Pause lowest performing ad set</li>
        <li><span class="checkbox"></span>Duplicate winner with new headline</li>
        <li>New angle: "Grand Prairie homeowners — free estimate this week only"</li>
    </ul>

    <p><strong>Step 2: Audience Expansion</strong></p>
    <ul>
        <li><span class="checkbox"></span>Expand age range by 2–3 years</li>
        <li><span class="checkbox"></span>OR add adjacent zip codes</li>
        <li>Why: You're hitting the same small pool, exhausting it</li>
    </ul>

    <p><strong>Step 3: Form Friction Test</strong></p>
    <ul>
        <li><span class="checkbox"></span>Simplify lead form — remove 1 question</li>
        <li><span class="checkbox"></span>Pre-fill location if possible</li>
        <li>Test: Single question "What's your address?" vs 3-question form</li>
    </ul>

    <p><strong>Step 4: Placement Audit</strong></p>
    <ul>
        <li><span class="checkbox"></span>Check placement breakdown in Ads Manager</li>
        <li><span class="checkbox"></span>Turn off Audience Network if eating budget</li>
        <li><span class="checkbox"></span>Reallocate to Feed + Stories only</li>
        <li>Current CPM: $35–$46 (high for landscaping)</li>
    </ul>

    <p><strong>Expected Outcome:</strong> CPL should stabilize in $20–$25 range. Lead quality should improve within 5–7 days.</p>
</div>

<div class="page-break"></div>

<div class="client-section low">
    <h2>Client 3: PJ Sparks (We Do Hardscape)</h2>
    <p><strong>Priority:</strong> <span class="priority-low">LOW</span></p>
    
    <h3>Current Status</h3>
    <ul>
        <li><strong>Campaign:</strong> We Do Hardscape | 03/09/26 | Lead Gen Campaign — Copy</li>
        <li><strong>Status:</strong> Active</li>
        <li><strong>Budget:</strong> $30/day</li>
        <li><strong>Recent CPL:</strong> $24–$31 (good)</li>
        <li><strong>Lead Volume:</strong> 0.5 leads/day (too low)</li>
    </ul>

    <h3>The Problem</h3>
    <p><strong>Low volume, not quality.</strong> PJ is actually performing well — just not getting enough leads.</p>
    <p><strong>Symptoms:</strong></p>
    <ul>
        <li>Best CPL of all 3 clients ($28 avg)</li>
        <li>But only 3 leads in 6 days</li>
        <li>Frequency climbing: 1.31 → 1.49 (highest of all clients)</li>
        <li>CTR volatile: 0.54% to 1.41% (creative fatigue)</li>
        <li>Reach too small: 301–672/day (vs Hector's 700–1300)</li>
    </ul>

    <h3>Immediate Actions (Do Today)</h3>
    
    <p><strong>Step 1: Budget Increase</strong></p>
    <ul>
        <li><span class="checkbox"></span>Increase from $30/day to $40/day</li>
        <li><span class="checkbox"></span>Duration: 5 days minimum</li>
        <li>Why: Forces Meta to find new audience segments, breaks out of small pool</li>
    </ul>

    <p><strong>Step 2: Creative Rotation</strong></p>
    <ul>
        <li><span class="checkbox"></span>Duplicate winning ad</li>
        <li><span class="checkbox"></span>Test 2 new hooks:</li>
        <li style="margin-left: 40px;">1. "Free estimate this week — hardscape specialists"</li>
        <li style="margin-left: 40px;">2. "See 50+ patios we've built in [City]"</li>
    </ul>

    <p><strong>Step 3: Expand Location</strong></p>
    <ul>
        <li><span class="checkbox"></span>Add 10-mile radius</li>
        <li><span class="checkbox"></span>OR add adjacent cities</li>
        <li>Why: PJ is in a smaller market, need more people to target</li>
    </ul>

    <p><strong>Step 4: Form Optimization</strong></p>
    <ul>
        <li><span class="checkbox"></span>Remove 1 question, test 2-question form</li>
        <li><span class="checkbox"></span>Keep: Budget + Timeline only</li>
    </ul>

    <p><strong>Expected Outcome:</strong> Lead volume should increase from 0.5/day to 1–1.5/day. CPL may rise slightly to $32–$35 (acceptable for volume increase).</p>
</div>

<div class="page-break"></div>

<h2>Comparative Quick Reference</h2>

<table>
    <tr>
        <th>Metric</th>
        <th>Hector</th>
        <th>Ricardo</th>
        <th>PJ</th>
    </tr>
    <tr>
        <td><strong>Priority</strong></td>
        <td><span class="priority-medium">MEDIUM</span></td>
        <td><span class="priority-critical">CRITICAL</span></td>
        <td><span class="priority-low">LOW</span></td>
    </tr>
    <tr>
        <td><strong>CPL Range</strong></td>
        <td>$13–$34</td>
        <td>$24–$42</td>
        <td>$24–$31</td>
    </tr>
    <tr>
        <td><strong>Lead Volume</strong></td>
        <td>8 leads/10 days</td>
        <td>5 leads/6 days</td>
        <td>3 leads/6 days</td>
    </tr>
    <tr>
        <td><strong>Frequency</strong></td>
        <td>1.33</td>
        <td><strong>1.48</strong></td>
        <td>1.49</td>
    </tr>
    <tr>
        <td><strong>CTR</strong></td>
        <td>0.81–0.93%</td>
        <td>0.64–1.21%</td>
        <td>0.54–1.41%</td>
    </tr>
    <tr>
        <td><strong>Core Issue</strong></td>
        <td>Quality dropping</td>
        <td>Cost doubled</td>
        <td>Volume low</td>
    </tr>
    <tr>
        <td><strong>Budget Change</strong></td>
        <td>Keep $30</td>
        <td>$40 (3 days)</td>
        <td>$40 (5 days)</td>
    </tr>
</table>

<h2>Implementation Timeline</h2>

<h3>Today (Next 2 Hours)</h3>
<ol>
    <li><strong>Ricardo:</strong> Creative refresh + budget bump</li>
    <li><strong>Hector:</strong> Creative refresh + audience expansion</li>
    <li><strong>PJ:</strong> Budget bump + creative rotation</li>
</ol>

<h3>This Week</h3>
<ul>
    <li><strong>Day 2:</strong> Check frequency drops for Ricardo</li>
    <li><strong>Day 3:</strong> Adjust Hector's placements if needed</li>
    <li><strong>Day 5:</strong> Evaluate PJ's volume increase</li>
    <li><strong>Day 7:</strong> Full performance review</li>
</ul>

<h2>Budget Summary</h2>

<table>
    <tr>
        <th>Client</th>
        <th>Current</th>
        <th>New</th>
        <th>Duration</th>
    </tr>
    <tr>
        <td>Hector</td>
        <td>$30/day</td>
        <td>$30/day</td>
        <td>Keep same</td>
    </tr>
    <tr>
        <td>Ricardo</td>
        <td>$30/day</td>
        <td>$40/day</td>
        <td>3 days only</td>
    </tr>
    <tr>
        <td>PJ</td>
        <td>$30/day</td>
        <td>$40/day</td>
        <td>5 days</td>
    </tr>
</table>

<p><strong>Total Additional Spend:</strong> +$50/day for 3 days, then +$10/day for 2 days = ~$170 test investment</p>

<h2>Success Metrics (Check in 7 Days)</h2>

<table>
    <tr>
        <th>Client</th>
        <th>Target CPL</th>
        <th>Target Leads/Day</th>
        <th>Target Frequency</th>
    </tr>
    <tr>
        <td>Hector</td>
        <td>$20–$25</td>
        <td>1+</td>
        <td>&lt;1.3</td>
    </tr>
    <tr>
        <td>Ricardo</td>
        <td>$25–$30</td>
        <td>1+</td>
        <td>&lt;1.35</td>
    </tr>
    <tr>
        <td>PJ</td>
        <td>$28–$35</td>
        <td>1+</td>
        <td>&lt;1.4</td>
    </tr>
</table>

<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e0e0e0; font-size: 12px; color: #666;">
    <p><strong>Document Created:</strong> March 30, 2026</p>
    <p><strong>Analyst:</strong> Poseidon</p>
    <p><strong>Next Review:</strong> April 6, 2026</p>
</div>

</body>
</html>
HTMLEOF

echo "HTML file created: ~/campaign-optimization-2026-03-30.html"
echo ""
echo "To convert to PDF:"
echo "1. Open in browser: open ~/campaign-optimization-2026-03-30.html"
echo "2. Print to PDF: Cmd + P -> Save as PDF"
