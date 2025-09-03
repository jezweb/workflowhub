# Actions Feature Redesign - Scratchpad

## Overview
Redesigning Actions to be simple one-click shortcuts that trigger n8n workflows in the background.

## Key Principles
- Actions = instant execution, no user input at runtime
- All data is pre-configured in action settings
- Non-blocking async execution
- Clear visual feedback
- Beautiful, customizable buttons

## Current State Analysis
- Actions currently ask for dynamic data on execute (not wanted)
- Test button doesn't work (TODO comment)
- No visual customization options
- Blocking execution with modal dialogs
- No notification system

## Implementation Phases

### Phase 1: Core Action Improvements ✅ COMPLETED
- [x] Remove dynamic data dialog
- [x] Fix variable substitution
- [x] Add async execution (non-blocking)
- [x] Implement test action (preview only, no execution)
- [x] Basic toast notifications

### Phase 2: Visual Customization ✅ COMPLETED
- [x] Add icon/emoji field
- [x] Add color theme options (9 themes with gradients)
- [x] Create ActionButton component
- [x] Update ActionBuilder UI (4-tab interface)

### Phase 3: Dashboard Integration ✅ COMPLETED
- [x] Add actions to dashboard
- [x] Create action widgets (Quick Actions section)
- [x] Quick execute buttons with ActionButton component

### Phase 4: Notification System 🚧 IN PROGRESS
- [ ] Database table for execution history
- [ ] Backend API for execution tracking
- [ ] Notification store (Zustand)
- [ ] Sidebar notifications panel
- [ ] Execution history with details
- [ ] Unread indicators
- [ ] Auto-refresh mechanism

## Phase 4 Implementation Details

### Database Schema (action_executions)
```sql
CREATE TABLE action_executions (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'success', 'error')),
  request_url TEXT,
  request_method TEXT,
  request_headers TEXT, -- JSON
  request_payload TEXT, -- JSON
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (action_id) REFERENCES actions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### API Endpoints
- GET /api/executions - List with pagination/filtering
- GET /api/executions/:id - Get details
- DELETE /api/executions/:id - Remove record
- GET /api/executions/unread-count - Count unread
- PATCH /api/executions/:id/read - Mark as read

### Frontend Components
- NotificationPanel - Sliding sidebar
- NotificationItem - Individual execution
- NotificationIndicator - Badge with count
- useNotificationStore - Zustand store

### UI Flow
1. Action executed → Create execution record (pending)
2. Webhook called → Update with response/error
3. Notification badge updates
4. User clicks bell → Panel slides in
5. Shows recent executions with status
6. Click item → Expand details
7. Auto-refresh every 30s when open

## Database Changes Needed
```sql
ALTER TABLE actions ADD COLUMN icon TEXT DEFAULT '⚡';
ALTER TABLE actions ADD COLUMN color_theme TEXT DEFAULT 'slate';
ALTER TABLE actions ADD COLUMN button_style TEXT DEFAULT 'solid';
ALTER TABLE actions ADD COLUMN on_success TEXT DEFAULT 'toast';
```

## Variable System
System variables to auto-inject:
- {{user.id}} - Current user's ID
- {{user.username}} - Current username  
- {{user.email}} - User's email
- {{timestamp}} - Unix timestamp
- {{date}} - Current date ISO format
- {{datetime}} - Current datetime ISO format

## Color Themes
- ocean: Blue gradient (#0EA5E9 → #0284C7)
- forest: Green gradient (#10B981 → #059669)
- sunset: Orange gradient (#F97316 → #EA580C)
- berry: Purple gradient (#A855F7 → #9333EA)
- rose: Pink gradient (#F43F5E → #E11D48)
- slate: Gray gradient (#64748B → #475569)
- emerald: Teal gradient (#14B8A6 → #0D9488)
- amber: Yellow gradient (#F59E0B → #D97706)
- indigo: Deep blue (#6366F1 → #4F46E5)

## Testing Plan
1. Test with simple webhook (no payload)
2. Test with payload and variables
3. Test error handling
4. Test UI feedback
5. Test on dashboard

## Notes
- Keep it simple, don't over-engineer
- Focus on user experience
- Ensure backward compatibility
- Document all changes