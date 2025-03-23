import * as logsApi from '@opentelemetry/api-logs';

/**
 * Create a logger with OpenTelemetry integration
 * 
 * @param {string} loggerName - Name for this specific logger instance
 * @returns {Object} Logger with standard logging methods
 */
function createLogger(loggerName = 'default-logger') {
  // Get the globally registered logger provider (configured in instrumentation.js)
  const otelLogger = logsApi.logs.getLogger(loggerName);
  
  // Debug check if we have a valid logger
  if (!otelLogger || typeof otelLogger.emit !== 'function') {
    console.warn('Warning: OTel logger not properly initialized - logs won\'t be sent to collector');
  } else {
    console.log('OTel logger successfully initialized for: ' + loggerName);
  }

  /**
   * Log a message with the specified severity level
   */
  function logWithLevel(severityNumber, severityText, message, attributes = {}) {
    try {
      // Enrich attributes with timestamp for better correlation
      const enhancedAttrs = {
        ...attributes,
        timestamp: new Date().toISOString(),
      };
      
      // Emit to OpenTelemetry
      otelLogger.emit({
        severityNumber,
        severityText,
        body: message,
        attributes: enhancedAttrs
      });
      
      // Also log to console for development visibility
      console.log(JSON.stringify({
        level: severityText,
        message,
        ...enhancedAttrs
      }));
    } catch (error) {
      console.error('Error emitting log:', error);
      
      // Fallback to console logging
      console.log(JSON.stringify({
        level: severityText,
        message,
        ...attributes,
        timestamp: new Date().toISOString(),
        loggingError: error.message
      }));
    }
  }

  // Return a logger object with standard methods
  return {
    trace: (message, attributes = {}) => logWithLevel(logsApi.SeverityNumber.TRACE, 'TRACE', message, attributes),
    debug: (message, attributes = {}) => logWithLevel(logsApi.SeverityNumber.DEBUG, 'DEBUG', message, attributes),
    info: (message, attributes = {}) => logWithLevel(logsApi.SeverityNumber.INFO, 'INFO', message, attributes),
    warn: (message, attributes = {}) => logWithLevel(logsApi.SeverityNumber.WARN, 'WARN', message, attributes),
    error: (message, attributes = {}) => logWithLevel(logsApi.SeverityNumber.ERROR, 'ERROR', message, attributes),
    fatal: (message, attributes = {}) => logWithLevel(logsApi.SeverityNumber.FATAL, 'FATAL', message, attributes),
  };
}

// Create and export a default logger instance
const logger = createLogger('backend-service');
export default logger;

// Also export the createLogger function for custom configuration
export { createLogger };

