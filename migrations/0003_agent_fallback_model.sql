-- Migration: 0003_agent_fallback_model.sql
-- Description: Add fallback_model column to agents table
-- Date: 2025-01-06

-- Add fallback_model column to agents table
ALTER TABLE agents ADD COLUMN fallback_model TEXT;

-- Update the model column comment to clarify it stores full model ID
-- SQLite doesn't support column comments, but this is for documentation
-- Both model and fallback_model store the full model ID format: "provider/model-name"
-- Examples: "openai/gpt-4", "anthropic/claude-3-opus", "google/gemini-pro"