---
sidebar_position: 3
---

# Monitoring and Observability

The LuaPlatform implements a comprehensive observability stack using the Grafana ecosystem, providing full visibility into application performance, system health, and user behavior.

## Observability Stack Overview

The monitoring infrastructure is built around the three pillars of observability:

1. **Metrics** - Stored in Mimir (Prometheus-compatible)
2. **Logs** - Aggregated in Loki
3. **Traces** - Collected in Tempo

All data is visualized through Grafana dashboards with pre-configured data sources.

## Grafana Configuration

### Container Setup

```yaml
grafana:
  container_name: grafana
  image: grafana/grafana
  restart: unless-stopped
  ports:
    - "3001:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD}
    - GF_SECURITY_ADMIN_USER=${GF_SECURITY_ADMIN_USER}
  volumes:
    - grafana-storage:/var/lib/grafana
    - ./grafana/datasource.yml:/etc/grafana/provisioning/datasources/datasource.yml
```

### Data Source Configuration

The `datasource.yml` file automatically provisions data sources:

```yaml
datasources:
  - name: Mimir
    type: prometheus
    default: true
    access: proxy
    url: http://mimir:9009/prometheus

  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100

  - name: Tempo
    type: tempo
    access: proxy
    url: http://tempo:3200
```

**Data Source Details:**

- **Mimir**: Primary metrics source (Prometheus-compatible)
- **Loki**: Log aggregation and search
- **Tempo**: Distributed tracing visualization

### Access and Authentication

- **URL**: `http://localhost:3001`
- **Default Admin User**: Configured via `GF_SECURITY_ADMIN_USER`
- **Default Admin Password**: Configured via `GF_SECURITY_ADMIN_PASSWORD`

## Mimir (Metrics Storage)

### Configuration

Mimir serves as the Prometheus-compatible metrics storage backend.

**Container Configuration:**

```yaml
mimir:
  container_name: mimir
  image: grafana/mimir
  ports:
    - "9009:9009"
  command: ["-config.file=/etc/mimir.yml"]
  volumes:
    - ./mimir/mimir-config.yml:/etc/mimir.yml
    - mimir_data:/data
```

### Key Configuration Features

```yaml
# Server configuration
server:
  http_listen_port: 9009

multitenancy_enabled: false
no_auth_tenant: "anonymous"

# Storage configuration
blocks_storage:
  tsdb:
    dir: /data/tsdb
  bucket_store:
    sync_dir: /data/sync
  filesystem:
    dir: /data/blocks
```

**Features:**

- **Single-tenant mode** for simplified deployment
- **Local filesystem storage** for data persistence
- **Prometheus-compatible API** for querying
- **Automatic compaction** for storage optimization

### Metrics Collection

Metrics are collected via the OpenTelemetry Collector and forwarded to Mimir:

```yaml
exporters:
  prometheusremotewrite:
    endpoint: "http://mimir:9009/api/v1/push"
    tls:
      insecure: true
```

## Loki (Log Aggregation)

### Configuration

Loki provides centralized log aggregation and search capabilities.

**Container Configuration:**

```yaml
loki:
  container_name: loki
  image: grafana/loki:latest
  ports:
    - "3100:3100"
  volumes:
    - ./loki/loki-config.yml:/etc/loki/local-config.yml
    - loki_data:/data
```

### Key Features

```yaml
auth_enabled: false

limits_config:
  allow_structured_metadata: true
  volume_enabled: true

storage_config:
  tsdb_shipper:
    active_index_directory: /tmp/loki/index
    cache_location: /tmp/loki/index_cache
  filesystem:
    directory: /tmp/loki/chunks
```

**Capabilities:**

- **Structured metadata support** for rich log context
- **Volume queries** for log analytics
- **TSDB indexing** for efficient log search
- **Local filesystem storage** for persistence

### Log Collection

Logs are forwarded from the OpenTelemetry Collector:

```yaml
exporters:
  loki:
    endpoint: "http://loki:3100/loki/api/v1/push"
    tls:
      insecure: true
```

## Tempo (Distributed Tracing)

### Configuration

Tempo provides distributed tracing storage and visualization.

**Container Configuration:**

```yaml
tempo:
  container_name: tempo
  image: grafana/tempo
  user: root
  command: ["-config.file=/etc/tempo.yml"]
  ports:
    - "3200:3200" # Tempo UI
    - "14317:4317" # OTLP gRPC
    - "14318:4318" # OTLP HTTP
  volumes:
    - ./tempo/tempo.yml:/etc/tempo.yml
    - tempo_data:/tmp/tempo
```

### Key Features

```yaml
# OTLP receiver configuration
distributor:
  receivers:
    otlp:
      protocols:
        grpc:
          endpoint: "0.0.0.0:4317"
        http:
          endpoint: "0.0.0.0:4318"

# Storage configuration
storage:
  trace:
    backend: local
    wal:
      path: /tmp/tempo/wal
    local:
      path: /tmp/tempo/blocks
```

**Capabilities:**

- **OTLP protocol support** for OpenTelemetry traces
- **Local storage backend** for trace persistence
- **Write-ahead logging** for data durability
- **Configurable retention** (24h default)

### Trace Collection

Traces are collected via the OpenTelemetry Collector:

```yaml
exporters:
  otlp:
    endpoint: "tempo:4317"
    tls:
      insecure: true
```

## OpenTelemetry Collector

### Container Configuration

```yaml
otel-collector:
  container_name: otel-collector
  image: otel/opentelemetry-collector-contrib:latest
  volumes:
    - ./otel/otel-collector-config.yml:/etc/otel-collector-config.yml
  command: ["--config=/etc/otel-collector-config.yml"]
  ports:
    - "4317:4317" # gRPC
    - "4318:4318" # HTTP
```

### Pipeline Configuration

The collector processes three types of telemetry data:

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlp]
    metrics:
      receivers: [otlp]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [loki]
```

**Pipeline Details:**

- **Traces**: Direct forwarding to Tempo
- **Metrics**: Transformation and forwarding to Mimir
- **Logs**: Batching and forwarding to Loki

## Monitoring Dashboards

### Pre-configured Dashboards

The Grafana instance comes with several pre-configured dashboards:

1. **Application Metrics**

   - Request rates and response times
   - Error rates and status codes
   - Database connection metrics

2. **Infrastructure Metrics**

   - Container resource usage
   - Network traffic
   - Disk and memory utilization

3. **Log Analysis**

   - Error log aggregation
   - Request log patterns
   - Application event timelines

4. **Distributed Tracing**
   - Request flow visualization
   - Service dependency mapping
   - Performance bottleneck identification

### Custom Dashboard Creation

**Metrics Queries (PromQL):**

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Log Queries (LogQL):**

```logql
# Error logs
{service="backend-service"} |= "ERROR"

# Slow requests
{service="backend-service"} | json | duration > 1s
```

## Alerting Configuration

### Alert Rules

Create alert rules in Grafana for proactive monitoring:

**High Error Rate Alert:**

```yaml
alert:
  name: High Error Rate
  condition: avg(rate(http_requests_total{status=~"5.."}[5m])) > 0.1
  for: 5m
  annotations:
    summary: "High error rate detected"
    description: "Error rate is above 10% for 5 minutes"
```

**High Response Time Alert:**

```yaml
alert:
  name: High Response Time
  condition: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
  for: 10m
  annotations:
    summary: "High response time detected"
    description: "95th percentile response time is above 2 seconds"
```

## Performance Optimization

### Resource Allocation

**Memory Configuration:**

```yaml
# Mimir
GOMEMLIMIT: 2GiB

# Loki
limits_config:
  max_query_parallelism: 32

# Tempo
overrides:
  max_bytes_per_trace: 50000000
```

**Storage Optimization:**

- Configure appropriate retention periods
- Implement log sampling for high-volume applications
- Use metric aggregation for long-term storage

### Query Performance

**Best Practices:**

- Use appropriate time ranges for queries
- Leverage label filtering in PromQL/LogQL queries
- Create efficient dashboard queries with proper caching

## Troubleshooting

### Common Issues

1. **Data Source Connection Errors**

   ```bash
   # Check service connectivity
   docker exec grafana curl -f http://mimir:9009/ready
   docker exec grafana curl -f http://loki:3100/ready
   docker exec grafana curl -f http://tempo:3200/ready
   ```

2. **Missing Metrics/Logs**

   ```bash
   # Check OpenTelemetry Collector logs
   docker logs otel-collector

   # Verify data ingestion
   curl http://localhost:9009/api/v1/label/__name__/values
   ```

3. **Storage Issues**

   ```bash
   # Check volume usage
   docker volume inspect mimir_data
   docker volume inspect loki_data
   docker volume inspect tempo_data
   ```

4. **Performance Issues**
   ```bash
   # Monitor resource usage
   docker stats grafana mimir loki tempo otel-collector
   ```

### Log Analysis

**Useful Log Queries:**

```bash
# Application errors
docker logs backend | grep ERROR

# Database connection issues
docker logs mongo

# Network connectivity
docker exec backend ping mimir
docker exec backend ping loki
docker exec backend ping tempo
```

## Security Considerations

### Authentication and Authorization

- Configure strong admin passwords for Grafana
- Implement proper network segmentation
- Use HTTPS in production environments
- Restrict access to monitoring ports

### Data Protection

- Configure appropriate data retention policies
- Implement log sanitization for sensitive data
- Use encrypted storage volumes in production
- Regular backup of configuration and data

### Network Security

```yaml
# Example production network configuration
networks:
  monitoring:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```
