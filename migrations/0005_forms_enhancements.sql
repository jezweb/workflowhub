-- Forms enhancements migration
-- Add response handling and additional features to forms

-- Add response_type to forms for handling submission responses
ALTER TABLE forms ADD COLUMN response_type TEXT DEFAULT 'toast' 
  CHECK (response_type IN ('toast', 'modal', 'page'));

-- Add R2 bucket configuration for file uploads
ALTER TABLE forms ADD COLUMN r2_bucket TEXT;

-- Add Turnstile configuration
ALTER TABLE forms ADD COLUMN turnstile_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE forms ADD COLUMN turnstile_site_key TEXT;

-- Add embedding configuration
ALTER TABLE forms ADD COLUMN embed_allowed BOOLEAN DEFAULT TRUE;

-- Add webhook execution tracking to form_submissions
ALTER TABLE form_submissions ADD COLUMN webhook_status TEXT 
  CHECK (webhook_status IN ('pending', 'success', 'error', 'skipped'));
ALTER TABLE form_submissions ADD COLUMN webhook_response TEXT;
ALTER TABLE form_submissions ADD COLUMN webhook_response_code INTEGER;
ALTER TABLE form_submissions ADD COLUMN webhook_executed_at DATETIME;
ALTER TABLE form_submissions ADD COLUMN webhook_duration_ms INTEGER;

-- Add file uploads tracking
ALTER TABLE form_submissions ADD COLUMN files TEXT; -- JSON array of R2 file keys

-- Create notifications table if not exists
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data TEXT, -- JSON additional data
  read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create form_templates table for import/export and cloning
CREATE TABLE IF NOT EXISTS form_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  template_data TEXT NOT NULL, -- JSON structure of the form
  created_by TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_form_submissions_webhook_status ON form_submissions(webhook_status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_form_templates_created_by ON form_templates(created_by);
CREATE INDEX idx_form_templates_is_public ON form_templates(is_public);