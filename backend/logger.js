import { trace, context, logs, diag } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import pino from 'pino';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';

// Map to convert Pino log levels to OpenTelemetry severity numbers
const levelToSeverity = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

// Set up the Pino instrumentation to capture logs for OpenTelemetry
const pinoInstrumentation = new PinoInstrumentation({
  // Optional: customize how logs are captured
  logHook: (_span, record, _level) => {
    // Add additional context to log records if needed
    record['service.name'] = 'backend-service';
    record['service.version'] = '1.0.0';
  },
});

// Register the instrumentation
pinoInstrumentation.setTracerProvider(); // Connect to trace context automatically

// Create a standard Pino logger - its output will be captured by OpenTelemetry
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    environment: process.env.NODE_ENV || 'development'
  }
});

// Create a logger that sends logs to the OpenTelemetry collector
const otelLogger = logs.getLogger('backend-service');

// Create a wrapper with convenient methods that mimic Pino's API
const loggerWrapper = {
  trace: (message, attributes = {}) => logWithLevel('trace', message, attributes),
  debug: (message, attributes = {}) => logWithLevel('debug', message, attributes),
  info: (message, attributes = {}) => logWithLevel('info', message, attributes),
  warn: (message, attributes = {}) => logWithLevel('warn', message, attributes),
  error: (message, attributes = {}) => logWithLevel('error', message, attributes),
  fatal: (message, attributes = {}) => logWithLevel('fatal', message, attributes),
};

// Helper function to log with appropriate level
function logWithLevel(level, message, attributes) {
  // Get current trace context if available
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();
  
  // Prepare log attributes
  const logAttributes = {
    ...attributes,
    'service.name': 'backend-service',
    'service.version': '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  };

  // Add trace context if available
  if (spanContext) {
    logAttributes.traceId = spanContext.traceId;
    logAttributes.spanId = spanContext.spanId;
  }

  // Log to console for development visibility
  console.log(JSON.stringify({
    level,
    message,
    ...logAttributes,
    timestamp: new Date().toISOString()
  }));
  
  // Send to OpenTelemetry
  otelLogger.emit({
    severityNumber: levelToSeverity[level],
    severityText: level,
    body: message,
    attributes: logAttributes,
  });
}

// You can also access OpenTelemetry's diagnostic logger if needed
diag.debug('OpenTelemetry diagnostic logging is also available');

export default logger;
