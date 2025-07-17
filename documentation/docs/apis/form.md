---
sidebar_position: 3
---

# Form API

This page documents the form-related endpoints available in the LUA Platform API. These endpoints allow you to create, retrieve, update, and delete feedback forms.

## Overview

The Form API provides endpoints to manage feedback forms on the LUA Platform. All endpoints require authentication using a JWT token obtained through the login process.

## Create a Form

### Description

This endpoint allows you to create a new feedback form. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/forms/create`
- **Method**: `POST`
- **Tags**: Forms
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Request Body

```json
{
  "title": "Product Quality Survey",
  "description": "Please give us your opinion about the quality of the product",
  "opinion": ["very unhappy", "unhappy", "neutral", "happy", "very happy"],
  "fields": [
    {
      "label": "First Name",
      "type": "text",
      "value": "John"
    },
    {
      "label": "Date of Birth",
      "type": "date"
    },
    {
      "label": "Profile Picture",
      "type": "file"
    }
  ]
}
```

**Notes:**

- The `opinion` field is optional. If not specified, it defaults to `["unhappy", "neutral", "happy"]`.
- The `type` field can be one of: "text", "number", "date", "email", "textarea", "file".
- The `value` field is optional and can contain a default value.

### Responses

| Status Code | Description                        | Response Body |
| ----------- | ---------------------------------- | ------------- |
| 201         | Form created successfully          | Form object   |
| 401         | Token has expired or Invalid token | Error message |
| 403         | Not Authorized - Missing token     | Error message |
| 429         | Rate limit exceeded                | Error message |
| 500         | Internal server error              | Error message |

### Example Request

```bash
curl -X POST \
  'http://backend/api/forms/create' \
  -c cookies.txt -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Product Quality Survey",
    "description": "Please give us your opinion about the quality of the product",
    "opinion": ["very unhappy", "unhappy", "neutral", "happy", "very happy"],
    "fields": [
      {
        "label": "First Name",
        "type": "text",
        "value": "John"
      },
      {
        "label": "Date of Birth",
        "type": "date"
      },
      {
      "label": "Profile Picture",
      "type": "file"
    }
    ]
  }'
```

### Example Response

```json
{
  "title": "Product Quality Survey",
  "description": "Please give us your opinion about the quality of the product",
  "opinion": ["very unhappy", "unhappy", "neutral", "happy", "very happy"],
  "fields": [
    {
      "label": "First Name",
      "type": "text",
      "value": "John",
      "_id": "67d6db77fcfdc0d95911b484"
    },
    {
      "label": "Date of Birth",
      "type": "date",
      "_id": "67d6db77fcfdc0d95911b485"
    },
    {
      "label": "Profile Picture",
      "type": "file",
      "_id": "67d6db77fcfdc0d95911b486"
    }
  ],
  "_id": "67d6db77fcfdc0d95911b483",
  "createdAt": "2025-03-16T14:08:55.226Z",
  "updatedAt": "2025-03-16T14:08:55.226Z",
  "__v": 0
}
```

## Get All Forms

### Description

This endpoint retrieves all forms created by the authenticated user. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/forms`
- **Method**: `GET`
- **Tags**: Forms
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Responses

| Status Code | Description                        | Response Body         |
| ----------- | ---------------------------------- | --------------------- |
| 200         | Forms retrieved successfully       | Array of Form objects |
| 204         | No forms found                     | No content            |
| 401         | Token has expired or Invalid token | Error message         |
| 403         | Not Authorized - Missing token     | Error message         |
| 429         | Rate limit exceeded                | Error message         |
| 500         | Internal server error              | Error message         |

### Example Request

```bash
curl -X GET \
  'http://backend/api/forms' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "title": "Product Quality Survey",
    "description": "Please give us your opinion about the quality of the product",
    "opinion": ["unhappy", "neutral", "happy"],
    "fields": [
      {
        "label": "First Name",
        "type": "text",
        "value": "John",
        "_id": "67d6db77fcfdc0d95911b484"
      },
      {
        "label": "Date of Birth",
        "type": "date",
        "_id": "67d6db77fcfdc0d95911b485"
      }
    ],
    "_id": "67d6db77fcfdc0d95911b483",
    "createdAt": "2025-03-16T14:08:55.226Z",
    "updatedAt": "2025-03-16T14:08:55.226Z",
    "__v": 0
  }
  // Additional forms...
]
```

## Get Form by ID

### Description

This endpoint retrieves a specific form by its ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/forms/{id}`
- **Method**: `GET`
- **Tags**: Forms
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| id        | string | Yes      | The unique identifier of the form |

### Responses

| Status Code | Description                        | Response Body |
| ----------- | ---------------------------------- | ------------- |
| 200         | Form retrieved successfully        | Form object   |
| 401         | Token has expired or Invalid token | Error message |
| 403         | Not Authorized - Missing token     | Error message |
| 404         | Form not found                     | Error message |
| 429         | Rate limit exceeded                | Error message |
| 500         | Internal server error              | Error message |

### Example Request

```bash
curl -X GET \
  'http://backend/api/forms/67d6db77fcfdc0d95911b483' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
{
  "title": "Product Quality Survey",
  "description": "Please give us your opinion about the quality of the product",
  "opinion": ["unhappy", "neutral", "happy"],
  "fields": [
    {
      "label": "First Name",
      "type": "text",
      "value": "John",
      "_id": "67d6db77fcfdc0d95911b484"
    },
    {
      "label": "Date of Birth",
      "type": "date",
      "_id": "67d6db77fcfdc0d95911b485"
    }
  ],
  "_id": "67d6db77fcfdc0d95911b483",
  "createdAt": "2025-03-16T14:08:55.226Z",
  "updatedAt": "2025-03-16T14:08:55.226Z",
  "__v": 0
}
```

## Update Form

### Description

This endpoint allows you to update an existing form by its ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/forms/{id}/edit`
- **Method**: `PATCH`
- **Tags**: Forms
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                                 |
| --------- | ------ | -------- | ------------------------------------------- |
| id        | string | Yes      | The unique identifier of the form to update |

### Request Body

Same as for the Create Form endpoint. You can update any fields of the form.

**Important Notes:**

- If `title`, `description`, or `opinion` are not specified in the request, their existing values will remain unchanged.
- If the `fields` array is not specified in the request, all existing fields will be completely removed from the form.
- To update or keep fields, you must include the entire fields array with all desired fields in the request.

### Responses

| Status Code | Description                        | Response Body       |
| ----------- | ---------------------------------- | ------------------- |
| 200         | Form updated successfully          | Updated Form object |
| 401         | Token has expired or Invalid token | Error message       |
| 403         | Not Authorized - Missing token     | Error message       |
| 404         | Form not found                     | Error message       |
| 429         | Rate limit exceeded                | Error message       |
| 500         | Internal server error              | Error message       |

### Example Request

```bash
curl -X PATCH \
  'http://backend/api/forms/67d6db77fcfdc0d95911b483/edit' \
  -c cookies.txt -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Updated Product Quality Survey",
    "opinion": ["terrible", "poor", "average", "good", "excellent"]
  }'
```

### Example Response

```json
{
  "title": "Updated Product Quality Survey",
  "description": "Please give us your opinion about the quality of the product",
  "opinion": ["terrible", "poor", "average", "good", "excellent"],
  "_id": "67d6db77fcfdc0d95911b483",
  "createdAt": "2025-03-16T14:08:55.226Z",
  "updatedAt": "2025-03-16T14:10:22.114Z",
  "__v": 0
}
```

## Delete Form

### Description

This endpoint allows you to delete a form by its ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/forms/{id}/delete`
- **Method**: `DELETE`
- **Tags**: Forms
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                                 |
| --------- | ------ | -------- | ------------------------------------------- |
| id        | string | Yes      | The unique identifier of the form to delete |

### Responses

| Status Code | Description                        | Response Body       |
| ----------- | ---------------------------------- | ------------------- |
| 200         | Form deleted successfully          | Deleted Form object |
| 401         | Token has expired or Invalid token | Error message       |
| 403         | Not Authorized - Missing token     | Error message       |
| 404         | Form not found                     | Error message       |
| 429         | Rate limit exceeded                | Error message       |
| 500         | Internal server error              | Error message       |

### Example Request

```bash
curl -X DELETE \
  'http://backend/api/forms/67d6db77fcfdc0d95911b483/delete' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
{
  "title": "Updated Product Quality Survey",
  "description": "Please give us your opinion about the quality of the product",
  "opinion": ["terrible", "poor", "average", "good", "excellent"],
  "fields": [
    {
      "label": "First Name",
      "type": "text",
      "value": "John",
      "_id": "67d6db77fcfdc0d95911b484"
    },
    {
      "label": "Date of Birth",
      "type": "date",
      "_id": "67d6db77fcfdc0d95911b485"
    }
  ],
  "_id": "67d6db77fcfdc0d95911b483",
  "createdAt": "2025-03-16T14:08:55.226Z",
  "updatedAt": "2025-03-16T14:10:22.114Z",
  "__v": 0
}
```

## Authentication Requirements

All Form API endpoints require authentication via HTTP-only cookies. After logging in, the JWT token is automatically included in subsequent requests through cookies.

### How Authentication Works

1. **Login**: Use the [login endpoint](/docs/apis/authorization#login-endpoint) to authenticate
2. **Cookie Set**: Server sets an HTTP-only `jwt` cookie
3. **Automatic Authentication**: Browser automatically includes the cookie in API requests
4. **No Manual Headers**: No need to manually set Authorization headers

## Form Fields

Forms can have various field types:

| Type     | Description                  |
| -------- | ---------------------------- |
| text     | A single-line text input     |
| number   | A numeric input field        |
| date     | A date picker field          |
| email    | An email address input field |
| textarea | A multi-line text input area |
| file     | A file upload field          |

## Opinion Options

The `opinion` field allows you to customize the feedback sentiment options:

- If not specified, it defaults to `["unhappy", "neutral", "happy"]`
- You can customize it with your preferred scale (e.g., `["very unhappy", "unhappy", "neutral", "happy", "very happy"]` or `["terrible", "poor", "average", "good", "excellent"]`)
- The number of options is flexible based on your requirements
