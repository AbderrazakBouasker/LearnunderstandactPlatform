---
sidebar_position: 6
---

# Production Deployment

This guide covers deploying the LuaPlatform to production environments, including security hardening, performance optimization, and monitoring setup.

## Production Overview

The production deployment focuses on:

- **Security**: Hardened configurations and secure communication
- **Performance**: Optimized containers and resource allocation
- **Reliability**: High availability and fault tolerance
- **Observability**: Comprehensive monitoring and alerting
- **Scalability**: Horizontal scaling capabilities

## Production Docker Configuration

### Production Compose File

Use the production-specific Docker Compose configuration:

```bash
# Deploy to production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Production Dockerfile

The `Dockerfile.prod` uses multi-stage builds for optimization:

```dockerfile
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --only=production  # Production dependencies only
COPY . .
RUN npm run build                   # Build optimized application

FROM node:18
WORKDIR /app
COPY --from=build /app /app        # Copy only built application
CMD ["npm", "start"]               # Production start command
```

**Production Optimizations:**

- **Multi-stage build**: Reduces final image size
- **Production dependencies**: Excludes development tools
- **Optimized builds**: Compiled and minified code
- **Security**: Non-root user execution

### Environment Configuration

Production environment variables should be managed securely:

```bash
# Production environment file (.env.prod)
NODE_ENV=production
PORT=5000

# Database (use strong credentials)
MONGO_ROOT_USERNAME=prod_admin
MONGO_ROOT_PASSWORD=complex_secure_password_123!
MONGO_USERNAME=app_prod_user
MONGO_PASSWORD=another_secure_password_456!

# Redis (secure password)
REDIS_PASSWORD=redis_production_password_789!

# JWT (strong secret)
JWT_SECRET=very_long_and_secure_jwt_secret_key_for_production_use_only
JWT_EXPIRES_IN=1h

# Monitoring
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=secure_grafana_password

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/server.crt
SSL_KEY_PATH=/etc/ssl/private/server.key
```

## Security Hardening

### Container Security

**Non-root User:**

```dockerfile
# Add to production Dockerfile
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
RUN chown -R appuser:appgroup /app
USER appuser
```

**Security Configurations:**

```yaml
services:
  app:
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE # Only if binding to privileged ports
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache
```

### Network Security

**Secure Network Configuration:**

```yaml
networks:
  frontend:
    driver: bridge
    ipam:
      config:
        - subnet: 172.18.0.0/16
  backend:
    driver: bridge
    internal: true # No external access
    ipam:
      config:
        - subnet: 172.19.0.0/16
```

**Service Network Assignment:**

```yaml
services:
  nginx:
    networks:
      - frontend
      - backend

  app:
    networks:
      - backend

  db:
    networks:
      - backend # Database only accessible internally
```

### SSL/TLS Configuration

**Nginx SSL Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/server.crt;
    ssl_certificate_key /etc/ssl/private/server.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Performance Optimization

### Resource Limits

**Container Resource Limits:**

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 4G
        reservations:
          cpus: "1.0"
          memory: 2G
    restart: unless-stopped

  db:
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 8G
        reservations:
          cpus: "1.0"
          memory: 4G

  redis:
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 2G
        reservations:
          cpus: "0.5"
          memory: 1G
```

### Application Performance

**Node.js Production Optimizations:**

```javascript
// Production configuration
const productionConfig = {
  // Cluster mode for multi-core utilization
  cluster: process.env.NODE_ENV === "production",
  workers: process.env.WORKERS || require("os").cpus().length,

  // Memory management
  maxOldSpaceSize: process.env.MAX_OLD_SPACE_SIZE || "4096",

  // Performance monitoring
  enableGC: true,
  enableHeapDump: false,

  // Caching
  enableResponseCache: true,
  cacheTimeout: 300, // 5 minutes
};

// Cluster setup for production
if (productionConfig.cluster && cluster.isMaster) {
  for (let i = 0; i < productionConfig.workers; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  startServer();
}
```

### Database Performance

**MongoDB Production Configuration:**

```javascript
const mongoProductionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50, // Maintain up to 50 socket connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,

  // Production-specific options
  writeConcern: {
    w: "majority",
    j: true,
    wtimeout: 1000,
  },
  readPreference: "secondaryPreferred",

  // Connection pool settings
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,
};
```

**Redis Production Configuration:**

```javascript
const redisProductionConfig = {
  host: "redis",
  port: 6379,
  password: process.env.REDIS_PASSWORD,

  // Connection pool
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,

  // Performance
  lazyConnect: true,
  keepAlive: 30000,
  commandTimeout: 5000,

  // Cluster support (if using Redis cluster)
  enableOfflineQueue: false,
};
```

## Scaling and Load Balancing

### Horizontal Scaling

**Scale Services:**

```bash
# Scale application containers
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale app=3

# Scale with specific resource allocation
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale app=5 --scale redis=2
```

**Load Balancer Configuration:**

```nginx
upstream backend {
    least_conn;
    server app_1:5000 max_fails=3 fail_timeout=30s;
    server app_2:5000 max_fails=3 fail_timeout=30s;
    server app_3:5000 max_fails=3 fail_timeout=30s;
}

server {
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Health checks
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_connect_timeout 2s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
```

### Auto-scaling with Docker Swarm

**Initialize Swarm Mode:**

```bash
# Initialize swarm on manager node
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml luaplatform

# Scale services
docker service scale luaplatform_app=5
```

**Swarm Configuration:**

```yaml
version: "3.8"
services:
  app:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
```

## Monitoring and Alerting

### Production Monitoring

**Grafana Production Configuration:**

```yaml
grafana:
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD}
    - GF_SECURITY_SECRET_KEY=${GF_SECURITY_SECRET_KEY}
    - GF_USERS_ALLOW_SIGN_UP=false
    - GF_USERS_ALLOW_ORG_CREATE=false
    - GF_AUTH_ANONYMOUS_ENABLED=false
    - GF_SMTP_ENABLED=true
    - GF_SMTP_HOST=${SMTP_HOST}
    - GF_SMTP_USER=${SMTP_USER}
    - GF_SMTP_PASSWORD=${SMTP_PASSWORD}
```

### Alert Rules

**Critical System Alerts:**

```yaml
# High CPU usage
- alert: HighCPUUsage
  expr: (100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "High CPU usage detected"

# High memory usage
- alert: HighMemoryUsage
  expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
  for: 5m
  labels:
    severity: critical

# Application errors
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
```

### Health Checks

**Application Health Endpoint:**

```javascript
app.get("/health", async (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {},
  };

  try {
    // Database health check
    await mongoose.connection.db.admin().ping();
    health.checks.database = "healthy";
  } catch (error) {
    health.checks.database = "unhealthy";
    health.status = "unhealthy";
  }

  try {
    // Redis health check
    await redis.ping();
    health.checks.redis = "healthy";
  } catch (error) {
    health.checks.redis = "unhealthy";
    health.status = "unhealthy";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
});
```

**Docker Health Checks:**

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Backup and Recovery

### Database Backup

**Automated MongoDB Backup:**

```bash
#!/bin/bash
# backup-mongodb.sh

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="mongo"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
docker exec $CONTAINER_NAME mongodump \
  --username=$MONGO_USERNAME \
  --password=$MONGO_PASSWORD \
  --authenticationDatabase=admin \
  --out=/tmp/backup

# Copy backup from container
docker cp $CONTAINER_NAME:/tmp/backup $BACKUP_DIR/$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_backup_$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete
```

**Automated Redis Backup:**

```bash
#!/bin/bash
# backup-redis.sh

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="redis"

mkdir -p $BACKUP_DIR

# Create Redis snapshot
docker exec $CONTAINER_NAME redis-cli --rdb /tmp/dump.rdb

# Copy snapshot from container
docker cp $CONTAINER_NAME:/tmp/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Cleanup old backups
find $BACKUP_DIR -name "redis_backup_*.rdb" -mtime +7 -delete
```

### Backup Automation

**Cron Job Setup:**

```bash
# Add to crontab
0 2 * * * /scripts/backup-mongodb.sh
0 3 * * * /scripts/backup-redis.sh

# Weekly full system backup
0 1 * * 0 /scripts/full-backup.sh
```

## Deployment Strategies

### Blue-Green Deployment

```bash
#!/bin/bash
# blue-green-deploy.sh

BLUE_COMPOSE="docker-compose.blue.yml"
GREEN_COMPOSE="docker-compose.green.yml"
CURRENT_ENV=$(docker ps --filter "name=luaplatform" --format "table {{.Names}}" | grep -o "blue\|green" | head -1)

if [ "$CURRENT_ENV" = "blue" ]; then
    NEW_ENV="green"
    NEW_COMPOSE=$GREEN_COMPOSE
else
    NEW_ENV="blue"
    NEW_COMPOSE=$BLUE_COMPOSE
fi

echo "Deploying to $NEW_ENV environment"

# Deploy new version
docker-compose -f $NEW_COMPOSE up -d

# Health check
sleep 30
if curl -f http://localhost:5001/health; then
    echo "Health check passed, switching traffic"
    # Update load balancer to point to new environment
    # Stop old environment
    docker-compose -f $OLD_COMPOSE down
else
    echo "Health check failed, rolling back"
    docker-compose -f $NEW_COMPOSE down
    exit 1
fi
```

### Rolling Updates

```yaml
# docker-compose.prod.yml with rolling updates
services:
  app:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1 # Update one container at a time
        delay: 30s # Wait 30s between updates
        order: start-first # Start new container before stopping old
        failure_action: rollback
        monitor: 60s
      rollback_config:
        parallelism: 1
        delay: 10s
        order: stop-first
```

## Disaster Recovery

### Recovery Procedures

**Database Recovery:**

```bash
#!/bin/bash
# restore-mongodb.sh

BACKUP_FILE=$1
CONTAINER_NAME="mongo"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Extract backup
tar -xzf $BACKUP_FILE -C /tmp/

# Copy to container
docker cp /tmp/backup $CONTAINER_NAME:/tmp/

# Restore database
docker exec $CONTAINER_NAME mongorestore \
  --username=$MONGO_USERNAME \
  --password=$MONGO_PASSWORD \
  --authenticationDatabase=admin \
  --drop \
  /tmp/backup
```

**Full System Recovery:**

```bash
#!/bin/bash
# disaster-recovery.sh

echo "Starting disaster recovery process..."

# Stop all services
docker-compose down

# Restore data volumes
docker volume create mongo_data
docker volume create redis_data
docker volume create grafana-storage

# Restore from backup
docker run --rm -v mongo_data:/data -v /backups:/backup alpine sh -c "cd /data && tar -xzf /backup/mongo_backup_latest.tar.gz --strip 1"

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo "Disaster recovery completed"
```

## Maintenance

### Regular Maintenance Tasks

**System Updates:**

```bash
#!/bin/bash
# maintenance.sh

# Update base images
docker-compose pull

# Rebuild with latest images
docker-compose build --no-cache

# Deploy with zero downtime
docker-compose up -d --force-recreate

# Cleanup unused resources
docker system prune -f

# Update monitoring dashboards
# Update SSL certificates
# Rotate log files
```

**Performance Monitoring:**

```bash
# Monitor system resources
docker stats --no-stream

# Check disk usage
df -h

# Monitor database performance
docker exec mongo mongostat --host localhost -u $MONGO_USERNAME -p $MONGO_PASSWORD

# Check application logs
docker logs --tail=100 backend
```
