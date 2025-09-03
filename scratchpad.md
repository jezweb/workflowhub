# Forms System Enhancement - Implementation Scratchpad

## Overview
Enhancing the Forms system with advanced features while maintaining simplicity and modularity.

## Features to Implement

### 1. Response Types
- [x] Current: toast, modal, page
- [ ] Rename "page" to "redirect" 
- [ ] Add "html" response type for dynamic content from webhook

### 2. New Field Types
- [ ] **Heading** - Display text with H1-H6 levels
- [ ] **Separator** - Visual divider line
- [ ] **HTML** - Raw HTML content block
- [ ] **Hidden** - Store data without display

### 3. Appearance Settings Tab
- [ ] Button styling (variant, size, full width)
- [ ] Theme settings (colors, dark mode)
- [ ] Custom CSS classes
- [ ] Apply theme to form fields

### 4. Cloudflare Turnstile
- [ ] Enable/disable toggle
- [ ] Site key configuration
- [ ] Client-side widget integration
- [ ] Server-side token validation
- [ ] Store validation status

### 5. Embedding Security
- [ ] Allowed domains field (comma-separated)
- [ ] Validate Referer/Origin headers
- [ ] Proper CORS headers
- [ ] X-Frame-Options handling

## Database Schema Changes

```sql
-- New columns for forms table
ALTER TABLE forms ADD COLUMN response_type TEXT DEFAULT 'toast' 
  CHECK (response_type IN ('toast', 'modal', 'redirect', 'html'));
  
ALTER TABLE forms ADD COLUMN allowed_domains TEXT;
ALTER TABLE forms ADD COLUMN appearance_settings TEXT; -- JSON
ALTER TABLE forms ADD COLUMN turnstile_enabled INTEGER DEFAULT 0;
ALTER TABLE forms ADD COLUMN turnstile_site_key TEXT;

-- Update field types
-- Current: text, email, number, textarea, select, checkbox, radio, date, time, datetime, file, url, tel
-- Adding: heading, separator, html, hidden
```

## Implementation Steps

### Step 1: Database Migration
- Create 0006_forms_advanced_features.sql
- Add new columns
- Update existing "page" to "redirect"

### Step 2: Update Types
- Update FormField type with new field types
- Add appearance settings interface
- Add turnstile configuration interface

### Step 3: FormBuilder Updates
- Add new field types to Add Field dropdown
- Implement field-specific configuration
- Add Appearance tab with styling controls

### Step 4: Public Form Updates
- Handle new field types rendering
- Integrate Turnstile widget
- Implement HTML response handling
- Check allowed domains

### Step 5: Backend Updates
- Validate allowed domains
- Verify Turnstile tokens
- Handle HTML responses
- Store appearance settings

## Component Structure

```
components/forms/
├── FormBuilder.tsx (existing - add Appearance tab)
├── FormAppearanceSettings.tsx (new)
├── FormFieldConfig.tsx (update for new types)
├── FormTurnstileSettings.tsx (new)
└── FormEmbedSettings.tsx (new)
```

## HTML Response Implementation
Based on SWMS webhook pattern:
1. Webhook returns HTML in response
2. Store HTML temporarily
3. Use window.open() with document.write()
4. Clean up stored HTML after use

## Testing Checklist
- [ ] New field types render correctly
- [ ] Appearance settings apply properly
- [ ] Turnstile validates tokens
- [ ] HTML responses open in new tab
- [ ] Allowed domains restrict embedding
- [ ] Backward compatibility maintained

## Git Commits Plan
1. "feat: add database migration for advanced form features"
2. "feat: add new field types (heading, separator, html, hidden)"
3. "feat: implement form appearance settings"
4. "feat: add HTML response type for dynamic content"
5. "feat: integrate Cloudflare Turnstile"
6. "feat: add embedding security with allowed domains"
7. "docs: update documentation for new form features"

## Notes
- Keep each feature modular and independent
- Maintain backward compatibility
- Use existing patterns from Actions where applicable
- Test each feature independently before integration