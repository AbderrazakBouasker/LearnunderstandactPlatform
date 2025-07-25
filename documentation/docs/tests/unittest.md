---
sidebar_position: 1
---

# Unit Tests Documentation

## Introduction

Unit tests are essential components of our testing strategy, designed to verify that individual components of our backend API and middleware function correctly in isolation. These tests help catch bugs early, ensure code quality, and provide documentation for how components should behave.

## Test Coverage

Our test suite covers several critical areas of the application:

### API Controllers

- **Auth Controller**: Tests for user registration, login, and logout functionality

  - User registration with unique email/username validation
  - Organization identifier validation and creation
  - Password hashing and authentication
  - JWT token generation and management
  - Error handling and logging for authentication failures

- **Users Controller**: Tests for user management operations

  - User profile retrieval and authentication
  - User profile updates with password verification
  - Organization membership management
  - Input validation and error handling
  - Secure data filtering (password exclusion from responses)

- **Forms Controller**: Tests for form CRUD operations

  - Form creation with field validation
  - Form retrieval by ID and organization
  - Form updates and field management
  - Form deletion and authorization checks
  - Organization domain integration

- **Feedbacks Controller**: Tests for feedback submission and retrieval

  - Feedback creation with form validation
  - AI-powered sentiment analysis integration
  - Clustering and embedding generation
  - File upload handling for feedback attachments
  - Insight generation from feedback data

- **Insight Controller**: Tests for AI-driven feedback analysis

  - Insight retrieval by organization and form
  - Clustering analysis for feedback patterns
  - Sentiment analysis and trend identification
  - Error handling for AI service integration

- **Organization Controller**: Tests for organization management

  - Organization creation and validation
  - Member management and role assignment
  - Email service integration testing
  - Configuration management (Jira, email settings)
  - Domain management and access control

- **Stats Controller**: Tests for analytics and reporting

  - Feedback count aggregation over time
  - Opinion distribution analysis
  - Cluster statistics and sentiment tracking
  - Performance metrics and data visualization support

- **Stripe Controller**: Tests for payment processing
  - Payment intent creation for different tiers
  - Stripe integration and error handling
  - Subscription tier validation
  - Secure payment metadata handling

### Middleware

- **Authentication Middleware**: Tests for JWT token validation
- **Rate Limiter**: Tests for request rate limiting functionality

## Running Tests

### Local Development

To run the test suite locally:

```bash
# Install dependencies first
npm install

# Run all tests
npm test

# Run tests with coverage report
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

### Docker Container

To run the test suite inside a Docker container:

```bash
# Run all tests in the container
sudo docker exec -it backend npm test

# Run tests with coverage report
sudo docker exec -it backend npm test -- --coverage

# Run specific test file
sudo docker exec -it backend npm test -- auth.test.js
```

Note: Make sure the container is running before executing these commands. The container name 'backend' should match your container name from docker-compose configuration.

### Test Configuration

Tests are configured using Jest as the testing framework. The configuration can be found in `jest.config.js` at the root of the project.

### Continuous Integration

Tests are automatically run in our CI pipeline:

- On every push to any branch
- On pull requests before merging
- Tests must pass before deployment is allowed

## Test Structure

Each test file follows a consistent structure:

```javascript
describe("Component Name", () => {
  // Setup and teardown
  beforeEach(() => {
    // Test setup
  });

  describe("Method/Function Name", () => {
    it("should do something specific", async () => {
      // Test case
    });
  });
});
```

### Mocking

We use Jest's mocking capabilities to isolate components:

- Database models are mocked to prevent actual database operations
- External services (Redis, JWT) are mocked for consistent behavior
- Logger is mocked to verify logging behavior

Example of mocked dependencies:

```javascript
jest.mock("../models/User.js");
jest.mock("../logger.js");
jest.mock("jsonwebtoken");
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Test descriptions should clearly state what is being tested
3. **Setup/Teardown**: Use `beforeEach` to reset state between tests
4. **Error Cases**: Test both success and failure scenarios
5. **Logging**: Verify that errors are properly logged
6. **Mock Reset**: Clear all mocks between tests using `jest.clearAllMocks()`

## Common Testing Patterns

### Testing API Endpoints

```javascript
it("should handle successful request", async () => {
  const req = {
    body: {
      /* test data */
    },
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  await endpoint(req, res);

  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith(expectedData);
});
```

### Testing Error Handling

```javascript
it("should handle errors appropriately", async () => {
  const error = new Error("Test error");
  someFunction.mockRejectedValue(error);

  await endpoint(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(logger.error).toHaveBeenCalled();
});
```

## Debugging Tests

To debug tests:

1. Use the `debug` script in package.json:

```bash
npm run test:debug
```

2. Add `debugger` statements in your tests
3. Use console.log (remember to remove before committing)
4. Use Jest's --verbose flag for detailed output

## Contributing to Tests

When adding new features:

1. Create corresponding test file(s)
2. Follow existing test patterns
3. Ensure adequate coverage of new code
4. Test error cases and edge conditions
5. Verify logging behavior
