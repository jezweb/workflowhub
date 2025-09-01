# WorkflowHub 2.0 Deployment Guide

## Prerequisites

### Required Tools
- Node.js 20+ and npm 10+
- Wrangler CLI 4.x (`npm install -g wrangler`)
- Git for version control
- Cloudflare account with Workers enabled

### Cloudflare Resources Needed
- Workers (with Static Assets)
- D1 Database
- R2 Storage
- Custom domain (optional)

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/workflowhub.git
cd workflowhub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required environment variables:
```env
# Cloudflare Account
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Authentication
JWT_SECRET=generate_random_32_char_string
AUTH_SALT_ROUNDS=10

# n8n Integration
DEFAULT_WEBHOOK_URL=https://your-n8n.com/webhook/xxx

# Optional
SENTRY_DSN=your_sentry_dsn
```

### 4. Setup Cloudflare Resources

#### Create D1 Database
```bash
# Create database
wrangler d1 create workflowhub

# Note the database_id from output
# Update wrangler.toml with the ID
```

#### Create R2 Bucket
```bash
# Create bucket for files
wrangler r2 bucket create workflowhub-files
```

### 5. Run Database Migrations
```bash
# Apply migrations locally
wrangler d1 migrations apply workflowhub --local

# Create admin user (interactive)
npm run seed:admin
```

### 6. Start Development Server
```bash
# Start both frontend and worker
npm run dev

# Frontend only
npm run dev:frontend

# Worker only
npm run dev:worker
```

Development URLs:
- Frontend: http://localhost:5173
- Worker API: http://localhost:8787

## Production Deployment

### 1. Pre-deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run check`)
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Sensitive data removed from code
- [ ] Error tracking configured (Sentry)

### 2. Build Application
```bash
# Build frontend and worker
npm run build

# Verify build
npm run preview
```

### 3. Configure Production Environment

#### Set Secrets
```bash
# Set JWT secret
wrangler secret put JWT_SECRET

# Set other secrets as needed
wrangler secret put DEFAULT_WEBHOOK_URL
```

#### Update wrangler.toml
```toml
name = "workflowhub"
main = "worker/index.ts"
compatibility_date = "2025-09-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist"

[[d1_databases]]
binding = "DB"
database_name = "workflowhub"
database_id = "your_database_id"

[[r2_buckets]]
binding = "FILES"
bucket_name = "workflowhub-files"

[env.production]
vars = { ENVIRONMENT = "production" }
routes = [
  { pattern = "workflowhub.yourdomain.com", custom_domain = true }
]
```

### 4. Deploy to Cloudflare

#### Initial Deployment
```bash
# Deploy to production
npm run deploy

# Or with wrangler directly
wrangler deploy --env production
```

#### Apply Database Migrations
```bash
# Apply to production database
wrangler d1 migrations apply workflowhub --env production
```

### 5. Verify Deployment
```bash
# Check worker logs
wrangler tail --env production

# Test endpoints
curl https://workflowhub.yourdomain.com/api/health
```

## CI/CD with GitHub Actions

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run check
      - run: npm test

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          environment: production
          
      - name: Run migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: d1 migrations apply workflowhub --env production
```

### Required GitHub Secrets
- `CLOUDFLARE_API_TOKEN` - API token with Workers edit permissions
- `SENTRY_AUTH_TOKEN` - For source map uploads (optional)

## Environment-Specific Configuration

### Development
```bash
# Local D1 database
wrangler d1 execute workflowhub --local --file schema.sql

# Local R2 (uses local filesystem)
mkdir -p .wrangler/state/r2/workflowhub-files
```

### Staging
```bash
# Deploy to staging
wrangler deploy --env staging

# Staging URL
https://staging.workflowhub.workers.dev
```

### Production
```bash
# Deploy with custom domain
wrangler deploy --env production

# Production URL
https://workflowhub.yourdomain.com
```

## Database Management

### Migrations
```bash
# Create new migration
npm run migration:create -- add_user_preferences

# Apply migrations
wrangler d1 migrations apply workflowhub --env production

# Rollback (manual - no automatic rollback)
wrangler d1 execute workflowhub --env production --file migrations/rollback/001.sql
```

### Backup & Restore
```bash
# Export database
wrangler d1 export workflowhub --env production --output backup.sql

# Import to new database
wrangler d1 execute new-database --env production --file backup.sql
```

## Monitoring & Maintenance

### Logs
```bash
# Real-time logs
wrangler tail --env production

# Filter logs
wrangler tail --env production --filter "error"

# Format as JSON
wrangler tail --env production --format json
```

### Analytics
Access via Cloudflare Dashboard:
- Workers Analytics
- D1 Metrics
- R2 Usage

### Health Checks
```bash
# API health
curl https://workflowhub.yourdomain.com/api/health

# Database health
curl https://workflowhub.yourdomain.com/api/health/db

# Storage health
curl https://workflowhub.yourdomain.com/api/health/storage
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist .wrangler
npm install
npm run build
```

#### Database Connection Issues
```bash
# Check D1 binding
wrangler d1 list

# Test query
wrangler d1 execute workflowhub --command "SELECT 1"
```

#### R2 Upload Issues
```bash
# Check bucket exists
wrangler r2 bucket list

# Verify CORS settings
wrangler r2 bucket cors get workflowhub-files
```

#### Worker Timeout
- Check for long-running operations
- Implement pagination for large datasets
- Use background tasks for heavy processing

### Debug Mode
```bash
# Enable debug logging
wrangler deploy --env production --var DEBUG=true

# View debug logs
wrangler tail --env production --filter "debug"
```

## Rollback Procedures

### Quick Rollback
```bash
# Revert to previous deployment
wrangler rollback --env production

# Or deploy specific version
wrangler deploy --env production --compatibility-date 2025-08-31
```

### Database Rollback
```bash
# Manual rollback with prepared scripts
wrangler d1 execute workflowhub --env production --file migrations/rollback/latest.sql
```

## Security Considerations

### Production Checklist
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] Secrets rotated regularly
- [ ] Audit logging enabled

### Secret Rotation
```bash
# Generate new JWT secret
openssl rand -base64 32

# Update secret
wrangler secret put JWT_SECRET --env production

# Restart worker (automatic)
```

## Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run build:analyze

# Optimize for production
npm run build:prod
```

### Worker Optimization
- Enable Smart Placement
- Use Argo for routing
- Configure caching headers
- Implement ETags

## Backup Strategy

### Automated Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
wrangler d1 export workflowhub --env production --output backups/db-$DATE.sql
wrangler r2 object list workflowhub-files > backups/files-$DATE.txt
```

### Disaster Recovery
1. Keep 30 days of backups
2. Test restore procedure monthly
3. Document recovery time objective (RTO)
4. Maintain runbook for incidents

## Scaling Considerations

### When to Scale
- Response time > 500ms consistently
- Database size approaching 10GB
- Concurrent users > 1000
- File storage > 1TB

### Scaling Options
1. **Database**: Add read replicas
2. **Storage**: Multiple R2 buckets
3. **Compute**: Durable Objects for state
4. **CDN**: Cloudflare CDN for assets

## Support & Resources

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)

### Community
- GitHub Issues for bug reports
- Discord for community support
- Stack Overflow for Q&A

### Professional Support
- Cloudflare Enterprise Support
- Consulting services available