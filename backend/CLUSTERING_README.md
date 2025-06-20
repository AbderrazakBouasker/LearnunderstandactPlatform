# Feedback Clustering System

This system automatically clusters user feedback insights to identify common themes and generate actionable recommendations.

## Features

### 1. **Automatic Insight Clustering**

- Groups similar feedback using semantic embeddings
- Uses transformer model (all-MiniLM-L6-v2) for text understanding
- Applies K-means clustering algorithm
- Automatically determines optimal number of clusters

### 2. **AI-Powered Analysis**

- Analyzes clusters for sentiment patterns
- Generates recommendations using Google GenAI
- Assesses impact (high/medium/low) and urgency (immediate/soon/later)
- Creates cluster summaries and labels

### 3. **Smart Ticket Creation**

- Automatically identifies critical issues (>5 feedback + >60% negative sentiment)
- Prevents duplicate tickets (7-day cooldown)
- Ready for Jira/Trello integration

## API Endpoints

### POST `/api/insight/cluster/form/:formId`

Performs clustering analysis on all insights for a specific form.

**Response:**

```json
{
  "formId": "...",
  "totalInsights": 15,
  "clusters": [
    {
      "clusterId": "0",
      "clusterLabel": "checkout, payment, bug",
      "insights": [...],
      "sentimentPercentage": 75,
      "clusterSize": 8,
      "analysis": {
        "recommendation": "Fix checkout flow and payment processing",
        "impact": "high",
        "urgency": "immediate",
        "cluster_summary": "Users experiencing critical checkout failures"
      },
      "shouldCreateTicket": true
    }
  ]
}
```

### GET `/api/insight/cluster/form/:formId`

Retrieves existing cluster analysis results for a form.

## Database Models

### ClusterAnalysis

Stores clustering results and AI analysis:

- `formId`: Reference to the form
- `clusterLabel`: Auto-generated cluster name
- `clusterSummary`: AI-generated summary
- `insightIds`: Array of insights in cluster
- `sentimentPercentage`: % of negative sentiment
- `recommendation`: AI-generated improvement suggestion
- `impact`: high/medium/low
- `urgency`: immediate/soon/later
- `ticketCreated`: Boolean flag
- `lastTicketDate`: Timestamp of last ticket creation

### Updated Insight Model

Added `embedding` field to cache computed embeddings for performance.

## Workflow

1. **Feedback Creation** → GenAI generates insight + embedding
2. **Auto-clustering Check** → Every 5th insight triggers automatic clustering
3. **Manual Clustering** → Can be triggered via API endpoint anytime
4. **Semantic Grouping** → Embeddings clustered by similarity
5. **AI Analysis** → Each cluster analyzed for recommendations
6. **Ticket Decision** → High-impact urgent clusters → ticket creation
7. **Results Storage** → Analysis saved for tracking and history

## Automatic Clustering

The system automatically triggers clustering in the following scenarios:

### **Every 5 Insights**

- Counts total insights for a form after each new feedback
- When count is divisible by 5 (5, 10, 15, 20, etc.) → auto-cluster
- Prevents excessive clustering while keeping analysis current
- Logs trigger reason for monitoring

### **Manual Trigger**

- Always available via `POST /api/insight/cluster/form/:formId`
- Useful for immediate analysis or testing
- No restrictions on frequency (rate limited)

## Configuration

Required environment variables:

- `GOOGLE_AI_API_KEY`: For GenAI analysis
- `AI_MODEL`: GenAI model name (e.g., "gemini-1.5-flash")

## Performance Notes

- First embedding generation downloads ~90MB model (cached)
- Embeddings generated once per insight and cached
- Clustering scales well up to ~100 insights per form
- Rate limited to prevent abuse (10 requests/hour for clustering)

## Future Enhancements

- [ ] Jira/Trello API integration for ticket creation
- [ ] Automated clustering triggers (cron jobs)
- [ ] Advanced clustering algorithms (DBSCAN, hierarchical)
- [ ] Cluster trend analysis over time
- [ ] Email notifications for critical clusters
