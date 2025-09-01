// Worker environment bindings
export interface Env {
  // D1 Database
  DB: D1Database;
  
  // R2 Storage
  FILES: R2Bucket;
  
  // KV Cache
  CACHE: KVNamespace;
  
  // Environment variables
  DEFAULT_WEBHOOK_URL: string;
}

// Chat types
export interface ChatFolder {
  id: string;
  name: string;
  icon?: string;
  webhook_url: string;
  webhook_headers?: Record<string, string>;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChatThread {
  id: string;
  folder_id: string;
  title: string;
  last_message?: string;
  last_activity: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    name: string;
    key: string;
    size: number;
    mime_type: string;
  }>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActionButton {
  id: string;
  label: string;
  icon?: string;
  color: string;
  webhook_url: string;
  webhook_method: string;
  webhook_headers?: Record<string, string>;
  position: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FileMetadata {
  id: string;
  key: string;
  name: string;
  size: number;
  mime_type?: string;
  folder?: string;
  metadata?: Record<string, any>;
  uploaded_at: string;
}