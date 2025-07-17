---
sidebar_position: 5
---

# Development Environment

This guide covers setting up and working with the development environment for the LuaPlatform, including Docker configuration, hot-reloading, debugging, and development tools.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd luaplatform
   ```

2. **Create environment file**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create Docker network**

   ```bash
   docker network create luaplatform-network
   ```

4. **Start development environment**
   ```bash
   docker-compose up -d
   ```

The development environment automatically uses `docker-compose.override.yml` for development-specific configurations.

## Development Configuration

### Docker Compose Override

The `docker-compose.override.yml` file provides development-specific settings:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app # Source code mounting for hot-reload
      - /app/node_modules # Preserve node_modules
    command: npm run dev
    environment:
      NODE_ENV: development
    ports:
      - "5000:5000"
```

**Key Features:**

- **Hot-reloading**: Source code changes trigger automatic restart
- **Volume mounting**: Real-time code synchronization
- **Development dependencies**: Includes tools like nodemon
- **Environment variables**: Development-specific configuration

### Development Dockerfile

The `Dockerfile.dev` is optimized for development:

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install                    # Includes dev dependencies
RUN npm install -g nodemon        # Global nodemon for hot-reloading
VOLUME ["/app"]                   # Volume for source code
CMD ["npm", "run", "dev"]         # Development start command
```

**Benefits:**

- Includes all development dependencies
- Nodemon for automatic restarts
- Volume mounting for file watching
- Development-optimized build

## Hot-Reloading Setup

### Nodemon Configuration

Create `nodemon.json` for fine-tuned hot-reloading:

```json
{
  "watch": ["src", "routes", "middleware"],
  "ext": "js,mjs,json",
  "ignore": ["node_modules", "logs", "dist"],
  "exec": "node --loader ./instrumentation.js src/index.js",
  "env": {
    "NODE_ENV": "development"
  },
  "delay": 1000
}
```

### Package.json Scripts

Development scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon",
    "dev:debug": "nodemon --inspect=0.0.0.0:9229",
    "dev:trace": "nodemon --trace-warnings",
    "test:watch": "jest --watch",
    "lint:watch": "eslint --watch"
  }
}
```

## Debugging

### VS Code Debugging

Create `.vscode/launch.json` for debugging:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Docker",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "address": "localhost",
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "/app",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Remote Debugging

Enable remote debugging in Docker:

```yaml
services:
  app:
    command: nodemon --inspect=0.0.0.0:9229
    ports:
      - "5000:5000"
      - "9229:9229" # Debug port
```

**Usage:**

1. Start the container with debug mode
2. Attach VS Code debugger
3. Set breakpoints in your code
4. Debug as usual

### Debug Logging

Enable debug logging for different components:

```bash
# OpenTelemetry debugging
export OTEL_LOG_LEVEL=debug

# Application debugging
export DEBUG=app:*

# Database debugging
export DEBUG_MONGO=true
```

## Development Tools

### Code Quality Tools

**ESLint Configuration (`.eslintrc.js`):**

```javascript
module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ["eslint:recommended", "@typescript-eslint/recommended"],
  rules: {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
  },
};
```

**Prettier Configuration (`.prettierrc`):**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Testing Setup

**Jest Configuration (`jest.config.js`):**

```javascript
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["**/__tests__/**/*.js", "**/*.test.js"],
  collectCoverageFrom: ["src/**/*.js", "!src/index.js", "!**/node_modules/**"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

**Test Setup (`tests/setup.js`):**

```javascript
// Global test setup
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

## Environment Variables

### Development Environment File

Create `.env` for development configuration:

```bash
# Application
NODE_ENV=development
PORT=5000
DEBUG=true

# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=development_password
MONGO_USERNAME=app_user
MONGO_PASSWORD=app_password
MONGO_URI=mongodb://app_user:app_password@mongo:27017/luaplatform

# Redis
REDIS_PASSWORD=development_redis_password
REDIS_URI=redis://:development_redis_password@redis:6379

# JWT
JWT_SECRET=development_jwt_secret_key
JWT_EXPIRES_IN=24h

# Monitoring
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=development_grafana_password

# OpenTelemetry
OTEL_LOG_LEVEL=info
OTEL_SERVICE_NAME=backend-service
OTEL_SERVICE_VERSION=1.0.0

# Development Tools
ACCESS_TOKEN=development_access_token
```

### Environment Variable Validation

Add environment validation:

```javascript
import Joi from "joi";

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(5000),
  MONGO_URI: Joi.string().required(),
  REDIS_URI: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("24h"),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default envVars;
```

## Database Development

### MongoDB Development Setup

**Connection with Development Database:**

```javascript
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
    };

    if (process.env.NODE_ENV === "development") {
      mongoose.set("debug", true); // Enable query logging
    }

    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
```

### Redis Development Setup

**Redis Client Configuration:**

```javascript
import Redis from "ioredis";

const redis = new Redis({
  host: "redis",
  port: 6379,
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

if (process.env.NODE_ENV === "development") {
  redis.on("connect", () => console.log("Redis connected"));
  redis.on("error", (err) => console.error("Redis error:", err));
}

export default redis;
```

## Development Workflow

### Daily Development

1. **Start development environment:**

   ```bash
   docker-compose up -d
   ```

2. **View logs:**

   ```bash
   docker-compose logs -f app
   ```

3. **Run tests:**

   ```bash
   docker-compose exec app npm test
   ```

4. **Code linting:**

   ```bash
   docker-compose exec app npm run lint
   ```

5. **Database operations:**

   ```bash
   # Access MongoDB shell
   docker-compose exec db mongosh -u app_user -p app_password luaplatform

   # Access Redis CLI
   docker-compose exec redis redis-cli -a $REDIS_PASSWORD
   ```

### Code Changes

1. **Edit source files** - Changes automatically trigger hot-reload
2. **Check logs** for any errors or warnings
3. **Test endpoints** using your preferred API client
4. **Run tests** to ensure nothing is broken

### Database Schema Changes

1. **Create migration files**
2. **Test migrations locally**
3. **Update model definitions**
4. **Run integration tests**

## Performance Monitoring in Development

### Local Monitoring Stack

Access monitoring tools during development:

- **Grafana**: `http://localhost:3001`
- **Mimir**: `http://localhost:9009`
- **Loki**: `http://localhost:3100`
- **Tempo**: `http://localhost:3200`

### Development Metrics

Monitor development-specific metrics:

```javascript
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("development-metrics");

// Development-specific counters
const codeReloads = meter.createCounter("dev_code_reloads_total");
const testRuns = meter.createCounter("dev_test_runs_total");
const apiCalls = meter.createCounter("dev_api_calls_total");

// Track development activities
export function trackCodeReload() {
  codeReloads.add(1, { timestamp: Date.now() });
}

export function trackTestRun(testType, result) {
  testRuns.add(1, {
    test_type: testType,
    result: result,
  });
}
```

## Troubleshooting Development Issues

### Common Issues

1. **Port Conflicts**

   ```bash
   # Check what's using a port
   lsof -i :5000

   # Kill process using port
   kill -9 $(lsof -t -i:5000)
   ```

2. **Volume Mount Issues**

   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER .

   # Restart with fresh volumes
   docker-compose down -v
   docker-compose up -d
   ```

3. **Node Modules Issues**

   ```bash
   # Rebuild in container
   docker-compose exec app npm ci

   # Clear npm cache
   docker-compose exec app npm cache clean --force
   ```

4. **Database Connection Issues**

   ```bash
   # Test MongoDB connection
   docker-compose exec app mongosh $MONGO_URI

   # Test Redis connection
   docker-compose exec app redis-cli -u $REDIS_URI ping
   ```

### Debug Information

**Collect debug information:**

```bash
# Container status
docker-compose ps

# Container logs
docker-compose logs app

# Network information
docker network ls
docker network inspect luaplatform-network

# Volume information
docker volume ls
docker volume inspect luaplatform_mongo_data
```

### Performance Issues

**Monitor resource usage:**

```bash
# Container resource usage
docker stats

# Host system resources
htop
df -h
free -h
```

**Optimize development performance:**

- Use `.dockerignore` to exclude unnecessary files
- Limit file watching scope in nodemon
- Use volume caching for better I/O performance
- Consider using Docker Desktop with WSL2 on Windows
