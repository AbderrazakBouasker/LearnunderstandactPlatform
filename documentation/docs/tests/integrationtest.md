---
sidebar_position: 2
---

# Integration Tests Documentation

## Introduction

Integration tests verify that different parts of the application work together correctly. Our integration tests focus on testing the complete request-response cycle through the API endpoints, including database operations and middleware interactions.

## Test Setup

### In-Memory MongoDB

Tests use `mongodb-memory-server` to create an isolated test database:

```javascript
// In setup.js
const mongoServer = await MongoMemoryServer.create();
const mongoUri = mongoServer.getUri();
await mongoose.connect(mongoUri);
```

### Test Helpers

Located in `tests/helpers.js`, these utilities simplify common testing operations:

```javascript
// Common auth operations
export const loginUser = async (credentials) => {
  return await request(testApp).post("/api/auth/login").send(credentials);
};

export const registerUser = async (userData) => {
  return await request(testApp).post("/api/auth/register").send(userData);
};

// Log verification helpers
export const verifyLogCalls = {
  error: (message, attributes) => {
    /* ... */
  },
  noBusinessErrors: () => {
    /* ... */
  },
  // ... other verification methods
};
```

## Running Tests

### Local Development

```bash
# Run all integration tests
npm run test:api

# Run specific test file
npm run test:api -- auth.test.js

# Run with coverage
npm run test:api -- --coverage
```

### Docker Container

```bash
# Run all integration tests in container
sudo docker exec -it backend npm run test:api

# Run specific test file
sudo docker exec -it backend npm run test:api -- auth.test.js
```

## Test Structure

### Basic Test Pattern

```javascript
describe("API Endpoint", () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Setup: register and login user
    await registerUser(testUser);
    const loginRes = await loginUser(credentials);
    token = loginRes.body.token;
  });

  it("should perform expected operation", async () => {
    const res = await request(testApp)
      .post("/api/endpoint")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchExpectedStructure();
  });
});
```

## Test Categories

### Authentication Tests (`auth.test.js`)

- User registration with validation
- User login with credentials
- Logout functionality
- Duplicate email handling
- Invalid password rejection

### Form Management Tests (`form.test.js`)

- Form creation with authentication
- Form retrieval (authenticated and public)
- Form updates and editing
- Form deletion
- Organization-specific forms
- Form validation and error handling

### Feedback Tests (`feedback.test.js`)

- Feedback submission to forms
- Feedback retrieval with authentication
- Form-specific feedback queries
- Feedback validation and error cases
- Missing field validation

### User Management Tests (`user.test.js`)

- User profile retrieval
- User profile updates with password verification
- Current user information (`/me` endpoint)
- Organization membership management
- Username and email uniqueness validation

### Organization Tests (`organization.test.js`)

- Organization creation and management
- Organization member addition/removal
- Role management within organizations
- Organization settings and thresholds
- JIRA integration configuration
- Test email functionality

### Insight and Analytics Tests (`insight.test.js`)

- Insight generation from feedback
- Sentiment analysis results
- Keyword extraction
- Organization-specific insights
- Form-based insight queries
- Cluster analysis and recommendations

## Logging Verification

The `verifyLogCalls` helper provides methods to check logging behavior:

```javascript
// Verify no unexpected errors
verifyLogCalls.noBusinessErrors();

// Verify specific error was logged
verifyLogCalls.error("Expected error message", {
  expectedAttribute: "value",
});
```

## Database Management

Tests automatically manage the database:

```javascript
beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Best Practices

1. **Independent Tests**: Each test should create its own data
2. **Clean State**: Use `beforeEach` to reset database
3. **Proper Authorization**: Always include tokens for protected routes
4. **Error Cases**: Test both success and failure scenarios
5. **Logging Verification**: Verify proper error/warning logging
6. **Request Validation**: Test input validation and error responses

## Common Testing Patterns

### Protected Route Testing

```javascript
describe("Protected Endpoint", () => {
  it("should require authentication", async () => {
    const res = await request(testApp).get("/api/protected-route");

    expect(res.statusCode).toBe(403);
  });

  it("should reject invalid token", async () => {
    const res = await request(testApp)
      .get("/api/protected-route")
      .set("Authorization", "Bearer invalid-token");

    expect(res.statusCode).toBe(401);
  });
});
```

### Data Validation Testing

```javascript
it("should validate required fields", async () => {
  const invalidData = {
    /* missing required fields */
  };

  const res = await request(testApp)
    .post("/api/endpoint")
    .set("Authorization", `Bearer ${token}`)
    .send(invalidData);

  expect(res.statusCode).toBe(400);
  expect(res.body).toHaveProperty("error");
});
```
