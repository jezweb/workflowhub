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

### Phase 1: Core Action Improvements ✅ Starting
- [ ] Remove dynamic data dialog
- [ ] Fix variable substitution
- [ ] Add async execution
- [ ] Implement test action
- [ ] Basic toast notifications

### Phase 2: Visual Customization
- [ ] Add icon/emoji field
- [ ] Add color theme options
- [ ] Create ActionButton component
- [ ] Update ActionBuilder UI

### Phase 3: Dashboard Integration
- [ ] Add actions to dashboard
- [ ] Create action widgets
- [ ] Quick execute buttons

### Phase 4: Notification System (Future)
- [ ] Sidebar notifications
- [ ] Execution history
- [ ] Click-through details

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