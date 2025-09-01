-- Add button collections for dashboard organization

-- Create button_collections table
CREATE TABLE IF NOT EXISTS button_collections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3b82f6',
  position INTEGER DEFAULT 0,
  collapsed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add collection_id to action_buttons
ALTER TABLE action_buttons ADD COLUMN collection_id TEXT REFERENCES button_collections(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_action_buttons_collection ON action_buttons(collection_id);
CREATE INDEX idx_button_collections_position ON button_collections(position);

-- Insert default collections
INSERT INTO button_collections (name, description, icon, color, position) VALUES
  ('Data Operations', 'Data synchronization and processing workflows', '📊', '#10b981', 1),
  ('Communications', 'Email, notifications, and messaging workflows', '📧', '#6366f1', 2),
  ('Reports & Analytics', 'Generate reports and analytics dashboards', '📈', '#f59e0b', 3);

-- Update existing buttons to assign to collections (optional)
-- This assigns the existing sample buttons to appropriate collections
UPDATE action_buttons 
SET collection_id = (SELECT id FROM button_collections WHERE name = 'Reports & Analytics')
WHERE label = 'Run Report';

UPDATE action_buttons 
SET collection_id = (SELECT id FROM button_collections WHERE name = 'Communications')
WHERE label = 'Send Email';

UPDATE action_buttons 
SET collection_id = (SELECT id FROM button_collections WHERE name = 'Data Operations')
WHERE label = 'Sync Data';