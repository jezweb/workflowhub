-- Initial database schema for WorkflowHub

-- Chat folders for organizing conversations
CREATE TABLE IF NOT EXISTS chat_folders (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  icon TEXT,
  webhook_url TEXT NOT NULL,
  webhook_headers TEXT, -- JSON string
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat threads within folders
CREATE TABLE IF NOT EXISTS chat_threads (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  folder_id TEXT NOT NULL,
  title TEXT NOT NULL,
  last_message TEXT,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES chat_folders(id) ON DELETE CASCADE
);

-- Chat messages within threads
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments TEXT, -- JSON string with file references
  metadata TEXT, -- JSON string (token count, model, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
);

-- Action buttons for dashboard
CREATE TABLE IF NOT EXISTS action_buttons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#3b82f6',
  webhook_url TEXT NOT NULL,
  webhook_method TEXT DEFAULT 'POST',
  webhook_headers TEXT, -- JSON string
  position INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File metadata for R2 storage
CREATE TABLE IF NOT EXISTS files_metadata (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  key TEXT NOT NULL UNIQUE, -- R2 object key
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT,
  folder TEXT, -- Virtual folder path
  metadata TEXT, -- JSON string
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_chat_threads_folder ON chat_threads(folder_id);
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_files_folder ON files_metadata(folder);
CREATE INDEX idx_files_uploaded ON files_metadata(uploaded_at);

-- Default data
INSERT INTO chat_folders (name, icon, webhook_url, position) 
VALUES ('General', '💬', 'https://n8n.example.com/webhook/general', 1);

INSERT INTO action_buttons (label, icon, color, webhook_url, position)
VALUES 
  ('Run Report', '📊', '#10b981', 'https://n8n.example.com/webhook/report', 1),
  ('Send Email', '✉️', '#6366f1', 'https://n8n.example.com/webhook/email', 2),
  ('Sync Data', '🔄', '#f59e0b', 'https://n8n.example.com/webhook/sync', 3);