# Forms Feature Implementation Scratchpad

## Current Status
Starting implementation of Forms functionality for WorkflowHub

## Implementation Plan

### Phase 1: Database Schema ⏳
- Create migration file 0003_forms.sql
- Define forms, form_fields, form_submissions tables
- Add indexes for performance

### Phase 2: API Endpoints
- Forms CRUD operations
- Field management
- Public form submission
- File upload handling

### Phase 3: UI Components
- Forms list page
- Form builder (simplified)
- Form renderer
- Public form view

### Phase 4: Integration & Testing
- Connect to webhooks
- Test file uploads
- Verify form submissions

## Design Decisions

### Simplification Choices
1. **No drag-and-drop initially** - Use simple list with position ordering
2. **Basic field types only** - text, email, number, textarea, select, checkbox, file
3. **Simple validation** - Required fields and basic pattern matching
4. **No multi-step forms** - Single page forms only for MVP
5. **No conditional logic** - All fields always visible

### Technical Choices
1. **Form data as JSON** - Store form submissions as JSON in database
2. **File uploads to R2** - Reuse existing R2 bucket for form files
3. **Webhook retry** - Simple retry logic with exponential backoff
4. **Public access via slug** - Simple URL-friendly identifiers

## API Design

### Forms Endpoints
```
GET    /api/forms              - List forms
POST   /api/forms              - Create form
GET    /api/forms/:id          - Get form with fields
PUT    /api/forms/:id          - Update form
DELETE /api/forms/:id          - Delete form

GET    /api/forms/:id/fields   - Get fields
POST   /api/forms/:id/fields   - Add field
PUT    /api/fields/:id         - Update field
DELETE /api/fields/:id         - Delete field

GET    /api/forms/:id/submissions - Get submissions
GET    /api/public/form/:slug     - Get public form
POST   /api/public/form/:slug/submit - Submit form
```

## Progress Log
- Started: Creating database migration
- Next: API endpoints