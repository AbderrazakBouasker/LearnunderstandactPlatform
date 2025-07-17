---
sidebar_position: 1
---

# Authentication API

This page documents the authentication endpoints available in the LUA Platform API. These endpoints allow users to register for a new account and log in to existing accounts.

## Overview

The LUA Platform provides two main authentication endpoints:

- Register: Create a new user account
- Login: Authenticate an existing user and receive an access token

Both endpoints are rate-limited to protect the system from abuse.

## Register Endpoint

### Description

The register endpoint allows new users to create an account on the LUA Platform. This endpoint does not require any authentication.

### Endpoint Details

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Tags**: Auth
- **Rate Limit**: 10 requests per minute

### Request Body

```json
{
  "username": "johndoe",
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "admin",
  "organization": "myorg123",
  "organizationName": "My Organization"
}
```

**Notes:**

- `username` is required and must be unique
- `email` is required and must be unique
- `password` is required
- `role` is optional and defaults to "admin" if not specified
- `organization` is optional - unique identifier for the organization
- `organizationName` is optional - display name for the organization

### Responses

| Status Code | Description                                    | Response Body |
| ----------- | ---------------------------------------------- | ------------- |
| 200         | User registered successfully                   | User object   |
| 409         | User already exists or Username already exists | Error message |
| 429         | Rate limit exceeded                            | Error message |
| 500         | Internal server error                          | Error message |

### Example Request

```bash
curl -X POST \
  'http://backend/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "johndoe",
    "email": "user@example.com",
    "password": "securepassword123",
    "role": "admin",
    "organization": "myorg123",
    "organizationName": "My Organization"
  }'
```

### Example Response

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "username": "johndoe",
  "email": "user@example.com",
  "role": "admin",
  "organization": "myorg123",
  "organizationName": "My Organization",
  "createdAt": "2023-10-25T12:00:00Z",
  "updatedAt": "2023-10-25T12:00:00Z"
}
```

## Login Endpoint

### Description

The login endpoint authenticates existing users and sets an HTTP-only JWT cookie for accessing protected endpoints. This cookie is automatically included in subsequent requests for secure authentication.

### Endpoint Details

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Tags**: Auth
- **Rate Limit**: 10 requests per minute

### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Responses

| Status Code | Description                 | Response Body         |
| ----------- | --------------------------- | --------------------- |
| 200         | User logged in successfully | Token and user object |
| 400         | Invalid credentials         | Error message         |
| 404         | User not found              | Error message         |
| 429         | Rate limit exceeded         | Error message         |
| 500         | Internal server error       | Error message         |

### Example Request

```bash
curl -X POST \
  'http://backend/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Example Response

```json
{
  "message": "Logged in successfully"
}
```

**Note:** The login endpoint sets an HTTP-only cookie named `jwt` with the authentication token. This cookie is automatically included in subsequent requests to authenticated endpoints.

## The Role Attribute

The role attribute is optional it takes the value admin by default if not explicitly specified.

## Logout Endpoint

### Description

The logout endpoint allows authenticated users to log out by clearing their authentication cookie. This endpoint helps ensure secure session management.

### Endpoint Details

- **URL**: `/api/auth/logout`
- **Method**: `POST`
- **Tags**: Auth
- **Authentication**: None required (but typically called by authenticated users)

### Responses

| Status Code | Description                  | Response Body   |
| ----------- | ---------------------------- | --------------- |
| 200         | User logged out successfully | Success message |
| 500         | Internal server error        | Error message   |

### Example Request

```bash
curl -X POST \
  'http://backend/api/auth/logout' \
  -H 'Content-Type: application/json'
```

### Example Response

```json
{
  "message": "Logged out successfully"
}
```

## Authentication for Protected Endpoints

After successful login, authentication is handled automatically through HTTP-only cookies. The login endpoint sets a secure JWT cookie that is automatically included in subsequent requests.

### How It Works

1. **Login**: Call the login endpoint with valid credentials
2. **Cookie Set**: Server sets an HTTP-only cookie named `jwt`
3. **Automatic Authentication**: Browser automatically includes the cookie in future requests
4. **No Manual Headers**: No need to manually include Authorization headers

### Security Benefits

- **HTTP-only cookies** prevent client-side JavaScript access
- **Automatic inclusion** reduces the risk of token exposure
- **Secure transmission** when used with HTTPS
- **Protection against XSS attacks** through HTTP-only flag

### For API Testing

When testing with tools like Postman or curl, ensure cookies are preserved between requests:

```bash
# Use -c to save cookies and -b to send them
curl -c cookies.txt -b cookies.txt -X POST \
  'http://backend/api/auth/login' \
  -H 'Content-Type: application/json' \
  -d '{"email": "user@example.com", "password": "password123"}'

# Subsequent authenticated requests
curl -b cookies.txt -X GET \
  'http://backend/api/protected-endpoint'
```

This authentication method is required for accessing most of the other endpoints in the LUA Platform API.
