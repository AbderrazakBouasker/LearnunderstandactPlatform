---
sidebar_position: 1
---

# Infrastructure Overview

The LuaPlatform infrastructure is built using Docker containers and includes a comprehensive observability stack. The system is designed to be scalable, maintainable, and provides full observability into application performance and behavior.

## Architecture Components

### Core Services

- **Backend Application** - Node.js API server
- **MongoDB** - Primary database for application data
- **Redis** - Caching and session storage
- **Nginx** - Reverse proxy and load balancer

### Observability Stack

- **OpenTelemetry Collector** - Telemetry data collection and routing
- **Grafana** - Visualization and dashboards
- **Loki** - Log aggregation and storage
- **Tempo** - Distributed tracing
- **Mimir** - Metrics storage and querying

### Development Tools

- **K6** - Load testing and performance testing

## Network Architecture

All services communicate through a dedicated Docker network (`luaplatform-network`) ensuring secure inter-service communication and isolation from external networks.

## Data Persistence

The infrastructure includes several persistent volumes:

- `mongo_data` - MongoDB database files
- `grafana-storage` - Grafana configuration and dashboards
- `mimir_data` - Metrics data storage
- `tempo_data` - Trace data storage
- `loki_data` - Log data storage

## Environment Configurations

The infrastructure supports multiple deployment environments:

- **Development** - Hot-reloading, debugging tools, development-specific configurations
- **Production** - Optimized builds, security hardening, resource limits
- **Testing** - Isolated environment for automated testing

## Security Features

- Network isolation through Docker networks
- Environment variable management for sensitive configuration
- HTTP-only cookies for authentication
- TLS/SSL support through Nginx proxy
- Redis password protection
- MongoDB authentication

## Monitoring and Observability

The platform implements the three pillars of observability:

1. **Metrics** - Application and infrastructure metrics collected via OpenTelemetry and stored in Mimir
2. **Logs** - Structured logging collected via OpenTelemetry and stored in Loki
3. **Traces** - Distributed tracing for request flow analysis stored in Tempo

All observability data is visualized through Grafana dashboards with pre-configured data sources.

## Scalability Considerations

The infrastructure is designed with scalability in mind:

- Stateless application containers
- External data storage (MongoDB, Redis)
- Load balancing through Nginx
- Horizontal scaling capabilities
- Resource monitoring and alerting

## Getting Started

1. [Docker Setup](./docker-setup) - Container configuration and deployment
2. [Development Environment](./development) - Local development setup
3. [Monitoring](./monitoring) - Observability stack configuration
4. [Production Deployment](./production) - Production environment setup
