# Agent & Chat System Implementation TODO

## Phase 1: Agent Management System

### Database & Types
- [ ] Create `/migrations/0002_agents_system.sql`
  - [ ] Create agents table
  - [ ] Add indexes for performance
  - [ ] Add default agent seed data
- [ ] Create `/src/types/agent.ts`
  - [ ] Define Agent interface
  - [ ] Define AgentWebhookRequest interface
  - [ ] Define AgentWebhookResponse interface
  - [ ] Define AgentCapability type
  - [ ] Add validation schemas with Zod

### Backend API
- [ ] Create `/src/worker/routes/agents.ts`
  - [ ] GET `/agents` - List agents (public + user's)
  - [ ] POST `/agents` - Create new agent
  - [ ] GET `/agents/:id` - Get agent details
  - [ ] PUT `/agents/:id` - Update agent
  - [ ] DELETE `/agents/:id` - Delete agent
  - [ ] POST `/agents/:id/test` - Test webhook connection
  - [ ] POST `/agents/:id/duplicate` - Clone agent
- [ ] Update `/src/worker/index.ts` to include agents routes

### Frontend Components
- [ ] Create `/src/components/agents/AgentList.tsx`
  - [ ] Grid view layout
  - [ ] Filter by public/private
  - [ ] Search functionality
- [ ] Create `/src/components/agents/AgentCard.tsx`
  - [ ] Display agent info
  - [ ] Show capabilities badges
  - [ ] Quick actions (edit, test, duplicate)
- [ ] Create `/src/components/agents/AgentForm.tsx`
  - [ ] Basic Info tab (name, description, icon)
  - [ ] Webhook tab (URLs)
  - [ ] AI Config tab (prompt, temperature, model)
  - [ ] Features tab (capability toggles)
  - [ ] Files tab (size limits, types)
  - [ ] Custom Variables tab (key-value pairs)
- [ ] Create `/src/components/agents/AgentTest.tsx`
  - [ ] Simple chat interface for testing
  - [ ] Show request/response
  - [ ] Display timing and metadata
- [ ] Create `/src/pages/Agents.tsx`
  - [ ] Main agents management page
  - [ ] Router integration

### API Client
- [ ] Update `/src/lib/api.ts`
  - [ ] Add agentsApi object
  - [ ] Implement all CRUD methods
  - [ ] Add test method

### Navigation
- [ ] Update `/src/components/layout/Sidebar.tsx`
  - [ ] Add Agents menu item
  - [ ] Update navigation structure
- [ ] Update `/src/App.tsx`
  - [ ] Add agents route

## Phase 2: Chat System Integration

### Database Updates
- [ ] Create `/migrations/0003_chat_agents.sql`
  - [ ] ALTER conversations table
    - [ ] Add agent_id column
    - [ ] Add session_id column
    - [ ] Remove parent_id (not needed now)
    - [ ] Add last_message_at
  - [ ] Add message_attachments table (for future)
  - [ ] Add indexes

### Types
- [ ] Create `/src/types/chat.ts`
  - [ ] Define Conversation interface
  - [ ] Define Message interface
  - [ ] Define ChatWebhookRequest interface
  - [ ] Define ChatWebhookResponse interface
  - [ ] Define HistoryWebhookRequest interface
  - [ ] Define HistoryWebhookResponse interface

### Backend Updates
- [ ] Update `/src/worker/routes/chat.ts`
  - [ ] Modify POST `/conversations` to include agent_id
  - [ ] Update GET `/conversations/:id/messages` to fetch from n8n
  - [ ] Modify POST `/conversations/:id/messages` to:
    - [ ] Get agent configuration
    - [ ] Send to n8n webhook
    - [ ] Handle webhook response
    - [ ] Update last_message_at
  - [ ] Add DELETE `/conversations/:id`
  - [ ] Add error handling for webhook failures

### Frontend Components
- [ ] Create `/src/components/chat/ChatContainer.tsx`
  - [ ] Main container layout
  - [ ] State management
  - [ ] Message loading from n8n
- [ ] Create `/src/components/chat/ConversationList.tsx`
  - [ ] List user's conversations
  - [ ] Show last message time
  - [ ] Delete conversation option
- [ ] Create `/src/components/chat/ChatMessages.tsx`
  - [ ] Display message history
  - [ ] Auto-scroll to bottom
  - [ ] Loading states
- [ ] Create `/src/components/chat/ChatInput.tsx`
  - [ ] Text input with multiline support
  - [ ] Send button
  - [ ] Keyboard shortcuts (Enter to send)
- [ ] Create `/src/components/chat/MessageItem.tsx`
  - [ ] Display user/AI messages differently
  - [ ] Show timestamp
  - [ ] Copy message option
- [ ] Create `/src/components/chat/AgentSelector.tsx`
  - [ ] Choose agent when creating conversation
  - [ ] Show agent capabilities

### Update Chat Page
- [ ] Update `/src/pages/Chat.tsx`
  - [ ] Use new components
  - [ ] Handle conversation selection
  - [ ] Manage chat state

## Phase 3: File Attachment Support

### Backend
- [ ] Update `/src/worker/routes/chat.ts`
  - [ ] Handle file_ids in message payload
  - [ ] Process files to base64 or URLs
  - [ ] Include in webhook request

### Frontend
- [ ] Create `/src/components/chat/FileAttachment.tsx`
  - [ ] File selection UI
  - [ ] Show selected files
  - [ ] Remove files option
- [ ] Update `/src/components/chat/ChatInput.tsx`
  - [ ] Add file attachment button
  - [ ] Show attached files count

### File Processing
- [ ] Create `/src/lib/fileUtils.ts`
  - [ ] fileToBase64 function
  - [ ] generateTempUrl function
  - [ ] validateFileForChat function

## Phase 4: n8n Integration & Documentation

### n8n Workflow Examples
- [ ] Create `/docs/n8n-workflows/basic-chat.json`
  - [ ] Webhook trigger
  - [ ] Gemini Chat with D1 Memory
  - [ ] Response webhook
- [ ] Create `/docs/n8n-workflows/chat-with-history.json`
  - [ ] Chat webhook
  - [ ] History webhook
  - [ ] Shared D1 configuration
- [ ] Create `/docs/n8n-workflows/advanced-agent.json`
  - [ ] File processing nodes
  - [ ] Web search tools
  - [ ] Custom variable usage

### Documentation
- [ ] Create `/docs/AGENT_SETUP.md`
  - [ ] How to create agents
  - [ ] Webhook configuration
  - [ ] Testing agents
- [ ] Create `/docs/N8N_INTEGRATION.md`
  - [ ] Setting up n8n workflows
  - [ ] D1 memory configuration
  - [ ] Webhook format documentation
- [ ] Update `/README.md`
  - [ ] Add Agent/Chat section
  - [ ] Update features list

## Phase 5: Testing & Polish

### Testing
- [ ] Test agent CRUD operations
- [ ] Test webhook connectivity
- [ ] Test message flow end-to-end
- [ ] Test file attachments
- [ ] Test error scenarios
- [ ] Test with different agent configurations

### UI Polish
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add tooltips for complex features
- [ ] Mobile responsiveness
- [ ] Keyboard navigation

### Performance
- [ ] Optimize message loading
- [ ] Add pagination for conversations
- [ ] Implement message caching (browser)
- [ ] Lazy load components

## Phase 6: Default Agents

### Create Default Agent Seeds
- [ ] General Assistant
- [ ] Code Helper
- [ ] Creative Writer
- [ ] Research Assistant
- [ ] Add to migration script

## Future Enhancements (Not Now)

### Streaming Support
- [ ] Research n8n SSE implementation
- [ ] Add streaming URL to agent config
- [ ] Implement EventSource in frontend
- [ ] Handle partial responses

### Conversation Collections
- [ ] Create collections table
- [ ] Add collection management UI
- [ ] Link conversations to collections

### Agent Marketplace
- [ ] Add agent rating system
- [ ] Implement agent search
- [ ] Add usage statistics
- [ ] Create featured agents

### Advanced Features
- [ ] Voice input/output
- [ ] Conversation export/import
- [ ] Agent versioning
- [ ] Usage quotas

## Technical Debt & Cleanup

- [ ] Remove old messages table references
- [ ] Update type definitions
- [ ] Add proper error boundaries
- [ ] Implement retry logic for webhooks
- [ ] Add request timeout handling

## Documentation Updates

- [ ] Update ARCHITECTURE.md with agent system
- [ ] Update CHANGELOG.md with changes
- [ ] Update scratchpad.md progress
- [ ] Create troubleshooting guide

## Git Commits

- [ ] Commit after Phase 1 completion
- [ ] Commit after Phase 2 completion
- [ ] Commit after Phase 3 completion
- [ ] Commit after testing
- [ ] Final commit with documentation

---

## Priority Order

1. **Essential (Do First)**
   - Agent database schema
   - Agent CRUD API
   - Basic agent UI
   - Update chat to use agents
   - Message flow with n8n

2. **Important (Do Second)**
   - File attachments
   - Agent testing interface
   - Error handling
   - Documentation

3. **Nice to Have (Do if Time)**
   - Agent templates
   - Conversation search
   - UI polish
   - Performance optimizations

## Notes

- Keep it simple, no streaming initially
- Test with real n8n workflows frequently
- Ensure backward compatibility where possible
- Document webhook formats clearly
- Use existing patterns from Forms/Actions/Files