import pkg from '@opentelemetry/api';
const { trace, context, diag } = pkg;
import * as logsApi from '@opentelemetry/api-logs';
import { SeverityNumber } from '@opentelemetry/api-logs';
import pino from 'pino';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

// Map to convert Pino log levels to OpenTelemetry severity numbers
const levelToSeverity = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

// Create a TracerProvider
const tracerProvider = new NodeTracerProvider();
// Initialize the provider
tracerProvider.register();

// Set up the Pino instrumentation to capture logs for OpenTelemetry
const pinoInstrumentation = new PinoInstrumentation({
  // Optional: customize how logs are captured
  logHook: (_span, record, _level) => {
    // Add additional context to log records if needed
    record['service.name'] = 'backend-service';
    record['service.version'] = '1.0.0';
  },
});

// Register the instrumentation with the tracer provider
pinoInstrumentation.setTracerProvider(tracerProvider);

// Create a standard Pino logger with OTEL transport
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    environment: process.env.NODE_ENV || 'development'
  },
  transport: {
    target: 'pino/file',
    options: { destination: 1 } // stdout
  }
});

// Get the logger from the global LoggerProvider (configured in instrumentation.js)
const otelLogger = logsApi.logs.getLogger('backend-service');

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
  // Log with Pino first
  logger[level](attributes, message);
  
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
  
  // Send to OpenTelemetry
  otelLogger.emit({
    severityNumber: levelToSeverity[level],
    severityText: level,
    body: message,
    attributes: logAttributes,
  });
}

// Export the wrapper as the default logger
export default loggerWrapper;
