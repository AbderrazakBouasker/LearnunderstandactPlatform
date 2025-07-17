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
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| id        | string | Yes      | The unique identifier of the user |

### Responses

| Status Code | Description                             | Response Body |
| ----------- | --------------------------------------- | ------------- |
| 200         | User information retrieved successfully | User object   |
| 401         | Token has expired or Invalid token      | Error message |
| 403         | Not Authorized - Missing token          | Error message |
| 429         | Rate limit exceeded                     | Error message |
| 500         | Server error                            | Error message |

### Example Request

**Note:** This example assumes you have already logged in and saved cookies to `cookies.txt`. See [Authentication Guide](/docs/apis/authorization#authentication-for-protected-endpoints) for details.

```bash
curl -X GET \
  'http://backend/api/user/60d21b4667d0d8992e610c85' \
  -c cookies.txt -b cookies.txt
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

## Get Current User (Me)

### Description

This endpoint retrieves the currently authenticated user's information with populated organization details. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/user/me`
- **Method**: `GET`
- **Tags**: User
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Responses

| Status Code | Description                             | Response Body                         |
| ----------- | --------------------------------------- | ------------------------------------- |
| 200         | User information retrieved successfully | User object with organization details |
| 401         | Token has expired or Invalid token      | Error message                         |
| 403         | Not Authorized - Missing token          | Error message                         |
| 404         | User not found                          | Error message                         |
| 500         | Server error                            | Error message                         |

### Example Request

```bash
curl -X GET \
  'http://backend/api/user/me' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "username": "johndoe",
  "email": "user@example.com",
  "organization": "myorg123",
  "organizationName": "My Organization",
  "organizationDetails": {
    "_id": "60d21b4667d0d8992e610c86",
    "name": "My Organization",
    "identifier": "myorg123"
  }
}
```

## Update User

### Description

This endpoint allows users to update their account information. All updates require current password verification for security. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/user/{id}`
- **Method**: `PUT`
- **Tags**: User
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| id        | string | Yes      | The unique identifier of the user |

### Request Body

```json
{
  "currentPassword": "currentpassword123",
  "username": "newusername",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Notes:**

- `currentPassword` is required for all updates
- `username` is optional - must be unique if provided
- `email` is optional - must be unique if provided
- `password` is optional - new password if changing

### Responses

| Status Code | Description                                           | Response Body   |
| ----------- | ----------------------------------------------------- | --------------- |
| 200         | User updated successfully                             | Success message |
| 400         | Current password required or Invalid current password | Error message   |
| 401         | Token has expired or Invalid token                    | Error message   |
| 403         | Not Authorized - Missing token                        | Error message   |
| 404         | User not found                                        | Error message   |
| 409         | Username or email already exists                      | Error message   |
| 500         | Server error                                          | Error message   |

### Example Request

```bash
curl -X PUT \
  'http://backend/api/user/60d21b4667d0d8992e610c85' \
  -c cookies.txt -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "currentPassword": "currentpassword123",
    "username": "newusername",
    "email": "newemail@example.com"
  }'
```

### Example Response

```json
{
  "message": "User updated successfully"
}
```

## Add User to Organization

### Description

This endpoint allows adding a user to an organization using the organization identifier. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/user/{id}/organization`
- **Method**: `POST`
- **Tags**: User
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| id        | string | Yes      | The unique identifier of the user |

### Request Body

```json
{
  "organizationIdentifier": "myorg123"
}
```

### Responses

| Status Code | Description                                                      | Response Body   |
| ----------- | ---------------------------------------------------------------- | --------------- |
| 200         | User added to organization successfully                          | Success message |
| 400         | Organization identifier required or User already in organization | Error message   |
| 401         | Token has expired or Invalid token                               | Error message   |
| 403         | Not Authorized - Missing token                                   | Error message   |
| 404         | User not found                                                   | Error message   |
| 500         | Server error                                                     | Error message   |

### Example Request

```bash
curl -X POST \
  'http://backend/api/user/60d21b4667d0d8992e610c85/organization' \
  -c cookies.txt -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "organizationIdentifier": "myorg123"
  }'
```

### Example Response

```json
{
  "message": "User added to organization successfully"
}
```

## Remove User from Organization

### Description

This endpoint allows removing a user from an organization. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/user/{id}/organization/{organizationId}`
- **Method**: `DELETE`
- **Tags**: User
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter      | Type   | Required | Description                               |
| -------------- | ------ | -------- | ----------------------------------------- |
| id             | string | Yes      | The unique identifier of the user         |
| organizationId | string | Yes      | The unique identifier of the organization |

## Authentication Requirements

All endpoints in the User API require authentication via HTTP-only cookies. After logging in, the JWT token is automatically included in subsequent requests through cookies.

### How Authentication Works

1. **Login**: Use the [login endpoint](/docs/apis/authorization#login-endpoint) to authenticate
2. **Cookie Set**: Server sets an HTTP-only `jwt` cookie
3. **Automatic Authentication**: Browser automatically includes the cookie in API requests
4. **No Manual Headers**: No need to manually set Authorization headers

This token is obtained through the [login endpoint](/docs/apis/authorization#login-endpoint) in the Authentication API.

## Usage Notes

- User information should only be accessible to the user themselves or users with admin privileges
- The password field is typically not returned in the response for security reasons
- The user ID in the endpoint must match the authenticated user's ID or the request must come from a user with admin privileges
- All password updates require current password verification for security
- Username and email updates are validated for uniqueness
- Organization operations may require specific permissions within the organization
