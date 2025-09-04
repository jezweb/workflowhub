# Variables & Context System Implementation Scratchpad

## Overview
Implementing a comprehensive context and variables system for WorkflowHub that allows:
- Organization context (company details)
- Team profiles (user details beyond auth)
- Custom variables (key-value store)
- Variable substitution across Forms, Actions, and Agents

## Database Schema Design

### New Tables Needed:
1. `organization_context` - Single record for org details
2. `team_profiles` - Extended user profiles
3. `custom_variables` - Flexible key-value store

### Variable Naming Convention:
- `{{user.*}}` - Current user (existing)
- `{{org.*}}` - Organization variables
- `{{team.*}}` - Team member variables
- `{{custom.*}}` - Custom variables
- `{{my.*}}` - User-specific custom variables
- `{{time.*}}` - Time/date variables (existing as timestamp, date, datetime)
- `{{system.*}}` - System variables (existing as random)

## Implementation Order:
1. Database migrations
2. Backend API endpoints
3. Variable service
4. Settings UI tabs
5. Integration with existing features

## Design Decisions:
- Keep it simple - no complex templating engine
- Use existing settings structure where possible
- Backward compatible with existing action variables
- Single organization context (not multi-tenant for simplicity)
- Variables are text-based (JSON for complex data)

## Technical Notes:
- Variable substitution happens server-side for security
- Cache variables in memory for performance
- Use same substitution pattern as existing actions
- Sensitive variables masked in UI but available server-side

## Current State:
- Actions have working backend variables
- Settings table exists but is generic key-value
- No UI for variable management
- No documentation of available variables

## Files to Modify:
### Backend:
- `/migrations/` - New migration for tables
- `/src/worker/routes/settings.ts` - API for new data
- `/src/worker/services/variables.ts` - New service (create)
- `/src/worker/routes/actions.ts` - Update to use service
- `/src/worker/routes/forms.ts` - Add variable support

### Frontend:
- `/src/pages/Settings.tsx` - Add new tabs
- `/src/components/settings/` - New components (create)
- `/src/lib/api.ts` - API client methods
- `/src/types/` - TypeScript types

## Testing Checklist:
- [ ] Database migration runs cleanly
- [ ] API endpoints work
- [ ] Variables substitute correctly
- [ ] UI displays and saves properly
- [ ] Backward compatibility maintained
- [ ] No performance regression