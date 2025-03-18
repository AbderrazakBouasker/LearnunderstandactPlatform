---
sidebar_position: 2
---

# User API

This page documents the user-related endpoints available in the LUA Platform API.

## Overview

The User API allows you to retrieve user information. These endpoints require authentication using a JWT token obtained through the login process.

## Get User by ID

### Description

This endpoint retrieves a user's information by their unique ID. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/user/{id}`
- **Method**: `GET`
- **Tags**: User
- **Authentication**: Bearer Token (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | The unique identifier of the user |

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | User information retrieved successfully | User object |
| 401 | Token has expired or Invalid token | Error message |
| 403 | Not Authorized - Missing token | Error message |
| 429 | Rate limit exceeded | Error message |
| 500 | Server error | Error message |

### Example Request

```bash
curl -X GET \
  'http://backend/api/user/60d21b4667d0d8992e610c85' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### Example Response

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "email": "user@example.com",
  "role": "user",
  "createdAt": "2023-10-25T12:00:00Z",
  "updatedAt": "2023-10-25T12:00:00Z"
}
```

## Authentication Requirements

All endpoints in the User API require the JWT token to be included in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

This token is obtained through the [login endpoint](/docs/apis/authorization#login-endpoint) in the Authentication API.

## Usage Notes

- User information should only be accessible to the user themselves or users with admin privileges
- The password field is typically not returned in the response for security reasons
- The user ID in the endpoint must match the authenticated user's ID or the request must come from a user with admin privileges
