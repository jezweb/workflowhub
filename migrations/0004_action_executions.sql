-- Action Executions table for tracking webhook calls
CREATE TABLE IF NOT EXISTS action_executions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action_id TEXT NOT NULL,
  action_name TEXT NOT NULL, -- Denormalized for easy display
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error')),
  request_url TEXT NOT NULL,
  request_method TEXT NOT NULL,
  request_headers TEXT, -- JSON string
  request_payload TEXT, -- JSON string
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_executions_user_id ON action_executions(user_id);
CREATE INDEX idx_executions_action_id ON action_executions(action_id);
CREATE INDEX idx_executions_status ON action_executions(status);
CREATE INDEX idx_executions_is_read ON action_executions(is_read);
CREATE INDEX idx_executions_created_at ON action_executions(created_at);

-- Composite index for common queries
CREATE INDEX idx_executions_user_unread ON action_executions(user_id, is_read, created_at DESC);