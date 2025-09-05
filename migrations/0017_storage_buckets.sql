-- Storage buckets configuration table
CREATE TABLE IF NOT EXISTS storage_buckets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  provider TEXT NOT NULL DEFAULT 'r2' CHECK(provider IN ('r2', 's3')),
  is_default BOOLEAN DEFAULT FALSE,
  is_default_chat BOOLEAN DEFAULT FALSE,
  is_default_forms BOOLEAN DEFAULT FALSE,
  config_json TEXT NOT NULL, -- Encrypted credentials and configuration
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add bucket reference to conversation groups
ALTER TABLE conversation_groups ADD COLUMN bucket_id TEXT REFERENCES storage_buckets(id) ON DELETE SET NULL;

-- Add bucket reference to forms (replacing the unused r2_bucket field)
ALTER TABLE forms ADD COLUMN bucket_id TEXT REFERENCES storage_buckets(id) ON DELETE SET NULL;

-- Add bucket reference to files
ALTER TABLE files ADD COLUMN bucket_id TEXT REFERENCES storage_buckets(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_storage_buckets_provider ON storage_buckets(provider);
CREATE INDEX idx_storage_buckets_defaults ON storage_buckets(is_default, is_default_chat, is_default_forms);
CREATE INDEX idx_files_bucket_id ON files(bucket_id);

-- Create default R2 bucket using existing environment configuration
INSERT INTO storage_buckets (
  id,
  name,
  description,
  provider,
  is_default,
  is_default_chat,
  is_default_forms,
  config_json,
  created_by
) VALUES (
  'default-r2-bucket',
  'Default Storage',
  'Default R2 storage bucket',
  'r2',
  TRUE,
  TRUE,
  TRUE,
  '{"bucket_name":"workflowhub-files","use_binding":true}',
  NULL
);

-- Migrate existing files to use default bucket
UPDATE files SET bucket_id = 'default-r2-bucket' WHERE bucket_id IS NULL;