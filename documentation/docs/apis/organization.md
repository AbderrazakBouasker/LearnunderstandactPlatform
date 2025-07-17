---
sidebar_position: 6
---

# Organization API

This page documents the organization-related endpoints available in the LUA Platform API. These endpoints allow you to create, retrieve, update, and manage organizations and their members.

## Overview

The Organization API provides comprehensive management of organizations on the LUA Platform. Organizations can have multiple members with different roles, and various configuration settings including JIRA integration and email settings.

## Create Organization

### Description

This endpoint allows you to create a new organization. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/create`
- **Method**: `POST`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Request Body

```json
{
  "name": "My Organization",
  "identifier": "myorg123",
  "members": [
    {
      "user": "60d21b4667d0d8992e610c85",
      "role": "admin"
    }
  ]
}
```

**Notes:**

- `identifier` is required and must be unique
- `name` is optional - display name for the organization
- `members` is optional - array of user objects with roles

### Responses

| Status Code | Description                                 | Response Body       |
| ----------- | ------------------------------------------- | ------------------- |
| 201         | Organization created successfully           | Organization object |
| 400         | Missing identifier                          | Error message       |
| 409         | Organization with identifier already exists | Error message       |
| 401         | Token has expired or Invalid token          | Error message       |
| 403         | Not Authorized - Missing token              | Error message       |
| 500         | Internal server error                       | Error message       |

### Example Request

```bash
curl -X POST \
  'http://backend/api/organizations/create' \
  -c cookies.txt -b cookies.txt \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Organization",
    "identifier": "myorg123"
  }'
```

### Example Response

```json
{
  "_id": "60d21b4667d0d8992e610c86",
  "name": "My Organization",
  "identifier": "myorg123",
  "members": [],
  "createdAt": "2023-10-25T12:00:00Z",
  "updatedAt": "2023-10-25T12:00:00Z"
}
```

## Get All Organizations

### Description

This endpoint retrieves all organizations with populated member information. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations`
- **Method**: `GET`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Responses

| Status Code | Description                          | Response Body                 |
| ----------- | ------------------------------------ | ----------------------------- |
| 200         | Organizations retrieved successfully | Array of Organization objects |
| 204         | No organizations found               | No content                    |
| 401         | Token has expired or Invalid token   | Error message                 |
| 403         | Not Authorized - Missing token       | Error message                 |
| 500         | Internal server error                | Error message                 |

### Example Request

```bash
curl -X GET \
  'http://backend/api/organizations' \
  -c cookies.txt -b cookies.txt
```

### Example Response

```json
[
  {
    "_id": "60d21b4667d0d8992e610c86",
    "name": "My Organization",
    "identifier": "myorg123",
    "members": [
      {
        "user": {
          "_id": "60d21b4667d0d8992e610c85",
          "username": "johndoe",
          "email": "john@example.com"
        },
        "role": "admin"
      }
    ],
    "createdAt": "2023-10-25T12:00:00Z",
    "updatedAt": "2023-10-25T12:00:00Z"
  }
]
```

## Get Organization by ID

### Description

This endpoint retrieves a specific organization by its ID with populated member information. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}`
- **Method**: `GET`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter | Type   | Required | Description                               |
| --------- | ------ | -------- | ----------------------------------------- |
| id        | string | Yes      | The unique identifier of the organization |

### Responses

| Status Code | Description                         | Response Body       |
| ----------- | ----------------------------------- | ------------------- |
| 200         | Organization retrieved successfully | Organization object |
| 401         | Token has expired or Invalid token  | Error message       |
| 403         | Not Authorized - Missing token      | Error message       |
| 404         | Organization not found              | Error message       |
| 500         | Internal server error               | Error message       |

### Example Request

```bash
curl -X GET \
  'http://backend/api/organizations/60d21b4667d0d8992e610c86' \
  -c cookies.txt -b cookies.txt
```

## Get Organization by Identifier

### Description

This endpoint retrieves a specific organization by its unique identifier with populated member information. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/identifier/{identifier}`
- **Method**: `GET`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

### Path Parameters

| Parameter  | Type   | Required | Description                               |
| ---------- | ------ | -------- | ----------------------------------------- |
| identifier | string | Yes      | The unique identifier of the organization |

### Responses

| Status Code | Description                         | Response Body       |
| ----------- | ----------------------------------- | ------------------- |
| 200         | Organization retrieved successfully | Organization object |
| 401         | Token has expired or Invalid token  | Error message       |
| 403         | Not Authorized - Missing token      | Error message       |
| 404         | Organization not found              | Error message       |
| 500         | Internal server error               | Error message       |

### Example Request

```bash
curl -X GET \
  'http://backend/api/organizations/identifier/myorg123' \
  -c cookies.txt -b cookies.txt
```

## Update Organization

### Description

This endpoint allows you to update an existing organization. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}`
- **Method**: `PUT`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Delete Organization

### Description

This endpoint allows you to delete an organization. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}`
- **Method**: `DELETE`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Add Member to Organization by Username

### Description

This endpoint allows you to add a new member to an organization using their username. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}/members/username`
- **Method**: `POST`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Add Member to Organization by Email

### Description

This endpoint allows you to add a new member to an organization using their email address. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}/members/email`
- **Method**: `POST`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Delete Member from Organization

### Description

This endpoint allows you to remove a member from an organization. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}/members/{memberId}`
- **Method**: `DELETE`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Promote/Demote Member

### Description

This endpoint allows you to change a member's role within the organization (promote to admin or demote to regular member). This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}/members/{memberId}/role`
- **Method**: `PUT`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Send Test Email

### Description

This endpoint allows you to send a test email to verify the organization's email configuration. This is a secured endpoint that requires authentication via a JWT token.

### Endpoint Details

- **URL**: `/api/organizations/{id}/test-email`
- **Method**: `POST`
- **Tags**: Organizations
- **Authentication**: HTTP-only Cookie (JWT)
- **Rate Limit**: 100 requests per minute

## Security Notes

- All sensitive information (like JIRA API tokens) is filtered out from responses
- Organization management requires appropriate permissions
- Member operations may require admin role within the organization
- All organization operations are logged for audit purposes
