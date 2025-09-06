# Storage Providers Enhancement Scratchpad

## Goal
Improve the storage bucket configuration modal to make it more intuitive with clearer provider options and better UX.

## Current Issues
1. Unclear provider options - "Cloudflare R2" doesn't indicate binding vs S3 API modes
2. Confusing tabs - Configuration tabs disabled based on provider
3. Cramped layout - Name and Provider fields side-by-side
4. Unclear S3 compatibility - "Amazon S3" doesn't indicate it works for all S3-compatible services

## New Provider Types
```typescript
export type StorageProvider = 
  | 'r2-binding'      // Cloudflare R2 with binding
  | 'r2-s3'           // Cloudflare R2 with S3 API
  | 's3'              // Amazon S3
  | 'backblaze'       // Backblaze B2
  | 'digitalocean'    // DigitalOcean Spaces
  | 'vultr'           // Vultr Object Storage
  | 'minio'           // MinIO
  | 's3-compatible';  // Generic S3-compatible
```

## Provider Configurations

### Cloudflare R2 (Binding)
- bucket_name: string
- use_binding: true (implicit)

### Cloudflare R2 (S3 API)
- bucket_name: string
- account_id: string
- access_key_id: string
- secret_access_key: string
- endpoint: auto-generated `https://${account_id}.r2.cloudflarestorage.com`
- region: 'auto'

### Amazon S3
- bucket_name: string
- region: string (dropdown)
- access_key_id: string
- secret_access_key: string

### Backblaze B2
- bucket_name: string
- endpoint: `https://s3.${region}.backblazeb2.com`
- access_key_id: string (Application Key ID)
- secret_access_key: string (Application Key)
- region: derived from endpoint selection

### DigitalOcean Spaces
- bucket_name: string (Space name)
- region: nyc3 | sfo3 | ams3 | sgp1 | fra1 | syd1
- endpoint: `https://${region}.digitaloceanspaces.com`
- access_key_id: string
- secret_access_key: string

### Vultr Object Storage
- bucket_name: string
- region: ewr1 | lax1 | etc.
- endpoint: `https://${region}.vultrobjects.com`
- access_key_id: string
- secret_access_key: string
- force_path_style: true

### MinIO
- bucket_name: string
- endpoint: string (user provided)
- access_key_id: string
- secret_access_key: string
- force_path_style: true (default)

### Other S3-Compatible
- All fields exposed for full control

## Implementation Tasks

### Phase 1: Type Updates
- [x] Create scratchpad
- [ ] Update StorageProvider type in frontend types
- [ ] Update StorageProvider type in backend types
- [ ] Update database schema if needed

### Phase 2: Frontend Form Refactor
- [ ] Remove tabs from BucketForm
- [ ] Create provider dropdown with descriptions
- [ ] Implement dynamic configuration sections
- [ ] Add provider-specific validation
- [ ] Add helper text for each provider

### Phase 3: Backend Updates
- [ ] Update StorageFactory to handle new provider types
- [ ] Map provider types to S3 configurations
- [ ] Add provider-specific endpoint generation
- [ ] Update validation logic

### Phase 4: Testing
- [ ] Test R2 binding mode
- [ ] Test R2 S3 API mode
- [ ] Test Amazon S3
- [ ] Test with other providers if available
- [ ] Test migration of existing buckets

## Provider Display Names & Descriptions
```typescript
const PROVIDER_OPTIONS = [
  {
    value: 'r2-binding',
    label: 'Cloudflare R2 (Binding)',
    description: 'Direct Worker binding - Fastest, no credentials needed'
  },
  {
    value: 'r2-s3',
    label: 'Cloudflare R2 (S3 API)',
    description: 'Use R2 with credentials via S3-compatible API'
  },
  {
    value: 's3',
    label: 'Amazon S3',
    description: 'AWS S3 buckets'
  },
  {
    value: 'backblaze',
    label: 'Backblaze B2',
    description: 'Cost-effective S3-compatible cloud storage'
  },
  {
    value: 'digitalocean',
    label: 'DigitalOcean Spaces',
    description: 'Simple, scalable S3-compatible object storage'
  },
  {
    value: 'vultr',
    label: 'Vultr Object Storage',
    description: 'High-performance S3-compatible storage'
  },
  {
    value: 'minio',
    label: 'MinIO',
    description: 'Self-hosted S3-compatible storage'
  },
  {
    value: 's3-compatible',
    label: 'Other S3-Compatible',
    description: 'Any S3-compatible API (Wasabi, Linode, etc.)'
  }
];
```

## Migration Strategy
1. Keep existing 'r2' and 's3' provider types in database
2. Map them to new types in UI:
   - 'r2' with use_binding=true → 'r2-binding'
   - 'r2' with use_binding=false → 'r2-s3'
   - 's3' → check endpoint to determine specific provider or use 's3-compatible'

## Notes
- Backend still stores as 'r2' or 's3' with config determining actual behavior
- Frontend shows user-friendly provider options
- Pre-fill known endpoints and settings for popular providers
- Maintain backward compatibility with existing buckets