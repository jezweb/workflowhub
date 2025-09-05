# Storage Buckets Implementation Scratchpad

## Overview
Transform the isolated Files system into a multi-bucket storage management platform that integrates with Chat and Forms.

## Core Features
1. **Multiple Storage Buckets** - Support R2 (Cloudflare) and S3 (AWS) initially
2. **Default Buckets** - System defaults for general use, chat, and forms
3. **Contextual Integration** - Buckets assigned to chat groups and forms
4. **Secure Credentials** - Store provider credentials encrypted in D1
5. **Simple UI** - Clean bucket management interface

## Database Schema

### New Tables
```sql
-- Storage buckets configuration
CREATE TABLE storage_buckets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  provider TEXT NOT NULL DEFAULT 'r2', -- 'r2' or 's3'
  is_default BOOLEAN DEFAULT FALSE,      -- general default
  is_default_chat BOOLEAN DEFAULT FALSE, -- default for chat
  is_default_forms BOOLEAN DEFAULT FALSE,-- default for forms
  
  -- Provider-specific configuration (JSON)
  -- R2: { bucket_name, account_id, access_key_id, secret_access_key }
  -- S3: { bucket_name, region, access_key_id, secret_access_key, endpoint? }
  config_json TEXT NOT NULL,
  
  -- Metadata
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Update existing tables
ALTER TABLE conversation_groups ADD COLUMN bucket_id TEXT REFERENCES storage_buckets(id);
ALTER TABLE forms ADD COLUMN bucket_id TEXT REFERENCES storage_buckets(id);
ALTER TABLE files ADD COLUMN bucket_id TEXT REFERENCES storage_buckets(id);
```

## API Endpoints

### Storage Management
```
GET    /api/storage/buckets         - List all buckets
GET    /api/storage/buckets/:id     - Get bucket details
POST   /api/storage/buckets         - Create bucket
PUT    /api/storage/buckets/:id     - Update bucket
DELETE /api/storage/buckets/:id     - Delete bucket (if no files)
POST   /api/storage/buckets/:id/test - Test bucket connection
GET    /api/storage/defaults        - Get default buckets
```

### Files API Updates
```
GET    /api/files?bucket_id=:id     - List files in bucket
POST   /api/files/upload            - Upload with bucket_id in form data
```

## Storage Provider Interface

```typescript
interface StorageProvider {
  upload(key: string, data: ArrayBuffer, metadata?: any): Promise<void>;
  download(key: string): Promise<Response>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<StorageObject[]>;
  exists(key: string): Promise<boolean>;
  getSignedUrl?(key: string, expires?: number): Promise<string>;
}

class R2Provider implements StorageProvider {
  // Use Cloudflare R2 bindings
}

class S3Provider implements StorageProvider {
  // Use AWS SDK v3 S3 client
}
```

## UI Components Structure

### Storage Page (/storage)
```
src/pages/Storage.tsx
src/components/storage/
├── BucketList.tsx       - List of buckets with actions
├── BucketForm.tsx       - Create/edit bucket modal
├── BucketCard.tsx       - Individual bucket display
├── TestConnection.tsx   - Test bucket connectivity
└── types.ts            - TypeScript definitions
```

### Files Page Updates
- Add bucket selector dropdown
- Store selected bucket in localStorage
- Filter files by bucket_id

### Chat Integration
- Bucket selector in group settings
- "Attach from Storage" button
- File browser modal for quick selection

### Forms Integration
- Bucket selector in form settings
- Upload to selected bucket

## Implementation Steps

### Phase 1: Backend Foundation
1. Create migration for storage_buckets table
2. Build storage provider abstraction
3. Implement R2Provider and S3Provider
4. Create storage API routes
5. Update files API to support bucket_id

### Phase 2: Storage UI
1. Create Storage page component
2. Build bucket management interface
3. Add bucket creation/edit modals
4. Implement connection testing

### Phase 3: Integration
1. Update Files page with bucket selector
2. Add bucket assignment to chat groups
3. Add bucket assignment to forms
4. Update file operations to use selected bucket

### Phase 4: Chat Storage Feature
1. Add "Attach from Storage" to chat
2. Build file browser modal
3. Link attachments to bucket files

## Security Considerations
- Encrypt sensitive credentials before storing in D1
- Use environment variables for default R2 bucket
- Validate bucket access on every operation
- Sanitize file keys to prevent directory traversal

## Configuration Examples

### R2 Bucket Config
```json
{
  "bucket_name": "my-r2-bucket",
  "account_id": "abc123",
  "access_key_id": "key123",
  "secret_access_key": "secret456"
}
```

### S3 Bucket Config
```json
{
  "bucket_name": "my-s3-bucket",
  "region": "us-east-1",
  "access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "endpoint": null  // optional, for S3-compatible services
}
```

## Migration Strategy
1. On first deploy, create default R2 bucket using existing STORAGE binding
2. Migrate existing files to have bucket_id of default bucket
3. Maintain backward compatibility with single-bucket mode

## Testing Plan
1. Test R2 bucket operations (upload, download, delete)
2. Test S3 bucket operations
3. Test bucket switching in Files page
4. Test chat attachment from storage
5. Test form uploads to specific bucket

## Future Considerations
- Support for Azure Blob Storage
- Support for Google Cloud Storage
- Bucket usage statistics
- File transfer between buckets (if needed)
- Bucket access policies/permissions