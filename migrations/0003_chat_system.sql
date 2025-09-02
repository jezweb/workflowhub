-- Migration: Chat System (Phase 2)
-- Date: 2025-01-02
-- Description: Creates messages table and indexes for chat functionality
-- Note: conversations table already exists from initial schema

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments JSON, -- Array of attachment objects
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Performance indexes for conversations table (create if not exists)
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Performance indexes for messages table
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_role ON messages(role);

-- Trigger to update conversation stats when messages are added
CREATE TRIGGER update_conversation_stats_after_insert
AFTER INSERT ON messages
BEGIN
  UPDATE conversations 
  SET 
    message_count = (SELECT COUNT(*) FROM messages WHERE conversation_id = NEW.conversation_id),
    last_message_at = NEW.created_at,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.conversation_id;
END;

-- Trigger to update conversation stats when messages are deleted
CREATE TRIGGER update_conversation_stats_after_delete
AFTER DELETE ON messages
BEGIN
  UPDATE conversations 
  SET 
    message_count = (SELECT COUNT(*) FROM messages WHERE conversation_id = OLD.conversation_id),
    last_message_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = OLD.conversation_id),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.conversation_id;
END;

-- View for conversation list with agent details (optional, for performance)
CREATE VIEW conversation_list AS
SELECT 
  c.*,
  a.name as agent_name,
  a.description as agent_description,
  a.avatar_url as agent_avatar_url,
  a.is_public as agent_is_public
FROM conversations c
LEFT JOIN agents a ON c.agent_id = a.id;