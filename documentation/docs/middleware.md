---
sidebar_position: 5
---

# Middleware Documentation

This section describes the middleware components available in the LUA Platform.

## Request Logger

The request logger middleware provides detailed logging for all incoming HTTP requests. It captures timing information and request details at both the start and completion of each request.

### Features

- Logs incoming requests with method, URL, IP, and user agent
- Captures response times and status codes
- Automatically adjusts log level based on response status (error level for 4xx/5xx responses)

### Usage

```javascript
import { requestLogger } from "./logging-examples.js";

app.use(requestLogger);
```

### Log Output Example

Request start:

```json
{
  "level": "info",
  "message": "Request received",
  "method": "GET",
  "url": "/api/users",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0..."
}
```

Request completion:

```json
{
  "level": "info",
  "message": "Request completed",
  "method": "GET",
  "url": "/api/users",
  "statusCode": 200,
  "responseTime": 45
}
```

## Error Logger

The error logger middleware handles uncaught exceptions and errors in the application, ensuring they are properly logged with relevant context.

### Features

- Captures full error stack traces
- Includes request context (method, URL, body)
- Automatically sets 500 status code
- Provides standardized error response

### Usage

```javascript
import { errorLogger } from "./logging-examples.js";

// Make sure to add this last in your middleware chain
app.use(errorLogger);
```

### Log Output Example

```json
{
  "level": "error",
  "message": "Unhandled exception",
  "error": "Database connection failed",
  "stack": "Error: Database connection failed\n    at ...",
  "method": "POST",
  "url": "/api/users",
  "body": { "username": "john" }
}
```

## Best Practices

1. **Order of Middleware**

   - Place the requestLogger at the beginning of your middleware chain
   - Place the errorLogger at the end of your middleware chain

2. **Error Handling**

   - Always let the errorLogger handle uncaught exceptions
   - Avoid catching errors unless you need specific error handling logic

3. **Logging Context**
   - The middleware automatically includes relevant request context
   - Additional context can be added through the req.log property

## Configuration

The logging middleware uses the application's central logger configuration. No additional setup is required, but you can customize the log levels and formats through the logger configuration.

## Security Considerations

- Request bodies are logged in error scenarios
- Sensitive information should be filtered before logging
- Consider log rotation and retention policies for production environments

## Authentication Middleware

The authentication middleware verifies JWT tokens from HTTP-only cookies and protects routes that require authentication.

### Features

- JWT token verification from HTTP-only cookies
- Automatic cookie-based authentication
- Detailed error handling for different token issues
- Automatic logging of authentication attempts

### Usage

```javascript
import { verifyToken } from "./middleware/auth.js";

// Protect a single route
app.get("/protected", verifyToken, (req, res) => {
  // Route handler code
});

// Protect all routes in a router
router.use(verifyToken);
```

### Error Responses

| Scenario      | Status Code | Response                         |
| ------------- | ----------- | -------------------------------- |
| No token      | 403         | "Not Authorized"                 |
| Expired token | 401         | `{"error": "Token has expired"}` |
| Invalid token | 401         | `{"error": "Invalid token"}`     |
| Server error  | 500         | `{"error": "Error message"}`     |

### Authentication Flow

1. User logs in via `/api/auth/login` endpoint
2. Server sets an HTTP-only cookie named `jwt` with the authentication token
3. Browser automatically includes the cookie in subsequent requests
4. Middleware extracts and verifies the token from the cookie
5. If valid, the request proceeds; if invalid, an appropriate error is returned

### Security Features

- HTTP-only cookies prevent client-side JavaScript access
- Cookies are automatically included in requests by the browser
- Token verification includes expiration checking
- Detailed logging of authentication attempts and failures

## Rate Limiter

The rate limiter middleware implements a sliding window algorithm using Redis to control request rates.

### Features

- Sliding window implementation
- Redis-backed storage
- Configurable window size and request limits
- Automatic cleanup of expired records
- Failsafe operation when Redis is unavailable

### Usage

```javascript
import { rateLimiter } from "./middleware/ratelimiter.js";

// Default: 5 requests per 1 minute
app.use(rateLimiter());

// Custom: 10 requests per 5 minutes
app.use(rateLimiter(5, 10));
```

### Configuration Parameters

- `windowsize`: Duration in minutes (default: 1)
- `maxrequests`: Maximum requests allowed in window (default: 5)

### Redis Requirements

The rate limiter requires a Redis connection with the following environment variables:

```
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
```

### Error Handling

- Automatically falls back to allowing requests if Redis is unavailable
- Implements timeout protection for Redis operations
- Logs all rate limit violations and Redis connection issues

### Response Codes

- 429: Too Many Requests
- 200: Request allowed within limits

## Security Best Practices

1. **Authentication**

   - Keep JWT secrets secure and rotate regularly
   - Use environment variables for sensitive configuration
   - HTTP-only cookies provide better security than Bearer tokens
   - Implement token refresh mechanisms
   - Consider secure cookie flags (secure, sameSite) in production

2. **Rate Limiting**

   - Set appropriate limits based on your application's capacity
   - Consider different limits for different endpoints
   - Monitor and adjust limits based on usage patterns

3. **General**
   - Always use HTTPS in production
   - Implement proper CORS policies
   - Regular security audits of middleware configuration
