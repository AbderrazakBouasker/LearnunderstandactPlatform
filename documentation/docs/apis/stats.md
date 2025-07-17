---
sidebar_position: 7
---

# Statistics API

This page documents the statistics-related endpoints available in the LUA Platform API. These endpoints provide analytics and metrics for feedback data, opinions, and clusters.

## Overview

The Statistics API provides comprehensive analytics for organizations and forms, including feedback counts over time, opinion distributions, and cluster analysis statistics.

## Get Feedback Count Over Time by Organization

### Description

This endpoint retrieves feedback count statistics over a specified time period for an organization.

### Endpoint Details

- **URL**: `/api/stats/feedback-count/organization/{organization}`
- **Method**: `GET`
- **Tags**: Statistics
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter    | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| organization | string | Yes      | The organization identifier |

### Query Parameters

| Parameter | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| startDate | string | Yes      | Start date in ISO format (YYYY-MM-DD) |
| endDate   | string | Yes      | End date in ISO format (YYYY-MM-DD)   |

### Responses

| Status Code | Description                        | Response Body                  |
| ----------- | ---------------------------------- | ------------------------------ |
| 200         | Statistics retrieved successfully  | Array of daily feedback counts |
| 400         | Missing startDate or endDate       | Error message                  |
| 401         | Token has expired or Invalid token | Error message                  |
| 403         | Not Authorized - Missing token     | Error message                  |
| 500         | Internal server error              | Error message                  |

### Example Request

```bash
curl -X GET \
  'http://backend/api/stats/feedback-count/organization/myorg123?startDate=2023-01-01&endDate=2023-12-31' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "_id": "2023-10-25",
    "count": 15
  },
  {
    "_id": "2023-10-26",
    "count": 12
  }
]
```

## Get Feedback Count Over Time by Form

### Description

This endpoint retrieves feedback count statistics over a specified time period for a specific form.

### Endpoint Details

- **URL**: `/api/stats/feedback-count/form/{formId}`
- **Method**: `GET`
- **Tags**: Statistics
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| formId    | string | Yes      | The form ID (ObjectId or string) |

### Query Parameters

| Parameter | Type   | Required | Description                           |
| --------- | ------ | -------- | ------------------------------------- |
| startDate | string | Yes      | Start date in ISO format (YYYY-MM-DD) |
| endDate   | string | Yes      | End date in ISO format (YYYY-MM-DD)   |

### Responses

| Status Code | Description                        | Response Body                  |
| ----------- | ---------------------------------- | ------------------------------ |
| 200         | Statistics retrieved successfully  | Array of daily feedback counts |
| 400         | Missing startDate or endDate       | Error message                  |
| 401         | Token has expired or Invalid token | Error message                  |
| 403         | Not Authorized - Missing token     | Error message                  |
| 500         | Internal server error              | Error message                  |

### Example Request

```bash
curl -X GET \
  'http://backend/api/stats/feedback-count/form/67d6db77fcfdc0d95911b483?startDate=2023-01-01&endDate=2023-12-31' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "_id": "2023-10-25",
    "count": 8
  },
  {
    "_id": "2023-10-26",
    "count": 5
  }
]
```

## Get Total Feedback by Form

### Description

This endpoint retrieves the total feedback count grouped by form for an organization.

### Endpoint Details

- **URL**: `/api/stats/total-feedback/organization/{organization}`
- **Method**: `GET`
- **Tags**: Statistics
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter    | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| organization | string | Yes      | The organization identifier |

### Responses

| Status Code | Description                        | Response Body                 |
| ----------- | ---------------------------------- | ----------------------------- |
| 200         | Statistics retrieved successfully  | Array of form feedback counts |
| 401         | Token has expired or Invalid token | Error message                 |
| 403         | Not Authorized - Missing token     | Error message                 |
| 500         | Internal server error              | Error message                 |

### Example Request

```bash
curl -X GET \
  'http://backend/api/stats/total-feedback/organization/myorg123' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "_id": "67d6db77fcfdc0d95911b483",
    "formTitle": "Product Quality Survey",
    "count": 145
  },
  {
    "_id": "67d6db77fcfdc0d95911b484",
    "formTitle": "Customer Service Feedback",
    "count": 89
  }
]
```

## Get Opinion Counts by Form

### Description

This endpoint retrieves the distribution of opinions (happy, neutral, unhappy) for a specific form.

### Endpoint Details

- **URL**: `/api/stats/opinions/form/{formId}`
- **Method**: `GET`
- **Tags**: Statistics
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| formId    | string | Yes      | The form ID (ObjectId or string) |

### Responses

| Status Code | Description                               | Response Body           |
| ----------- | ----------------------------------------- | ----------------------- |
| 200         | Opinion statistics retrieved successfully | Array of opinion counts |
| 401         | Token has expired or Invalid token        | Error message           |
| 403         | Not Authorized - Missing token            | Error message           |
| 500         | Internal server error                     | Error message           |

### Example Request

```bash
curl -X GET \
  'http://backend/api/stats/opinions/form/67d6db77fcfdc0d95911b483' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "_id": "happy",
    "count": 85
  },
  {
    "_id": "neutral",
    "count": 42
  },
  {
    "_id": "unhappy",
    "count": 18
  }
]
```

## Get Cluster Statistics by Organization

### Description

This endpoint retrieves general cluster statistics for an organization, providing insights into feedback clustering patterns.

### Endpoint Details

- **URL**: `/api/stats/clusters/organization/{organization}`
- **Method**: `GET`
- **Tags**: Statistics
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter    | Type   | Required | Description                 |
| ------------ | ------ | -------- | --------------------------- |
| organization | string | Yes      | The organization identifier |

## Get Cluster Sentiment by Form

### Description

This endpoint tracks cluster sentiment over time for a specific form, helping understand how sentiment patterns evolve.

### Endpoint Details

- **URL**: `/api/stats/cluster-sentiment/form/{formId}`
- **Method**: `GET`
- **Tags**: Statistics
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| formId    | string | Yes      | The form ID |

## Usage Notes

- All statistics endpoints require authentication
- Date parameters should be in ISO format (YYYY-MM-DD)
- Form IDs can be either MongoDB ObjectIds or string identifiers
- Results are typically sorted by date or count for better analysis
- Statistics are calculated in real-time from the feedback database
