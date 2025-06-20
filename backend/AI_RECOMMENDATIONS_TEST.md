# 🧪 AI Recommendations Testing Guide

## Test Scenario: Mobile Checkout Issues

This guide shows how to test the AI recommendations system with realistic negative feedback.

### 📋 Step 1: Create Test Feedback

Use these API calls to create negative feedback that will trigger AI analysis:

```bash
# 1. Create negative feedback about mobile checkout
curl -X POST http://localhost:6001/api/feedback/{FORM_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "opinion": "very dissatisfied",
    "fields": [
      {"label": "issue", "value": "Checkout button doesnt work on mobile"},
      {"label": "device", "value": "iPhone"},
      {"label": "experience", "value": "Very frustrating, tried multiple times"}
    ]
  }'

# 2. Create more similar negative feedback (repeat 4-5 times with variations)
curl -X POST http://localhost:6001/api/feedback/{FORM_ID} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "opinion": "dissatisfied",
    "fields": [
      {"label": "issue", "value": "Payment fails on mobile checkout"},
      {"label": "device", "value": "Android"},
      {"label": "experience", "value": "Cannot complete purchase"}
    ]
  }'

# Continue with 3-4 more similar negative feedbacks...
```

### 🎯 Step 2: Trigger Clustering & AI Analysis

```bash
# Trigger clustering analysis
curl -X POST http://localhost:6001/api/insight/cluster/form/{FORM_ID} \
  -H "Authorization: Bearer {TOKEN}"
```

### ✅ Expected AI Recommendation Response:

```json
{
  "formId": "...",
  "totalInsights": 6,
  "clusters": [
    {
      "clusterId": "0",
      "clusterLabel": "checkout, mobile, payment",
      "sentimentPercentage": 83,
      "clusterSize": 5,
      "analysis": {
        "recommendation": "Fix mobile checkout button responsiveness. Implement touch-friendly button sizing (minimum 44px), add loading states to prevent double-taps, and optimize payment processing for mobile browsers. Consider implementing one-click payment options.",
        "impact": "high",
        "urgency": "immediate",
        "cluster_summary": "Users experiencing critical checkout failures on mobile devices preventing purchase completion"
      },
      "shouldCreateTicket": true
    }
  ]
}
```

### 🎪 Demo Scenarios

#### 1. **High Impact + Immediate** (Creates Ticket)

- 5+ checkout failures on mobile
- 80%+ negative sentiment
- **AI Response**: "Fix checkout button", impact: "high", urgency: "immediate"
- **Result**: ✅ Ticket flagged for creation

#### 2. **Medium Impact + Soon** (No Ticket)

- 5+ UI complaints
- 60% negative sentiment
- **AI Response**: "Improve UI design", impact: "medium", urgency: "soon"
- **Result**: ⏸️ No ticket (doesn't meet high+immediate criteria)

#### 3. **Low Volume** (No Analysis)

- < 5 feedbacks
- **Result**: ⏸️ No AI analysis triggered

### 🔍 Check Results

```bash
# View cluster analysis results
curl -X GET http://localhost:6001/api/insight/cluster/form/{FORM_ID} \
  -H "Authorization: Bearer {TOKEN}"
```

### 📊 What the AI Analyzes

1. **Cluster Summary**: Combines all feedback descriptions
2. **Keywords**: Top 3 common keywords become cluster label
3. **Sentiment**: % of dissatisfied/very dissatisfied feedback
4. **Impact Assessment**: Based on functionality affected
5. **Urgency**: Based on severity and user pain points

### 🎯 Success Criteria

- ✅ AI generates actionable recommendations
- ✅ Impact/urgency properly assessed
- ✅ Only high+immediate issues flagged for tickets
- ✅ Prevents duplicate tickets (7-day cooldown)
- ✅ Results stored for tracking
