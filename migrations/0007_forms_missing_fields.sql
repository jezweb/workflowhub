-- Migration: Add missing fields for advanced form features
-- This migration adds columns that were not included in previous migrations

-- Add allowed_domains and appearance_settings to forms table (if they don't exist)
ALTER TABLE forms ADD COLUMN allowed_domains TEXT;
ALTER TABLE forms ADD COLUMN appearance_settings TEXT DEFAULT '{}';

-- Add Turnstile tracking columns to form_submissions (if they don't exist)
ALTER TABLE form_submissions ADD COLUMN turnstile_validated INTEGER DEFAULT 0;
ALTER TABLE form_submissions ADD COLUMN turnstile_challenge_ts TEXT;

-- Create index for better performance on submission queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id_created 
ON form_submissions(form_id, created_at DESC);