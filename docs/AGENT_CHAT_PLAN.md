# Agent & Chat System Implementation Plan

## Overview
Build a flexible AI chat system where n8n workflows act as intelligent agents, with n8n managing conversation memory and WorkflowHub providing the user interface and orchestration layer.

## Core Architecture Principles

### 1. Separation of Concerns
- **WorkflowHub**: User management, agent configuration, UI, orchestration
- **n8n**: AI processing, conversation memory, tool execution, integrations
- **Cloudflare D1**: Shared database for n8n memory nodes
- **R2**: File storage for attachments

### 2. Data Ownership
- **n8n owns**: Conversation history, AI memory, session management
- **WorkflowHub owns**: User accounts, agent configurations, conversation metadata

### 3. Communication Flow
```
User → WorkflowHub UI → WorkflowHub API → n8n Webhook → AI Agent → Response
                                     ↓
                            n8n D1 Memory (persistence)
```

## System Components

### 1. Agent Management System

#### Purpose
Allow users to create, configure, and manage AI agents that connect to n8n workflows.

#### Database Schema
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Webhook Configuration
  chat_webhook_url TEXT NOT NULL,        -- Main chat endpoint
  history_webhook_url TEXT,              -- Get conversation history (optional)
  delete_webhook_url TEXT,               -- Cleanup endpoint (optional)
  
  -- AI Configuration (passed to n8n)
  system_prompt TEXT,
  temperature REAL DEFAULT 0.7,          -- 0.0 to 1.0
  max_tokens INTEGER DEFAULT 2048,
  model TEXT DEFAULT 'gemini-1.5-flash', -- gemini-1.5-pro, gpt-4, claude-3, etc.
  response_style TEXT DEFAULT 'balanced', -- balanced, concise, detailed, creative, technical
  
  -- Feature Flags (tells n8n what tools to enable)
  enable_web_search BOOLEAN DEFAULT false,
  enable_code_execution BOOLEAN DEFAULT false,
  enable_database_query BOOLEAN DEFAULT false,
  enable_file_processing BOOLEAN DEFAULT false,
  
  -- File Configuration
  max_file_size INTEGER DEFAULT 4194304, -- 4MB default
  allowed_file_types TEXT,               -- JSON array: ['pdf','txt','md','png','jpg']
  
  -- Custom Configuration
  custom_config TEXT,                    -- JSON for agent-specific variables
  
  -- UI/UX
  icon TEXT,                             -- emoji or lucide icon name
  color TEXT,                            -- hex color for UI theming
  
  -- Metadata
  created_by TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,       -- Can other users use this agent?
  is_active BOOLEAN DEFAULT true,        -- Is agent available?
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_agents_public ON agents(is_public);
CREATE INDEX idx_agents_created_by ON agents(created_by);
CREATE INDEX idx_agents_active ON agents(is_active);
```

#### Agent Features
- **CRUD Operations**: Create, read, update, delete agents
- **Testing Interface**: Test webhook connectivity and responses
- **Sharing**: Public agents that other users can use
- **Templates**: Pre-configured agents for common use cases
- **Duplication**: Clone existing agents with modifications

### 2. Conversation Management

#### Purpose
Track conversation metadata while letting n8n handle the actual message storage.

#### Database Schema
```sql
-- Minimal conversation tracking
CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,      -- n8n's session identifier
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME,
  message_count INTEGER DEFAULT 0,       -- Track for UI display
  metadata TEXT,                         -- JSON for extra data
  
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversation collections (future feature)
CREATE TABLE conversation_collections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  default_agent_id TEXT,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (default_agent_id) REFERENCES agents(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Link conversations to collections
ALTER TABLE conversations ADD COLUMN collection_id TEXT REFERENCES conversation_collections(id);

-- Indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_session ON conversations(session_id);
```

### 3. Chat Interface

#### Components Structure
```
/src/components/chat/
├── ChatContainer.tsx       # Main container orchestrating all components
├── ConversationList.tsx    # Sidebar listing conversations
├── ChatMessages.tsx        # Message history display
├── ChatInput.tsx          # Text input with send button
├── MessageItem.tsx        # Individual message component
├── FileAttachment.tsx     # File upload/preview
├── AgentSelector.tsx      # Choose agent for conversation
└── TypingIndicator.tsx    # Show when AI is processing
```

#### Message Flow
1. User types message in ChatInput
2. Optional: Attach files via FileAttachment
3. Send to WorkflowHub API
4. API forwards to n8n webhook with session_id
5. n8n processes with AI agent and saves to memory
6. Response returned to UI
7. UI updates ChatMessages

### 4. File Handling

#### Strategy
- Small files (< 1MB): Send as base64 in request
- Large files (1MB - 4MB): Upload to R2, send URL
- Process files before sending to n8n

#### File Processing Pipeline
```typescript
1. User selects files in UI
2. Validate file type and size
3. Upload to R2 (if large)
4. Generate temporary signed URL or base64
5. Include in webhook payload
6. n8n processes file (extract text, analyze image, etc.)
```

## API Endpoints

### Agent Endpoints
```
GET    /api/agents                 # List available agents
POST   /api/agents                 # Create new agent
GET    /api/agents/:id             # Get agent details
PUT    /api/agents/:id             # Update agent
DELETE /api/agents/:id             # Delete agent
POST   /api/agents/:id/test        # Test agent webhook
POST   /api/agents/:id/duplicate   # Clone agent
```

### Chat Endpoints
```
GET    /api/chat/conversations              # List user's conversations
POST   /api/chat/conversations              # Create new conversation
GET    /api/chat/conversations/:id          # Get conversation metadata
DELETE /api/chat/conversations/:id          # Delete conversation
GET    /api/chat/conversations/:id/messages # Get messages from n8n
POST   /api/chat/conversations/:id/messages # Send message to n8n
```

## n8n Integration

### Webhook Request Format
```typescript
interface ChatWebhookRequest {
  sessionId: string;           // Unique conversation identifier
  message: string;             // User's message
  
  // Agent configuration
  config: {
    systemPrompt?: string;
    temperature: number;
    maxTokens: number;
    model: string;
    responseStyle: string;
  };
  
  // Feature flags
  features: {
    webSearch: boolean;
    codeExecution: boolean;
    databaseQuery: boolean;
  };
  
  // File attachments
  attachments?: Array<{
    name: string;
    mimeType: string;
    data?: string;           // base64 for small files
    url?: string;            // URL for large files
    size: number;
  }>;
  
  // Custom context from agent config
  customContext?: Record<string, any>;
}
```

### Webhook Response Format
```typescript
interface ChatWebhookResponse {
  response: string;            // AI response text
  sessionId: string;           // Echo back session ID
  metadata?: {
    toolsUsed?: string[];      // Tools/nodes activated
    model?: string;            // Model actually used
    tokensUsed?: number;       // Token consumption
    processingTime?: number;   // Response time in ms
  };
}
```

### History Webhook Format
```typescript
// Request
interface HistoryWebhookRequest {
  sessionId: string;
}

// Response
interface HistoryWebhookResponse {
  sessionId: string;
  messages: Array<{
    message_type: 'human' | 'ai' | 'system';
    content: string;
    metadata?: any;
    timestamp: string;
  }>;
  totalMessages: number;
}
```

## Implementation Phases

### Phase 1: Agent Management (Week 1)
- [ ] Create database migrations
- [ ] Build agent CRUD API
- [ ] Create agent management UI
- [ ] Implement agent testing
- [ ] Add default agent templates

### Phase 2: Basic Chat (Week 2)
- [ ] Create conversation tracking
- [ ] Build chat API endpoints
- [ ] Implement chat UI components
- [ ] Connect to n8n webhooks
- [ ] Test message flow

### Phase 3: Advanced Features (Week 3)
- [ ] Add file attachment support
- [ ] Implement conversation search
- [ ] Add conversation collections
- [ ] Polish UI/UX
- [ ] Error handling and retry logic

### Phase 4: Future Enhancements
- [ ] Streaming responses (SSE)
- [ ] Voice input/output
- [ ] Conversation sharing
- [ ] Agent marketplace
- [ ] Analytics dashboard

## Technical Decisions

### Why n8n Manages Memory
1. **Built-in persistence** - D1 Chat Memory node handles it
2. **Session management** - Automatic session tracking
3. **Context windows** - Manages token limits automatically
4. **Tool integration** - Memory available to all n8n nodes

### Why Not Store Messages in WorkflowHub
1. **Avoid duplication** - Single source of truth
2. **Reduce complexity** - No sync issues
3. **Leverage n8n** - Use its strengths
4. **Flexibility** - Can switch memory backends in n8n

### File Handling Approach
1. **R2 for storage** - Already integrated
2. **Base64 for small** - Simpler for small files
3. **URLs for large** - Efficient for bigger files
4. **n8n processes** - Let n8n handle extraction

## Default Agents

### 1. General Assistant
```json
{
  "name": "General Assistant",
  "description": "A helpful AI assistant for general queries",
  "system_prompt": "You are a helpful AI assistant. Be friendly and informative.",
  "temperature": 0.7,
  "model": "gemini-1.5-flash",
  "response_style": "balanced"
}
```

### 2. Code Helper
```json
{
  "name": "Code Helper",
  "description": "Technical assistant for programming",
  "system_prompt": "You are an expert programmer. Provide concise, technical answers with code examples.",
  "temperature": 0.3,
  "model": "gemini-1.5-pro",
  "response_style": "technical",
  "enable_code_execution": true
}
```

### 3. Creative Writer
```json
{
  "name": "Creative Writer",
  "description": "Assistant for creative writing tasks",
  "system_prompt": "You are a creative writing assistant. Be imaginative and inspiring.",
  "temperature": 0.9,
  "model": "gemini-1.5-pro",
  "response_style": "creative",
  "enable_web_search": true
}
```

### 4. Research Assistant
```json
{
  "name": "Research Assistant",
  "description": "Thorough researcher with web access",
  "system_prompt": "You are a research assistant. Provide detailed, well-sourced information.",
  "temperature": 0.5,
  "model": "gemini-1.5-pro",
  "response_style": "detailed",
  "enable_web_search": true,
  "enable_database_query": true
}
```

## Error Handling

### Webhook Failures
- Timeout after 25 seconds (Cloudflare limit is 30s)
- Retry with exponential backoff
- Show user-friendly error messages
- Log errors for debugging

### File Upload Errors
- Validate before upload
- Show progress indicators
- Handle network failures
- Clean up failed uploads

### Session Issues
- Create new session if not found
- Handle session expiration
- Provide session recovery options

## Security Considerations

### Agent Webhooks
- Validate webhook URLs (HTTPS only in production)
- Optional webhook authentication tokens
- Rate limiting per user
- Sanitize custom configurations

### File Handling
- Virus scanning for uploads (future)
- Validate MIME types
- Enforce size limits
- Temporary URL expiration

### User Isolation
- Users can only access own conversations
- Optional conversation sharing (future)
- Agent permissions (public/private)
- Audit logging

## Testing Strategy

### Unit Tests
- Agent CRUD operations
- File processing functions
- API endpoint validation
- UI component isolation

### Integration Tests
- Webhook connectivity
- Message flow end-to-end
- File upload pipeline
- Error handling scenarios

### Manual Testing
- Various agent configurations
- Different file types
- Long conversations
- Concurrent users

## Documentation Needed

### For Users
- How to create agents
- Connecting to n8n workflows
- File attachment guide
- Troubleshooting guide

### For Developers
- n8n workflow examples
- API documentation
- Component architecture
- Deployment guide

## Success Metrics

### Technical
- Response time < 3 seconds
- Webhook success rate > 99%
- File upload success rate > 95%
- Zero data loss

### User Experience
- Intuitive agent creation
- Smooth conversation flow
- Clear error messages
- Responsive UI

## Risks and Mitigations

### Risk: n8n webhook downtime
**Mitigation**: Show clear status, queue messages locally

### Risk: Large conversation history
**Mitigation**: Pagination, lazy loading, summary views

### Risk: File processing failures
**Mitigation**: Graceful degradation, clear error messages

### Risk: Complexity for users
**Mitigation**: Good defaults, templates, documentation

## Next Steps

1. Review and refine this plan
2. Create database migrations
3. Start with Agent CRUD implementation
4. Build incrementally with testing
5. Document as we build

## Questions to Resolve

1. Should we support multiple webhooks per agent for different purposes?
2. How to handle conversation export/import?
3. Should agents have usage quotas/limits?
4. How to handle offline/queued messages?
5. Agent versioning strategy?

---

*This is a living document and will be updated as development progresses.*