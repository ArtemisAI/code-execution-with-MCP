## Security Best Practices

This document outlines security considerations and best practices for deploying the MCP Code Execution Harness.

## 🔐 Sandbox Security

### Docker Container Hardening

The sandbox container implements multiple security layers:

1. **Non-Root User**
   - All code runs as `sandboxuser` (non-root)
   - Prevents privilege escalation attacks
   - Limited filesystem permissions

2. **Read-Only Root Filesystem**
   ```typescript
   ReadonlyRootfs: true
   ```
   - Prevents malicious code from modifying system files
   - Only `/skills` and `/workspace` are writable

3. **Resource Limits**
   ```typescript
   Memory: 100 * 1024 * 1024,  // 100MB
   CpuQuota: 50000,            // 50% of one CPU
   ```
   - Prevents resource exhaustion attacks
   - Configurable based on your needs

4. **Capability Dropping**
   ```typescript
   CapDrop: ['ALL']
   ```
   - Removes all Linux capabilities
   - Minimal attack surface

5. **Network Isolation**
   - Use `NetworkMode: 'none'` for complete isolation
   - Use custom networks with egress filtering for controlled access
   - Current template uses `bridge` for host communication

### Recommended Production Configuration

```typescript
// In DockerSandbox.ts constructor
{
  timeoutMs: 30000,        // 30 second timeout
  memoryLimitMb: 100,      // 100MB RAM limit
  cpuQuota: 50000,         // 50% CPU
  networkMode: 'none'      // No network access (adjust as needed)
}
```

## 🛡️ Authentication & Authorization

### Sandbox Authentication

1. **Session Tokens**
   - Generate unique tokens per execution
   - Include in all sandbox ↔ host communications
   - Validate on every internal API call

   ```typescript
   const sandboxAuthToken = `session_${userId}_${Date.now()}`;
   ```

2. **Token Validation** (TODO - Implement)
   ```typescript
   app.post('/internal/mcp-call', async (req, res) => {
     const { authToken } = req.body;
     
     // Validate token
     if (!isValidToken(authToken)) {
       return res.status(403).json({ error: 'Invalid auth token' });
     }
     
     // Execute...
   });
   ```

3. **Token Expiration**
   - Implement token TTL
   - Revoke tokens after task completion
   - Store in secure, time-limited cache (Redis)

### User Authorization

```typescript
// Implement user permission checks
async function authorizeUser(userId: string, action: string): Promise<boolean> {
  // Check user permissions
  // Validate against role-based access control
  // Log authorization attempts
  return true;
}
```

## 🔒 PII Protection

### Tokenization Strategy

1. **Detection Patterns**
   - Email addresses
   - Phone numbers
   - SSN, credit cards
   - Custom patterns for your domain

2. **Storage Security**
   - **Development**: In-memory Map (current template)
   - **Production**: Encrypted Redis with expiring keys
   
   ```typescript
   // Production example (not included in template)
   import Redis from 'ioredis';
   
   class SecurePiiCensor {
     private redis: Redis;
     
     constructor() {
       this.redis = new Redis({
         // Use TLS in production
         tls: { /* ... */ },
         password: process.env.REDIS_PASSWORD
       });
     }
     
     async tokenize(userId: string, data: any): Promise<any> {
       // Tokenize and store in Redis with TTL
       await this.redis.setex(
         `pii:${userId}:${token}`,
         3600, // 1 hour TTL
         encryptedValue
       );
     }
   }
   ```

3. **PII Lifecycle**
   - Tokenize: Before sending to LLM
   - De-tokenize: Before sending to MCP tools
   - Clear: After session completion
   - Audit: Log PII access (without exposing data)

## 🚨 Input Validation

### Code Execution Safety

```typescript
// Validate user input before execution
function validateCode(code: string): boolean {
  // Check for obvious malicious patterns
  const forbidden = [
    'process.exit',
    'child_process',
    'require("fs")',  // Use our sandboxed fs instead
    'eval(',
    'Function(',
  ];
  
  for (const pattern of forbidden) {
    if (code.includes(pattern)) {
      console.warn(`[Security] Forbidden pattern detected: ${pattern}`);
      return false;
    }
  }
  
  return true;
}
```

### Input Sanitization

```typescript
// Sanitize all user inputs
app.post('/task', async (req, res) => {
  const { userId, task } = req.body;
  
  // Validate input types
  if (typeof userId !== 'string' || typeof task !== 'string') {
    return res.status(400).json({ error: 'Invalid input types' });
  }
  
  // Check lengths
  if (userId.length > 100 || task.length > 10000) {
    return res.status(400).json({ error: 'Input too long' });
  }
  
  // Sanitize special characters
  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // Process...
});
```

## 📊 Monitoring & Auditing

### Security Logging

```typescript
interface SecurityEvent {
  timestamp: string;
  userId: string;
  eventType: 'code_execution' | 'tool_call' | 'pii_access' | 'auth_failure';
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

function logSecurityEvent(event: SecurityEvent): void {
  // Log to secure audit system
  console.log(`[SECURITY] ${event.eventType}: ${JSON.stringify(event)}`);
  
  // In production: Send to SIEM, CloudWatch, Datadog, etc.
}
```

### Metrics to Monitor

1. **Execution Metrics**
   - Sandbox creation/destruction rate
   - Execution timeouts
   - Resource limit hits
   - Failed executions

2. **Security Metrics**
   - Authentication failures
   - PII tokenization events
   - Suspicious code patterns
   - Network access attempts

3. **Performance Metrics**
   - Average execution time
   - Memory usage
   - CPU usage
   - Tool call latency

## 🌐 Network Security

### Firewall Rules

1. **Internal API Protection**
   ```
   # Only allow Docker containers to access internal API
   iptables -A INPUT -p tcp --dport 3000 -s 172.17.0.0/16 -j ACCEPT
   iptables -A INPUT -p tcp --dport 3000 -j DROP
   ```

2. **Docker Network Segmentation**
   ```typescript
   // Create isolated Docker network
   const network = await docker.createNetwork({
     Name: 'mcp-sandbox-network',
     Internal: true,  // No external access
     EnableIPv6: false
   });
   ```

### Egress Filtering

```typescript
// If sandboxes need selective network access
HostConfig: {
  NetworkMode: 'custom-network',
  // Implement egress proxy or firewall
  Dns: ['your-dns-server'],
  DnsSearch: ['yourdomain.com']
}
```

## 🔄 Update & Patch Management

1. **Base Image Updates**
   ```bash
   # Regularly rebuild sandbox image
   docker pull node:20-alpine
   npm run build-sandbox
   ```

2. **Dependency Scanning**
   ```bash
   # Scan for vulnerabilities
   npm audit
   npm audit fix
   ```

3. **Container Scanning**
   ```bash
   # Use Docker Scout or similar
   docker scout cves sandbox-image-name
   ```

## 🚦 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/task', limiter);
```

## ✅ Security Checklist

Before deploying to production:

- [ ] Implement proper authentication and authorization
- [ ] Use encrypted PII storage (Redis with TLS)
- [ ] Enable comprehensive logging and monitoring
- [ ] Configure network isolation appropriately
- [ ] Implement rate limiting
- [ ] Set up intrusion detection
- [ ] Regular security audits
- [ ] Dependency vulnerability scanning
- [ ] Incident response plan
- [ ] Data retention policies
- [ ] Backup and recovery procedures
- [ ] Review and harden all TODO items in code

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
