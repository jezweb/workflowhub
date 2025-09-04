-- Migration: 0008_conversation_groups.sql
-- Description: Add conversation groups for organizing chats with consistent agent context
-- Date: 2025-01-04

-- Create conversation_groups table for organizing conversations
CREATE TABLE conversation_groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,  -- Default agent for this group
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,  -- Emoji or icon identifier
  color TEXT DEFAULT '#6b7280',  -- Theme color (default gray)
  
  -- Shared context for all conversations in group
  shared_context TEXT,  -- Persistent context/instructions for the agent
  shared_variables JSON,  -- Key-value pairs available to all chats in group
  
  -- Organization
  position INTEGER DEFAULT 0,  -- For custom ordering
  is_archived BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Update conversations table to support groups
ALTER TABLE conversations ADD COLUMN group_id TEXT REFERENCES conversation_groups(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN shared_session_id TEXT; -- For context sharing within group

-- Create indexes for performance
CREATE INDEX idx_conversation_groups_user_id ON conversation_groups(user_id);
CREATE INDEX idx_conversation_groups_agent_id ON conversation_groups(agent_id);
CREATE INDEX idx_conversation_groups_position ON conversation_groups(position);
CREATE INDEX idx_conversation_groups_archived ON conversation_groups(is_archived);
CREATE INDEX idx_conversations_group_id ON conversations(group_id);
CREATE INDEX idx_conversations_session_id ON conversations(shared_session_id);

-- Add some default group templates (these will be created programmatically for new users)
-- Example: When a user creates their first chat, we can auto-create a "General" group