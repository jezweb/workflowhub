# Changelog

All notable changes to WorkflowHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-09-01

### Added
- **Button Collections** - New feature for organizing dashboard actions
  - Create collections with name, description, icon, and color
  - Group action buttons into thematic collections
  - Collapsible/expandable collections on dashboard with persistent state
  - Visual hierarchy with collection headers and descriptions
  - "Quick Actions" section for ungrouped buttons
  - Collections management tab in Settings page
  - Database migration (0002_button_collections.sql) for collections support
  - Collection assignment dropdown in button editor
  - Button count indicators for each collection
- New API endpoints for collections management
  - GET /api/collections - List all collections with button counts
  - POST /api/collections - Create new collection
  - PUT /api/collections/:id - Update collection
  - DELETE /api/collections/:id - Delete collection
  - GET /api/collections/:id/buttons - Get buttons in collection

### Changed
- Enhanced dashboard layout with organized button groups
- Updated Settings page with new Collections tab
- Improved button management with collection assignment
- Updated action_buttons table with collection_id foreign key
- Better visual organization of workflow triggers

## [0.1.0] - 2025-09-01

### Added
- Initial release with core functionality
- Multi-threaded chat system with folder organization
- Action buttons dashboard for triggering n8n workflows
- File management with R2 storage
- D1 database viewer with SQL query support
- Settings manager with KV storage
- n8n webhook integration for all features
- Responsive web interface with React and Tailwind CSS
- Cloudflare Workers deployment with static assets
- Database migrations system
- Comprehensive API endpoints for all features

[Unreleased]: https://github.com/jezweb/workflowhub/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/jezweb/workflowhub/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jezweb/workflowhub/releases/tag/v0.1.0