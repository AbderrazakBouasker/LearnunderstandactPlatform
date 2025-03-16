---
sidebar_position: 4
---

# Feedback API

This page documents the feedback-related endpoints available in the LUA Platform API. These endpoints allow you to create, retrieve, and delete feedback submissions.

## Overview

The Feedback API provides endpoints to manage feedback submissions on the LUA Platform. These endpoints enable users to submit feedback for forms and administrators to view and manage those submissions.

## Create a Feedback

### Description

This endpoint allows end users to submit feedback for a specific form. This endpoint does not require authentication, making it accessible to all users.

### Endpoint Details

- **URL**: `/api/feedbacks/create/{id}`
- **Method**: `POST`
- **Tags**: Feedbacks
- **Authentication**: None required
- **Rate Limit**: 5 requests per minute

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the form for which feedback is being submitted |

### Request Body

The request body uses `multipart/form-data` to support file uploads:

```json
{
  "opinion": "happy",
  "fields": [
    {
      "label": "first name",
      "value": "hassen"
    },
    {
      "label": "date of birth",
      "value": "25/12/2025"
    },
    {
      "label": "picture",
      "value": "image1.png"
    }
  ]
}
```

**Notes:**
- The `opinion` field should match one of the opinion options defined in the form.
- The `fields` array should contain objects that match the fields defined in the form.
- For file type fields, the value represents the file name.

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 201 | Feedback created successfully | Feedback object |
| 400 | Missing field or invalid type | Error message |
| 404 | Form not found | Error message |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

### Example Request

```bash
curl -X POST \
  'http://backend/api/feedbacks/create/67d6db77fcfdc0d95911b483' \
  -H 'Content-Type: multipart/form-data' \
  -F 'opinion=happy' \
  -F 'fields=[{"label":"first name","value":"hassen"},{"label":"date of birth","value":"25/12/2025"},{"label":"picture","value":"image1.png"}]' \
  -F 'file=@image1.png'
```

### Example Response

```json
{
  "formId": "67d6db77fcfdc0d95911b483",
  "formTitle": "Product Quality",
  "formDescription": "Please give us you opinion about the quality of the product",
  "opinion": "happy",
  "fields": [
    {
      "label": "first name",
      "value": "hassen",
      "_id": "67d6e21bfcfdc0d95911b49a"
    },
    {
      "label": "date of birth",
      "value": "25/12/2025",
      "_id": "67d6e21bfcfdc0d95911b49b"
    },
    {
      "label": "picture",
      "value": "/home/image1.png",
      "_id": "67d6e21bfcfdc0d95911b49c"
    }
  ],
  "_id": "67d6e21bfcfdc0d95911b499",
  "createdAt": "2025-03-16T14:37:15.242Z",
  "updatedAt": "2025-03-16T14:37:15.242Z",
  "__v": 0
}
```

## Get All Feedbacks

### Description

This endpoint retrieves all feedback submissions across all forms. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/feedbacks`
- **Method**: `GET`
- **Tags**: Feedbacks
- **Authentication**: Bearer Token (JWT)
- **Rate Limit**: 100 requests per minute

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | Feedbacks retrieved successfully | Array of Feedback objects |
| 204 | No feedbacks found | No content |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

### Example Request

```bash
curl -X GET \
  'http://backend/api/feedbacks' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Example Response

```json
[
  {
    "formId": "67d6db77fcfdc0d95911b483",
    "formTitle": "Product Quality",
    "formDescription": "Please give us you opinion about the quality of the product",
    "opinion": "happy",
    "fields": [
      {
        "label": "first name",
        "value": "hassen",
        "_id": "67d6e21bfcfdc0d95911b49a"
      },
      {
        "label": "date of birth",
        "value": "25/12/2025",
        "_id": "67d6e21bfcfdc0d95911b49b"
      }
    ],
    "_id": "67d6e21bfcfdc0d95911b499",
    "createdAt": "2025-03-16T14:37:15.242Z",
    "updatedAt": "2025-03-16T14:37:15.242Z",
    "__v": 0
  },
  // Additional feedbacks...
]
```

## Get Feedback by ID

### Description

This endpoint retrieves a specific feedback submission by its ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/feedbacks/{id}`
- **Method**: `GET`
- **Tags**: Feedbacks
- **Authentication**: Bearer Token (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The unique identifier of the feedback |

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | Feedback retrieved successfully | Feedback object |
| 404 | Feedback not found | Error message |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

### Example Request

```bash
curl -X GET \
  'http://backend/api/feedbacks/67d6e21bfcfdc0d95911b499' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Example Response

```json
{
  "formId": "67d6db77fcfdc0d95911b483",
  "formTitle": "Product Quality",
  "formDescription": "Please give us you opinion about the quality of the product",
  "opinion": "happy",
  "fields": [
    {
      "label": "first name",
      "value": "hassen",
      "_id": "67d6e21bfcfdc0d95911b49a"
    },
    {
      "label": "date of birth",
      "value": "25/12/2025",
      "_id": "67d6e21bfcfdc0d95911b49b"
    },
    {
      "label": "picture",
      "value": "/home/image1.png",
      "_id": "67d6e21bfcfdc0d95911b49c"
    }
  ],
  "_id": "67d6e21bfcfdc0d95911b499",
  "createdAt": "2025-03-16T14:37:15.242Z",
  "updatedAt": "2025-03-16T14:37:15.242Z",
  "__v": 0
}
```

## Get Feedbacks by Form ID

### Description

This endpoint retrieves all feedback submissions for a specific form. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/feedbacks/form/{id}`
- **Method**: `GET`
- **Tags**: Feedbacks
- **Authentication**: Bearer Token (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The ID of the form for which to retrieve feedbacks |

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | Feedbacks retrieved successfully | Array of Feedback objects |
| 204 | No feedbacks found | No content |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

### Example Request

```bash
curl -X GET \
  'http://backend/api/feedbacks/form/67d6db77fcfdc0d95911b483' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Example Response

```json
[
  {
    "formId": "67d6db77fcfdc0d95911b483",
    "formTitle": "Product Quality",
    "formDescription": "Please give us you opinion about the quality of the product",
    "opinion": "happy",
    "fields": [
      {
        "label": "first name",
        "value": "hassen",
        "_id": "67d6e21bfcfdc0d95911b49a"
      },
      {
        "label": "date of birth",
        "value": "25/12/2025",
        "_id": "67d6e21bfcfdc0d95911b49b"
      }
    ],
    "_id": "67d6e21bfcfdc0d95911b499",
    "createdAt": "2025-03-16T14:37:15.242Z",
    "updatedAt": "2025-03-16T14:37:15.242Z",
    "__v": 0
  },
  // Additional feedbacks for the same form...
]
```

## Delete Feedback

### Description

This endpoint allows you to delete a feedback submission by its ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/feedbacks/{id}/delete`
- **Method**: `DELETE`
- **Tags**: Feedbacks
- **Authentication**: Bearer Token (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The unique identifier of the feedback to delete |

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | Feedback deleted successfully | Deleted Feedback object |
| 404 | Feedback not found | Error message |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

### Example Request

```bash
curl -X DELETE \
  'http://backend/api/feedbacks/67d6e21bfcfdc0d95911b499/delete' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Example Response

```json
{
  "formId": "67d6db77fcfdc0d95911b483",
  "formTitle": "Product Quality",
  "formDescription": "Please give us you opinion about the quality of the product",
  "opinion": "happy",
  "fields": [
    {
      "label": "first name",
      "value": "hassen",
      "_id": "67d6e21bfcfdc0d95911b49a"
    },
    {
      "label": "date of birth",
      "value": "25/12/2025",
      "_id": "67d6e21bfcfdc0d95911b49b"
    },
    {
      "label": "picture",
      "value": "/home/image1.png",
      "_id": "67d6e21bfcfdc0d95911b49c"
    }
  ],
  "_id": "67d6e21bfcfdc0d95911b499",
  "createdAt": "2025-03-16T14:37:15.242Z",
  "updatedAt": "2025-03-16T14:37:15.242Z",
  "__v": 0
}
```

## Authentication Requirements

All Feedback API endpoints except for creating a feedback require the JWT token to be included in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

This token is obtained through the [login endpoint](/docs/apis/authorization#login-endpoint) in the Authentication API.

## File Upload

When submitting feedback that includes file fields:

1. The request must use `multipart/form-data` format
2. The file field should be included as a separate part in the form data
3. In the fields array, include the file's label and provide a value (which could be a file name or path)
