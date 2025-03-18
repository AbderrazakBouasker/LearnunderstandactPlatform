/*instrumentation.js*/
// Require dependencies
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { Resource } from '@opentelemetry/resources';

// Configure the SDK to export telemetry data to the collector
const sdk = new NodeSDK({
  resource: new Resource({
    'service.name': 'my-service',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://otel-collector:4318/v1/traces', // Use Docker service name
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://otel-collector:4318/v1/metrics', // Use Docker service name
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
