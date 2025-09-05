# S3-Compatible Storage Implementation Scratchpad

## Goal
Implement universal S3-compatible storage that works with:
- Cloudflare R2 (bindings + credentials)
- AWS S3
- Vultr Object Storage
- Any S3-compatible service (MinIO, DigitalOcean, Backblaze, etc.)

## Current State
- R2Provider: Only supports bindings, credentials not working
- S3Provider: Basic skeleton, not fully implemented
- StorageFactory: Creates providers based on bucket config

## Implementation Plan

### 1. AWS SDK Setup
- Install @aws-sdk/client-s3
- Import necessary commands: PutObject, GetObject, DeleteObject, HeadObject, ListObjectsV2

### 2. Provider Architecture
```
StorageProvider (interface)
├── R2Provider (binding mode only)
└── S3Provider (universal S3-compatible)
    ├── AWS S3 mode
    ├── R2 credential mode
    ├── Vultr mode
    └── Generic S3-compatible mode
```

### 3. Endpoint Logic
```typescript
// R2 (credential mode)
endpoint = `https://${account_id}.r2.cloudflarestorage.com`
region = "auto"

// AWS S3
endpoint = undefined // Uses default AWS endpoints
region = config.region // e.g., "us-east-1"

// Vultr
endpoint = config.endpoint // e.g., "https://ewr1.vultrobjects.com"
region = config.region // e.g., "ewr1"
forcePathStyle = true

// Generic S3
endpoint = config.endpoint
region = config.region || "us-east-1"
forcePathStyle = config.force_path_style || false
```

### 4. Configuration Examples

#### R2 with Credentials
```json
{
  "provider": "r2",
  "bucket_name": "workflowhub-autorag",
  "use_binding": false,
  "account_id": "0460574641fdbb98159c98ebf593e2bd",
  "access_key_id": "016241efaaf28254809848bad204a7f2",
  "secret_access_key": "..."
}
```

#### AWS S3
```json
{
  "provider": "s3",
  "bucket_name": "my-aws-bucket",
  "region": "us-east-1",
  "access_key_id": "AKIA...",
  "secret_access_key": "..."
}
```

#### Vultr Object Storage
```json
{
  "provider": "s3",
  "bucket_name": "my-vultr-bucket",
  "region": "ewr1",
  "endpoint": "https://ewr1.vultrobjects.com",
  "access_key_id": "...",
  "secret_access_key": "...",
  "force_path_style": true
}
```

## Implementation Notes

### S3Client Initialization
```typescript
const s3Client = new S3Client({
  region: this.getRegion(),
  endpoint: this.getEndpoint(),
  credentials: {
    accessKeyId: config.access_key_id,
    secretAccessKey: config.secret_access_key
  },
  forcePathStyle: config.force_path_style || false
});
```

### Key Methods to Implement
1. **upload(key, data, options)**
   - Use PutObjectCommand
   - Handle ArrayBuffer, Blob, ReadableStream
   - Set ContentType and metadata

2. **download(key)**
   - Use GetObjectCommand
   - Return Response with proper headers

3. **delete(key)**
   - Use DeleteObjectCommand

4. **exists(key)**
   - Use HeadObjectCommand
   - Return boolean

5. **list(options)**
   - Use ListObjectsV2Command
   - Handle pagination with continuationToken

6. **testConnection()**
   - Try ListObjectsV2Command with MaxKeys: 1

## Testing Checklist
- [ ] R2 with binding (existing)
- [ ] R2 with credentials
- [ ] AWS S3
- [ ] Vultr (if available)
- [ ] Error handling for wrong credentials
- [ ] File upload/download/delete
- [ ] List operations
- [ ] Large file handling

## Current Issues
1. R2Provider throws error when not using binding
2. Need to detect when to use S3 API vs binding
3. UI shows credentials saved but they're not being used properly

## Next Steps
1. Install AWS SDK
2. Refactor S3Provider to be fully functional
3. Update R2Provider to delegate to S3Provider when not using binding
4. Test with actual R2 credentials
5. Deploy and test in production