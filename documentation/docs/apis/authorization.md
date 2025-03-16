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
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Responses

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | User registered successfully | User object |
| 409 | User already exists | Error message |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

### Example Request

```bash
curl -X POST \
  'http://backend/api/auth/register' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Example Response

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "email": "user@example.com",
  "role": "admin",
  "createdAt": "2023-10-25T12:00:00Z",
  "updatedAt": "2023-10-25T12:00:00Z"
}
```

## Login Endpoint

### Description

The login endpoint authenticates existing users and provides a JWT token for accessing protected endpoints. This token should be included in the Authorization header of subsequent requests.

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

| Status Code | Description | Response Body |
|-------------|-------------|--------------|
| 200 | User logged in successfully | Token and user object |
| 400 | Invalid credentials | Error message |
| 404 | User not found | Error message |
| 429 | Rate limit exceeded | Error message |
| 500 | Internal server error | Error message |

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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MGQyMWI0NjY3ZDBkODk5MmU2MTBjODUiLCJpYXQiOjE2MzUxNTcyMDAsImV4cCI6MTYzNTI0MzYwMH0.7dJbJhQdIJ_GvZmndPs9a5ommfXNnxVedSF_Cgo6PVE",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com",
    "role": "admin",
    "createdAt": "2023-10-25T12:00:00Z",
    "updatedAt": "2023-10-25T12:00:00Z"
  }
}
```

## The Role Attribute

The role attribute is optional it takes the value admin by default if not explicitly specified.

## Using the JWT Token

After successful login, the JWT token should be included in the Authorization header for all protected endpoints:

```
Authorization: Bearer <your-jwt-token>
```

This token is required for accessing most of the other endpoints in the LUA Platform API.
