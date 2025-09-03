# Forms System Enhancement - Implementation Scratchpad

## Current State Analysis
- Forms can be created with field builder
- Forms have is_public toggle but no public viewing route
- Form submissions are stored but webhooks don't execute
- No submission tracking UI
- No integration with notifications

## Implementation Plan

### Phase 1: Core Functionality (Current Focus)

#### 1.1 Public Form Viewing Route
- [x] Create `/forms/:id` route in App.tsx
- [x] Build PublicFormView component
- [x] Add public form API endpoint (bypass auth for public forms)
- [x] Handle both authenticated and anonymous submissions

#### 1.2 Webhook Execution
- [x] Modify form submission endpoint to execute webhooks
- [x] Structure webhook payload properly
- [x] Handle async execution (fire and forget)
- [x] Store webhook response/status

#### 1.3 Response Handling
- [x] Add response_type to form settings (toast/modal/page)
- [x] Implement response handlers in frontend
- [x] Update FormSettings type

### Phase 2: Submission Management

#### 2.1 Submission Tracking
- [x] Create FormSubmissions component
- [x] Add API endpoint for fetching submissions
- [x] Display submission count on form cards
- [x] Add submission details modal

#### 2.2 Notifications
- [x] Integrate with existing notification system
- [x] Trigger notifications on submission
- [ ] Add notification preferences

### Phase 3: Enhanced Features

#### 3.1 Form Operations
- [x] Clone form functionality
- [x] Export form as JSON
- [x] Import form from JSON

#### 3.2 File Uploads
- [ ] Enhance file field for R2 uploads
- [ ] Add bucket configuration
- [ ] Handle file upload in submission

#### 3.3 Embedding
- [ ] Create embed route
- [ ] Generate embed codes
- [ ] Configure CORS

#### 3.4 Turnstile
- [ ] Add Turnstile settings
- [ ] Frontend integration
- [ ] Backend validation

## Technical Decisions

### Response Types
- `toast`: Quick notification, continue on page
- `modal`: Show response in dialog
- `page`: Navigate to URL from response
- All responses are async (non-blocking) by default

### Webhook Payload Structure
```json
{
  "form": {
    "id": "...",
    "name": "..."
  },
  "submission": {
    "id": "...",
    "data": { /* form fields */ },
    "submitted_at": "...",
    "submitted_by": "...",
    "ip_address": "..."
  }
}
```

### File Upload Strategy
- Use multipart form data for files
- Upload to R2 before webhook execution
- Pass R2 URLs in webhook payload

## Notes
- Keep forms and actions separate (Option A)
- No SMTP needed - handle in n8n
- Async means fire-and-forget, not a separate response type
- Maintain simplicity, avoid over-engineering

## Current Task
Starting with Phase 1.1 - Creating public form viewing route