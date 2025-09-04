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
- [ ] Local context/organization GET works
- [ ] Local context/organization PUT works
- [ ] Production health check works
- [ ] Production context/organization GET works
- [ ] Production context/organization PUT works
- [ ] UI can save organization settings
- [ ] UI can save team profiles

## Progress Updates
- Fixed duplicate variable naming in public.ts (both occurrences now use `formSettings`)
- Added try-catch error handling to organization GET and PUT endpoints
- Local wrangler dev server restarted successfully
- TypeScript compilation successful