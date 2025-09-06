# WorkflowHub 2.0

A modern business workflow management dashboard built on Cloudflare's edge platform with n8n integration. Designed for simplicity, functionality, and ease of use for small teams.

🚀 **Live Demo**: https://workflowhub.webfonts.workers.dev

## Features

### 🔐 Authentication & Security
- Simple username/password authentication
- JWT-based sessions
- Role-based access control (User/Admin)
- Protected routes for secure areas

### 📝 Dynamic Forms
- Visual form builder with drag-and-drop
- Flexible field layouts (full, 1/2, 1/3, 1/4 width)
- Multiple field types (text, select, file, date, etc.)
- Public and private form options
- Webhook integration for form submissions

### 📁 File Management
- R2-powered file storage with 4MB limit (AutoRAG compatible)
- Multi-file upload with drag-and-drop zone
- **Table view as default** with sortable columns
- Grid view with file type icons
- Support for all file types (PDF, DOCX, CSV, JSON, images, etc.)
- **Authenticated download** with JWT token security
- Direct delete operations with confirmation
- Upload progress tracking with status indicators
- File metadata display (size, type, upload date)

### 🗄️ Storage Management (v2.6.0)
- **Multi-Bucket Support** - Manage multiple storage buckets
- **8 Storage Providers** - Pre-configured support for popular providers:
  - Cloudflare R2 (Binding mode for fastest performance)
  - Cloudflare R2 (S3 API mode with credentials)
  - Amazon S3
  - Backblaze B2
  - DigitalOcean Spaces
  - Vultr Object Storage
  - MinIO (self-hosted)
  - Generic S3-compatible services
- **Intuitive Configuration** - Provider-specific forms with contextual help
- **Auto-configured Endpoints** - Pre-filled endpoints for known providers
- **Context-Aware Storage** - Different buckets for different purposes
- **Bucket Assignment** - Assign buckets to chat groups and forms
- **Connection Testing** - Verify bucket connectivity before use
- **Secure Credentials** - Encrypted storage of access keys in D1
- **Default Buckets** - Configure defaults for general, chat, and forms

### 💬 Chat System
- **Conversation Groups** - Organize chats by project/topic with custom icons and colors
- **Agent Integration** - Each group uses a specific AI agent with shared context
- **Rich Messaging** - Support for text, code, and file attachments
- **n8n Webhook Integration** - Process messages through your custom workflows
- **Resizable UI** - Flexible layout with collapsible panels
- **Context Persistence** - Maintain conversation context within groups

### 🎯 Action Buttons
- **One-click n8n workflow triggers** - no user input required at execution
- Full HTTP method support (GET, POST, PUT, DELETE, PATCH)
- Custom headers configuration
- JSON payload templates with automatic variable substitution:
  - User data: `{{user.id}}`, `{{user.username}}`, `{{user.email}}`
  - Time variables: `{{timestamp}}`, `{{date}}`, `{{datetime}}`
  - Random values: `{{random}}`
- **Visual customization:**
  - Emoji icons for buttons
  - 9 color themes with gradient options (ocean, forest, sunset, berry, rose, slate, emerald, amber, indigo)
  - Solid or gradient button styles
- **Execution tracking & notifications:**
  - Complete execution history with request/response details
  - Real-time notification sidebar with unread badge
  - Status indicators (success/error/pending)
  - Execution duration tracking
  - Filter by status, mark as read, clear history
  - Auto-refresh every 30 seconds
- Response handling modes (silent, toast, modal, refresh)
- Test mode with request preview (shows payload without executing)
- Direct webhook execution with non-blocking async processing
- URL copy for external integration
- Dashboard quick actions for instant access

### 📊 Database Viewer
- Interactive data grid
- Inline editing capabilities
- Sort, filter, and pagination
- CSV export functionality
- Schema exploration

### ⚙️ Settings Management
- Categorized settings interface
- Import/export configurations
- Environment-specific settings
- Webhook URL management

### 🏢 Context & Variables System (v2.4.0)
- **Organization Profile**
  - Company information, logo, social links
  - Keywords, Products, Services tags for SEO and categorization
  - Context text for AI agents
  - All fields available as `{{org.*}}` variables
- **Team Profiles**
  - Individual user profiles with contact details
  - Professional bio and skills management
  - Available as `{{team.current.*}}` variables
- **Custom Variables**
  - Global variables (shared across all users)
  - Personal variables (user-specific)
  - Sensitive value masking for API keys
  - Available as `{{custom.*}}` and `{{my.*}}` variables
- **Variable Usage**
  - Available in Actions (webhook payloads, headers, URLs)
  - Available in Forms (webhook integrations)
  - Automatic substitution at execution time
  - Examples:
    - Organization: `{{org.name}}`, `{{org.keywords}}`, `{{org.product.0}}`
    - Team: `{{team.current.name}}`, `{{team.current.skills}}`, `{{team.current.skill.2}}`
    - Custom: `{{custom.api_endpoint}}`, `{{my.personal_token}}`

### 📈 Dashboard
- Customizable widget layout
- Drag-and-drop arrangement
- Multiple widget types (buttons, forms, stats)
- Responsive grid system
- Per-user customization

## Tech Stack

- **Frontend**: React 19, TypeScript, shadcn/ui, Tailwind CSS
- **Backend**: Cloudflare Workers, Hono, D1 Database, R2 Storage
- **Build**: Vite 6, Wrangler 4
- **Integration**: n8n webhooks, Server-Sent Events

## Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone https://github.com/jezweb/workflowhub.git
cd workflowhub

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup Cloudflare resources
wrangler d1 create workflowhub
wrangler r2 bucket create workflowhub-files

# Run migrations
wrangler d1 migrations apply workflowhub --local

# Start development server
npm run dev
```

Visit http://localhost:5173 to see the application

## Project Structure

```
workflowhub/
├── src/                 # React application
│   ├── components/      # UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   └── stores/         # State management
├── worker/             # Cloudflare Worker
│   ├── routes/         # API endpoints
│   ├── middleware/     # Request middleware
│   └── services/       # Business logic
├── migrations/         # Database migrations
└── public/            # Static assets
```

## Development

```bash
# Start development server
npm run dev

# Run type checking
npm run check

# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Cloudflare
npm run deploy
```

## API Documentation

The API follows RESTful conventions. All endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Check session

### Forms
- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `GET /api/forms/:id` - Get form
- `POST /api/forms/:id/submit` - Submit form

### Files
- `GET /api/files` - List files with metadata
- `POST /api/files/upload` - Upload multiple files (4MB limit per file)
- `GET /api/files/:id/download` - Download file (requires authentication)
- `GET /api/files/:id/url` - Get file URL
- `DELETE /api/files/:id` - Delete file

### Chat
- `GET /api/conversations` - List conversations
- `POST /api/conversations/:id/messages` - Send message (SSE)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## Configuration

### Environment Variables

```env
# Required
CLOUDFLARE_ACCOUNT_ID=your_account_id
JWT_SECRET=your_secret_key
DEFAULT_WEBHOOK_URL=https://n8n.example.com/webhook/xxx

# Optional
SENTRY_DSN=your_sentry_dsn
DEBUG=false
REGISTRATION_DISABLED=false
CUSTOM_R2_BUCKET=workflowhub-files
TURNSTILE_SITE_KEY=your_site_key
TURNSTILE_SECRET_KEY=your_secret_key
```

### n8n Integration

1. Create webhooks in n8n for each integration point
2. Configure webhook URLs in Settings page
3. Test connections using the Test button

Example n8n webhook node configuration:
```json
{
  "webhookDescription": "WorkflowHub Chat",
  "path": "workflowhub-chat",
  "responseMode": "responseNode",
  "responseData": "allEntries"
}
```

## Deployment

### Production Deployment

```bash
# Build application
npm run build

# Deploy to Cloudflare
npm run deploy

# Apply migrations
wrangler d1 migrations apply workflowhub --env production
```

### Custom Domain

1. Add custom domain in Cloudflare Dashboard
2. Update DNS records
3. Configure in wrangler.toml

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## Architecture

WorkflowHub uses a modern edge-first architecture:

- **Edge Computing**: Zero cold starts with Cloudflare Workers
- **SQLite at the Edge**: D1 for fast, distributed database
- **Object Storage**: R2 for file storage with S3 compatibility
- **Real-time Updates**: SSE for streaming responses
- **Type Safety**: Full TypeScript coverage

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Security

- Password hashing with bcrypt
- JWT tokens with expiration
- CORS protection
- Input validation with Zod
- SQL injection prevention
- XSS protection via React

## Performance

- Edge computing for low latency
- Optimistic UI updates
- Virtual scrolling for large lists
- Code splitting and lazy loading
- Efficient caching strategies

## Troubleshooting

### Common Issues

**Build fails**: Check Node.js version (20+) and clear node_modules

**Database errors**: Verify D1 bindings in wrangler.toml

**Upload fails**: Check R2 bucket permissions and CORS settings

**Auth issues**: Verify JWT_SECRET is set correctly

See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for more solutions.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Support

- 📧 Email: support@workflowhub.com
- 💬 Discord: [Join our community](https://discord.gg/workflowhub)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/workflowhub/issues)

## Acknowledgments

- [Cloudflare](https://cloudflare.com) for the edge platform
- [n8n](https://n8n.io) for workflow automation
- [shadcn/ui](https://ui.shadcn.com) for beautiful components
- The open-source community

---

Built with ❤️ by the WorkflowHub team