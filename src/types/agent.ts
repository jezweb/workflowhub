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
  model: string; // Full model ID format: "provider/model-name"
  fallback_model?: string; // Optional fallback model ID
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

// Chat message format (for UI, actual storage is in n8n)
export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string; // For R2 stored files
  data?: string; // Base64 for small files
}

// Request/Response types for API
export interface CreateAgentRequest {
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt?: string;
  webhook_url: string;
  webhook_method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  model?: string;
  fallback_model?: string;
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

export interface SendMessageRequest {
  message: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversation_id: string;
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

export function generateConfigId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Model-related types
export interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  max_tokens?: number;
}

export interface ModelsResponse {
  success: boolean;
  models: OpenRouterModel[];
  fallback?: boolean;
}

// Default agent templates
export const DEFAULT_AGENT_TEMPLATES: Partial<Agent>[] = [
  {
    name: 'General Assistant',
    description: 'A helpful AI assistant for general questions and tasks',
    model: 'openai/gpt-4o',
    fallback_model: 'openai/gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: 'You are a helpful assistant. Be concise and clear in your responses.',
  },
  {
    name: 'Code Helper',
    description: 'Specialized in programming and technical questions',
    model: 'anthropic/claude-3.5-sonnet',
    fallback_model: 'anthropic/claude-3.5-haiku',
    temperature: 0.3,
    max_tokens: 3000,
    system_prompt: 'You are an expert programmer. Help with code, debugging, and technical questions. Always provide clear examples.',
  },
  {
    name: 'Creative Writer',
    description: 'Assists with creative writing and content generation',
    model: 'anthropic/claude-3-opus',
    fallback_model: 'google/gemini-2.0-flash-exp:free',
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