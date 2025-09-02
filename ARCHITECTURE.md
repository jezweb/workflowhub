# WorkflowHub 2.0 Architecture

## Overview
WorkflowHub is a business workflow management dashboard built on Cloudflare's edge platform with n8n webhook integration. Designed for simplicity, functionality, and ease of use for small teams.

## System Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  CF Worker  │────▶│     n8n     │
│  React SPA  │◀────│   + Hono    │◀────│  Webhooks   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │             │
              ┌─────▼───┐   ┌────▼────┐
              │   D1    │   │   R2    │
              │Database │   │ Storage │
              └─────────┘   └─────────┘
```

## Tech Stack

### Frontend
- **React 19** - UI framework
- **TypeScript 5.8** - Type safety
- **shadcn/ui** - Component library (Radix UI + Tailwind)
- **Tailwind CSS** - Utility-first styling
- **React Router 6** - Client-side routing
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **TanStack Query** - Data fetching & caching
- **Zustand** - State management
- **Vite 6** - Build tool

### Backend
- **Cloudflare Workers** - Edge compute
- **Hono** - Lightweight web framework
- **TypeScript** - Type safety
- **JWT** - Authentication tokens

### Storage
- **D1** - SQLite database at the edge
- **R2** - Object storage (S3-compatible)

### Integration
- **n8n Webhooks** - Workflow automation
- **SSE** - Server-sent events for streaming

## Database Schema

### Core Tables

```sql
-- User authentication
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Session management
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form definitions
CREATE TABLE forms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  fields_json TEXT NOT NULL, -- JSON schema
  is_public BOOLEAN DEFAULT FALSE,
  webhook_url TEXT,
  success_message TEXT,
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Form submissions
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  form_id TEXT NOT NULL REFERENCES forms(id),
  data_json TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  webhook_response TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Action buttons
CREATE TABLE action_buttons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  label TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  type TEXT NOT NULL, -- 'quick' or 'full'
  http_method TEXT DEFAULT 'POST',
  webhook_url TEXT NOT NULL,
  payload_json TEXT, -- Dynamic data to send
  position INTEGER,
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- File metadata
CREATE TABLE files (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  r2_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT,
  folder_path TEXT DEFAULT '/',
  bucket_name TEXT DEFAULT 'workflowhub-files',
  uploaded_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Agents (n8n webhook integration)
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  system_prompt TEXT,
  webhook_url TEXT NOT NULL,
  webhook_method TEXT DEFAULT 'POST',
  history_webhook_url TEXT,
  model TEXT DEFAULT 'gpt-4',
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Agent configurations (headers, parameters, secrets)
CREATE TABLE agent_configurations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  config_key TEXT NOT NULL,
  config_value TEXT NOT NULL,
  config_type TEXT DEFAULT 'header', -- 'header', 'parameter', 'secret'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat conversations (minimal tracking, n8n owns history)
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  title TEXT,
  last_message_at DATETIME,
  message_count INTEGER DEFAULT 0,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings store
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard widgets
CREATE TABLE dashboard_widgets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  type TEXT NOT NULL, -- 'button', 'form', 'stats', 'recent'
  config_json TEXT NOT NULL,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 3, -- Grid columns (1-12)
  height INTEGER DEFAULT 1, -- Grid rows
  user_id TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Design

### Authentication Endpoints
```
POST   /api/auth/register    - Create new user
POST   /api/auth/login       - Authenticate user
POST   /api/auth/logout      - End session
GET    /api/auth/session     - Verify current session
POST   /api/auth/refresh     - Refresh JWT token
```

### Forms API
```
GET    /api/forms            - List forms (public + owned)
GET    /api/forms/:id        - Get form definition
POST   /api/forms            - Create form
PUT    /api/forms/:id        - Update form
DELETE /api/forms/:id        - Delete form
POST   /api/forms/:id/submit - Submit form data
GET    /api/forms/:id/submissions - View submissions
```

### Files API
```
GET    /api/files            - List files with folders
POST   /api/files/upload     - Upload file(s)
GET    /api/files/:key       - Download file
DELETE /api/files/:key       - Delete file
POST   /api/files/folder     - Create virtual folder
```

### Database API
```
GET    /api/tables           - List all tables
GET    /api/tables/:name     - Query table data
POST   /api/tables/:name     - Insert row
PUT    /api/tables/:name/:id - Update row
DELETE /api/tables/:name/:id - Delete row
POST   /api/tables/:name/export - Export as CSV
```

### Chat API
```
GET    /api/conversations    - Get conversation tree
POST   /api/conversations    - Create conversation/folder
PUT    /api/conversations/:id - Update conversation
DELETE /api/conversations/:id - Delete conversation
GET    /api/conversations/:id/messages - Get messages
POST   /api/conversations/:id/messages - Send message (SSE response)
```

### Actions API
```
GET    /api/actions          - List action buttons
POST   /api/actions          - Create action
PUT    /api/actions/:id      - Update action
DELETE /api/actions/:id      - Delete action
POST   /api/actions/:id/execute - Trigger action
```

### Settings API
```
GET    /api/settings         - Get all settings
GET    /api/settings/:key    - Get specific setting
PUT    /api/settings/:key    - Update setting
DELETE /api/settings/:key    - Delete setting
POST   /api/settings/export  - Export settings
POST   /api/settings/import  - Import settings
```

### Agents API
```
GET    /api/agents           - List agents (user's + public)
GET    /api/agents/:id       - Get agent with configurations
POST   /api/agents           - Create new agent
PUT    /api/agents/:id       - Update agent
DELETE /api/agents/:id       - Delete agent
POST   /api/agents/:id/test  - Test agent webhook
```

### Chat API (Minimal - n8n owns history)
```
GET    /api/chat/conversations        - List conversations
POST   /api/chat/conversations        - Create conversation
GET    /api/chat/conversations/:id    - Get conversation metadata
DELETE /api/chat/conversations/:id    - Delete conversation
POST   /api/chat/conversations/:id/messages - Send message to agent
```

### Dashboard API
```
GET    /api/dashboard/widgets - Get user widgets
POST   /api/dashboard/widgets - Create widget
PUT    /api/dashboard/widgets/:id - Update widget
DELETE /api/dashboard/widgets/:id - Delete widget
POST   /api/dashboard/layout  - Save layout
```

## Security Architecture

### Authentication Flow
1. User logs in with username/password
2. Password verified against bcrypt hash
3. JWT token generated with user ID and role
4. Token stored in httpOnly cookie
5. All API requests validate JWT
6. Token refreshed before expiration

### Authorization Levels
- **Public** - No auth required (public forms, login)
- **User** - Authenticated users (most features)
- **Admin** - Full access (user management, all data)

### Security Measures
- Password hashing with bcrypt
- JWT tokens with 24h expiration
- CORS configured for n8n origins
- Input validation with Zod
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping)
- Rate limiting on auth endpoints
- File upload validation (type, size)

## Component Architecture

### Frontend Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ProtectedRoute.tsx
│   ├── forms/
│   │   ├── FormBuilder.tsx
│   │   ├── FormRenderer.tsx
│   │   ├── FormField.tsx
│   │   └── fields/
│   │       ├── TextField.tsx
│   │       ├── SelectField.tsx
│   │       ├── FileField.tsx
│   │       └── index.ts
│   ├── files/
│   │   ├── FileManager.tsx
│   │   ├── FileUpload.tsx
│   │   ├── FileGrid.tsx
│   │   └── FolderTree.tsx
│   ├── chat/
│   │   ├── ConversationTree.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── ChatWindow.tsx
│   ├── data/
│   │   ├── DataGrid.tsx
│   │   ├── TableViewer.tsx
│   │   ├── CellEditor.tsx
│   │   └── ExportButton.tsx
│   ├── dashboard/
│   │   ├── WidgetGrid.tsx
│   │   ├── WidgetEditor.tsx
│   │   └── widgets/
│   │       ├── ButtonWidget.tsx
│   │       ├── FormWidget.tsx
│   │       ├── StatsWidget.tsx
│   │       └── RecentWidget.tsx
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── ui/ (shadcn components)
├── pages/
│   ├── Dashboard.tsx
│   ├── Forms.tsx
│   ├── Files.tsx
│   ├── Database.tsx
│   ├── Chat.tsx
│   ├── Actions.tsx
│   ├── Settings.tsx
│   └── Login.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   ├── useWebhook.ts
│   └── useSSE.ts
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── utils.ts
│   └── constants.ts
├── stores/
│   ├── authStore.ts
│   ├── uiStore.ts
│   └── settingsStore.ts
└── types/
    ├── api.ts
    ├── database.ts
    └── forms.ts
```

### Worker Structure
```
worker/
├── index.ts
├── routes/
│   ├── auth.ts
│   ├── forms.ts
│   ├── files.ts
│   ├── database.ts
│   ├── chat.ts
│   ├── actions.ts
│   ├── settings.ts
│   └── dashboard.ts
├── middleware/
│   ├── auth.ts
│   ├── cors.ts
│   └── rateLimit.ts
├── services/
│   ├── jwt.ts
│   ├── webhook.ts
│   └── sse.ts
└── utils/
    ├── db.ts
    ├── r2.ts
    ├── crypto.ts
    └── validators.ts
```

## Data Flow Patterns

### Form Submission Flow
1. User fills form → Client validates with Zod
2. Submit to `/api/forms/:id/submit`
3. Worker stores in D1
4. Worker calls n8n webhook with data
5. n8n processes and returns response
6. Worker stores response and returns to client
7. Client shows success/error message

### Chat Message Flow
1. User sends message → POST to API
2. Worker stores in D1
3. Worker forwards to n8n webhook
4. n8n processes with AI/logic
5. Response streamed via SSE
6. Client displays streaming response
7. Final response stored in D1

### File Upload Flow
1. User drops file → Client validates
2. Multipart upload to Worker
3. Worker streams to R2
4. Metadata stored in D1
5. File URL returned
6. Client updates file list

## Performance Optimizations

### Frontend
- Code splitting by route
- Lazy loading components
- Virtual scrolling for large lists
- Debounced search inputs
- Optimistic UI updates
- Image lazy loading

### Backend
- Edge computing (0ms cold starts)
- Streaming responses for large data
- R2 direct URLs for file serving
- Efficient SQL queries with indexes
- Connection pooling for D1

### Caching Strategy
- No KV cache (simplicity over speed)
- Browser caching for static assets
- TanStack Query caching on client
- ETag headers for API responses

## Deployment Architecture

### Environments
- **Development** - Local with Wrangler
- **Preview** - Branch deployments
- **Production** - Main branch auto-deploy

### CI/CD Pipeline
1. Push to GitHub
2. GitHub Actions runs tests
3. Build static assets with Vite
4. Deploy Worker with Wrangler
5. Run D1 migrations
6. Verify deployment

### Monitoring
- Cloudflare Analytics for traffic
- Worker logs with `wrangler tail`
- Sentry for error tracking
- Custom metrics in D1

## Scalability Considerations

### Current Limits
- D1: 10GB database size
- R2: Unlimited storage
- Workers: 50ms CPU time
- File uploads: 100MB max

### Growth Path
1. Start with single D1 database
2. Add read replicas if needed
3. Multiple R2 buckets for isolation
4. Queue for long-running tasks
5. Durable Objects for real-time features

## Key Design Decisions

### Why No KV Cache?
- Simplicity over micro-optimizations
- D1 is fast enough for our scale
- Fewer moving parts to manage
- Easier debugging and maintenance

### Why shadcn/ui?
- Clean, minimal design
- Fully customizable
- No vendor lock-in
- Accessibility built-in
- TypeScript support

### Why Hono?
- Lightweight (12KB)
- TypeScript-first
- Works great with Workers
- Simple middleware system
- Good performance

### Why JWT over Sessions?
- Stateless authentication
- Works well with edge computing
- Easy to scale horizontally
- Standard format

## Agent & Chat Architecture

### Design Philosophy
WorkflowHub's AI chat system follows a **separation of concerns** approach:
- **WorkflowHub**: UI orchestration, agent management, minimal conversation tracking
- **n8n**: AI processing, conversation memory, message history storage

### Architecture Flow
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ WorkflowHub │───▶│ Agent Config │───▶│     n8n     │
│     UI      │    │  + Headers   │    │  Workflow   │
└─────────────┘    └──────────────┘    └─────────────┘
       │                                       │
       │           ┌─────────────┐            │
       └──────────▶│ Conversation│◀───────────┘
                   │  Metadata   │
                   └─────────────┘
                         │
                   ┌─────▼─────┐
                   │  n8n D1   │
                   │ Chat Mem  │
                   └───────────┘
```

### Agent Configuration System
1. **Agent Definition**: Name, description, model settings
2. **Webhook Integration**: n8n workflow endpoint
3. **Dynamic Configuration**: Headers, parameters passed to n8n
4. **Flexible Models**: Support for GPT, Claude, Gemini via n8n
5. **Public/Private**: Share agents with team or keep private

### Memory Management
- **WorkflowHub Stores**: Agent metadata, conversation titles, message counts
- **n8n Stores**: Complete message history using D1 Chat Memory nodes
- **File Handling**: Base64 for small files, R2 URLs for large files
- **Context Persistence**: n8n manages conversation context across sessions

### Webhook Protocol
```json
{
  "message": "User input",
  "agent_config": {
    "name": "Assistant Name",
    "system_prompt": "You are...",
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "attachments": [
    {"name": "file.pdf", "data": "base64..." },
    {"name": "large.pdf", "url": "https://r2.../file.pdf"}
  ],
  "conversation_id": "conv_123",
  "metadata": { "custom": "values" }
}
```

### Benefits of This Architecture
1. **Scalability**: n8n handles AI processing load
2. **Flexibility**: Easy to add new AI providers in n8n
3. **Simplicity**: WorkflowHub focuses on UI/UX
4. **Cost Efficiency**: Only pay for AI when used
5. **Reliability**: n8n handles retries and error management

### Agent Testing System
- **Live Testing**: Test webhooks directly from UI
- **Configuration Validation**: Ensure proper setup
- **Response Time Monitoring**: Track performance
- **Error Debugging**: Clear error messages

## Future Considerations

### Potential Enhancements
- WebSocket support for real-time
- Multi-tenancy with organizations
- Plugin system for extensions
- Mobile app with Capacitor
- Advanced workflow builder UI

### Technical Debt to Avoid
- Over-abstracting too early
- Complex state management
- Premature optimization
- Feature creep
- Poor error handling