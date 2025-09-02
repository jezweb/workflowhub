# Changelog

All notable changes to WorkflowHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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