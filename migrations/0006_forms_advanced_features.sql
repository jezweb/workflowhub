-- Migration: Add advanced features to forms system
-- This migration adds support for:
-- 1. New response types (rename page to redirect, add html)
-- 2. Appearance settings for form styling
-- 3. Cloudflare Turnstile integration
-- 4. Embedding security with allowed domains
-- 5. New field types support

-- First, update existing response_type values
UPDATE forms 
SET response_type = 'redirect' 
WHERE response_type = 'page';

-- Add new columns to forms table
ALTER TABLE forms ADD COLUMN allowed_domains TEXT;
ALTER TABLE forms ADD COLUMN appearance_settings TEXT DEFAULT '{}';
ALTER TABLE forms ADD COLUMN turnstile_enabled INTEGER DEFAULT 0;
ALTER TABLE forms ADD COLUMN turnstile_site_key TEXT;

-- Update form_submissions to track Turnstile validation
ALTER TABLE form_submissions ADD COLUMN turnstile_validated INTEGER DEFAULT 0;
ALTER TABLE form_submissions ADD COLUMN turnstile_challenge_ts TEXT;

-- Create index for better performance on submission queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id_created 
ON form_submissions(form_id, created_at DESC);

-- Update the response_type check constraint
-- SQLite doesn't support ALTER CONSTRAINT, so we need to recreate the table
-- However, since we're using D1, we'll handle this in the application layer