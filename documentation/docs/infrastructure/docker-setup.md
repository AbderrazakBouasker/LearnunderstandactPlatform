---
sidebar_position: 2
---

# Docker Setup

The LuaPlatform uses Docker containers for all services, ensuring consistent deployment across different environments. The setup includes multiple Docker Compose files for different deployment scenarios.

## Docker Compose Files

### Base Configuration (`docker-compose.yml`)

The main Docker Compose file defines all core services and their configurations:

```yaml
services:
  app:
    container_name: backend
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    env_file:
      - .env
    networks:
      - luaplatform-network
    depends_on:
      - db
      - redis
      - otel-collector
```

### Development Override (`docker-compose.override.yml`)

Automatically loaded in development, provides hot-reloading and development-specific configurations:

```yaml
services:
  app:
    build:
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run dev
    environment:
      NODE_ENV: development
```

### Production Configuration (`docker-compose.prod.yml`)

Production-optimized settings with security and performance enhancements:

```yaml
services:
  app:
    build:
      dockerfile: Dockerfile.prod
    environment:
      NODE_ENV: production
    restart: always
```

## Container Services

### Application Container (`app`)

The main Node.js backend application container.

**Configuration:**

- **Port:** 5000
- **Environment:** Configurable via `.env` file
- **Dependencies:** MongoDB, Redis, OpenTelemetry Collector
- **Network:** `luaplatform-network`

**Build Contexts:**

- **Development:** `Dockerfile.dev` - Includes nodemon for hot-reloading
- **Production:** `Dockerfile.prod` - Multi-stage build for optimization
- **Docker Hub:** `Dockerfile.hub` - Simplified build for container registry

### Database Container (`db`)

MongoDB database container for persistent data storage.

**Configuration:**

- **Image:** `mongo:latest`
- **Port:** 27017
- **Volume:** `mongo_data:/data/db`
- **Authentication:** Root and application user credentials via environment variables

**Environment Variables:**

```bash
MONGO_ROOT_USERNAME=${MONGO_ROOT_USERNAME}
MONGO_ROOT_PASSWORD=${MONGO_ROOT_PASSWORD}
MONGO_USERNAME=${MONGO_USERNAME}
MONGO_PASSWORD=${MONGO_PASSWORD}
```

### Cache Container (`redis`)

Redis container for caching and session management.

**Configuration:**

- **Image:** `redis:latest`
- **Port:** 6379
- **Authentication:** Password protection via `REDIS_PASSWORD`
- **Memory Management:** `vm.overcommit_memory=1`

### Reverse Proxy (`nginx`)

Nginx container serving as reverse proxy and load balancer.

**Configuration:**

- **Image:** `nginx:latest`
- **Port:** 80
- **Configuration:** Custom `nginx.conf` mounted as volume
- **Dependencies:** Backend application

### Observability Containers

#### OpenTelemetry Collector (`otel-collector`)

- **Image:** `otel/opentelemetry-collector-contrib:latest`
- **Ports:** 4317 (gRPC), 4318 (HTTP)
- **Configuration:** Custom YAML configuration for telemetry routing

#### Grafana (`grafana`)

- **Image:** `grafana/grafana`
- **Port:** 3001 (mapped from internal 3000)
- **Volume:** `grafana-storage` for persistence
- **Data Sources:** Pre-configured Prometheus, Loki, and Tempo connections

#### Loki (`loki`)

- **Image:** `grafana/loki:latest`
- **Port:** 3100
- **Storage:** Local filesystem with `loki_data` volume

#### Tempo (`tempo`)

- **Image:** `grafana/tempo`
- **Ports:** 3200 (UI), 14317 (gRPC), 14318 (HTTP)
- **Storage:** Local filesystem with `tempo_data` volume

#### Mimir (`mimir`)

- **Image:** `grafana/mimir`
- **Port:** 9009
- **Storage:** Local filesystem with `mimir_data` volume

### Testing Container (`k6`)

K6 load testing container for performance testing.

**Configuration:**

- **Image:** `grafana/k6`
- **Volume:** `./k6:/k6` for test scripts
- **Environment:** `ACCESS_TOKEN` for authenticated testing

## Dockerfile Configurations

### Development Dockerfile (`Dockerfile.dev`)

```dockerfile
FROM node:18
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install -g nodemon
VOLUME ["/app"]
CMD ["npm", "run", "dev"]
```

**Features:**

- Hot-reloading with nodemon
- Volume mounting for live code updates
- Development dependencies included

### Production Dockerfile (`Dockerfile.prod`)

```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --only=production
COPY . .
RUN npm run build

FROM node:18
WORKDIR /app
COPY --from=build /app /app
CMD ["npm", "start"]
```

**Features:**

- Multi-stage build for optimization
- Production-only dependencies
- Compiled/optimized code

## Networking

### Docker Network

All services communicate through the `luaplatform-network` external network:

```yaml
networks:
  luaplatform-network:
    external: true
```

**Benefits:**

- Service isolation
- DNS resolution between containers
- Security through network segmentation

### Port Mapping

| Service        | Internal Port | External Port | Protocol  |
| -------------- | ------------- | ------------- | --------- |
| Backend        | 5000          | 5000          | HTTP      |
| MongoDB        | 27017         | 27017         | TCP       |
| Redis          | 6379          | 6379          | TCP       |
| Nginx          | 80            | 80            | HTTP      |
| Grafana        | 3000          | 3001          | HTTP      |
| Loki           | 3100          | 3100          | HTTP      |
| Tempo          | 3200          | 3200          | HTTP      |
| Mimir          | 9009          | 9009          | HTTP      |
| OTEL Collector | 4317/4318     | 4317/4318     | gRPC/HTTP |

## Volume Management

### Persistent Volumes

```yaml
volumes:
  mongo_data: # MongoDB data persistence
  grafana-storage: # Grafana dashboards and config
  mimir_data: # Metrics storage
  tempo_data: # Trace storage
  loki_data: # Log storage
```

### Development Volumes

```yaml
volumes:
  - .:/app # Source code mounting
  - /app/node_modules # Node modules preservation
  - ./nginx/nginx.conf:/etc/nginx/nginx.conf # Configuration mounting
```

## Deployment Commands

### Development Environment

```bash
# Start development environment (automatically uses override)
docker-compose up -d

# Build and start with fresh images
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

### Production Environment

```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Scale specific services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale app=3
```

### Maintenance Commands

```bash
# Stop all services
docker-compose down

# Remove volumes (destructive)
docker-compose down -v

# Update images
docker-compose pull
docker-compose up -d --build

# View resource usage
docker stats
```

## Environment Variables

Key environment variables that need to be configured:

```bash
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=secure_password
MONGO_USERNAME=app_user
MONGO_PASSWORD=app_password

# Redis Configuration
REDIS_PASSWORD=redis_password

# Grafana Configuration
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=grafana_password

# Application Configuration
NODE_ENV=production
ACCESS_TOKEN=your_access_token
```

## Troubleshooting

### Common Issues

1. **Network Creation**

   ```bash
   # Create external network if it doesn't exist
   docker network create luaplatform-network
   ```

2. **Permission Issues**

   ```bash
   # Fix volume permissions
   sudo chown -R 1000:1000 ./data
   ```

3. **Port Conflicts**

   ```bash
   # Check port usage
   netstat -tulpn | grep :5000
   ```

4. **Resource Constraints**
   ```bash
   # Monitor resource usage
   docker system df
   docker system prune
   ```
