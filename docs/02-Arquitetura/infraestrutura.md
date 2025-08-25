# 🏗️ Infraestrutura e Deployment

## 🌐 Deployment Architecture

### 🚀 **Deployment Strategy**

#### **Multi-Environment Setup**
```yaml
# Environments
environments:
  - name: development
    domain: localhost:3000
    database: intranet_dev
    features: [debug, hot-reload]

  - name: staging
    domain: staging.intranet.company.com
    database: intranet_staging
    features: [production-build, monitoring]

  - name: production
    domain: intranet.company.com
    database: intranet_prod
    features: [production-build, monitoring, backup]
```

#### **Containerization Strategy**
```dockerfile
# Dockerfile.production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

## 🐳 **Orchestration with Docker Compose**

### 📋 **Development Environment**
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/intranet_dev
    depends_on:
      - db
      - redis
    command: npm run dev

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=intranet_dev
      - POSTGRES_USER=intranet_user
      - POSTGRES_PASSWORD=dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 🚀 **Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: intranet-elo:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - UPLOADTHING_SECRET=${UPLOADTHING_SECRET}
      - UPLOADTHING_APP_ID=${UPLOADTHING_APP_ID}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=intranet_prod
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## ☁️ **Cloud Deployment Options**

### 🔄 **Vercel (Recommended for Prototyping)**
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "src/app/api/trpc/[trpc]/route.ts": {
      "maxDuration": 10
    }
  },
  "regions": ["fra1"],
  "env": {
    "DATABASE_URL": "@database-url",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": "@clerk-publishable-key",
    "CLERK_SECRET_KEY": "@clerk-secret-key"
  }
}
```

### 🐳 **Railway**
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[deploy]
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[environment]
DATABASE_URL = "postgresql://..."
NODE_ENV = "production"
```

### ☁️ **AWS ECS Fargate**
```yaml
# task-definition.json
{
  "family": "intranet-elo",
  "taskRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/intranet-elo:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/intranet-elo"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/intranet-elo",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 🗄️ **Database Infrastructure**

### 🐘 **PostgreSQL Production Setup**

#### **Connection Pooling**
```sql
-- Create connection pool user
CREATE USER intranet_pool WITH PASSWORD 'pool_password';
GRANT CONNECT ON DATABASE intranet_prod TO intranet_pool;

-- Create pool schema
CREATE SCHEMA pool AUTHORIZATION intranet_pool;
```

#### **Performance Optimization**
```sql
-- Optimize for production workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';

-- Create indexes for common queries
CREATE INDEX CONCURRENTLY idx_users_enterprise ON users(enterprise);
CREATE INDEX CONCURRENTLY idx_bookings_date ON bookings(date);
CREATE INDEX CONCURRENTLY idx_food_orders_date ON food_orders(created_at);
CREATE INDEX CONCURRENTLY idx_suggestions_status ON suggestions(status);
```

### 🔄 **Database Migration Strategy**
```bash
# Migration commands
npm run db:generate          # Generate Prisma client
npm run db:migrate           # Apply migrations (production)
npm run db:push              # Push schema (development)
npm run db:studio            # Open database GUI
```

## 📊 **Monitoring & Observability**

### 📈 **Application Performance Monitoring**

#### **Next.js Analytics**
```typescript
// src/lib/analytics.ts
import { NextWebVitalsMetric } from 'next/app'

export function reportWebVitals(metric: NextWebVitalsMetric) {
  switch (metric.name) {
    case 'FCP':
      // First Contentful Paint
      console.log('FCP:', metric.value)
      break
    case 'LCP':
      // Largest Contentful Paint
      console.log('LCP:', metric.value)
      break
    case 'CLS':
      // Cumulative Layout Shift
      console.log('CLS:', metric.value)
      break
    case 'FID':
      // First Input Delay
      console.log('FID:', metric.value)
      break
    case 'TTFB':
      // Time to First Byte
      console.log('TTFB:', metric.value)
      break
    default:
      break
  }
}
```

#### **Custom Metrics**
```typescript
// src/lib/metrics.ts
export class Metrics {
  static async recordApiCall(endpoint: string, duration: number, success: boolean) {
    // Record to monitoring service
    console.log(`API Call: ${endpoint} - ${duration}ms - ${success ? 'SUCCESS' : 'ERROR'}`)
  }

  static async recordDatabaseQuery(query: string, duration: number) {
    // Record slow queries
    if (duration > 1000) {
      console.warn(`Slow query: ${query} - ${duration}ms`)
    }
  }

  static async recordError(error: Error, context?: Record<string, any>) {
    // Record to error monitoring
    console.error('Application error:', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    })
  }
}
```

### 🔍 **Logging Strategy**

#### **Structured Logging**
```typescript
// src/lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'intranet-elo' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }))
}
```

#### **Log Levels**
```typescript
// Usage examples
logger.error('Database connection failed', {
  error: error.message,
  database: 'intranet_prod',
  timestamp: new Date()
})

logger.warn('Rate limit exceeded', {
  userId: 'user_123',
  endpoint: '/api/trpc/room.book',
  ip: '192.168.1.1'
})

logger.info('User logged in', {
  userId: 'user_123',
  userAgent: req.headers['user-agent'],
  timestamp: new Date()
})

logger.debug('Cache hit', {
  key: 'rooms_available',
  value: cachedRooms.length
})
```

## 🔒 **Security Infrastructure**

### 🛡️ **Web Application Firewall**
```nginx
# nginx.conf
server {
    listen 80;
    server_name intranet.company.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api/ {
        limit_req zone=api;
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 🔐 **SSL/TLS Configuration**
```nginx
# SSL Configuration
server {
    listen 443 ssl http2;
    server_name intranet.company.com;

    ssl_certificate /etc/ssl/certs/intranet.crt;
    ssl_certificate_key /etc/ssl/private/intranet.key;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # SSL Stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

## 💾 **Backup & Recovery**

### 📋 **Database Backup Strategy**

#### **Automated Backups**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASE="intranet_prod"

# Create backup
pg_dump -h localhost -U intranet_user -d $DATABASE \
  --no-owner --no-privileges \
  --format=custom \
  --compress=9 \
  --file=$BACKUP_DIR/${DATABASE}_${DATE}.backup

# Keep only last 30 days
find $BACKUP_DIR -name "*.backup" -mtime +30 -delete

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/${DATABASE}_${DATE}.backup s3://intranet-backups/
```

#### **Point-in-Time Recovery**
```sql
-- Enable WAL archiving
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /wal_archive/%f';

-- Create base backup
pg_basebackup -h localhost -U intranet_user -D /backups/base_backup -Ft -z

-- Restore from backup
pg_restore -h localhost -U intranet_user -d intranet_prod \
  --no-owner --no-privileges \
  /backups/intranet_prod_20240101.backup
```

### 📁 **File System Backup**
```bash
#!/bin/bash
# file-backup.sh

BACKUP_DIR="/backups/files"
SOURCE_DIR="/app/uploads"

# Create incremental backup
rsync -av --delete --backup --backup-dir=$BACKUP_DIR/$(date +%Y%m%d_%H%M%S) \
  $SOURCE_DIR/ $BACKUP_DIR/current/

# Compress old backups
find $BACKUP_DIR -name "20*" -type d -mtime +7 -exec tar czf {}.tar.gz {} \;
find $BACKUP_DIR -name "20*" -type d -mtime +7 -exec rm -rf {} \;
```

## 🚀 **CI/CD Pipeline**

### 🔄 **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: .next/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: actions/download-artifact@v3
        with:
          name: build-files
          path: .next/

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway login --token ${{ secrets.RAILWAY_TOKEN }}
          railway deploy --service intranet-elo
```

### 🐳 **Docker Build Pipeline**
```yaml
# .github/workflows/docker.yml
name: Build and Push Docker Image

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: intranet-elo
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 📊 **Scaling Strategy**

### 🚀 **Horizontal Scaling**
```yaml
# docker-compose.scaled.yml
version: '3.8'

services:
  app:
    image: intranet-elo:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s
    environment:
      - NODE_ENV=production
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    deploy:
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      restart_policy:
        condition: on-failure
```

### 📈 **Load Balancing**
```nginx
# nginx.conf (Load Balancer)
upstream intranet_backend {
    least_conn;
    server app1:3000 weight=3;
    server app2:3000 weight=3;
    server app3:3000 weight=3;
    keepalive 32;
}

server {
    listen 80;
    server_name intranet.company.com;

    location / {
        proxy_pass http://intranet_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📋 **Health Checks & Monitoring**

### 🔍 **Application Health Checks**
```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check database connection
    const dbHealth = await checkDatabaseHealth()

    // Check external services
    const clerkHealth = await checkClerkHealth()
    const uploadthingHealth = await checkUploadThingHealth()

    const health = {
      status: dbHealth && clerkHealth && uploadthingHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth ? 'healthy' : 'unhealthy',
        clerk: clerkHealth ? 'healthy' : 'unhealthy',
        uploadthing: uploadthingHealth ? 'healthy' : 'unhealthy'
      },
      uptime: process.uptime()
    }

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}

async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch {
    return false
  }
}
```

### 📊 **Metrics Collection**
```typescript
// src/lib/metrics.ts
export class MetricsCollector {
  private static metrics: Record<string, number> = {}

  static increment(metric: string, value: number = 1) {
    this.metrics[metric] = (this.metrics[metric] || 0) + value
  }

  static getMetrics() {
    return {
      ...this.metrics,
      timestamp: Date.now(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  }

  static reset() {
    this.metrics = {}
  }
}

// Usage
MetricsCollector.increment('api_calls')
MetricsCollector.increment('database_queries')
MetricsCollector.increment('cache_hits')
```

## 🔒 **Compliance & Security**

### 📊 **Data Retention Policy**
```sql
-- Automatically delete old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old logs (90 days)
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '90 days';

    -- Archive old orders (1 year)
    INSERT INTO archived_orders SELECT * FROM food_orders
    WHERE created_at < NOW() - INTERVAL '1 year';

    DELETE FROM food_orders WHERE created_at < NOW() - INTERVAL '1 year';

    -- Clean old sessions (30 days)
    DELETE FROM user_sessions WHERE last_activity < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup
SELECT cron.schedule('cleanup-old-data', '0 2 * * *', 'SELECT cleanup_old_data();');
```

### 🔐 **Security Best Practices**
```bash
# Security scanning
npm audit --audit-level=moderate
npm audit fix

# Docker security
docker scan intranet-elo:latest

# SSL certificate monitoring
certbot certificates
certbot renew --dry-run
```

## 📋 **Disaster Recovery**

### 🆘 **Disaster Recovery Plan**
```yaml
# disaster-recovery.yml
version: '3.8'

services:
  backup:
    image: postgres:15
    command: >
      bash -c "
        while true; do
          pg_dump -h primary-db -U intranet_user -d intranet_prod > /backups/backup.sql
          aws s3 cp /backups/backup.sql s3://intranet-backups/
          sleep 3600
        done
      "
    volumes:
      - backup-data:/backups

  recovery:
    image: postgres:15
    command: >
      bash -c "
        aws s3 cp s3://intranet-backups/latest.sql /tmp/backup.sql
        psql -h localhost -U intranet_user -d intranet_prod < /tmp/backup.sql
      "
    profiles:
      - recovery

volumes:
  backup-data:
```

### 🔄 **Failover Strategy**
```typescript
// src/lib/failover.ts
export class FailoverManager {
  private primaryDB = 'primary-db'
  private replicaDB = 'replica-db'
  private currentDB = this.primaryDB

  async checkHealth() {
    try {
      await this.query(this.primaryDB, 'SELECT 1')
      this.currentDB = this.primaryDB
    } catch {
      console.warn('Primary DB failed, switching to replica')
      this.currentDB = this.replicaDB
    }
  }

  async query(db: string, sql: string) {
    // Implement database query with failover
  }

  getCurrentDB() {
    return this.currentDB
  }
}
```

## 📋 **Infrastructure Checklist**

### 🏗️ **Deployment Readiness**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### 🔒 **Security Checklist**
- [ ] Firewall rules configured
- [ ] SSL/TLS enabled
- [ ] Security headers set
- [ ] Rate limiting configured
- [ ] Authentication working
- [ ] Authorization implemented

### 📊 **Monitoring Checklist**
- [ ] Application logs configured
- [ ] Database monitoring enabled
- [ ] Performance metrics collected
- [ ] Error tracking setup
- [ ] Health checks implemented

### 💾 **Backup Checklist**
- [ ] Database backup automated
- [ ] File backup configured
- [ ] Backup testing performed
- [ ] Recovery procedure documented
- [ ] Offsite backup enabled

---

**📅 Última atualização**: Agosto 2025
**👥 Mantido por**: Equipe de DevOps

