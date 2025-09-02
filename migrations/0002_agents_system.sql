-- Migration: 0002_agents_system.sql
-- Description: Add agents and agent configurations for AI chat system
-- Date: 2025-01-02

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS agent_configurations;
DROP TABLE IF EXISTS agents;

-- Agents table - Store AI agent definitions
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  system_prompt TEXT,
  webhook_url TEXT NOT NULL,
  webhook_method TEXT DEFAULT 'POST' CHECK (webhook_method IN ('GET', 'POST', 'PUT', 'DELETE')),
  history_webhook_url TEXT, -- Optional webhook to fetch chat history from n8n
  model TEXT DEFAULT 'gpt-4', -- Model preference passed to n8n
  temperature REAL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false, -- Whether other users can use this agent
  metadata JSON, -- Additional agent-specific settings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Agent configurations - Store default headers and parameters
CREATE TABLE agent_configurations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  config_type TEXT DEFAULT 'header' CHECK (config_type IN ('header', 'parameter', 'secret')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(agent_id, config_key),
  FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
);

-- Update conversations table to link with agents (minimal tracking, n8n owns history)
DROP TABLE IF EXISTS messages; -- Remove messages table, n8n stores this
DROP TABLE IF EXISTS conversations; -- Recreate with agent support

CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  title TEXT,
  last_message_at DATETIME,
  message_count INTEGER DEFAULT 0,
  metadata JSON, -- Store any additional conversation metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_is_active ON agents(is_active);
CREATE INDEX idx_agents_is_public ON agents(is_public);
CREATE INDEX idx_agent_configurations_agent_id ON agent_configurations(agent_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Insert default agents for new users (will be added programmatically)
-- These are templates that can be cloned when a user signs up