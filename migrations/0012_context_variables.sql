-- Migration: Add context and variables system
-- Description: Organization context, team profiles, and custom variables for template substitution

-- Organization/Business Context (single record)
CREATE TABLE IF NOT EXISTS organization_context (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  social_links TEXT, -- JSON object {twitter, linkedin, facebook, etc}
  context_text TEXT, -- Rich text/markdown about the organization
  custom_fields TEXT, -- JSON for extensible fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team Member Profiles (extends user accounts)
CREATE TABLE IF NOT EXISTS team_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  title TEXT,
  department TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT, -- Can differ from login email
  photo_url TEXT,
  bio TEXT,
  skills TEXT, -- JSON array of skills
  custom_fields TEXT, -- JSON for extensible fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom Variables Store (key-value with metadata)
CREATE TABLE IF NOT EXISTS custom_variables (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL, -- 'global', 'user', 'organization'
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  data_type TEXT DEFAULT 'string', -- string, number, boolean, json
  is_sensitive BOOLEAN DEFAULT 0, -- For API keys, tokens (masks in UI)
  user_id TEXT, -- NULL for global variables
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE(category, key, user_id)
);

-- Indexes for performance
CREATE INDEX idx_team_profiles_user_id ON team_profiles(user_id);
CREATE INDEX idx_custom_variables_category ON custom_variables(category);
CREATE INDEX idx_custom_variables_key ON custom_variables(key);
CREATE INDEX idx_custom_variables_user_id ON custom_variables(user_id);