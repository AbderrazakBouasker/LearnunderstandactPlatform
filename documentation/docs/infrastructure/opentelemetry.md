---
sidebar_position: 4
---

# OpenTelemetry Instrumentation

The LuaPlatform implements comprehensive OpenTelemetry instrumentation to provide full observability into application performance, user behavior, and system health. This section covers the instrumentation setup, configuration, and best practices.

## Overview

OpenTelemetry provides automatic and manual instrumentation for collecting:

- **Traces** - Request flow and service interactions
- **Metrics** - Performance indicators and business metrics
- **Logs** - Structured application and system logs

## Instrumentation Setup

### Core Configuration

The `instrumentation.js` file sets up the OpenTelemetry SDK with automatic instrumentation:

```javascript
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
```

### Resource Configuration

A shared resource configuration identifies the service:

```javascript
const resource = new Resource({
  "service.name": "backend-service",
  "service.version": "1.0.0",
  "deployment.environment": process.env.NODE_ENV || "development",
});
```

**Resource Attributes:**

- `service.name`: Identifies the service in traces and metrics
- `service.version`: Tracks deployments and changes
- `deployment.environment`: Distinguishes between dev/staging/production

## Trace Instrumentation

### Automatic Instrumentation

The SDK automatically instruments common libraries and frameworks:

```javascript
instrumentations: [getNodeAutoInstrumentations()],
```

**Automatically Instrumented Libraries:**

- HTTP/HTTPS requests and responses
- Express.js routes and middleware
- MongoDB operations
- Redis commands
- DNS lookups
- File system operations

### Trace Export Configuration

Traces are exported to the OpenTelemetry Collector via HTTP:

```javascript
traceExporter: new OTLPTraceExporter({
  url: 'http://otel-collector:4318/v1/traces',
}),
```

### Manual Trace Instrumentation

For custom business logic, you can add manual instrumentation:

```javascript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("backend-service");

function processUserData(userData) {
  return tracer.startActiveSpan("process-user-data", (span) => {
    try {
      // Add span attributes
      span.setAttributes({
        "user.id": userData.id,
        "user.type": userData.type,
        "operation.complexity": "high",
      });

      // Your business logic here
      const result = complexProcessing(userData);

      // Mark span as successful
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      // Record error in span
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Metrics Instrumentation

### Metrics Export Configuration

Metrics are exported to Mimir via the OpenTelemetry Collector:

```javascript
metricReader: new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({
    url: 'http://otel-collector:4318/v1/metrics',
  }),
}),
```

### Custom Metrics

Create custom metrics for business-specific monitoring:

```javascript
import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("backend-service");

// Counter for tracking events
const userRegistrations = meter.createCounter("user_registrations_total", {
  description: "Total number of user registrations",
});

// Histogram for tracking durations
const requestDuration = meter.createHistogram("request_duration_seconds", {
  description: "Duration of HTTP requests",
  unit: "s",
});

// Gauge for tracking current values
const activeConnections = meter.createObservableGauge("active_connections", {
  description: "Number of active database connections",
});

// Usage examples
function handleUserRegistration(userData) {
  const startTime = Date.now();

  try {
    // Process registration
    const user = createUser(userData);

    // Increment counter
    userRegistrations.add(1, {
      "user.type": userData.type,
      "registration.source": userData.source,
    });

    return user;
  } finally {
    // Record request duration
    const duration = (Date.now() - startTime) / 1000;
    requestDuration.record(duration, {
      endpoint: "/api/auth/register",
      method: "POST",
    });
  }
}
```

### Metric Types and Use Cases

**Counters:**

- User actions (logins, registrations, purchases)
- Error counts
- Request counts
- Event occurrences

**Histograms:**

- Request durations
- Response sizes
- Processing times
- Queue lengths

**Gauges:**

- Current resource usage
- Active connections
- Queue sizes
- Temperature readings

## Log Instrumentation

### Log Export Configuration

Logs are structured and exported to Loki via the OpenTelemetry Collector:

```javascript
const loggerProvider = new LoggerProvider({ resource });

loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: "http://otel-collector:4318/v1/logs",
      headers: {
        "Content-Type": "application/json",
      },
    })
  )
);

// Register globally
logsApi.logs.setGlobalLoggerProvider(loggerProvider);
```

### Structured Logging

Create structured logs with consistent formatting:

```javascript
import * as logsApi from "@opentelemetry/api-logs";

const logger = logsApi.logs.getLogger("backend-service");

function logUserAction(userId, action, metadata = {}) {
  logger.emit({
    severityText: "INFO",
    body: `User ${userId} performed ${action}`,
    attributes: {
      "user.id": userId,
      "action.type": action,
      "action.timestamp": new Date().toISOString(),
      ...metadata,
    },
  });
}

function logError(error, context = {}) {
  logger.emit({
    severityText: "ERROR",
    body: error.message,
    attributes: {
      "error.name": error.name,
      "error.stack": error.stack,
      "error.timestamp": new Date().toISOString(),
      ...context,
    },
  });
}

// Usage examples
logUserAction("user-123", "login", {
  "login.method": "password",
  "user.ip": req.ip,
});

logError(new Error("Database connection failed"), {
  "database.host": "mongo",
  "database.operation": "find",
  "request.id": req.id,
});
```

## Correlation and Context

### Trace Context Propagation

OpenTelemetry automatically propagates trace context across service boundaries:

```javascript
// Context is automatically propagated in HTTP headers
const response = await fetch("http://external-service/api/data", {
  headers: {
    // OpenTelemetry automatically adds trace headers
    "Content-Type": "application/json",
  },
});
```

### Adding Context to Logs

Link logs to traces for better correlation:

```javascript
import { trace, context } from "@opentelemetry/api";

function logWithTraceContext(message, attributes = {}) {
  const span = trace.getActiveSpan();
  const traceContext = span
    ? {
        "trace.id": span.spanContext().traceId,
        "span.id": span.spanContext().spanId,
      }
    : {};

  logger.emit({
    severityText: "INFO",
    body: message,
    attributes: {
      ...traceContext,
      ...attributes,
    },
  });
}
```

## Performance Considerations

### Sampling Configuration

Configure sampling to manage data volume and performance:

```javascript
import { TraceIdRatioBasedSampler } from "@opentelemetry/sdk-trace-node";

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: "http://otel-collector:4318/v1/traces",
  }),
  sampler: new TraceIdRatioBasedSampler(0.1), // Sample 10% of traces
  instrumentations: [getNodeAutoInstrumentations()],
});
```

### Batch Processing

Use batch processors for better performance:

```javascript
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";

const spanProcessor = new BatchSpanProcessor(
  new OTLPTraceExporter({
    url: "http://otel-collector:4318/v1/traces",
  }),
  {
    maxQueueSize: 2048,
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
  }
);
```

### Resource Usage Optimization

**Memory Management:**

```javascript
// Configure reasonable limits
const sdk = new NodeSDK({
  resource,
  spanLimits: {
    attributeCountLimit: 128,
    eventCountLimit: 128,
    linkCountLimit: 128,
  },
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) => {
          // Ignore health check requests
          return req.url?.includes("/health");
        },
      },
    }),
  ],
});
```

## Development vs Production Configuration

### Development Configuration

```javascript
const isDevelopment = process.env.NODE_ENV === "development";

const sdk = new NodeSDK({
  resource,
  sampler: isDevelopment
    ? new AlwaysOnSampler() // Sample all traces in development
    : new TraceIdRatioBasedSampler(0.1), // Sample 10% in production

  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-http": {
        ignoreIncomingRequestHook: (req) => {
          // In development, trace everything
          if (isDevelopment) return false;

          // In production, ignore health checks and static assets
          return req.url?.match(/\/(health|metrics|static)/);
        },
      },
    }),
  ],
});
```

### Production Optimizations

```javascript
// Production-specific configuration
if (process.env.NODE_ENV === "production") {
  // Reduce instrumentation overhead
  process.env.OTEL_AUTO_INSTRUMENT_FS = "false";
  process.env.OTEL_AUTO_INSTRUMENT_DNS = "false";

  // Configure resource limits
  process.env.OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT = "64";
  process.env.OTEL_SPAN_EVENT_COUNT_LIMIT = "64";
}
```

## Error Handling and Diagnostics

### SDK Initialization Error Handling

```javascript
try {
  sdk.start();
  console.log("OpenTelemetry instrumentation initialized");
} catch (error) {
  console.error("Failed to initialize OpenTelemetry:", error);
  // Continue without instrumentation rather than crashing
}
```

### Graceful Shutdown

```javascript
process.on("SIGTERM", async () => {
  try {
    await sdk.shutdown();
    console.log("OpenTelemetry SDK shut down successfully");
  } catch (error) {
    console.error("Error shutting down OpenTelemetry SDK:", error);
  } finally {
    process.exit(0);
  }
});
```

### Debugging Instrumentation

Enable debug logging for troubleshooting:

```javascript
// Environment variable for debugging
// export OTEL_LOG_LEVEL=debug

// Or programmatic configuration
import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";

if (process.env.NODE_ENV === "development") {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}
```

## Best Practices

### Attribute Naming

Follow OpenTelemetry semantic conventions:

```javascript
// Good: Use semantic conventions
span.setAttributes({
  "http.method": "POST",
  "http.url": "/api/users",
  "http.status_code": 200,
  "user.id": "12345",
  "db.operation": "insert",
  "db.collection.name": "users",
});

// Avoid: Custom naming without conventions
span.setAttributes({
  method: "POST",
  endpoint: "/api/users",
  response: 200,
  userId: "12345",
});
```

### High-Cardinality Attributes

Be careful with high-cardinality attributes:

```javascript
// Good: Bounded cardinality
span.setAttributes({
  "user.type": "premium",
  "request.size.bucket": "large",
});

// Avoid: Unbounded cardinality
span.setAttributes({
  "user.id": "12345", // High cardinality
  "request.timestamp": Date.now(), // Unique values
  "request.body": JSON.stringify(body), // Potentially large
});
```

### Error Recording

Properly record errors in spans:

```javascript
function handleRequest(req, res) {
  const span = trace.getActiveSpan();

  try {
    const result = processRequest(req);
    span?.setStatus({ code: SpanStatusCode.OK });
    res.json(result);
  } catch (error) {
    // Record the exception
    span?.recordException(error);

    // Set error status
    span?.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });

    // Add error attributes
    span?.setAttributes({
      "error.type": error.constructor.name,
      "error.handled": true,
    });

    res.status(500).json({ error: "Internal server error" });
  }
}
```
