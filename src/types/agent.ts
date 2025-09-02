// Agent type definitions
export interface Agent {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt?: string;
  webhook_url: string;
  webhook_method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  history_webhook_url?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  is_active: boolean;
  is_public: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentConfiguration {
  id: string;
  agent_id: string;
  config_key: string;
  config_value: string;
  config_type: 'header' | 'parameter' | 'secret';
  created_at: string;
}

// Chat system types - Phase 2 implementation
export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string;
  agent?: Agent; // Populated when fetched with agent details
  title?: string;
  last_message_at?: string;
  message_count: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string; // MIME type
  size: number;
  url?: string; // For R2 stored files (>1MB)
  data?: string; // Base64 for small files (<1MB)
  metadata?: Record<string, any>;
}

// Conversation management types
export interface CreateConversationRequest {
  agent_id: string;
  title?: string;
  initial_message?: string;
  metadata?: Record<string, any>;
}

export interface CreateConversationResponse {
  success: boolean;
  conversation?: Conversation;
  message?: ChatMessage; // If initial_message was provided
  error?: string;
}

// Request/Response types for API
export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt?: string;
  webhook_url: string;
  webhook_method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  history_webhook_url?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  is_active?: boolean;
  is_public?: boolean;
  metadata?: Record<string, any>;
  configurations?: Omit<AgentConfiguration, 'id' | 'agent_id' | 'created_at'>[];
}

export interface UpdateAgentRequest extends Partial<CreateAgentRequest> {
  id: string;
}

// Message sending types
export interface SendMessageRequest {
  content: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

export interface SendMessageResponse {
  success: boolean;
  user_message?: ChatMessage;
  assistant_message?: ChatMessage;
  error?: string;
  latency?: number;
}

// Conversation update types
export interface UpdateConversationRequest {
  title?: string;
  metadata?: Record<string, any>;
}

// Conversation list response
export interface ListConversationsResponse {
  success: boolean;
  conversations?: Conversation[];
  error?: string;
}

// Conversation with messages response
export interface GetConversationResponse {
  success: boolean;
  conversation?: Conversation;
  messages?: ChatMessage[];
  error?: string;
}

// n8n webhook integration types
export interface N8nWebhookPayload {
  message: string;
  conversation_id: string;
  agent_config: {
    name: string;
    system_prompt?: string;
    model: string;
    temperature: number;
    max_tokens: number;
  };
  conversation_history?: ChatMessage[];
  user_context: {
    user_id: string;
    username: string;
  };
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

export interface N8nWebhookResponse {
  message: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface TestAgentRequest {
  message: string;
  test_config?: Record<string, any>;
}

export interface TestAgentResponse {
  success: boolean;
  response?: string;
  error?: string;
  latency?: number;
}

// Helper functions
export function generateAgentId(): string {
  return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateConfigId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default agent templates
export const DEFAULT_AGENT_TEMPLATES: Partial<Agent>[] = [
  {
    name: 'General Assistant',
    description: 'A helpful AI assistant for general questions and tasks',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: 'You are a helpful assistant. Be concise and clear in your responses.',
  },
  {
    name: 'Code Helper',
    description: 'Specialized in programming and technical questions',
    model: 'gpt-4',
    temperature: 0.3,
    max_tokens: 3000,
    system_prompt: 'You are an expert programmer. Help with code, debugging, and technical questions. Always provide clear examples.',
  },
  {
    name: 'Creative Writer',
    description: 'Assists with creative writing and content generation',
    model: 'gpt-4',
    temperature: 0.9,
    max_tokens: 2500,
    system_prompt: 'You are a creative writing assistant. Help with stories, articles, and creative content. Be imaginative and engaging.',
  },
];

// Validation schemas (using simple validation for now, can add Zod later)
export function validateAgent(agent: Partial<Agent>): string[] {
  const errors: string[] = [];
  
  if (!agent.name || agent.name.trim().length === 0) {
    errors.push('Agent name is required');
  }
  
  if (!agent.webhook_url || !isValidUrl(agent.webhook_url)) {
    errors.push('Valid webhook URL is required');
  }
  
  if (agent.history_webhook_url && !isValidUrl(agent.history_webhook_url)) {
    errors.push('History webhook URL must be valid if provided');
  }
  
  if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  if (agent.max_tokens !== undefined && agent.max_tokens < 1) {
    errors.push('Max tokens must be at least 1');
  }
  
  return errors;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Chat validation functions
export function validateSendMessageRequest(request: Partial<SendMessageRequest>): string[] {
  const errors: string[] = [];
  
  if (!request.content || request.content.trim().length === 0) {
    errors.push('Message content is required');
  }
  
  if (request.content && request.content.length > 10000) {
    errors.push('Message content must be less than 10,000 characters');
  }
  
  if (request.attachments && request.attachments.length > 10) {
    errors.push('Maximum 10 attachments allowed per message');
  }
  
  return errors;
}

export function validateCreateConversationRequest(request: Partial<CreateConversationRequest>): string[] {
  const errors: string[] = [];
  
  if (!request.agent_id || request.agent_id.trim().length === 0) {
    errors.push('Agent ID is required');
  }
  
  if (request.title && request.title.length > 200) {
    errors.push('Conversation title must be less than 200 characters');
  }
  
  if (request.initial_message && request.initial_message.length > 10000) {
    errors.push('Initial message must be less than 10,000 characters');
  }
  
  return errors;
}

// Attachment utility functions
export function isSmallFile(size: number): boolean {
  return size < 1024 * 1024; // 1MB threshold
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📺';
  if (mimeType.includes('text/')) return '📄';
  return '📎';
}