# WorkflowHub 2.0 Architecture

## Overview
WorkflowHub is a business workflow management dashboard built on Cloudflare's edge platform with n8n webhook integration. Designed for simplicity, functionality, and ease of use for small teams.

## Core Features

### 🔐 Authentication & Security
- JWT-based authentication with session management
- Secure password hashing with bcrypt (10 salt rounds)
- Protected API routes with middleware
- CORS configuration with origin validation
- Input validation with Zod schemas
- Allowed domains configuration for form embedding
- Cloudflare Turnstile integration for bot protection

### 📝 Dynamic Forms
- Visual form builder with 4-tab interface
- Flexible field layouts (full, 1/2, 1/3, 1/4 width)
- Comprehensive field types:
  - Basic: text, email, number, textarea, select, checkbox, radio
  - Date/Time: date, time, datetime
  - Advanced: file, url, tel
  - Layout: heading (H1-H6), separator, html, hidden
- Real-time preview with appearance settings
- Public form submission with webhook integration
- Response types: toast, modal, redirect, HTML
- Submission tracking and CSV export
- Form cloning and JSON import/export
- Embed code generation

### 🎯 Action Buttons
- One-click workflow triggers (no user input at execution)
- Full HTTP method support (GET, POST, PUT, DELETE, PATCH)
- Custom headers and JSON payload templates
- Automatic variable substitution:
  - User data: {{user.id}}, {{user.username}}, {{user.email}}
  - Time variables: {{timestamp}}, {{date}}, {{datetime}}
  - Random values: {{random}}
- Visual customization:
  - Emoji icons
  - 10 color themes (default, ocean, forest, sunset, berry, rose, slate, emerald, amber, indigo)
  - Solid or gradient button styles
- Execution tracking with notification system
- Test mode with request preview

### 💬 Chat System
- **Conversation Groups** with shared context and agent assignment
  - Visual organization with custom icons and colors
  - Pinned groups for quick access
  - Shared system prompts and variables
- **Agent Integration** for AI-powered conversations
  - Each group linked to a specific agent
  - n8n webhook protocol for message processing
  - Context persistence within group sessions
  - Flexible webhook response format support
- **Direct D1 Memory Integration**
  - Shared database with n8n for seamless message storage
  - Uses n8n's chat_memory table format
  - Session ID mapped to conversation ID
  - No separate history webhooks needed
- **Rich Messaging**
  - User and assistant message display
  - File attachment support
  - Message timestamps and copy functionality
  - Loading indicators for async responses
  - Message persistence across page refreshes
- **Flexible UI** with resizable panels
  - Groups sidebar
  - Conversation list
  - Message history with D1 persistence
  - Input area with attachments
- **State Management** via Zustand store
  - Local message caching
  - Optimistic UI updates
  - Persistent conversation history from D1

### 📁 File Management
- R2 storage integration with 4MB limit (AutoRAG compatible)
- Multi-file upload with drag-and-drop
- Table view (default) and grid view
- File type icons and image thumbnails
- Authenticated download with JWT token
- Direct delete operations
- Upload progress tracking
- File metadata display

### 🔔 Notifications
- Real-time notification sidebar
- Complete execution history tracking
- Unread badge indicator
- Detailed execution logs with request/response data
- Status filtering (success/error/pending)
- Mark as read (individual or batch)
- Clear history with status filtering
- Auto-refresh every 30 seconds

### 🎨 Appearance Settings
- Unified appearance system for Forms and Actions
- Theme modes: light/dark/auto
- 10 predefined color themes with visual previews
- Button styling controls:
  - Variant selection
  - Size options
  - Full width toggle
  - Emoji icons
- Custom CSS support
- Live preview of appearance changes

### 📊 Database Viewer
- Interactive data grid with pagination
- Sort, filter, and search capabilities
- CSV and JSON export functionality
- Schema exploration
- Responsive column formatting

### 🔧 Context & Variables System
- **Organization Context** - Company-wide information management
  - Organization details (name, description, website, email, phone, address)
  - Logo URL for branding
  - Social media links (Twitter, LinkedIn, GitHub, etc.)
  - Custom context text for AI agents
  - Custom fields for additional metadata
- **Team Profiles** - Individual user profile management
  - Personal details (full name, title, department)
  - Contact information (email, phone, mobile)
  - Photo URL for avatars
  - Bio and skills
  - Custom fields for role-specific data
- **Custom Variables** - Flexible key-value store
  - Global variables (available to all users)
  - Personal variables (user-specific)
  - Data types: string, number, boolean, JSON
  - Sensitive variable masking for security
  - Description field for documentation
- **Variable Substitution** - Dynamic template system
  - Organization variables: {{org.name}}, {{org.email}}, {{org.website}}
  - Team variables: {{team.full_name}}, {{team.title}}, {{team.email}}
  - Custom variables: {{custom.api_key}}, {{custom.endpoint}}
  - Personal variables: {{my.api_token}}, {{my.preference}}
  - User variables: {{user.id}}, {{user.username}}, {{user.email}}
  - Time variables: {{time.date}}, {{time.timestamp}}, {{time.datetime}}
  - System variables: {{system.random}}, {{system.uuid}}
- **Integration Points**
  - Actions: URL, headers, and payload substitution
  - Forms: Default values and hidden fields (planned)
  - Agents: System prompts and context (planned)
  - Centralized VariableService for consistent substitution

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
  email TEXT,
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
  fields_json TEXT NOT NULL, -- JSON schema with field types
  settings_json TEXT, -- Includes response, webhook, appearance, security settings
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
  webhook_status INTEGER,
  webhook_duration_ms INTEGER,
  turnstile_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Action buttons
CREATE TABLE action_buttons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  label TEXT NOT NULL,
  icon TEXT, -- Emoji icon
  description TEXT,
  color_theme TEXT DEFAULT 'default', -- Color theme name
  button_style TEXT DEFAULT 'solid', -- solid or gradient
  http_method TEXT DEFAULT 'POST',
  webhook_url TEXT NOT NULL,
  headers_json TEXT, -- Custom headers
  payload_json TEXT, -- Dynamic data with variable substitution
  response_type TEXT DEFAULT 'toast', -- silent, toast, modal, refresh
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

-- Action execution history
CREATE TABLE action_executions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  action_id TEXT NOT NULL REFERENCES action_buttons(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  request_json TEXT,
  response_json TEXT,
  status TEXT DEFAULT 'pending', -- pending, success, error
  duration_ms INTEGER,
  error_message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

-- Conversation groups
CREATE TABLE conversation_groups (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  name TEXT NOT NULL,
  description TEXT,
  shared_context TEXT, -- Shared system prompt/context for all conversations
  shared_variables JSON, -- Variables available to all conversations in group
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6b7280',
  is_pinned BOOLEAN DEFAULT FALSE,
  position INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Organization context
CREATE TABLE organization_context (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  social_links JSON, -- {"twitter": "...", "linkedin": "...", etc}
  context_text TEXT, -- Additional context for AI agents
  custom_fields JSON, -- Flexible key-value pairs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team profiles
CREATE TABLE team_profiles (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  full_name TEXT,
  title TEXT,
  department TEXT,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  photo_url TEXT,
  bio TEXT,
  skills JSON, -- Array of skill strings
  custom_fields JSON, -- Flexible key-value pairs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Custom variables (key-value store)
CREATE TABLE custom_variables (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  category TEXT NOT NULL CHECK(category IN ('global', 'user', 'organization')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  data_type TEXT DEFAULT 'string' CHECK(data_type IN ('string', 'number', 'boolean', 'json')),
  is_sensitive BOOLEAN DEFAULT FALSE,
  user_id TEXT REFERENCES users(id), -- NULL for global/org variables
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, key, user_id)
);

-- Storage buckets configuration
CREATE TABLE storage_buckets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  provider TEXT NOT NULL DEFAULT 'r2' CHECK(provider IN ('r2', 's3')),
  is_default BOOLEAN DEFAULT FALSE,
  is_default_chat BOOLEAN DEFAULT FALSE,
  is_default_forms BOOLEAN DEFAULT FALSE,
  config_json TEXT NOT NULL, -- Encrypted JSON with provider-specific config
  created_by TEXT REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Design

### Authentication Endpoints
```
POST   /api/auth/register    - Create new user (can be disabled via env)
POST   /api/auth/login       - Authenticate user
GET    /api/auth/verify      - Verify current session
GET    /api/auth/registration-status - Check if registration is enabled
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
POST   /api/forms/:id/clone  - Clone form
GET    /api/forms/:id/export - Export form as JSON
POST   /api/forms/import     - Import form from JSON
```

### Public Forms API (No Auth)
```
GET    /api/public/forms/:id - Get public form
POST   /api/public/forms/:id/submit - Submit public form
```

### Files API
```
GET    /api/files            - List files with metadata
POST   /api/files/upload     - Upload file(s) (4MB limit)
GET    /api/files/:id/download - Download file (authenticated)
GET    /api/files/:id/url    - Get file URL
DELETE /api/files/:id        - Delete file
```

### Storage API
```
# Bucket Management
GET    /api/storage/buckets           - List all storage buckets
POST   /api/storage/buckets           - Create new storage bucket
GET    /api/storage/buckets/:id       - Get bucket details
PUT    /api/storage/buckets/:id       - Update bucket configuration
DELETE /api/storage/buckets/:id       - Delete bucket

# Bucket Operations
POST   /api/storage/buckets/:id/test  - Test bucket connection
POST   /api/storage/buckets/:id/set-default - Set as default bucket

# Provider Support
- Cloudflare R2 (with bindings or API)
- Amazon S3 and S3-compatible (MinIO, Backblaze B2)
- Encrypted credential storage in D1
```

### Database API
```
GET    /api/database/tables  - List all tables
GET    /api/database/tables/:name/schema - Get table schema
GET    /api/database/tables/:name/data - Query table data (paginated)
GET    /api/database/tables/:name/export - Export as CSV or JSON
POST   /api/database/query   - Execute custom query (admin only)
```

### Chat API
```
# Groups
GET    /api/chat/groups              - List conversation groups
POST   /api/chat/groups              - Create conversation group
PUT    /api/chat/groups/:id          - Update group
DELETE /api/chat/groups/:id          - Delete group

# Conversations
GET    /api/chat/conversations        - List conversations (with group filter)
POST   /api/chat/conversations        - Create conversation
DELETE /api/chat/conversations/:id    - Delete conversation

# Messages
GET    /api/chat/conversations/:id/messages - Get messages for conversation
POST   /api/chat/conversations/:id/messages - Send message (webhook integration)
```

### Actions API
```
GET    /api/actions          - List action buttons
GET    /api/actions/:id      - Get action details
POST   /api/actions          - Create action
PUT    /api/actions/:id      - Update action
DELETE /api/actions/:id      - Delete action
POST   /api/actions/:id/execute - Trigger action (async)
POST   /api/actions/:id/test - Test action (preview mode)
```

### Executions API
```
GET    /api/executions       - List executions (filterable)
GET    /api/executions/:id   - Get execution details
GET    /api/executions/unread/count - Get unread count
PATCH  /api/executions/:id/read - Mark as read
POST   /api/executions/mark-all-read - Mark all as read
DELETE /api/executions/:id   - Delete execution
DELETE /api/executions       - Clear history (with filters)
```

### Settings API
```
GET    /api/settings         - Get all settings
PUT    /api/settings/:key    - Update setting
DELETE /api/settings/:key    - Delete setting
```

### Context API
```
# Organization
GET    /api/context/organization    - Get organization context
PUT    /api/context/organization    - Update organization context

# Team Profiles  
GET    /api/context/team            - List all team profiles
GET    /api/context/team/me         - Get current user's profile
PUT    /api/context/team/me         - Update current user's profile

# Custom Variables
GET    /api/context/variables       - List variables (filter by category)
PUT    /api/context/variables       - Create/update variable
DELETE /api/context/variables/:id   - Delete variable
GET    /api/context/variables/available - Get all available variables

# Actions Integration
GET    /api/actions/variables       - Get variables for action substitution
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

### Dashboard API
```
GET    /api/dashboard/widgets - Get user widgets
POST   /api/dashboard/widgets - Create widget
PUT    /api/dashboard/widgets/:id - Update widget
DELETE /api/dashboard/widgets/:id - Delete widget
```

### Health Check
```
GET    /api/health          - Check API status
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
- Password hashing with bcrypt (10 salt rounds)
- JWT tokens with expiration
- CORS configured with origin validation
- Input validation with Zod schemas
- SQL injection prevention (parameterized queries)
- XSS prevention (React escaping)
- File upload validation (type, size limit 4MB)
- Cloudflare Turnstile for bot protection
- Allowed domains configuration for form embedding
- Origin/Referer validation for public forms
- Registration can be disabled via environment variable

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
│   │   ├── ChatContainer.tsx      # Main chat layout with resizable panels
│   │   ├── ConversationGroups.tsx # Group list and management
│   │   ├── ConversationList.tsx   # Conversations within a group
│   │   ├── ChatMessages.tsx       # Message history display
│   │   ├── MessageItem.tsx        # Individual message component
│   │   ├── ChatInput.tsx          # Message input with file attachments
│   │   └── GroupEditor.tsx        # Modal for group creation/editing
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
2. Worker forwards to n8n webhook with agent config
3. n8n processes with AI/logic
4. n8n stores messages in shared D1 chat_memory table
5. Worker returns response (supports multiple formats)
6. Client displays response with optimistic updates
7. Messages fetched directly from D1 on page load

### Action Execution Flow
1. User clicks action button → No input required
2. Client calls `/api/actions/:id/execute`
3. Worker retrieves action config from D1
4. Variable substitution performed server-side:
   - User data (id, username, email)
   - Timestamps (unix, ISO date/time)
   - Random values
5. Worker sends pre-configured webhook request
6. Non-blocking async execution
7. Response handling based on action config:
   - Silent: No user feedback
   - Toast: Brief notification
   - Modal: Display response
   - Refresh: Reload page
8. User continues working immediately

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
WorkflowHub's AI chat system follows a **simplified integration** approach:
- **WorkflowHub**: UI orchestration, agent management, conversation tracking
- **n8n**: AI processing, webhook handling
- **Shared D1 Database**: Both systems use the same database for message storage

### Architecture Flow
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ WorkflowHub │───▶│ Agent Config │───▶│     n8n     │
│     UI      │    │  + Headers   │    │  Workflow   │
└─────────────┘    └──────────────┘    └─────────────┘
       │                                       │
       │           ┌─────────────┐            │
       └──────────▶│   Shared    │◀───────────┘
                   │   D1 DB     │
                   │ chat_memory │
                   └─────────────┘
```

### Agent Configuration System
1. **Agent Definition**: Name, description, model settings
2. **Webhook Integration**: n8n workflow endpoint
3. **Dynamic Configuration**: Headers, parameters passed to n8n
4. **Flexible Models**: Support for GPT, Claude, Gemini via n8n
5. **Public/Private**: Share agents with team or keep private

### Memory Management
- **Shared D1 Database**: Both WorkflowHub and n8n use same database
- **chat_memory Table**: Standard n8n format for message storage
  - session_id: Maps to conversation_id
  - message_type: 'human' or 'ai'
  - content: Message text
  - metadata: JSON for additional data
- **Direct Access**: WorkflowHub reads messages directly from D1
- **No History Webhooks**: Simplified architecture without separate history endpoints

### Webhook Protocol

#### Request to n8n:
```json
{
  "message": "User input",
  "conversation_id": "conv_123",
  "agent_config": {
    "name": "Assistant Name",
    "system_prompt": "You are...",
    "model": "gpt-4",
    "temperature": 0.7,
    "max_tokens": 2000
  },
  "group_context": {
    "shared_context": "Optional group context",
    "variables": {}
  }
}
```

#### Response Formats (Flexible):
```json
// Format 1: n8n AI Agent default (array with output)
[{ "output": "Response text" }]

// Format 2: Object with output
{ "output": "Response text" }

// Format 3: Object with response
{ "response": "Response text" }

// Format 4: Plain text
"Response text"
```

### Benefits of This Architecture
1. **Simplicity**: Direct D1 access eliminates webhook complexity
2. **Performance**: Faster message loading from local database
3. **Compatibility**: Works seamlessly with n8n's memory system
4. **Flexibility**: Supports various response formats automatically
5. **Consistency**: One database, one format for all storage
6. **Reliability**: No network calls for message history

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