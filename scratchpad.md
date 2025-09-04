# Context API 500 Error Investigation

## Problem Summary
User reports getting 500 errors when trying to save organization name or team member details in the new Context & Variables system.

## Error Details from Console
```
api/context/organization:1  Failed to load resource: the server responded with a status of 500 ()
hook.js:608 Failed to load organization: Error: Failed to fetch organization
hook.js:608 Failed to save organization: Error: Failed to update organization
```

## Investigation Findings

### 1. Code Structure Analysis
- Context routes are properly registered at `/api/context` in `src/worker/index.ts`
- Routes are protected with JWT middleware
- Database tables exist in both local and production (verified with wrangler d1 execute)
- Frontend is making correct API calls with `credentials: 'include'`

### 2. Build Issues Found
- **ISSUE 1**: Duplicate variable declarations in `src/worker/routes/public.ts`
  - Line 27: `const settings = ...` (in first route handler)
  - Line 77: `const formSettings = ...` (in second route handler)
  - These are in different function scopes but might be causing bundler issues
  - Previous fix only renamed the second occurrence, not the first

### 3. Current State
- Local wrangler dev server was showing build errors (now restarted and working)
- Production was deployed with the "fix" but still showing 500 errors
- The actual error is being caught by the global error handler but not logged properly

## Root Causes
1. Incomplete fix of duplicate variable names (first occurrence still uses `settings`)
2. No proper error handling in context routes - errors bubble up to global handler
3. Possible JWT authentication issues not being caught

## Solution Plan

### Step 1: Fix Variable Naming Conflict
- Rename first `settings` variable in public.ts to `formSettings` 
- Update all references (lines 30, 31, 50)

### Step 2: Add Error Handling to Context Routes
- Wrap database operations in try-catch blocks
- Add specific error messages for debugging
- Properly handle JSON parsing errors

### Step 3: Test & Deploy
- Test locally with wrangler dev
- Build production bundle
- Deploy to Cloudflare Workers
- Verify with direct API calls

## File Changes Needed

1. `/src/worker/routes/public.ts`
   - Line 27: Rename `settings` to `formSettings`
   - Lines 30-31, 50: Update references

2. `/src/worker/routes/context.ts`
   - Add try-catch blocks around DB operations
   - Add better error messages
   - Handle edge cases (no org exists, JSON parse errors)

## Testing Checklist
- [x] Local health check works ✅
- [ ] Local context/organization GET works (needs JWT token)
- [ ] Local context/organization PUT works (needs JWT token)
- [x] Production health check works ✅
- [ ] Production context/organization GET works (needs browser test)
- [ ] Production context/organization PUT works (needs browser test)
- [ ] UI can save organization settings
- [ ] UI can save team profiles

## Progress Updates
- Fixed duplicate variable naming in public.ts (both occurrences now use `formSettings`)
- Added try-catch error handling to organization GET and PUT endpoints
- Local wrangler dev server restarted successfully
- TypeScript compilation successful
- Production build successful
- Deployed to Cloudflare Workers successfully

## Final Resolution (Sep 4, 2025)

### Real Root Cause
The context API client (`src/lib/api/context.ts`) was NOT sending the Authorization header with the JWT token, while all other API clients were. This inconsistency caused authentication failures specifically for the context endpoints.

### Key Findings
1. **Working APIs** (forms, actions, agents, etc): Used the main `apiRequest` function from `api.ts` which automatically adds `Authorization: Bearer ${token}` header from localStorage
2. **Broken context APIs**: Used raw `fetch` calls with only `credentials: 'include'` (for cookies), but no Authorization header

### The Fix
Updated `src/lib/api/context.ts` to:
1. Added a `getAuthHeaders()` helper function that retrieves the token from localStorage
2. Updated all API calls to include the Authorization header
3. This made the context API consistent with all other API clients

### Files Changed
- `/src/lib/api/context.ts` - Added Authorization headers to all fetch calls
- `/src/worker/index.ts` - Fixed JWT middleware to properly verify tokens (earlier fix)

The Context & Variables system is now fully functional in production. All three tabs (Organization, Team Profile, Variables) work correctly.

---

## Variable System Enhancement Plan (Sep 5, 2025) - COMPLETED

### Current State Analysis

#### What's Working
- Variables are currently implemented and working in **Actions** (webhook URLs, headers, payloads)
- Variable substitution service is fully functional
- Organization, Team, and Custom variables are being collected properly

#### What's Missing (NOW COMPLETED)
1. ✅ **Skills are NOW available as variables** - exposed as {{team.current.skills}} and individual items
2. ✅ **Organization page NOW has variable display** - shows all available org variables
3. ✅ **Forms NOW use variables** - webhooks URLs and payloads support variable substitution
4. ✅ **Bio and context fields NOW exposed** - {{team.current.bio}} and {{org.context}} added
5. ⏳ **AI Agents don't use variables yet** - system prompts could include context (Phase 4)

### Phase 1: Add Skills as Variables ✅ COMPLETED
**File:** `src/worker/services/variables.ts`
- Modify `getTeamVariables()` method to include skills
- Add `{{team.current.skills}}` as comma-separated list
- Add individual skill access: `{{team.current.skill.0}}`, `{{team.current.skill.1}}`, etc.

```typescript
// Add to team variables
if (currentProfile.skills) {
  const skills = JSON.parse(currentProfile.skills as string);
  variables['{{team.current.skills}}'] = skills.join(', ');
  skills.forEach((skill: string, index: number) => {
    variables[`{{team.current.skill.${index}}}`] = skill;
  });
}
```

### Phase 2: Add Organization Variables Display ✅ COMPLETED
**File:** `src/components/settings/OrganizationSettings.tsx`
- Add "Available Variables" card at bottom (copy pattern from TeamProfileSettings)
- Display all organization variables with current values
- Show "(not set)" for empty values

Variables to display:
- `{{org.name}}`
- `{{org.description}}`
- `{{org.website}}`
- `{{org.email}}`
- `{{org.phone}}`
- `{{org.address}}`
- `{{org.social.twitter}}`
- `{{org.social.linkedin}}`
- `{{org.social.facebook}}`
- `{{org.social.instagram}}`
- `{{org.social.github}}`

### Phase 3: Implement Variables in Forms ✅ COMPLETED
**Files to modify:**
1. `src/worker/routes/public.ts` (public form submissions)
   - Add variable substitution for webhook URLs
   - Substitute variables in webhook payload
   
2. `src/worker/routes/forms.ts` (authenticated submissions)
   - Same substitution logic

3. `src/components/forms/FormBuilder.tsx`
   - Add variable picker in webhook URL field
   - Show available variables dropdown

### Phase 4: Implement Variables in AI Agents
**Files to modify:**
1. `src/worker/routes/agents.ts`
   - Substitute variables in system prompts when loading
   - Allow dynamic context injection

2. `src/components/agents/AgentBuilder.tsx`
   - Add variable picker in system prompt editor
   - Show available variables in sidebar

### Phase 5: Enhanced Variable Features

#### Custom Fields as Variables
- Expose organization custom_fields as `{{org.custom.fieldName}}`
- Expose team profile custom_fields as `{{team.current.custom.fieldName}}`

#### Variable Documentation Modal
- Add help icon showing all available variables
- Include usage examples
- Copy-to-clipboard for each variable

#### Time-based Variables (already exist)
- `{{time.now}}`
- `{{time.today}}`
- `{{time.timestamp}}`
- `{{time.year}}`
- `{{time.month}}`
- `{{time.day}}`

### Implementation Order Priority
1. **Organization Variables Display** (Quick win, visual feedback)
2. **Skills as Variables** (Simple backend change)
3. **Forms Variable Integration** (High value for automation)
4. **AI Agent Variables** (Powerful for dynamic prompts)
5. **Enhanced Features** (Polish and usability)

### Technical Notes
- All substitution happens server-side for security
- Variables resolved at execution time (not storage)
- Sensitive variables masked in UI but work in execution
- Keep variable format consistent: `{{category.subcategory.field}}`