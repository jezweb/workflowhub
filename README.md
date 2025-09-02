# WorkflowHub 2.0

A modern business workflow management dashboard built on Cloudflare's edge platform with n8n integration. Designed for simplicity, functionality, and ease of use for small teams.

**Live Demo**: https://workflowhub.webfonts.workers.dev

## Features

### 🔐 Authentication & Security
- Simple username/password authentication with bcrypt hashing
- JWT-based sessions with 7-day expiration
- Session persistence across page refreshes
- Role-based access control (User/Admin)
- Protected routes for secure areas
- Configurable email domain restrictions for registration

### 📝 Dynamic Forms
- Visual form builder with drag-and-drop
- Flexible field layouts (full, 1/2, 1/3, 1/4 width)
- Multiple field types (text, select, file, date, etc.)
- Public and private form options
- Webhook integration for form submissions

### 📁 File Management
- R2-powered file storage with 4MB limit (AutoRAG compatible)
- Multi-file upload with drag-and-drop zone
- Grid view with image thumbnails
- Table view with sortable columns
- File type icons and metadata display
- Direct download and delete operations
- Upload progress tracking

### 💬 Chat System
- Nested conversation structure
- Real-time streaming responses via SSE
- File attachments support
- n8n webhook integration for AI/automation
- Searchable message history

### 🎯 Action Buttons
- Full HTTP method support (GET, POST, PUT, DELETE, PATCH)
- Custom headers configuration
- JSON payload templates with variable substitution
- Dynamic data injection ({{user.id}}, {{timestamp}}, etc.)
- Three response modes (modal, toast, page)
- Direct webhook execution with response handling
- Test mode with request preview
- URL copy for external integration

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

### 📈 Dashboard
- Customizable widget layout
- Drag-and-drop arrangement
- Multiple widget types (buttons, forms, stats)
- Responsive grid system
- Per-user customization

### 🤖 AI Agents
- Create and manage AI-powered conversational agents
- Custom system prompts and instructions
- Model selection and configuration
- Knowledge base integration
- Agent-specific conversation history

## Tech Stack

- **Frontend**: React 19, TypeScript, shadcn/ui, Tailwind CSS, Zustand, TanStack Query
- **Backend**: Cloudflare Workers with Static Assets, Hono, D1 Database, R2 Storage
- **Build**: Vite 6, Wrangler 4
- **Integration**: n8n webhooks, Server-Sent Events
- **Authentication**: JWT with bcrypt password hashing

## Quick Start

### Prerequisites
- Node.js 20+ and npm 10+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/workflowhub.git
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
│   │   ├── auth/       # Authentication components
│   │   ├── layout/     # Layout components
│   │   └── ui/         # shadcn/ui components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities and API client
│   ├── stores/         # Zustand state management
│   └── worker/         # Cloudflare Worker backend
│       ├── routes/     # API route handlers
│       ├── utils/      # Backend utilities
│       └── simple.ts   # Main worker entry
├── migrations/         # Database migrations
├── dist/              # Build output
└── public/            # Static assets
```

## Development

```bash
# Start frontend development server
npm run dev

# Start backend development server (in separate terminal)
npx wrangler dev --local

# Run type checking
npm run check

# Build for production
npm run build

# Deploy to Cloudflare
wrangler deploy
```

## API Documentation

The API follows RESTful conventions. All endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Forms
- `GET /api/forms` - List forms
- `POST /api/forms` - Create form
- `GET /api/forms/:id` - Get form
- `POST /api/forms/:id/submit` - Submit form

### Files
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload files
- `DELETE /api/files/:key` - Delete file

### Chat
- `GET /api/conversations` - List conversations
- `POST /api/conversations/:id/messages` - Send message (SSE)

### Agents
- `GET /api/agents` - List AI agents
- `POST /api/agents` - Create agent
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete API documentation.

## Configuration

### Environment Variables

```env
# Required
CLOUDFLARE_ACCOUNT_ID=your_account_id
JWT_SECRET=your_secret_key
DEFAULT_WEBHOOK_URL=https://n8n.example.com/webhook/xxx

# Registration Control
ALLOWED_EMAIL_DOMAINS=*  # Use "*" for open registration
# Examples:
# ALLOWED_EMAIL_DOMAINS=company.com  # Single domain
# ALLOWED_EMAIL_DOMAINS=company.com,partner.org  # Multiple domains
# ALLOWED_EMAIL_DOMAINS=*.company.com  # Subdomain support

# Optional
SENTRY_DSN=your_sentry_dsn
DEBUG=false
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
wrangler deploy

# Apply migrations to production
wrangler d1 migrations apply workflowhub --remote
```

The application uses Cloudflare Workers with Static Assets for optimal SPA routing and performance.

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

**404 on page refresh**: Ensure `not_found_handling = "single-page-application"` is set in wrangler.toml

**Logged out on refresh**: Fixed in latest version - authentication now persists across page refreshes

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