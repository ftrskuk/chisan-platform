# Operations & Infrastructure

This document defines operational architecture, environment management, disaster recovery procedures, and infrastructure guidelines for CHISAN Platform.

## 1. Environment Strategy

### 1.1 Environment Overview

| Environment | Purpose | URL | Database | Users |
|-------------|---------|-----|----------|-------|
| **Development** | Local development | `localhost:3000` | Local Supabase | Developers |
| **Staging** | Pre-production testing | `staging.chisan.app` | Supabase (staging project) | QA, Stakeholders |
| **Production** | Live system | `app.chisan.app` | Supabase (prod project) | All users |

### 1.2 Environment Topology

```mermaid
graph TB
    subgraph "Development"
        DEV_WEB[Next.js Dev Server]
        DEV_API[NestJS Dev Server]
        DEV_DB[(Local Supabase)]
    end
    
    subgraph "Staging"
        STG_WEB[Vercel Preview]
        STG_API[Cloud Run Staging]
        STG_DB[(Supabase Staging)]
    end
    
    subgraph "Production"
        PROD_WEB[Vercel Production]
        PROD_API[Cloud Run Production]
        PROD_DB[(Supabase Production)]
        PROD_R2[(Cloudflare R2)]
    end
    
    DEV_WEB --> DEV_API
    DEV_API --> DEV_DB
    
    STG_WEB --> STG_API
    STG_API --> STG_DB
    
    PROD_WEB --> PROD_API
    PROD_API --> PROD_DB
    PROD_API --> PROD_R2
```

### 1.3 Environment Parity

| Aspect | Development | Staging | Production |
|--------|-------------|---------|------------|
| Database engine | PostgreSQL 15 | PostgreSQL 15 | PostgreSQL 15 |
| Node.js version | 20.x | 20.x | 20.x |
| Supabase features | All enabled | All enabled | All enabled |
| Sample data | Seed data | Anonymized prod copy | Real data |
| Auth domain | Any Google | Company only | Company only |
| RLS policies | Enabled | Enabled | Enabled |

### 1.4 Promotion Flow

```
Development → Staging → Production

1. Developer creates PR
2. PR triggers preview deployment (Staging)
3. QA tests on staging environment
4. PR approved and merged to main
5. Main branch auto-deploys to Production
```

---

## 2. Secrets Management

### 2.1 Secret Categories

| Category | Examples | Storage | Rotation |
|----------|----------|---------|----------|
| **Database** | `SUPABASE_URL`, `DATABASE_URL` | Environment variables | On breach |
| **Auth** | `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Environment variables | On breach |
| **External APIs** | `GOOGLE_CLIENT_SECRET` | Environment variables | Annually |
| **Storage** | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Environment variables | Annually |
| **Application** | `JWT_SECRET`, `ENCRYPTION_KEY` | Environment variables | On breach |

### 2.2 Secret Storage by Environment

| Environment | Storage Method | Access Control |
|-------------|----------------|----------------|
| Development | `.env.local` (gitignored) | Developer machine |
| Staging | Vercel/Cloud Run env vars | Deploy admin |
| Production | Vercel/Cloud Run env vars | Deploy admin (restricted) |

### 2.3 Required Environment Variables

```bash
# .env.local.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Database (for NestJS direct connection)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Auth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Storage
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=chisan-files

# Application
NEXTAUTH_SECRET=xxx
API_URL=http://localhost:4000
```

### 2.4 Secret Rotation Procedure

1. Generate new secret value
2. Add new secret to environment (both old and new active)
3. Deploy application update that uses new secret
4. Verify application works with new secret
5. Remove old secret from environment
6. Document rotation in security log

### 2.5 Security Guidelines

| Rule | Description |
|------|-------------|
| Never commit secrets | All `.env*` files in `.gitignore` |
| Use strong secrets | Min 32 characters, random generation |
| Principle of least privilege | Each environment has own credentials |
| Audit access | Log who accessed production secrets |
| No secrets in logs | Mask sensitive data in application logs |

---

## 3. Backup & Recovery

### 3.1 Backup Strategy

| Data Type | Method | Frequency | Retention | Location |
|-----------|--------|-----------|-----------|----------|
| **Database** | Supabase PITR | Continuous | 7 days | Supabase managed |
| **Database** | Daily snapshot | Daily 03:00 KST | 30 days | Supabase managed |
| **Database** | Weekly export | Weekly Sunday | 90 days | Cloudflare R2 |
| **Files (R2)** | R2 versioning | On change | 30 days | Cloudflare R2 |
| **Migrations** | Git repository | On commit | Forever | GitHub |

### 3.2 Recovery Point Objective (RPO)

| Scenario | RPO | Method |
|----------|-----|--------|
| Minor data loss | < 1 minute | Supabase PITR |
| Database corruption | < 24 hours | Daily snapshot |
| Complete disaster | < 7 days | Weekly export + migrations |

### 3.3 Recovery Time Objective (RTO)

| Scenario | RTO | Procedure |
|----------|-----|-----------|
| Application crash | < 5 minutes | Auto-restart via platform |
| Database failover | < 1 minute | Supabase managed |
| Region outage | < 1 hour | Manual failover to backup region |
| Complete rebuild | < 4 hours | Deploy from scratch + restore backup |

### 3.4 Backup Verification

| Check | Frequency | Method |
|-------|-----------|--------|
| Backup completion | Daily | Automated alert on failure |
| Restore test | Monthly | Restore to staging, verify data |
| DR drill | Quarterly | Full recovery simulation |

### 3.5 Database Export Script

```bash
#!/bin/bash
# scripts/backup-database.sh

DATE=$(date +%Y%m%d)
BACKUP_FILE="chisan_backup_${DATE}.sql"

# Export database
pg_dump $DATABASE_URL > /tmp/$BACKUP_FILE

# Compress
gzip /tmp/$BACKUP_FILE

# Upload to R2
aws s3 cp /tmp/${BACKUP_FILE}.gz \
  s3://chisan-backups/database/${BACKUP_FILE}.gz \
  --endpoint-url https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com

# Cleanup
rm /tmp/${BACKUP_FILE}.gz

echo "Backup completed: ${BACKUP_FILE}.gz"
```

---

## 4. Disaster Recovery

### 4.1 Disaster Scenarios

| Scenario | Severity | Likelihood | Recovery Procedure |
|----------|----------|------------|-------------------|
| Application bug | Low | High | Rollback deployment |
| Database corruption | Medium | Low | PITR restore |
| Supabase outage | High | Very Low | Wait or migrate |
| Cloud region outage | High | Very Low | Multi-region failover |
| Security breach | Critical | Low | Incident response plan |
| Data deletion (accidental) | Medium | Medium | PITR restore |

### 4.2 Recovery Procedures

#### Procedure A: Application Rollback

**Trigger**: Critical bug in production

```bash
# 1. Identify last working deployment
vercel ls --prod

# 2. Rollback to previous deployment
vercel rollback [deployment-url]

# 3. Verify application is working
curl -I https://app.chisan.app/health

# 4. Notify team
# Post to Slack #incidents channel
```

**Time estimate**: 5-10 minutes

#### Procedure B: Database Point-in-Time Recovery

**Trigger**: Data corruption or accidental deletion

1. **Identify recovery point**
   - Check audit logs for last known good state
   - Determine exact timestamp

2. **Initiate PITR** (via Supabase Dashboard)
   - Go to Project Settings > Database > Backups
   - Select "Point in Time Recovery"
   - Choose timestamp
   - Confirm recovery

3. **Verify data integrity**
   - Check critical tables (stocks, orders)
   - Compare record counts
   - Verify recent transactions

4. **Notify stakeholders**
   - Document data loss window (if any)
   - Update incident log

**Time estimate**: 15-30 minutes

#### Procedure C: Full Disaster Recovery

**Trigger**: Complete infrastructure failure

1. **Assess situation**
   - Determine scope of failure
   - Identify available resources

2. **Provision new infrastructure**
   ```bash
   # Create new Supabase project
   supabase projects create chisan-dr --org-id xxx
   
   # Apply migrations
   supabase db push --project-ref new-project-ref
   ```

3. **Restore database**
   ```bash
   # Download latest backup from R2
   aws s3 cp s3://chisan-backups/database/latest.sql.gz ./
   
   # Decompress and restore
   gunzip latest.sql.gz
   psql $NEW_DATABASE_URL < latest.sql
   ```

4. **Update DNS/Configuration**
   - Update environment variables
   - Point domain to new infrastructure

5. **Verify and communicate**
   - Full system test
   - Notify all users of recovery

**Time estimate**: 2-4 hours

### 4.3 Incident Response Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| Primary On-Call | TBD | First response, initial triage |
| Database Admin | TBD | Database recovery decisions |
| Security Lead | TBD | Security incident handling |
| Business Owner | TBD | Business impact decisions |

### 4.4 Post-Incident Review

After any incident:

1. **Document timeline** - What happened, when
2. **Root cause analysis** - Why it happened
3. **Impact assessment** - Data loss, downtime, affected users
4. **Action items** - Preventive measures
5. **Update runbook** - Improve procedures based on learnings

---

## 5. Database Migration Strategy

### 5.1 Migration Workflow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as GitHub
    participant CI as CI/CD
    participant Stg as Staging DB
    participant Prod as Production DB
    
    Dev->>Git: Push migration file
    Git->>CI: Trigger pipeline
    CI->>Stg: Apply migration
    CI->>CI: Run tests
    alt Tests pass
        CI->>Git: Mark PR as ready
        Dev->>Git: Merge to main
        Git->>CI: Trigger prod deploy
        CI->>Prod: Apply migration
    else Tests fail
        CI->>Dev: Notify failure
        Dev->>Dev: Fix and retry
    end
```

### 5.2 Migration Best Practices

| Practice | Description |
|----------|-------------|
| **Always reversible** | Every migration must have a rollback script |
| **Small changes** | One logical change per migration |
| **Test on staging** | Never apply untested migrations to production |
| **Backup first** | Create snapshot before destructive migrations |
| **Off-peak hours** | Apply risky migrations during low-traffic periods |
| **Monitor after** | Watch for errors after migration |

### 5.3 Migration File Structure

```
supabase/
├── migrations/
│   ├── 20260101000000_create_users.sql
│   ├── 20260101000001_create_user_roles.sql
│   ├── 20260102000000_create_warehouses.sql
│   └── ...
├── rollbacks/
│   ├── 20260101000000_drop_users.sql
│   ├── 20260101000001_drop_user_roles.sql
│   └── ...
└── seed.sql
```

### 5.4 Rollback Procedure

```bash
# 1. Identify problematic migration
supabase migration list

# 2. Apply rollback script
psql $DATABASE_URL < supabase/rollbacks/20260102000000_rollback.sql

# 3. Remove migration from history (if needed)
# This requires manual intervention in supabase_migrations table

# 4. Verify database state
psql $DATABASE_URL -c "SELECT * FROM information_schema.tables WHERE table_schema = 'public';"
```

---

## 6. Monitoring & Alerting

### 6.1 Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Application logs | Vercel Logs / Cloud Run Logs | Debug, audit trail |
| Error tracking | Sentry | Exception monitoring |
| Uptime monitoring | Better Uptime / Checkly | Availability alerts |
| Database metrics | Supabase Dashboard | Query performance, connections |
| Real-user monitoring | Vercel Analytics | Frontend performance |

### 6.2 Key Metrics

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| API response time (p95) | > 500ms | > 2000ms |
| Error rate | > 1% | > 5% |
| Database connections | > 80% | > 95% |
| Database query time (p95) | > 100ms | > 500ms |
| Disk usage | > 70% | > 90% |
| Memory usage | > 80% | > 95% |

### 6.3 Alert Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | SMS + Slack + Email | Immediate |
| Warning | Slack + Email | Within 1 hour |
| Info | Slack only | Next business day |

### 6.4 Health Check Endpoints

```typescript
// apps/api/src/health/health.controller.ts

@Controller('health')
export class HealthController {
  @Get()
  async check(): Promise<HealthStatus> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION,
      checks: {
        database: await this.checkDatabase(),
        storage: await this.checkStorage(),
      },
    };
  }

  @Get('ready')
  async readiness(): Promise<{ ready: boolean }> {
    const dbOk = await this.checkDatabase();
    return { ready: dbOk.status === 'ok' };
  }

  @Get('live')
  liveness(): { alive: boolean } {
    return { alive: true };
  }
}
```

### 6.5 Logging Standards

```typescript
// Log levels and usage
logger.error('Database connection failed', { error, retryCount }); // Errors requiring attention
logger.warn('Slow query detected', { query, duration });           // Potential issues
logger.info('User logged in', { userId });                         // Business events
logger.debug('Processing request', { requestId, params });         // Debugging (dev only)
```

| Log Level | Production | Staging | Development |
|-----------|------------|---------|-------------|
| Error | Yes | Yes | Yes |
| Warn | Yes | Yes | Yes |
| Info | Yes | Yes | Yes |
| Debug | No | Yes | Yes |

---

## 7. Deployment Procedures

### 7.1 Deployment Checklist

**Before deployment:**
- [ ] All tests pass in CI
- [ ] PR approved by reviewer
- [ ] Migration tested on staging
- [ ] No breaking API changes (or versioned)
- [ ] Environment variables updated (if needed)

**After deployment:**
- [ ] Health check passes
- [ ] Smoke test critical paths
- [ ] Monitor error rates for 15 minutes
- [ ] Verify database migrations applied
- [ ] Update deployment log

### 7.2 Deployment Commands

```bash
# Deploy to staging (automatic on PR)
# Vercel auto-deploys preview for each PR

# Deploy to production (on merge to main)
# Automatic via Vercel + Cloud Run

# Manual deployment (emergency)
vercel --prod                           # Frontend
gcloud run deploy api --source .        # Backend

# Rollback
vercel rollback                         # Frontend
gcloud run services update-traffic api --to-revisions=REVISION=100  # Backend
```

### 7.3 Zero-Downtime Deployment

| Component | Strategy |
|-----------|----------|
| Frontend (Vercel) | Instant switchover (edge) |
| Backend (Cloud Run) | Rolling update (gradual traffic shift) |
| Database migrations | Backward-compatible changes only |

---

## 8. Security Operations

### 8.1 Security Checklist

**Weekly:**
- [ ] Review audit logs for anomalies
- [ ] Check for failed login attempts
- [ ] Verify backup completion

**Monthly:**
- [ ] Review user access (remove unused accounts)
- [ ] Check dependency vulnerabilities (`npm audit`)
- [ ] Review security alerts from GitHub

**Quarterly:**
- [ ] Rotate non-critical secrets
- [ ] Review and update security policies
- [ ] Conduct DR drill

### 8.2 Vulnerability Management

```bash
# Check for vulnerabilities
npm audit

# Auto-fix where possible
npm audit fix

# For manual fixes, create issue and prioritize by severity
```

| Severity | Response Time | Action |
|----------|---------------|--------|
| Critical | 24 hours | Immediate patch |
| High | 1 week | Prioritize in next sprint |
| Medium | 1 month | Include in regular updates |
| Low | 3 months | Address when convenient |

### 8.3 Access Control

| System | Access Method | Who |
|--------|---------------|-----|
| GitHub (code) | GitHub account | All developers |
| Vercel (frontend) | Vercel team | DevOps, Tech Lead |
| Cloud Run (backend) | GCP IAM | DevOps, Tech Lead |
| Supabase (database) | Supabase team | DevOps, DBA |
| Cloudflare (DNS, R2) | Cloudflare account | DevOps |

---

## 9. Runbook Quick Reference

### Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Site down | Check Vercel status, then Cloud Run status |
| Slow queries | Check Supabase dashboard for long-running queries |
| Auth not working | Verify Supabase Auth service status |
| Storage errors | Check R2 bucket permissions and quotas |
| Migration failed | Rollback, fix, and retry |

### Emergency Contacts

| Situation | Contact |
|-----------|---------|
| Supabase issues | support@supabase.io |
| Vercel issues | support@vercel.com |
| GCP issues | GCP Support Console |
| Security incident | security@chisanpaper.com (internal) |

### Useful Commands

```bash
# Check application status
curl https://app.chisan.app/api/health

# View recent logs (Vercel)
vercel logs --follow

# View recent logs (Cloud Run)
gcloud run services logs read api --limit=100

# Database connection test
psql $DATABASE_URL -c "SELECT 1;"

# Force cache clear
curl -X PURGE https://app.chisan.app/*
```
