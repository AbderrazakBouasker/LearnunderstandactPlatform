/*instrumentation.js*/
// Require dependencies
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';

// Create a shared resource for all telemetry
const resource = new Resource({
  'service.name': 'backend-service',
  'service.version': '1.0.0',
  'deployment.environment': process.env.NODE_ENV || 'development',
});

// Configure logger provider
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: 'http://otel-collector:4318/v1/logs',
    })
  )
);

// Configure the SDK to export telemetry data to the collector
const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces', // Use Docker service name
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://otel-collector:4318/v1/metrics', // Use Docker service name
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  loggerProvider,
});

sdk.start();
