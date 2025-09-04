# Chat System Implementation Scratchpad

## Overview
Implementing a complete chat system with agent integration and conversation groups for WorkflowHub.

## Architecture Decisions
1. **Conversation Groups**: Flat structure (no nested groups) for simplicity
2. **Message Storage**: n8n owns message history, we cache recent messages
3. **Agent Context**: Each group has a default agent with shared context
4. **Session Management**: Shared session IDs within groups for context persistence

## Implementation Progress

### Phase 1: Database Setup ⏳
- [ ] Create migration 0008_conversation_groups.sql
- [ ] Add conversation_groups table
- [ ] Update conversations table with group_id
- [ ] Add indexes for performance

### Phase 2: Backend API 
- [ ] Update /src/worker/routes/chat.ts
  - [ ] Add group CRUD endpoints
  - [ ] Modify conversation creation to support groups
  - [ ] Implement message sending with agent webhook
  - [ ] Add history fetching from n8n
  - [ ] Handle group context in webhooks

### Phase 3: Types & Interfaces
- [ ] Create /src/types/chat.ts
  - [ ] ConversationGroup interface
  - [ ] Conversation interface (updated)
  - [ ] ChatMessage interface
  - [ ] WebhookRequest/Response types

### Phase 4: Core Chat Components
- [ ] /src/components/chat/ChatContainer.tsx - Main layout
- [ ] /src/components/chat/ConversationGroups.tsx - Group sidebar
- [ ] /src/components/chat/ConversationList.tsx - Conversations in group
- [ ] /src/components/chat/ChatMessages.tsx - Message display
- [ ] /src/components/chat/ChatInput.tsx - Message input
- [ ] /src/components/chat/MessageItem.tsx - Individual message

### Phase 5: Group Management
- [ ] /src/components/chat/GroupEditor.tsx - Create/edit groups
- [ ] /src/components/chat/GroupSelector.tsx - Quick group selection
- [ ] Group context editor
- [ ] Group visual customization

### Phase 6: Integration & Testing
- [ ] n8n webhook integration testing
- [ ] File attachment support
- [ ] Error handling
- [ ] Loading states
- [ ] Keyboard shortcuts

### Phase 7: Documentation
- [ ] Update ARCHITECTURE.md
- [ ] Update README.md
- [ ] Update CHANGELOG.md
- [ ] Create example n8n workflows

## API Endpoints Design

### Groups
- GET /api/chat/groups - List all groups
- POST /api/chat/groups - Create new group
- PUT /api/chat/groups/:id - Update group
- DELETE /api/chat/groups/:id - Delete group

### Conversations (Updated)
- GET /api/chat/conversations - List all (with optional group_id filter)
- POST /api/chat/conversations - Create (with optional group_id)
- GET /api/chat/conversations/:id - Get single conversation
- DELETE /api/chat/conversations/:id - Delete conversation
- GET /api/chat/conversations/:id/messages - Get messages (from n8n)
- POST /api/chat/conversations/:id/messages - Send message

## Webhook Protocol

### To n8n (sending message):
```json
{
  "message": "User's message",
  "conversation_id": "conv_123",
  "session_id": "session_456", // Shared within group
  "agent_config": {
    "name": "Agent Name",
    "system_prompt": "...",
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "group_context": {
    "id": "group_789",
    "name": "Project X",
    "shared_context": "You are helping with Project X...",
    "variables": {
      "project_name": "Project X",
      "deadline": "2024-03-01"
    }
  },
  "attachments": [],
  "metadata": {}
}
```

### From n8n (response):
```json
{
  "response": "Assistant's response",
  "conversation_id": "conv_123",
  "message_id": "msg_456",
  "metadata": {}
}
```

### History fetch from n8n:
```json
{
  "conversation_id": "conv_123",
  "session_id": "session_456",
  "limit": 50,
  "offset": 0
}
```

## UI/UX Flow

```
┌─────────────────────────────────────────────┐
│  Chat                                       │
├─────────────┬───────────────────────────────┤
│ Groups      │  Customer Support             │
│ ────────    │  ─────────────────────────    │
│ 📁 Support  │  [Messages Area]              │
│   ├ Billing │                               │
│   └ Bugs    │  Assistant: How can I help?   │
│             │                               │
│ 🚀 Dev      │  User: I need help with...    │
│   ├ API     │                               │
│   └ DB      │  [Input Area]                 │
│             │  ┌─────────────────────┐      │
│ + New Group │  │ Type a message...   │ Send │
└─────────────┴──┴─────────────────────┴──────┘
```

## Component Structure

```
src/components/chat/
├── ChatContainer.tsx      # Main container with state
├── ConversationGroups.tsx # Left sidebar groups
├── ConversationList.tsx   # Conversations in group
├── ChatMessages.tsx       # Message display area
├── ChatInput.tsx         # Input with attachments
├── MessageItem.tsx       # Individual message
├── GroupEditor.tsx       # Create/edit groups
├── GroupSelector.tsx     # Quick group picker
└── types.ts             # Local component types
```

## State Management

Using Zustand for chat state:
```typescript
interface ChatStore {
  groups: ConversationGroup[];
  conversations: Conversation[];
  activeGroupId: string | null;
  activeConversationId: string | null;
  messages: Map<string, ChatMessage[]>;
  
  // Actions
  setActiveGroup: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  // ... more actions
}
```

## Testing Checklist
- [ ] Create new group
- [ ] Create conversation in group
- [ ] Send message to agent
- [ ] Receive response from n8n
- [ ] Switch between conversations
- [ ] Delete group/conversation
- [ ] Group context inheritance
- [ ] File attachments
- [ ] Error handling
- [ ] Mobile responsive

## Known Issues / TODOs
- Consider adding conversation search
- Think about message export feature
- Maybe add typing indicators later
- Consider conversation templates

## Git Commits Plan
1. Initial database migration and types
2. Backend API implementation
3. Core chat components
4. Group management features
5. n8n integration complete
6. Documentation updates

## Notes
- Keep components small and focused
- Follow existing patterns from Forms/Actions
- Use shadcn/ui components consistently
- Don't over-optimize initially
- Test with real n8n workflows frequently