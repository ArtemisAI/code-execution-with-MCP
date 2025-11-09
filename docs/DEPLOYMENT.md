## Deployment Guide

This guide covers deploying the MCP Code Execution Harness to production environments.

## 📋 Pre-Deployment Checklist

- [ ] Review and implement all security best practices (see SECURITY.md)
- [ ] Implement LLM integration in `AgentManager.ts`
- [ ] Connect to your MCP servers in `McpClient.ts`
- [ ] Configure environment variables (`.env`)
- [ ] Set up Redis for PII storage
- [ ] Configure monitoring and logging
- [ ] Test sandbox execution thoroughly
- [ ] Set up CI/CD pipeline
- [ ] Review and harden all `TODO` items in code

## 🐳 Docker Deployment

### Build Images

```bash
# Build the main application
docker build -t mcp-harness:latest .

# Build the sandbox image
docker build -t sandbox-image-name:latest -f Dockerfile.sandbox .
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    image: mcp-harness:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
    volumes:
      - ./skills:/app/skills
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - redis
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped
    
volumes:
  redis-data:
```

### Run

```bash
docker-compose up -d
```

## ☸️ Kubernetes Deployment

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-harness
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-harness
  template:
    metadata:
      labels:
        app: mcp-harness
    spec:
      containers:
      - name: mcp-harness
        image: mcp-harness:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_HOST
          value: "redis-service"
        volumeMounts:
        - name: skills
          mountPath: /app/skills
        - name: docker-sock
          mountPath: /var/run/docker.sock
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
      volumes:
      - name: skills
        persistentVolumeClaim:
          claimName: skills-pvc
      - name: docker-sock
        hostPath:
          path: /var/run/docker.sock
          type: Socket
---
apiVersion: v1
kind: Service
metadata:
  name: mcp-harness-service
spec:
  selector:
    app: mcp-harness
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Persistent Volume

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: skills-pvc
spec:
  accessModes:
    - ReadWriteMany
  resources:
    requests:
      storage: 10Gi
```

## 🚀 Cloud Provider Deployments

### AWS ECS

```json
{
  "family": "mcp-harness",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/mcp-task-role",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/mcp-execution-role",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "mcp-harness",
      "image": "YOUR_ECR_REPO/mcp-harness:latest",
      "memory": 2048,
      "cpu": 1024,
      "essential": true,
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
          "name": "REDIS_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:redis-password"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "docker-socket",
          "containerPath": "/var/run/docker.sock"
        }
      ]
    }
  ],
  "volumes": [
    {
      "name": "docker-socket",
      "host": {
        "sourcePath": "/var/run/docker.sock"
      }
    }
  ]
}
```

### Google Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/PROJECT_ID/mcp-harness

# Deploy
gcloud run deploy mcp-harness \
  --image gcr.io/PROJECT_ID/mcp-harness \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Azure Container Instances

```bash
az container create \
  --resource-group mcp-rg \
  --name mcp-harness \
  --image YOUR_ACR/mcp-harness:latest \
  --cpu 2 \
  --memory 4 \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables REDIS_PASSWORD=your-password
```

## 🔧 Production Configuration

### Environment Variables

Ensure all required environment variables are set (see `.env.example`).

**Critical Variables:**
- `NODE_ENV=production`
- `SESSION_SECRET` - Strong random value
- `REDIS_HOST` and `REDIS_PASSWORD` - Secure Redis connection
- LLM API keys and configuration
- MCP server configurations

### Reverse Proxy (Nginx)

```nginx
upstream mcp_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;
    
    location / {
        proxy_pass http://mcp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Block internal API from external access
    location /internal/ {
        deny all;
        return 403;
    }
}
```

## 📊 Monitoring

### Prometheus Metrics

Add to your application:

```typescript
import promClient from 'prom-client';

const register = new promClient.Register();

// Metrics
const executionCounter = new promClient.Counter({
  name: 'mcp_executions_total',
  help: 'Total number of code executions',
  labelNames: ['status']
});

const executionDuration = new promClient.Histogram({
  name: 'mcp_execution_duration_seconds',
  help: 'Duration of code executions',
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

register.registerMetric(executionCounter);
register.registerMetric(executionDuration);

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Health Checks

Already implemented at `/health` endpoint.

Configure liveness and readiness probes:

```yaml
# Kubernetes example
livenessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 🔐 Security Hardening

1. **Enable HTTPS** - Use TLS certificates
2. **API Authentication** - Implement JWT or OAuth
3. **Network Policies** - Restrict traffic between services
4. **Secrets Management** - Use vault services (AWS Secrets Manager, HashiCorp Vault)
5. **Container Scanning** - Regular vulnerability scans
6. **Audit Logging** - Log all security events
7. **Backup Strategy** - Regular backups of `/skills` volume

## 📈 Scaling

### Horizontal Scaling

The application is stateless except for:
- `/skills` directory (use shared storage)
- PII cache (use Redis cluster)

Configure multiple replicas with load balancer.

### Vertical Scaling

Adjust resource limits based on:
- Expected concurrent executions
- LLM response times
- Sandbox resource usage

## 🔄 Updates & Maintenance

### Rolling Updates

```bash
# Kubernetes
kubectl set image deployment/mcp-harness \
  mcp-harness=mcp-harness:v2.0.0

kubectl rollout status deployment/mcp-harness
```

### Backup

```bash
# Backup skills directory
tar -czf skills-backup-$(date +%Y%m%d).tar.gz skills/

# Backup to S3
aws s3 cp skills-backup-$(date +%Y%m%d).tar.gz \
  s3://your-backup-bucket/
```

## 🐛 Troubleshooting

### Container Logs

```bash
# Docker
docker logs mcp-harness

# Kubernetes
kubectl logs -f deployment/mcp-harness
```

### Common Issues

1. **Sandbox not starting** - Check Docker socket permissions
2. **High memory usage** - Adjust sandbox limits
3. **Slow execution** - Check LLM API latency
4. **Redis connection errors** - Verify network and credentials

## 📚 Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Production Checklist](https://kubernetes.io/docs/setup/best-practices/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
