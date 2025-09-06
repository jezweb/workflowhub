# Changelog

All notable changes to WorkflowHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2025-01-06

### Added
- **Enhanced Storage Provider Support**: Intuitive configuration for 8 storage providers
  - Cloudflare R2 (Binding mode) - Direct Worker binding for fastest performance
  - Cloudflare R2 (S3 API mode) - Credential-based access via S3-compatible API
  - Amazon S3 - Standard AWS S3 configuration
  - Backblaze B2 - Cost-effective S3-compatible storage
  - DigitalOcean Spaces - Simple, scalable object storage
  - Vultr Object Storage - High-performance S3-compatible storage
  - MinIO - Self-hosted S3-compatible storage
  - Generic S3-compatible - Support for any S3-compatible service

### Enhanced
- **Improved Storage Configuration UX**
  - Removed confusing tabs in favor of dynamic configuration sections
  - Provider-specific form fields with appropriate labels and placeholders
  - Pre-configured endpoints for known providers
  - Region dropdowns with provider-specific options
  - Contextual help text for each provider
  - Auto-detection of provider type when editing existing buckets
  - Full-width form fields for better layout

### Fixed
- Storage bucket configuration not loading when editing
- R2 credentials not working properly (now uses S3 API)
- BucketSelector potential crash with undefined bucket IDs

### Technical
- AWS SDK v3 integration for S3-compatible operations
- Universal S3Provider implementation supporting all providers
- Backward compatible with existing database schema
- Provider type mapping between UI and database

## [2.4.0] - 2025-01-04

### Added
- **Context & Variables System**: Comprehensive template variable system for dynamic content
  - Organization context management (company details, social links, context text)
  - Team member profiles with skills and contact information
  - Custom variables store with global and user-specific variables
  - Sensitive variable masking for secure storage
  - Variable substitution in Actions (URL, headers, payload)
  - Settings UI with dedicated tabs for Organization, Team Profile, and Variables
  - Grouped variable display showing all available variables by category
  - Support for nested variable paths (e.g., `{{org.social.twitter}}`)

### Enhanced
- Actions now support comprehensive variable substitution across all fields
- Backend variable service for centralized substitution logic
- TypeScript types for all context-related data structures
- API endpoints for managing context data

### Technical
- New database tables: `organization_context`, `team_profiles`, `custom_variables`
- VariableService class for unified variable management
- React components for settings management
- Full TypeScript coverage for new features

## [2.3.1] - 2025-09-04

### Fixed
- **Chat Response Parsing** - Now correctly handles n8n's array format with 'output' field
- **Message Persistence** - Messages now persist across page refreshes using D1 storage
- **Database Integration** - Fixed 500 errors by using shared D1 database with n8n

### Changed
- **Simplified Architecture** - Removed separate history webhooks in favor of direct D1 access
- **Flexible Response Handling** - Supports multiple webhook response formats:
  - Array with output field (n8n AI Agent default)
  - Object with response or output field
  - Plain text fallback
- **Direct Memory Access** - WorkflowHub now reads messages directly from n8n's chat_memory table

### Technical
- Session ID in chat_memory table maps to conversation ID
- No additional migrations needed - uses existing n8n table structure
- Improved error handling for missing tables

## [2.3.0] - 2025-09-04

### Added
- **Complete Chat System Implementation**
  - Conversation Groups with shared context and agent assignment
  - Visual group customization with icons and colors
  - Pinned groups for quick access
  - Agent integration with n8n webhook protocol
  - Rich messaging UI with user/assistant distinction
  - File attachment support in messages
  - Resizable panels for flexible layout
  - Message timestamps and copy functionality
  - Loading indicators for async responses
  - Zustand-based state management for chat
  - Full backend API with group/conversation/message support
  - Database schema for conversation groups with shared variables

### Changed
- Chat page now uses new component-based architecture
- Updated TypeScript types for complete chat system

### Fixed
- Chat system now fully integrated with existing Agents feature

## [2.2.1] - 2025-09-04

### Added
- **Unified Appearance System**
  - Shared appearance constants between Forms and Actions
  - Default theme using shadcn primary colors (adapts to light/dark mode)
  - 10 color themes: default, ocean, forest, sunset, berry, rose, slate, emerald, amber, indigo

### Changed
- **Forms Appearance Tab Redesign**
  - Simplified interface to match Actions appearance style
  - Single-flow design with visual theme selection
  - Emoji button icons for forms
  - Live button preview with correct vibrancy (removed disabled attribute)

- **Form Preview Enhancement**
  - Form preview tab now shows configured appearance theme
  - Submit button styling matches appearance settings

### Fixed
- Form button preview vibrancy now matches action buttons
- TypeScript type definitions for shared appearance system
- Default theme fallback consistency across components

### Technical
- Created shared lib/appearance.ts for color themes
- Updated FormBuilder, FormPreview, and PublicForm components
- Enhanced type safety with ColorTheme and ButtonStyle types

## [2.2.0] - 2025-09-03

### Added
- **New Field Types**
  - Heading field for section titles (H1-H6)
  - Separator field for visual dividers
  - HTML field for custom HTML content
  - Hidden field for storing data without display

- **Appearance Settings Tab**
  - Button styling controls (variant, size, full width)
  - Theme settings (light/dark/auto mode)
  - Custom color configuration
  - Advanced CSS customization option

- **Cloudflare Turnstile Integration**
  - Bot protection for public forms
  - Client-side widget integration
  - Server-side token validation
  - Validation status tracking

- **Security Enhancements**
  - Allowed domains configuration for embedding
  - Origin/Referer validation
  - Wildcard subdomain support
  - CORS protection

- **Response Types**
  - HTML response type for dynamic content from webhooks
  - Renamed 'page' to 'redirect' for clarity
  - Support for raw HTML response display in new window

### Changed
- Enhanced FormBuilder with 4-column tab layout
- Improved field editor with conditional property display
- Updated public form renderer to handle all new field types
- Better organization of form settings

### Technical
- Database migration for advanced form features
- Enhanced TypeScript types for new functionality
- Secure Turnstile verification flow
- Optimized webhook response handling

### Deployment
- Successfully deployed to production at https://workflowhub.webfonts.workers.dev
- Applied migration 0007_forms_missing_fields.sql
- All new features are live and operational

## [2.1.0] - 2025-09-03

### Added
- **Enhanced Forms System**
  - Public form viewing and submission page at `/forms/:id`
  - Webhook execution on form submission with async processing
  - Response handling types: toast, modal, page redirect
  - Form submission tracking and viewing interface
  - Export submissions to CSV
  - Clone form functionality
  - Export/Import forms as JSON
  - Embed code generation for public forms
  - Form submission notifications
  - Webhook response tracking with status and duration
  - Support for custom R2 bucket configuration
  - Foundation for Turnstile integration

### Changed
- **Form Builder Improvements**
  - Added response type selection (toast/modal/page)
  - Enhanced webhook configuration with n8n integration focus
  - Added advanced settings section
  - Improved form settings organization
  - Better visual distinction for public forms

### Technical
- Added comprehensive database migrations for form enhancements
- Created public API endpoints bypassing auth for public forms
- Enhanced TypeScript types for form system
- Integrated with existing notifications system
- Fire-and-forget webhook execution with status tracking

## [2.0.3] - 2025-09-03

### Fixed
- **File Download Authentication Issue**
  - Fixed download functionality by implementing authenticated fetch with JWT token
  - Downloads now properly include authorization headers
  - Creates blob URLs for secure file downloads with proper cleanup
  - Works correctly for all file types (PDF, DOCX, CSV, JSON, images, etc.)

### Changed
- **Default File View**
  - Changed default view from grid to table for better file management
  - Table view provides more information at a glance
  - Improved user experience for file browsing

### Deployment
- Successfully deployed to Cloudflare Workers
- Live demo available at https://workflowhub.webfonts.workers.dev

## [2.0.2] - 2025-09-03

### Added
- **Notification System for Action Executions**
  - Complete execution history tracking with database persistence
  - Real-time notification sidebar with sliding panel interface
  - Unread notification badge indicator in application header
  - Detailed execution logs with request/response data
  - Status filtering (success/error/pending)
  - Mark as read functionality (individual or batch)
  - Clear history with optional status filtering
  - Auto-refresh every 30 seconds when panel is active
  - Execution duration tracking and display
  - Expandable notification items with collapsible details

### Technical Improvements
- New `action_executions` table for comprehensive tracking
- RESTful API endpoints for execution management
- Zustand store for client-side notification state
- Integrated execution tracking into action workflow
- Added date-fns for better date formatting

## [2.0.1] - 2025-09-03

### Added
- Visual customization for action buttons
  - Emoji icon support
  - 9 color themes with gradients (ocean, forest, sunset, berry, rose, slate, emerald, amber, indigo)
  - Solid and gradient button styles
- Automatic variable substitution for actions
  - User data ({{user.id}}, {{user.username}}, {{user.email}})
  - Time variables ({{timestamp}}, {{date}}, {{datetime}})
  - Random values ({{random}})
- Test preview for actions before execution
- Actions display on dashboard for quick access
- Flexible response handling (silent, toast, modal, refresh)

### Changed
- Actions now execute immediately without requiring user input
- Removed dynamic data dialog - all data pre-configured
- Actions are now one-click triggers for n8n workflows
- Improved ActionBuilder with 4-tab interface (Basic, Request, Response, Appearance)

### Fixed
- JSON parsing issue in action headers and payload display
- TypeScript compilation errors

## [2.0.0] - 2025-09-02

### Added
- Complete rewrite from scratch with simplified architecture
- User authentication system with JWT tokens
- Visual form builder with flexible field widths (full, 1/2, 1/3, 1/4)
- Comprehensive action button system with webhook configuration
  - Support for GET, POST, PUT, DELETE, PATCH methods
  - Custom headers and payload templates
  - Dynamic variable substitution
  - Three response types (modal, toast, page)
- Complete file management system with R2 storage
  - Multi-file upload with drag-and-drop
  - Grid and table view modes
  - Image thumbnails and file type icons
  - 4MB file size limit for AutoRAG compatibility
  - File sorting and search capabilities
- Database viewer with advanced features
  - Table browser with row counts
  - Paginated data viewing with sorting
  - Text search across columns
  - Export to CSV and JSON formats
  - Responsive column type formatting
- Nested chat conversations with SSE streaming (planned)
- Customizable dashboard with widgets
- shadcn/ui component library integration
- Full TypeScript coverage

### Changed
- Migrated from KV cache to direct D1 queries
- Simplified state management with Zustand
- Improved UI/UX with cleaner design
- Better error handling throughout
- More intuitive settings management

### Removed
- KV cache complexity
- Over-engineered abstractions
- Multiple authentication systems
- Unnecessary dependencies

### Security
- Implemented bcrypt password hashing
- Added JWT token expiration
- Enhanced input validation with Zod
- Improved CORS configuration

## [1.0.0] - 2025-08-31

### Added
- Initial release
- Basic dashboard functionality
- Simple chat system
- File upload to R2
- Database viewer
- Settings management

---

## Upgrade Guide

### From 1.x to 2.0

⚠️ **Breaking Changes**: Version 2.0 is a complete rewrite. Data migration is not supported.

1. **Backup your data**
   - Export any important data from v1
   - Save webhook configurations
   - Document custom settings

2. **Clean installation**
   - Delete old Cloudflare resources (D1, R2, KV)
   - Remove old worker deployment
   - Follow new installation guide

3. **Reconfigure**
   - Set up new authentication
   - Recreate forms and buttons
   - Configure webhooks
   - Import data manually if needed

### Key Differences

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Auth | Token-based | Username/password + JWT |
| Cache | KV namespace | None (direct D1) |
| Forms | Basic | Visual builder |
| UI | Custom CSS | shadcn/ui |
| Chat | Flat structure | Nested folders |
| Files | Basic upload | Virtual folders |

## Future Roadmap

### [2.1.0] - Planned
- [ ] Multi-language support
- [ ] Advanced form validations
- [ ] Workflow templates
- [ ] Batch file operations
- [ ] API rate limiting

### [2.2.0] - Planned
- [ ] Real-time collaboration
- [ ] Advanced dashboard analytics
- [ ] Plugin system
- [ ] Mobile app companion
- [ ] Webhook testing tools

### [3.0.0] - Future
- [ ] Multi-tenancy support
- [ ] GraphQL API
- [ ] WebSocket support
- [ ] Advanced workflow builder
- [ ] AI-powered automation

## Support

For questions about upgrading or changelog entries:
- Open an issue on GitHub
- Check the documentation
- Join our Discord community