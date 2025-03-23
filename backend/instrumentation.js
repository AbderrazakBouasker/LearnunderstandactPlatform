/*instrumentation.js*/
// Require dependencies
import * as logsApi from '@opentelemetry/api-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';

// Create a shared resource for all telemetry
const resource = new Resource({
  'service.name': 'backend-service',
  'service.version': '1.0.0',
  'deployment.environment': process.env.NODE_ENV || 'development',
});

// Configure logger provider with correct port for HTTP protocol
const loggerProvider = new LoggerProvider({ resource });

// Use BatchLogRecordProcessor for better performance
loggerProvider.addLogRecordProcessor(
  new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: 'http://otel-collector:4318/v1/logs', // Corrected to use port 4318 for HTTP
      headers: {
        'Content-Type': 'application/json',
      },
    })
  )
);

// Register the logger provider BEFORE creating the SDK
logsApi.logs.setGlobalLoggerProvider(loggerProvider);

// Configure the SDK to export telemetry data to the collector
const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://otel-collector:4318/v1/metrics',
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  loggerProvider, // Pass our already configured loggerProvider
});

// Add graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('SDK shut down successfully'))
    .catch(err => console.error('Error shutting down SDK', err))
    .finally(() => process.exit(0));
});

sdk.start();
console.log('OpenTelemetry instrumentation initialized');
