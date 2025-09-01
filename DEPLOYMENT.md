# WorkflowHub Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)
- n8n instance with webhook endpoints

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository>
cd workflowhub
npm install
```

### 2. Cloudflare Authentication

```bash
wrangler login
```

### 3. Create Cloudflare Resources

#### D1 Database
```bash
wrangler d1 create workflowhub-db
```

Save the database ID from the output.

#### R2 Bucket
```bash
wrangler r2 bucket create workflowhub-files
```

#### KV Namespace
```bash
wrangler kv namespace create CACHE
```

Save the namespace ID from the output.

### 4. Configure wrangler.json

Update `wrangler.json` with your resource IDs:

```json
{
  "name": "workflowhub",
  "compatibility_date": "2025-01-01",
  "main": "worker/index.ts",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "workflowhub-db",
      "database_id": "YOUR_D1_DATABASE_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "FILES",
      "bucket_name": "workflowhub-files"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "CACHE",
      "id": "YOUR_KV_NAMESPACE_ID"
    }
  ],
  "vars": {
    "DEFAULT_WEBHOOK_URL": "https://your-n8n.com/webhook/default"
  }
}
```

### 5. Run Database Migrations

```bash
# Create migrations
wrangler d1 migrations create workflowhub-db init

# Apply migrations
wrangler d1 migrations apply workflowhub-db
```

### 6. Set Authentication Token

```bash
# Generate a secure token
openssl rand -hex 32

# Store in KV
wrangler kv key put --binding=CACHE "auth:token" "YOUR_GENERATED_TOKEN"
```

## Local Development

```bash
# Start dev server
npm run dev

# Access at http://localhost:5173
```

## Production Deployment

### Build and Deploy

```bash
# Build the application
npm run build

# Deploy to Cloudflare
npm run deploy
```

### Verify Deployment

```bash
# Check logs
wrangler tail

# Test the deployment
curl https://workflowhub.YOUR_SUBDOMAIN.workers.dev/api/health
```

## Environment Variables

Set these in the Cloudflare dashboard or via wrangler:

```bash
# n8n webhook base URL
wrangler secret put N8N_WEBHOOK_BASE

# Authentication token
wrangler secret put AUTH_TOKEN
```

## Custom Domain Setup

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your WorkflowHub project
3. Go to Custom Domains tab
4. Add your domain
5. Update DNS records as instructed

## n8n Configuration

### Webhook Setup

1. Create webhooks in n8n for:
   - Chat message processing
   - Action button triggers
   - Form submissions

2. Configure webhook URLs in WorkflowHub:
   - Via UI: Settings page
   - Via API: PUT `/api/settings/webhook:chat`

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "workflowhub-chat",
        "responseMode": "responseNode",
        "options": {}
      }
    },
    {
      "name": "Process Message",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// Process chat message\nreturn items;"
      }
    }
  ]
}
```

## Monitoring

### Logs
```bash
# Real-time logs
wrangler tail

# Filter by status
wrangler tail --status error
```

### Analytics
- Dashboard: https://dash.cloudflare.com
- Workers > Analytics
- Monitor request count, errors, CPU time

### Health Check
```bash
# API health
curl https://your-domain/api/health

# Check specific service
curl https://your-domain/api/health/database
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Verify D1 database ID in wrangler.json
   - Check migrations were applied
   
2. **File upload failures**
   - Verify R2 bucket name
   - Check file size limits (100MB)
   
3. **Authentication errors**
   - Verify auth token in KV
   - Check Authorization header format

### Debug Mode

```bash
# Enable debug logging
wrangler dev --local
```

## Backup and Recovery

### Database Backup
```bash
wrangler d1 backup create workflowhub-db
```

### R2 Backup
```bash
# List all files
wrangler r2 object list workflowhub-files

# Download specific file
wrangler r2 object get workflowhub-files/path/to/file
```

## Updates and Maintenance

### Rolling Updates
```bash
# Deploy new version
npm run build && npm run deploy

# Rollback if needed
wrangler rollback
```

### Zero-Downtime Deployment
Cloudflare Workers automatically handles:
- Blue-green deployments
- Gradual rollout
- Automatic rollback on errors

## Security Checklist

- [ ] Change default auth token
- [ ] Configure CORS for your domain
- [ ] Enable Cloudflare Access (optional)
- [ ] Review webhook URLs
- [ ] Set rate limiting rules
- [ ] Enable audit logging

## Support

For issues or questions:
- GitHub Issues: [repository]/issues
- Cloudflare Support: https://support.cloudflare.com
- n8n Community: https://community.n8n.io