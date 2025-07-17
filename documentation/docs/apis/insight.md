---
sidebar_position: 5
---

# Insight API

This page documents the insight-related endpoints available in the LUA Platform API. These endpoints provide AI-powered analysis of feedback data, including sentiment analysis, clustering, and actionable recommendations.

## Overview

The Insight API leverages Google GenAI to analyze feedback submissions and provide valuable insights. It offers automatic clustering of feedback, sentiment analysis, and generates actionable recommendations for product improvements.

## Cluster Insights by Form

### Description

This endpoint clusters feedback insights for a specific form and generates AI-powered recommendations for product improvements. The system automatically groups similar feedback and provides actionable suggestions.

### Endpoint Details

- **URL**: `/api/insights/cluster/form/{formId}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| formId    | string | Yes      | The unique identifier of the form |

### Responses

| Status Code | Description                             | Response Body                    |
| ----------- | --------------------------------------- | -------------------------------- |
| 200         | Cluster analysis completed successfully | Array of cluster recommendations |
| 400         | Invalid form ID                         | Error message                    |
| 401         | Token has expired or Invalid token      | Error message                    |
| 403         | Not Authorized - Missing token          | Error message                    |
| 404         | Form not found or no insights available | Error message                    |
| 500         | Internal server error                   | Error message                    |

### Example Request

```bash
curl -X GET \
  'http://backend/api/insights/cluster/form/67d6db77fcfdc0d95911b483' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "clusterLabel": "User Interface Issues",
    "recommendation": "Improve the navigation menu design and add more intuitive icons to enhance user experience",
    "impact": "high",
    "urgency": "soon",
    "cluster_summary": "Users are complaining about confusing navigation and hard-to-find features",
    "insightCount": 15,
    "avgSentiment": "dissatisfied"
  },
  {
    "clusterLabel": "Performance Problems",
    "recommendation": "Optimize database queries and implement caching to reduce page load times",
    "impact": "medium",
    "urgency": "immediate",
    "cluster_summary": "Users report slow loading times and timeouts during peak usage",
    "insightCount": 8,
    "avgSentiment": "neutral"
  }
]
```

## Get All Insights

### Description

This endpoint retrieves all insights across the platform. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/insights`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Responses

| Status Code | Description                        | Response Body            |
| ----------- | ---------------------------------- | ------------------------ |
| 200         | Insights retrieved successfully    | Array of Insight objects |
| 204         | No insights found                  | No content               |
| 401         | Token has expired or Invalid token | Error message            |
| 403         | Not Authorized - Missing token     | Error message            |
| 500         | Internal server error              | Error message            |

### Example Request

```bash
curl -X GET \
  'http://backend/api/insights' \
  -c cookies.txt -b cookies.txt
```

## Get Insights by Organization

### Description

This endpoint retrieves all insights for a specific organization. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/insights/organization/{organization}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter    | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| organization | string | Yes      | The organization identifier |

### Responses

| Status Code | Description                        | Response Body            |
| ----------- | ---------------------------------- | ------------------------ |
| 200         | Insights retrieved successfully    | Array of Insight objects |
| 204         | No insights found for organization | No content               |
| 401         | Token has expired or Invalid token | Error message            |
| 403         | Not Authorized - Missing token     | Error message            |
| 500         | Internal server error              | Error message            |

## Get Insight by ID

### Description

This endpoint retrieves a specific insight by its ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/insights/{id}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                          |
| --------- | ------ | -------- | ------------------------------------ |
| id        | string | Yes      | The unique identifier of the insight |

### Responses

| Status Code | Description                        | Response Body  |
| ----------- | ---------------------------------- | -------------- |
| 200         | Insight retrieved successfully     | Insight object |
| 401         | Token has expired or Invalid token | Error message  |
| 403         | Not Authorized - Missing token     | Error message  |
| 404         | Insight not found                  | Error message  |
| 500         | Internal server error              | Error message  |

## Get Insights by Feedback ID

### Description

This endpoint retrieves insights associated with a specific feedback submission. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/insights/feedback/{feedbackId}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter  | Type   | Required | Description                           |
| ---------- | ------ | -------- | ------------------------------------- |
| feedbackId | string | Yes      | The unique identifier of the feedback |

## Get Insights by Form ID

### Description

This endpoint retrieves all insights for a specific form. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/insights/form/{formId}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| formId    | string | Yes      | The unique identifier of the form |

## Delete Insight

### Description

This endpoint allows you to delete a specific insight. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/insights/{id}`
- **Method**: `DELETE`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                                    |
| --------- | ------ | -------- | ---------------------------------------------- |
| id        | string | Yes      | The unique identifier of the insight to delete |

### Responses

| Status Code | Description                        | Response Body   |
| ----------- | ---------------------------------- | --------------- |
| 200         | Insight deleted successfully       | Success message |
| 401         | Token has expired or Invalid token | Error message   |
| 403         | Not Authorized - Missing token     | Error message   |
| 404         | Insight not found                  | Error message   |
| 500         | Internal server error              | Error message   |

## Get Cluster Analysis by Form

### Description

This endpoint provides detailed cluster analysis for a specific form, including sentiment distribution and clustering patterns.

### Endpoint Details

- **URL**: `/api/insights/cluster-analysis/form/{formId}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| formId    | string | Yes      | The unique identifier of the form |

## Get Cluster Analysis by Organization

### Description

This endpoint provides comprehensive cluster analysis across all forms within an organization.

### Endpoint Details

- **URL**: `/api/insights/cluster-analysis/organization/{organization}`
- **Method**: `GET`
- **Tags**: Insights
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter    | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| organization | string | Yes      | The organization identifier |

## AI Analysis Features

### Sentiment Analysis

The system automatically analyzes feedback content to determine sentiment levels:

- **Very Dissatisfied**: Critical issues requiring immediate attention
- **Dissatisfied**: Problems that need addressing
- **Neutral**: Mixed or unclear sentiment
- **Satisfied**: Positive feedback with minor suggestions
- **Very Satisfied**: Highly positive feedback

### Keyword Extraction

Automatically identifies up to 5 key topics or keywords from feedback content to help categorize and understand common themes.

### Impact Assessment

AI-generated recommendations include impact assessment:

- **High Impact**: Affects core functionality, revenue, or user retention
- **Medium Impact**: Affects user experience but not critical
- **Low Impact**: Nice-to-have improvements

### Urgency Classification

Recommendations are prioritized by urgency:

- **Immediate**: Fix within 1-2 weeks (critical issues)
- **Soon**: Fix within 1-2 months (important improvements)
- **Later**: Fix when resources allow (minor issues)

## Usage Notes

- All insight endpoints require authentication
- AI analysis is powered by Google GenAI
- Clustering happens automatically when new feedback is submitted
- Insights include both automated analysis and actionable recommendations
- Recommendations are generated based on clustered feedback patterns
- All AI operations are logged for monitoring and improvement
