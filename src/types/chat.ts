// Chat type definitions

// Conversation Group for organizing chats
export interface ConversationGroup {
  id: string;
  user_id: string;
  agent_id: string;
  name: string;
  description?: string;
  icon?: string;  // Emoji or icon identifier
  color?: string;  // Theme color
  shared_context?: string;  // Persistent instructions for agent
  shared_variables?: Record<string, any>;  // Variables available to all chats
  bucket_id?: string;  // Storage bucket for attachments
  position: number;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when needed)
  agent?: any;  // Agent type from agent.ts
  conversation_count?: number;
  last_activity?: string;
}

// Updated Conversation type with group support
export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string;
  group_id?: string;  // Optional group association
  shared_session_id?: string;  // For context sharing within group
  title?: string;
  last_message_at?: string;
  message_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  
  // Relations (populated when needed)
  agent?: any;  // Agent type from agent.ts
  group?: ConversationGroup;
}

// Chat message format (for UI, actual storage is in n8n)
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  timestamp?: string;
  metadata?: Record<string, any>;
  
  // UI state
  isLoading?: boolean;
  error?: string;
}

// File attachment for messages
export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;  // For R2 stored files
  data?: string;  // Base64 for small files
}

// Request/Response types for API

// Group management
export interface CreateGroupRequest {
  name: string;
  agent_id: string;
  description?: string;
  icon?: string;
  color?: string;
  shared_context?: string;
  shared_variables?: Record<string, any>;
}

export interface UpdateGroupRequest extends Partial<CreateGroupRequest> {
  position?: number;
  is_archived?: boolean;
  is_pinned?: boolean;
}

// Conversation management
export interface CreateConversationRequest {
  agent_id?: string;  // Optional if group_id provided (uses group's agent)
  group_id?: string;
  title?: string;
  metadata?: Record<string, any>;
}

// Message sending
export interface SendMessageRequest {
  message: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

// Webhook formats for n8n integration
export interface ChatWebhookRequest {
  message: string;
  conversation_id: string;
  session_id?: string;  // For context persistence
  agent_config: {
    name: string;
    system_prompt?: string;
    model: string;
    temperature: number;
    max_tokens: number;
  };
  group_context?: {
    id: string;
    name: string;
    shared_context?: string;
    variables?: Record<string, any>;
  };
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

export interface ChatWebhookResponse {
  response: string;
  conversation_id: string;
  message_id?: string;
  metadata?: Record<string, any>;
}

// History webhook for fetching messages from n8n
export interface HistoryWebhookRequest {
  conversation_id: string;
  session_id?: string;
  limit?: number;
  offset?: number;
}

export interface HistoryWebhookResponse {
  messages: ChatMessage[];
  total?: number;
  has_more?: boolean;
}

// Helper functions
export function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default group templates
export const DEFAULT_GROUP_TEMPLATES: Partial<ConversationGroup>[] = [
  {
    name: 'General',
    description: 'General conversations',
    icon: '💬',
    color: '#6b7280',
  },
  {
    name: 'Work',
    description: 'Work-related discussions',
    icon: '💼',
    color: '#3b82f6',
  },
  {
    name: 'Personal',
    description: 'Personal projects and ideas',
    icon: '🏠',
    color: '#10b981',
  },
];

// Group colors for selection
export const GROUP_COLORS = [
  { value: '#6b7280', label: 'Gray' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#84cc16', label: 'Lime' },
  { value: '#22c55e', label: 'Green' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#d946ef', label: 'Fuchsia' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#f43f5e', label: 'Rose' },
];

// Common emoji icons for groups
export const GROUP_ICONS = [
  '💬', '🗨️', '💭', '🗣️',  // Chat
  '💼', '📊', '📈', '📉',  // Business
  '🚀', '⚡', '🔥', '✨',  // Dynamic
  '📚', '📖', '📝', '✏️',  // Education
  '🎨', '🎭', '🎪', '🎯',  // Creative
  '🔧', '⚙️', '🛠️', '🔨',  // Tools
  '🏠', '🏢', '🏭', '🏗️',  // Buildings
  '💡', '🧠', '🤔', '💭',  // Ideas
  '📱', '💻', '🖥️', '⌨️',  // Tech
  '🌟', '⭐', '🌙', '☀️',  // Space
];