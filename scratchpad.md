# WorkflowHub Development Scratchpad

## Project Overview
Building a business workflow management dashboard with:
- Cloudflare Workers + Static Assets
- Vite + React + TypeScript
- D1 Database, R2 Storage, KV Cache
- n8n webhook integrations

## Current Status
- [x] Project initialization
- [x] Infrastructure setup (bindings configured)
- [x] Worker API endpoints implemented
- [x] React frontend components
- [x] Testing & deployment
- [ ] Collections feature for dashboard organization

## Key Decisions
1. Using Cloudflare Vite plugin for development
2. React Router v6 for SPA routing
3. Tailwind CSS v4 for styling
4. Simple fetch API for n8n webhooks
5. SSE for streaming chat responses

## Development Steps

### Step 1: Initialize Project
- Use `npm create cloudflare@latest` with React template
- Verify Vite 6 and Cloudflare plugin compatibility
- Set up TypeScript configuration

### Step 2: Project Structure
```
workflowhub/
├── src/                    # React app
├── worker/                 # API endpoints
├── migrations/             # D1 schemas
├── public/                 # Static assets
└── tests/                  # Test files
```

### Step 3: Core Components
1. Chat system with folders/threads
2. File manager for R2
3. Dashboard with action buttons
4. Data viewer for D1 tables
5. Settings manager with KV

### Step 4: API Endpoints
- `/api/chat/*` - Chat operations
- `/api/files/*` - R2 file operations
- `/api/data/*` - D1 queries
- `/api/webhooks/*` - n8n proxy

### Step 5: Testing Strategy
- Unit tests for utilities
- Integration tests for API
- Type checking with TypeScript
- Linting with ESLint

## Dependencies to Install
```bash
# Core
react react-dom react-router-dom

# UI
tailwindcss@next lucide-react clsx

# Development
typescript @types/react @types/node
vitest @vitest/ui
```

## Cloudflare Resources
- D1 Database: workflowhub-db
- R2 Bucket: workflowhub-files
- KV Namespace: workflowhub-cache

## n8n Integration Points
1. Chat webhook: Process messages and return responses
2. Action webhooks: Trigger workflows from buttons
3. Form webhooks: Submit form data for processing

## Notes & Issues
- Check Tailwind v4 documentation for new config format
- Verify Vite 6 compatibility with Cloudflare plugin
- Use wrangler.jsonc for better IDE support
- Keep API responses under 1MB for Workers

## Git Commits
- Initial project setup
- Add documentation files
- Configure Cloudflare bindings
- Implement chat API
- Add React components
- Deploy to production

## Testing Checklist
- [x] TypeScript compiles without errors
- [x] ESLint passes
- [ ] Unit tests pass
- [x] API endpoints respond correctly
- [x] Frontend loads without errors
- [ ] n8n webhooks integrate properly

## Collections Feature Implementation

### Overview
Adding ability to organize dashboard buttons into collections with:
- Heading and description for each collection
- Visual grouping and hierarchy
- Collapsible/expandable sections
- Settings management for collections

### Database Schema Changes
1. New table: `button_collections`
   - id (TEXT PRIMARY KEY)
   - name (TEXT NOT NULL)
   - description (TEXT)
   - icon (TEXT)
   - color (TEXT)
   - position (INTEGER)
   - collapsed (BOOLEAN)
   - created_at, updated_at

2. Update `action_buttons`:
   - Add collection_id (TEXT, FOREIGN KEY)
   - Nullable to support ungrouped buttons

### Implementation Steps
1. Create database migration (0002_button_collections.sql)
2. Update Worker API:
   - CRUD endpoints for collections
   - Update button endpoints to include collection data
3. Frontend updates:
   - DashboardPage: Display collections with buttons
   - SettingsPage: Add Collections management tab
4. Testing and refinement
5. Documentation updates

### API Endpoints
- GET /api/collections - List all collections
- POST /api/collections - Create collection
- PUT /api/collections/:id - Update collection
- DELETE /api/collections/:id - Delete collection
- GET /api/collections/:id/buttons - Get buttons in collection

### UI Components
- CollectionCard: Container for grouped buttons
- CollectionHeader: Title, description, expand/collapse
- QuickActions: Section for ungrouped buttons